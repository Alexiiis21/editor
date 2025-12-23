import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { videoService } from '@/lib/service/video-service';
import { storageService } from '@/lib/services/storage-service';
import { videoQueue } from '@/lib/queue/queue';

// POST /api/videos/upload - Subir video
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const chunkIndex = formData.get('chunkIndex') as string;
    const totalChunks = formData.get('totalChunks') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and projectId are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;

    // Upload por chunks si se especifica
    if (chunkIndex && totalChunks) {
      const chunkPath = await storageService.saveChunk(
        buffer,
        filename,
        parseInt(chunkIndex)
      );

      // Si es el último chunk, combinar todos
      if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
        const finalPath = await storageService.mergeChunks(
          filename,
          parseInt(totalChunks)
        );

        // Crear registro en DB
        const video = await videoService.createVideo({
          projectId,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: parseInt(formData.get('totalSize') as string) || file.size,
          storageUrl: finalPath,
        });

        // Agregar a la cola de procesamiento
        await videoQueue.add('process-video', {
          videoId: video.id,
          storageUrl: finalPath,
        });

        return NextResponse.json({ video, completed: true });
      }

      return NextResponse.json({ 
        chunkIndex: parseInt(chunkIndex),
        completed: false 
      });
    }

    // Upload directo (sin chunks)
    const storagePath = await storageService.saveFile(buffer, filename, 'videos');
    
    const video = await videoService.createVideo({
      projectId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      storageUrl: storagePath,
    });

    // Agregar a la cola de procesamiento
    await videoQueue.add('process-video', {
      videoId: video.id,
      storageUrl: storagePath,
    });

    return NextResponse.json({ video, completed: true }, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// GET /api/videos/upload?videoId=xxx - Obtener estado del video
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

    const video = await videoService.getVideoById(videoId);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
