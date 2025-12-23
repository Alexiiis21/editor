import prisma from '@/lib/db/prisma';
import { RenderStatus } from '@prisma/client';
import { storageService } from './storage-service';
import { RenderSettings } from '@/types';
import path from 'path';
import fs from 'fs/promises';
import type { Prisma } from '@prisma/client';
import type { FfmpegCommand } from 'fluent-ffmpeg';

// Importación dinámica de FFmpeg para evitar problemas de bundling
let ffmpegModule: typeof import('fluent-ffmpeg') | null = null;
let ffmpegPath: string | null = null;

async function getFFmpeg() {
  if (!ffmpegModule) {
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
    const fluent = await import('fluent-ffmpeg');
    ffmpegModule = fluent.default;
    ffmpegPath = ffmpegInstaller.default.path;
    ffmpegModule.setFfmpegPath(ffmpegPath);
  }
  return ffmpegModule;
}

interface VideoData {
  id: string;
  storageUrl: string;
  [key: string]: unknown;
}

interface TimelineClip {
  videoId: string;
  [key: string]: unknown;
}

interface ProjectWithVideos {
  id: string;
  name: string;
  videos: VideoData[];
  timeline: {
    data: Prisma.JsonValue;
  } | null;
}

export class RenderService {
  private activeRenders = new Map<string, FfmpegCommand>();

