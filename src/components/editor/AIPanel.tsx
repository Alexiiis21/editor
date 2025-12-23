'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AIPanelProps {
  selectedVideo: any;
  onRefresh: () => void;
}

export default function AIPanel({ selectedVideo, onRefresh }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'tasks'>('tools');
  const [isProcessing, setIsProcessing] = useState(false);

  const runAITask = async (taskType: string) => {
    if (!selectedVideo) return;

    setIsProcessing(true);
    try {
      const endpoint = taskType === 'transcribe' 
        ? '/api/ai/transcribe' 
        : '/api/ai/analyze';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.id }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('AI task created:', data);
        onRefresh();
      }
    } catch (error) {
      console.error('Error running AI task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold mb-3">Herramientas IA</h2>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
          <Button
            onClick={() => setActiveTab('tools')}
            variant={activeTab === 'tools' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
          >
            Herramientas
          </Button>
          <Button
            onClick={() => setActiveTab('tasks')}
            variant={activeTab === 'tasks' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
          >
            Tareas
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedVideo ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Selecciona un video para usar herramientas IA
          </div>
        ) : activeTab === 'tools' ? (
          <div className="space-y-3">
            {/* Transcripción */}
            <Button
              onClick={() => runAITask('transcribe')}
              disabled={isProcessing}
              variant="outline"
              className="w-full justify-start h-auto p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎙️</span>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Transcribir</h3>
                  <p className="text-xs text-zinc-400">
                    Convierte el audio a texto automáticamente
                  </p>
                </div>
              </div>
            </Button>

            {/* Detección de Escenas */}
            <Button
              onClick={() => runAITask('analyze')}
              disabled={isProcessing}
              variant="outline"
              className="w-full justify-start h-auto p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎬</span>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Detectar Escenas</h3>
                  <p className="text-xs text-zinc-400">
                    Identifica cambios de escena automáticamente
                  </p>
                </div>
              </div>
            </Button>

            {/* Auto Edit */}
            <Button
              disabled
              variant="outline"
              className="w-full justify-start h-auto p-4 opacity-50"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Edición Auto</h3>
                  <p className="text-xs text-zinc-400">
                    Genera ediciones automáticas con IA
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    Próximamente
                  </Badge>
                </div>
              </div>
            </Button>

            {/* Subtítulos */}
            <Button
              disabled
              variant="outline"
              className="w-full justify-start h-auto p-4 opacity-50"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Generar Subtítulos</h3>
                  <p className="text-xs text-zinc-400">
                    Crea subtítulos automáticamente
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    Próximamente
                  </Badge>
                </div>
              </div>
            </Button>
          </div>
        ) : (
          /* Tasks Tab */
          <div className="space-y-2">
            {selectedVideo.aiTasks?.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No hay tareas de IA aún
              </div>
            ) : (
              selectedVideo.aiTasks?.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium">
                      {task.type === 'TRANSCRIBE' ? '🎙️ Transcripción' : '🎬 Análisis'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : task.status === 'PROCESSING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : task.status === 'FAILED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {new Date(task.createdAt).toLocaleString('es-ES')}
                  </p>
                  {task.error && (
                    <p className="text-xs text-red-400 mt-2">{task.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedVideo && (
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>DeepSeek AI</span>
          </div>
        </div>
      )}
    </div>
  );
}
