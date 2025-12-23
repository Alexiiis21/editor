import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import fs from 'fs';
import path from 'path';
import { stat } from 'fs/promises';

export const dynamic = 'force-dynamic';

// GET /api/stream/videos/filename.mp4 - Stream video files
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, ...pathSegments);

    // Security: Ensure the resolved path is within uploadDir
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // Check if file exists
    try {
      await stat(resolvedPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file stats for range support
    const fileStats = await stat(resolvedPath);
    const fileSize = fileStats.size;

    // Parse range header for video streaming
    const range = req.headers.get('range');
    
    if (range) {
      // Handle range request for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          fileStream.on('end', () => {
            controller.close();
          });
          fileStream.on('error', (error) => {
            controller.error(error);
          });
        },
        cancel() {
          fileStream.destroy();
        },
      });

      const mimeType = getMimeType(resolvedPath);

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } else {
      // Send entire file
      const fileStream = fs.createReadStream(resolvedPath);
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          fileStream.on('end', () => {
            controller.close();
          });
          fileStream.on('error', (error) => {
            controller.error(error);
          });
        },
        cancel() {
          fileStream.destroy();
        },
      });

      const mimeType = getMimeType(resolvedPath);

      return new NextResponse(readableStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    return NextResponse.json(
      { error: 'Failed to stream file' },
      { status: 500 }
    );
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.m4v': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
