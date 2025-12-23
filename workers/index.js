const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const ffmpeg = require('fluent-ffmpeg');

const prisma = new PrismaClient();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

console.log('🚀 Worker starting...');
console.log('📡 Redis:', process.env.REDIS_HOST);
console.log('🗄️  Database:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

// Video Processing Worker
const videoWorker = new Worker(
  'video-processing',
  async (job) => {
    console.log(`📹 Processing job ${job.id}: ${job.name}`);
    
    try {
      const { taskId, videoId, type, input, storageUrl } = job.data;

      // Handle initial video upload processing
      if (job.name === 'process-video' && videoId && storageUrl) {
        await processVideoUpload(videoId, storageUrl);
        console.log(`✅ Job ${job.id} completed`);
        return;
      }

      // Handle AI tasks
      switch (type) {
        case 'TRANSCRIBE':
          await processTranscription(taskId, videoId, input);
          break;
        case 'SCENE_DETECTION':
          await processSceneDetection(taskId, videoId, input);
          break;
        default:
          console.log(`Unknown task type: ${type}`);
      }

      console.log(`✅ Job ${job.id} completed`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
  }
);

// Render Processing Worker
const renderWorker = new Worker(
  'render-processing',
  async (job) => {
    console.log(`🎬 Rendering job ${job.id}`);
    
    try {
      const { renderId, projectId, settings } = job.data;
      
      await updateRenderStatus(renderId, 'PROCESSING');
      
      // Aquí iría la lógica de rendering con FFmpeg
      await performRender(renderId, projectId, settings, (progress) => {
        job.updateProgress(progress);
      });
      
      await updateRenderStatus(renderId, 'COMPLETED');
      console.log(`✅ Render ${job.id} completed`);
    } catch (error) {
      console.error(`❌ Render ${job.id} failed:`, error);
      await updateRenderStatus(job.data.renderId, 'FAILED', error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Solo un render a la vez
  }
);

// Helper functions
async function processVideoUpload(videoId, storageUrl) {
  console.log(`📹 Processing uploaded video ${videoId}...`);
  
  try {
    // Update video status to PROCESSING
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    // Here you would extract video metadata with ffmpeg
    // For now, just mark as READY
    console.log(`✅ Video ${videoId} processed successfully`);
    
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'READY' },
    });
  } catch (error) {
    console.error(`❌ Failed to process video ${videoId}:`, error);
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

async function processTranscription(taskId, videoId, input) {
  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  // Simulación - aquí llamarías a DeepSeek
  console.log(`🎙️  Transcribing video ${videoId}...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await prisma.aITask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      output: { transcript: 'Sample transcription text...' },
      completedAt: new Date(),
    },
  });
}

async function processSceneDetection(taskId, videoId, input) {
  await prisma.aITask.update({
    where: { id: taskId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  console.log(`🎬 Detecting scenes in video ${videoId}...`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  await prisma.aITask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      output: {
        scenes: [
          { timestamp: 0, description: 'Opening scene', confidence: 0.95 },
          { timestamp: 10.5, description: 'Scene change', confidence: 0.88 },
        ],
      },
      completedAt: new Date(),
    },
  });
}

async function updateRenderStatus(renderId, status, error = null) {
  await prisma.render.update({
    where: { id: renderId },
    data: {
      status,
      error,
      ...(status === 'PROCESSING' && { startedAt: new Date() }),
      ...(status === 'COMPLETED' || status === 'FAILED' ? { completedAt: new Date() } : {}),
    },
  });
}

async function performRender(renderId, projectId, settings, onProgress) {
  // Simulación de render
  console.log(`🎥 Rendering project ${projectId} with settings:`, settings);
  
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress(i);
    
    await prisma.render.update({
      where: { id: renderId },
      data: { progress: i },
    });
  }
}

// Event handlers
videoWorker.on('completed', (job) => {
  console.log(`✅ Video job ${job.id} completed`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`❌ Video job ${job?.id} failed:`, err.message);
});

renderWorker.on('completed', (job) => {
  console.log(`✅ Render job ${job.id} completed`);
});

renderWorker.on('failed', (job, err) => {
  console.error(`❌ Render job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down workers...');
  await videoWorker.close();
  await renderWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('✅ Workers ready and listening for jobs...');