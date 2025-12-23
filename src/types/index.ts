import { Video, Project, AITask, Render } from '@prisma/client';

export type VideoWithAssets = Video & {
  assets: any[];
  aiTasks: AITask[];
};

export type ProjectWithVideos = Project & {
  videos: Video[];
  renders: Render[];
};

export interface UploadChunkData {
  chunk: Buffer;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export interface TimelineClip {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  position: number;
  duration: number;
  track: number;
}

export interface RenderSettings {
  resolution: '1080p' | '720p' | '4k';
  fps: number;
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high';
}