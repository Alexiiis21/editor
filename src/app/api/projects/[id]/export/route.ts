import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { renderService } from '@/lib/services/render-service';
import { RenderSettings } from '@/types';

// POST /api/projects/[id]/export - Iniciar renderizado de proyecto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    // Validar que el proyecto existe y pertenece al usuario
    const project = await prisma.project.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        videos: true,
        timeline: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.videos || project.videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos in project to export' },
        { status: 400 }
      );
    }

    // Configuración de renderizado por defecto
    const settings: RenderSettings = {
      resolution: body.resolution || '1080p',
      fps: body.fps || 30,
      format: body.format || 'mp4',
      quality: body.quality || 'high',
    };

    // Crear registro de renderizado en la base de datos
    const render = await prisma.render.create({
      data: {
        projectId: id,
        filename: `${project.name}-${Date.now()}.${settings.format}`,
        settings: JSON.parse(JSON.stringify(settings)),
        status: 'QUEUED',
      },
    });

    // Iniciar proceso de renderizado de forma asíncrona
    // No esperamos a que termine, solo iniciamos el proceso
    renderService.startRender(render.id, project, settings).catch((error) => {
      console.error('Error starting render:', error);
      // El servicio de renderizado manejará la actualización del estado
    });

    return NextResponse.json({
      success: true,
      renderId: render.id,
      status: render.status,
      message: 'Render started',
    });
  } catch (error) {
    console.error('Error starting export:', error);
    return NextResponse.json(
      { error: 'Failed to start export' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/export - Obtener estado de renderizados
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const renders = await prisma.render.findMany({
      where: {
        project: {
          id,
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(renders);
  } catch (error) {
    console.error('Error fetching renders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renders' },
      { status: 500 }
    );
  }
}
