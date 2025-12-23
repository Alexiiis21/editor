import prisma from '@/lib/db/prisma';
import { VideoStatus } from '@prisma/client';
import { storageService } from './storage-service';

export class VideoService {
  async createVideo(data: {
    projectId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    storageUrl: string;
  }) {
    return await prisma.video.create({
      data: {
        ...data,
        status: VideoStatus.UPLOADING,
      },
    });
  }

  async updateVideoStatus(videoId: string, status: VideoStatus, metadata?: any) {
    return await prisma.video.update({
      where: { id: videoId },
      data: {
        status,
        ...metadata,
      },
    });
  }

  async getVideoById(videoId: string) {
    return await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        assets: true,
        aiTasks: true,
        project: true,
      },
    });
  }

  async getProjectVideos(projectId: string) {
    return await prisma.video.findMany({
      where: { projectId },
      include: {
        assets: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteVideo(videoId: string) {
    const video = await this.getVideoById(videoId);
    if (!video) throw new Error('Video not found');

    // Delete from storage
    await storageService.deleteFile(video.storageUrl);
    if (video.thumbnailUrl) {
      await storageService.deleteFile(video.thumbnailUrl);
    }

    // Delete from database
    return await prisma.video.delete({
      where: { id: videoId },
    });
  }
}

export const videoService = new VideoService();