  async startRender(
    renderId: string,
    project: ProjectWithVideos,
    settings: RenderSettings
  ) {
    try {
      // Actualizar estado a PROCESSING
      await prisma.render.update({
        where: { id: renderId },
        data: {
          status: RenderStatus.PROCESSING,
          startedAt: new Date(),
          progress: 0,
        },
      });

      const render = await prisma.render.findUnique({
        where: { id: renderId },
      });

      if (!render) {
        throw new Error('Render not found');
      }

      // Obtener información del timeline o usar el primer video
      let inputFiles: string[] = [];
      
      const timelineData = project.timeline?.data;
      if (
        timelineData &&
        typeof timelineData === 'object' &&
        'clips' in timelineData &&
        Array.isArray((timelineData as { clips?: unknown }).clips)
      ) {
        // Si hay timeline, procesar según los clips
        const clips = (timelineData as { clips: TimelineClip[] }).clips;
        inputFiles = clips
          .map((clip) => {
            const video = project.videos.find((v) => v.id === clip.videoId);
            return video ? storageService.getFilePath(video.storageUrl) : null;
          })
          .filter((path): path is string => path !== null);
      } else {
        // Si no hay timeline, usar todos los videos
        inputFiles = project.videos.map((v) => 
          storageService.getFilePath(v.storageUrl)
        );
      }

      if (inputFiles.length === 0) {
        throw new Error('No video files to render');
      }

      // Directorio de salida
      const outputDir = storageService.getUploadPath('renders');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, render.filename);

      // Configurar parámetros de FFmpeg
      const resolution = this.getResolutionParams(settings.resolution);
      const quality = this.getQualityParams(settings.quality);

      // Si solo hay un video, hacer una conversión simple
      if (inputFiles.length === 1) {
        await this.renderSingleVideo(
          renderId,
          inputFiles[0],
          outputPath,
          settings,
          resolution,
          quality
        );
      } else {
        // Si hay múltiples videos, concatenarlos
        await this.renderMultipleVideos(
          renderId,
          inputFiles,
          outputPath,
          settings,
          resolution,
          quality
        );
      }

      // Actualizar registro con URL del archivo
      const relativeUrl = `renders/${render.filename}`;
      await prisma.render.update({
        where: { id: renderId },
        data: {
          status: RenderStatus.COMPLETED,
          outputUrl: relativeUrl,
          progress: 100,
          completedAt: new Date(),
        },
      });

      this.activeRenders.delete(renderId);
      
      return outputPath;
    } catch (error) {
      console.error('Render error:', error);
      
      await prisma.render.update({
        where: { id: renderId },
        data: {
          status: RenderStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      this.activeRenders.delete(renderId);
      throw error;
    }
  }

  private async renderSingleVideo(
    renderId: string,
    inputPath: string,
    outputPath: string,
    settings: RenderSettings,
    resolution: string[],
    quality: string[]
  ): Promise<void> {
    const ffmpeg = await getFFmpeg();
    
    return new Promise((resolve, reject) => {
      let totalDuration = 0;
      
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          ...resolution,
          `-r ${settings.fps}`,
          ...quality,
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started:', commandLine);
        })
        .on('codecData', (data) => {
          totalDuration = this.parseTime(data.duration);
        })
        .on('progress', async (progress) => {
          if (totalDuration > 0 && progress.timemark) {
            const currentTime = this.parseTime(progress.timemark);
            const percent = Math.min((currentTime / totalDuration) * 100, 99);
            
            await prisma.render.update({
              where: { id: renderId },
              data: { progress: percent },
            }).catch(() => {});
          }
        })
        .on('end', () => {
          console.log('FFmpeg finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        });

      command.run();
      this.activeRenders.set(renderId, command);
    });
  }

  private async renderMultipleVideos(
    renderId: string,
    inputPaths: string[],
    outputPath: string,
    settings: RenderSettings,
    resolution: string[],
    quality: string[]
  ): Promise<void> {
    const ffmpeg = await getFFmpeg();
    
    // Crear archivo de concatenación
    const concatFilePath = path.join(
      path.dirname(outputPath),
      `concat-${renderId}.txt`
    );
    
    const concatContent = inputPaths
      .map((p) => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
      .join('\n');
    
    await fs.writeFile(concatFilePath, concatContent);

    return new Promise(async (resolve, reject) => {
      let totalDuration = 0;
      
      const command = ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          ...resolution,
          `-r ${settings.fps}`,
          ...quality,
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started:', commandLine);
        })
        .on('codecData', (data) => {
          totalDuration = this.parseTime(data.duration);
        })
        .on('progress', async (progress) => {
          if (totalDuration > 0 && progress.timemark) {
            const currentTime = this.parseTime(progress.timemark);
            const percent = Math.min((currentTime / totalDuration) * 100, 99);
            
            await prisma.render.update({
              where: { id: renderId },
              data: { progress: percent },
            }).catch(() => {});
          }
        })
        .on('end', async () => {
          console.log('FFmpeg finished');
          // Eliminar archivo temporal
          try {
            await fs.unlink(concatFilePath);
          } catch (e) {
            console.error('Error deleting concat file:', e);
          }
          resolve();
        })
        .on('error', async (err) => {
          console.error('FFmpeg error:', err);
          try {
            await fs.unlink(concatFilePath);
          } catch {
            // Ignorar error al eliminar archivo temporal
          }
          reject(err);
        });

      command.run();
      this.activeRenders.set(renderId, command);
    });
  }

  private parseTime(time: string): number {
    const parts = time.split(':');
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  private getResolutionParams(resolution: string): string[] {
    switch (resolution) {
      case '4k':
        return ['-vf', 'scale=3840:2160'];
      case '1080p':
        return ['-vf', 'scale=1920:1080'];
      case '720p':
        return ['-vf', 'scale=1280:720'];
      default:
        return ['-vf', 'scale=1920:1080'];
    }
  }

  private getQualityParams(quality: string): string[] {
    switch (quality) {
      case 'high':
        return ['-crf', '18', '-b:v', '5000k'];
      case 'medium':
        return ['-crf', '23', '-b:v', '2500k'];
      case 'low':
        return ['-crf', '28', '-b:v', '1000k'];
      default:
        return ['-crf', '23', '-b:v', '2500k'];
    }
  }

  async getRenderStatus(renderId: string) {
    return await prisma.render.findUnique({
      where: { id: renderId },
    });
  }

  async cancelRender(renderId: string) {
    const ffmpegCommand = this.activeRenders.get(renderId);
    if (ffmpegCommand) {
      ffmpegCommand.kill('SIGTERM');
      this.activeRenders.delete(renderId);
    }

    await prisma.render.update({
      where: { id: renderId },
      data: {
        status: RenderStatus.CANCELLED,
        completedAt: new Date(),
      },
    });
  }
}

export const renderService = new RenderService();
