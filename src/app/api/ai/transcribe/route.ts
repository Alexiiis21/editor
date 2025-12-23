import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { aiService } from '@/lib/services/ai-service';
import { videoService } from '@/lib/service/video-service';

// POST /api/ai/transcribe - Transcribir video con IA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, language = 'es' } = body;

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

    // Crear tarea de transcripción
    const task = await aiService.createTask(
      videoId,
      'TRANSCRIBE',
      { 
        videoUrl: video.storageUrl,
        language 
      }
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating transcription task:', error);
    return NextResponse.json(
      { error: 'Failed to create transcription task' },
      { status: 500 }
    );
  }
}

// GET /api/ai/transcribe?videoId=xxx - Obtener transcripción
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = req.nextUrl.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    const tasks = await aiService.getTasksByVideo(videoId);
    const transcribeTasks = tasks.filter(t => t.type === 'TRANSCRIBE');

    return NextResponse.json(transcribeTasks);
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 }
    );
  }
}
