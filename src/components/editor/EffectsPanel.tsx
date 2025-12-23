'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EffectsPanelProps {
  selectedVideo: any;
  onApplyEffect: (effect: string, params: any) => void;
}

export default function EffectsPanel({ selectedVideo, onApplyEffect }: EffectsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<'filters' | 'transitions' | 'text' | 'audio'>('filters');

  const filters = [
    { id: 'brightness', name: 'Brillo', icon: '☀️', params: { min: -100, max: 100, default: 0 } },
    { id: 'contrast', name: 'Contraste', icon: '◐', params: { min: -100, max: 100, default: 0 } },
    { id: 'saturation', name: 'Saturación', icon: '🎨', params: { min: -100, max: 100, default: 0 } },
    { id: 'blur', name: 'Desenfoque', icon: '💫', params: { min: 0, max: 20, default: 0 } },
    { id: 'grayscale', name: 'Blanco y Negro', icon: '⚫', params: { min: 0, max: 100, default: 0 } },
    { id: 'sepia', name: 'Sepia', icon: '🟤', params: { min: 0, max: 100, default: 0 } },
  ];

  const transitions = [
    { id: 'fade', name: 'Fade', icon: '🌓' },
    { id: 'slide', name: 'Deslizar', icon: '⬅️' },
    { id: 'wipe', name: 'Barrido', icon: '🔄' },
    { id: 'zoom', name: 'Zoom', icon: '🔍' },
  ];

  const textEffects = [
    { id: 'title', name: 'Título', icon: '📝' },
    { id: 'subtitle', name: 'Subtítulo', icon: '💬' },
    { id: 'caption', name: 'Leyenda', icon: '📄' },
  ];

  const audioEffects = [
    { id: 'volume', name: 'Volumen', icon: '🔊' },
    { id: 'fade-in', name: 'Fade In', icon: '📈' },
    { id: 'fade-out', name: 'Fade Out', icon: '📉' },
    { id: 'normalize', name: 'Normalizar', icon: '⚖️' },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white mb-3">Efectos</h2>
        
        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-zinc-950 rounded-lg p-1">
          <Button
            onClick={() => setActiveCategory('filters')}
            variant={activeCategory === 'filters' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
          >
            🎨
          </Button>
          <Button
            onClick={() => setActiveCategory('transitions')}
            variant={activeCategory === 'transitions' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
          >
            🔄
          </Button>
          <Button
            onClick={() => setActiveCategory('text')}
            variant={activeCategory === 'text' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
          >
            📝
          </Button>
          <Button
            onClick={() => setActiveCategory('audio')}
            variant={activeCategory === 'audio' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
          >
            🔊
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedVideo ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Selecciona un video para aplicar efectos
          </div>
        ) : (
          <>
            {/* Filters */}
            {activeCategory === 'filters' && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-zinc-400 mb-3">Filtros de Color</h3>
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    onClick={() => onApplyEffect(filter.id, filter.params)}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{filter.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{filter.name}</div>
                        <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
                          Click para ajustar
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Transitions */}
            {activeCategory === 'transitions' && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-zinc-400 mb-3">Transiciones</h3>
                {transitions.map((transition) => (
                  <Button
                    key={transition.id}
                    onClick={() => onApplyEffect(`transition-${transition.id}`, {})}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{transition.icon}</span>
                      <div className="text-sm font-medium text-white">{transition.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Text */}
            {activeCategory === 'text' && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-zinc-400 mb-3">Texto y Títulos</h3>
                {textEffects.map((text) => (
                  <Button
                    key={text.id}
                    onClick={() => onApplyEffect(`text-${text.id}`, {})}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{text.icon}</span>
                      <div className="text-sm font-medium text-white">{text.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Audio */}
            {activeCategory === 'audio' && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-zinc-400 mb-3">Efectos de Audio</h3>
                {audioEffects.map((audio) => (
                  <Button
                    key={audio.id}
                    onClick={() => onApplyEffect(`audio-${audio.id}`, {})}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{audio.icon}</span>
                      <div className="text-sm font-medium text-white">{audio.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          <p className="mb-1">💡 Tip: Los efectos se aplicarán en el timeline</p>
        </div>
      </div>
    </div>
  );
}
