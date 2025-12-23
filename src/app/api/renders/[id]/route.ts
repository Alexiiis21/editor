import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';

// GET /api/renders/[id] - Obtener información de un render específico
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

    const render = await prisma.render.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!render) {
      return NextResponse.json({ error: 'Render not found' }, { status: 404 });
    }

    // Verificar que el render pertenece al usuario
    if (render.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(render);
  } catch (error) {
    console.error('Error fetching render:', error);
    return NextResponse.json(
      { error: 'Failed to fetch render' },
      { status: 500 }
    );
  }
}
