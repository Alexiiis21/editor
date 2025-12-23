import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { storageService } from '@/lib/services/storage-service';

// GET /api/projects/[id] - Obtener proyecto específico
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

    const project = await prisma.project.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        videos: {
          include: {
            assets: true,
            aiTasks: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        timeline: true,
        renders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert BigInt fields (e.g., video.size) to strings so JSON serialization succeeds
    // Also convert internal filesystem storage paths to public URLs for the client.
    const safeProject = {
      ...project,
      videos: project.videos?.map((v) => ({
        ...v,
        size: typeof v.size === 'bigint' ? v.size.toString() : v.size,
        storageUrl: v.storageUrl ? storageService.getPublicUrl(v.storageUrl) : v.storageUrl,
        assets: v.assets ?? [],
        aiTasks: v.aiTasks ?? [],
      })) ?? [],
      renders: project.renders ?? [],
      timeline: project.timeline ?? null,
    };

    return NextResponse.json(safeProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Actualizar proyecto
export async function PATCH(
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
    const { name, description } = body;

    const project = await prisma.project.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Eliminar proyecto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.project.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
