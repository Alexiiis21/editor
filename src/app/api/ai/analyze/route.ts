import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { aiService } from '@/lib/services/ai-service';
import { videoService } from '@/lib/service/video-service';

// POST /api/ai/analyze - Analizar video con IA (detección de escenas)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Verificar que el video existe
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Crear tarea de análisis
    const task = await aiService.createTask(
      videoId,
      'SCENE_DETECTION',
      { videoUrl: video.storageUrl }
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis task:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis task' },
      { status: 500 }
    );
  }
}

// GET /api/ai/analyze?taskId=xxx - Obtener resultado del análisis
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = req.nextUrl.searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    const task = await aiService.getTasksByVideo(taskId);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
