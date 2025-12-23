'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import VideoPlayer from '@/components/editor/VideoPlayer';
import Timeline from '@/components/editor/Timeline';
import AssetPanel from '@/components/editor/AssetPanel';
import AIPanel from '@/components/editor/AIPanel';
import EffectsPanel from '@/components/editor/EffectsPanel';
import { Button } from '@/components/ui/button';
import { Video, Render } from '@prisma/client';

interface Project {
  id: string;
  name: string;
  videos: Video[];
  timeline: { data: unknown } | null;
  renders: Render[];
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [rightPanel, setRightPanel] = useState<'ai' | 'effects'>('effects');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.videos.length > 0) {
          setSelectedVideo(data.videos[0]);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && params.projectId) {
      fetchProject();
    }
  }, [status, params.projectId, fetchProject]);

  const handleApplyEffect = (effect: string, params: Record<string, unknown>) => {
    console.log('Applying effect:', effect, params);
    // TODO: Implementar aplicación de efectos
    alert(`Efecto ${effect} será aplicado en una próxima actualización`);
  };

  const handleExport = async () => {
    if (!project) return;

    const confirmed = window.confirm(
      '¿Deseas exportar este proyecto? El proceso puede tardar varios minutos.'
    );
    
    if (!confirmed) return;

    setExporting(true);
    setExportProgress(0);

    try {
      const response = await fetch(`/api/projects/${project.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution: '1080p',
          fps: 30,
          format: 'mp4',
          quality: 'high',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start export');
      }

      const data = await response.json();

      // Polling para verificar el progreso
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/projects/${project.id}/export`);
          if (statusRes.ok) {
            const renders: Render[] = await statusRes.json();
            const currentRender = renders.find((r) => r.id === data.renderId);
            
            if (currentRender) {
              setExportProgress(currentRender.progress);

              if (currentRender.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setExporting(false);
                setExportProgress(100);
                
                // Descargar archivo
                if (currentRender.outputUrl) {
                  const downloadUrl = `/api/stream/${currentRender.outputUrl}`;
                  window.open(downloadUrl, '_blank');
                }
                
                alert('¡Exportación completada!');
                fetchProject(); // Actualizar proyecto
              } else if (currentRender.status === 'FAILED') {
                clearInterval(pollInterval);
                setExporting(false);
                throw new Error(currentRender.error || 'Export failed');
              }
            }
          }
        } catch (error) {
          console.error('Error polling render status:', error);
        }
      }, 2000); // Verificar cada 2 segundos

      // Limpiar interval después de 30 minutos
      setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);

    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar el proyecto');
      setExporting(false);
      setExportProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-lg text-white">Cargando proyecto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-lg text-white">Proyecto no encontrado</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
          >
            ← Volver
          </Button>
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            💾 Guardar
          </Button>
          <Button 
            size="sm"
            onClick={handleExport}
            disabled={exporting || !project?.videos || project.videos.length === 0}
          >
            {exporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exportando {exportProgress.toFixed(0)}%
              </>
            ) : (
              '📤 Exportar'
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Assets */}
        <aside className="w-64 border-r border-zinc-800 overflow-y-auto">
          <AssetPanel 
            videos={project.videos} 
            onSelectVideo={setSelectedVideo}
            selectedVideoId={selectedVideo?.id}
            onRefresh={fetchProject}
          />
        </aside>

        {/* Center - Video Preview & Timeline */}
        <main className="flex flex-1 flex-col">
          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center bg-black p-4">
            {selectedVideo ? (
              <VideoPlayer 
                video={{
                  id: selectedVideo.id,
                  storageUrl: selectedVideo.storageUrl,
                  filename: selectedVideo.filename,
                  duration: selectedVideo.duration ?? undefined,
                }}
              />
            ) : (
              <div className="text-center text-zinc-500">
                <div className="text-6xl mb-4">🎬</div>
                <p>No hay videos en este proyecto</p>
                <p className="text-sm mt-2">Sube un video para comenzar</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="h-64 border-t border-zinc-800 bg-zinc-900">
            <Timeline 
              projectId={project.id}
              timelineData={project.timeline}
            />
          </div>
        </main>

        {/* Right Sidebar - Effects & AI Tools */}
        <aside className="w-80 border-l border-zinc-800 overflow-hidden flex flex-col">
          {/* Tab Selector */}
          <div className="flex border-b border-zinc-800">
            <Button
              onClick={() => setRightPanel('effects')}
              variant="ghost"
              className={`flex-1 rounded-none border-b-2 ${
                rightPanel === 'effects'
                  ? 'border-primary bg-zinc-900'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              🎨 Efectos
            </Button>
            <Button
              onClick={() => setRightPanel('ai')}
              variant="ghost"
              className={`flex-1 rounded-none border-b-2 ${
                rightPanel === 'ai'
                  ? 'border-primary bg-zinc-900'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              ✨ IA
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'effects' ? (
              <EffectsPanel 
                selectedVideo={selectedVideo}
                onApplyEffect={handleApplyEffect}
              />
            ) : (
              <AIPanel 
                selectedVideo={selectedVideo}
                onRefresh={fetchProject}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
