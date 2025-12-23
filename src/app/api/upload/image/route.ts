import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { storageService } from '@/lib/services/storage-service';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/upload/image - Subir imagen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and projectId are required' },
        { status: 400 }
      );
    }

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only images are allowed' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;
    const storagePath = await storageService.saveFile(buffer, filename, 'thumbnails');

    // Crear asset en la base de datos
    const asset = await prisma.asset.create({
      data: {
        videoId: projectId, // Temporalmente asociamos con el proyecto
        type: 'THUMBNAIL',
        name: file.name,
        url: storagePath,
        metadata: {
          size: file.size,
          mimeType: file.type,
        },
      },
    });

    return NextResponse.json({ 
      asset,
      url: storageService.getPublicUrl(storagePath),
      message: 'Image uploaded successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
