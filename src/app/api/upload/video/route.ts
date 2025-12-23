import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { videoService } from '@/lib/service/video-service';
import { storageService } from '@/lib/services/storage-service';
import { videoQueue } from '@/lib/queue/queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// POST /api/upload/video - Subir video con chunks
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const chunkIndex = formData.get('chunkIndex') as string | null;
    const totalChunks = formData.get('totalChunks') as string | null;
    const fileId = formData.get('fileId') as string;

    if (!file || !projectId || !fileId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload por chunks
    if (chunkIndex !== null && totalChunks !== null) {
      const idx = parseInt(chunkIndex);
      const total = parseInt(totalChunks);

      await storageService.saveChunk(buffer, fileId, idx);

      // Si es el último chunk, combinar
      if (idx === total - 1) {
        const finalPath = await storageService.mergeChunks(fileId, total);
        
        const video = await videoService.createVideo({
          projectId,
          filename: fileId,
          originalName: file.name,
          mimeType: file.type,
          size: parseInt(formData.get('totalSize') as string) || file.size,
          storageUrl: finalPath,
        });

        // Agregar a cola de procesamiento
        await videoQueue.add('process-video', {
          videoId: video.id,
          storageUrl: finalPath,
        });

        return NextResponse.json({ 
          video: {
            ...video,
            size: video.size.toString(),
          },
          completed: true,
          message: 'Video uploaded successfully' 
        });
      }

      return NextResponse.json({ 
        chunkIndex: idx,
        completed: false,
        progress: Math.round(((idx + 1) / total) * 100)
      });
    }

    // Upload directo
    const filename = `${Date.now()}-${fileId}`;
    const storagePath = await storageService.saveFile(buffer, filename, 'videos');
    
    const video = await videoService.createVideo({
      projectId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      storageUrl: storagePath,
    });

    // Agregar a cola de procesamiento
    await videoQueue.add('process-video', {
      videoId: video.id,
      storageUrl: storagePath,
    });

    return NextResponse.json({ 
      video: {
        ...video,
        size: video.size.toString(),
      },
      completed: true,
      message: 'Video uploaded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
