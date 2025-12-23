'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TimelineProps {
  projectId: string;
  timelineData: any;
}

export default function Timeline({ projectId, timelineData }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            ⏮️
          </Button>
          <Button variant="secondary" size="sm">
            ▶️
          </Button>
          <Button variant="secondary" size="sm">
            ⏭️
          </Button>
          <span className="text-xs text-zinc-400 ml-2">00:00:00</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Zoom:</span>
          <Button 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0"
          >
            -
          </Button>
          <span className="text-xs text-zinc-400 w-12 text-center">{zoom}x</span>
          <Button 
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0"
          >
            +
          </Button>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-zinc-900"
      >
        {/* Time Ruler */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 h-8 flex items-center px-4 text-xs text-zinc-400 z-10">
          {Array.from({ length: 20 }, (_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0" 
              style={{ width: `${50 * zoom}px` }}
            >
              {i}s
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div className="p-4">
          {/* Video Track */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium w-16">📹 Video</span>
            </div>
            <div className="h-16 bg-zinc-800/50 rounded border border-zinc-800 relative">
              {/* Clips would go here */}
              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
                Arrastra clips aquí
              </div>
            </div>
          </div>

          {/* Audio Track */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium w-16">🔊 Audio</span>
            </div>
            <div className="h-12 bg-zinc-800/50 rounded border border-zinc-800 relative">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
                Arrastra audio aquí
              </div>
            </div>
          </div>

          {/* Text Track */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium w-16">📝 Texto</span>
            </div>
            <div className="h-12 bg-zinc-800/50 rounded border border-zinc-800 relative">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
                Arrastra texto aquí
              </div>
            </div>
          </div>
        </div>

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
          style={{ left: `${playheadPosition}px` }}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
