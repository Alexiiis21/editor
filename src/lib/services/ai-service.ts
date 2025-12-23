import prisma from '@/lib/db/prisma';
import { AITaskType, TaskStatus } from '@prisma/client';
import { deepseekClient } from '../ai/deepseek-client';
import { videoQueue } from '../queue/queue';

export class AIService {
  async createTask(videoId: string, type: AITaskType, input?: any) {
    const task = await prisma.aITask.create({
      data: {
        videoId,
        type,
        status: TaskStatus.PENDING,
        input,
      },
    });

    // Add to queue
    await videoQueue.add('ai-task', {
      taskId: task.id,
      videoId,
      type,
      input,
    });

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    output?: any,
    error?: string
  ) {
    return await prisma.aITask.update({
      where: { id: taskId },
      data: {
        status,
        output,
        error,
        ...(status === TaskStatus.PROCESSING && { startedAt: new Date() }),
        ...(status === TaskStatus.COMPLETED || status === TaskStatus.FAILED
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  async processTranscription(taskId: string, videoUrl: string) {
    try {
      await this.updateTaskStatus(taskId, TaskStatus.PROCESSING);
      
      const transcript = await deepseekClient.transcribe(videoUrl);
      
      await this.updateTaskStatus(taskId, TaskStatus.COMPLETED, { transcript });
      
      return transcript;
    } catch (error: any) {
      await this.updateTaskStatus(taskId, TaskStatus.FAILED, null, error.message);
      throw error;
    }
  }

  async processSceneDetection(taskId: string, videoUrl: string) {
    try {
      await this.updateTaskStatus(taskId, TaskStatus.PROCESSING);
      
      const scenes = await deepseekClient.analyzeScene(videoUrl);
      
      await this.updateTaskStatus(taskId, TaskStatus.COMPLETED, scenes);
      
      return scenes;
    } catch (error: any) {
      await this.updateTaskStatus(taskId, TaskStatus.FAILED, null, error.message);
      throw error;
    }
  }

  async getTasksByVideo(videoId: string) {
    return await prisma.aITask.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const aiService = new AIService();
