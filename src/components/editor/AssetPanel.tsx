'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AssetPanelProps {
  videos: any[];
  onSelectVideo: (video: any) => void;
  selectedVideoId?: string;
  onRefresh: () => void;
}

export default function AssetPanel({ videos, onSelectVideo, selectedVideoId, onRefresh }: AssetPanelProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);

    const fileId = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const chunks = Math.ceil(file.size / chunkSize);

    try {
      if (file.size > chunkSize) {
        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('file', chunk);
          formData.append('projectId', projectId);
          formData.append('fileId', fileId);
          formData.append('chunkIndex', i.toString());
          formData.append('totalChunks', chunks.toString());
          formData.append('totalSize', file.size.toString());

          const res = await fetch('/api/upload/video', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error('Upload failed');

          const data = await res.json();
          setUploadProgress(data.progress || Math.round(((i + 1) / chunks) * 100));

          if (data.completed) {
            onRefresh();
            break;
          }
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('fileId', fileId);

        const res = await fetch('/api/upload/video', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          onRefresh();
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error al subir el archivo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        alert('Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold mb-3">Medios</h2>
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <div className={`w-full rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            isUploading ? 'border-primary bg-primary/5' : 'border-zinc-700 hover:border-zinc-600 cursor-pointer'
          }`}>
            {isUploading ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Subiendo {uploadingFileName}...</div>
                <Progress value={uploadProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">{uploadProgress}%</div>
              </div>
            ) : (
              <>
                <div className="text-2xl mb-1">📤</div>
                <div className="text-xs text-zinc-400">Subir video o imagen</div>
                <div className="text-[10px] text-zinc-600 mt-1">MP4, MOV, JPG, PNG</div>
              </>
            )}
          </div>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-500">No hay archivos aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`rounded-lg p-2 transition-all ${
                  selectedVideoId === video.id
                    ? 'bg-primary/20 border border-primary shadow-lg'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <button onClick={() => onSelectVideo(video)} className="w-full text-left">
                  <div className="aspect-video bg-zinc-900 rounded mb-2 flex items-center justify-center overflow-hidden relative group">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.filename} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{video.mimeType?.startsWith('image/') ? '🖼️' : '🎥'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">▶️ Seleccionar</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <p className="font-medium text-white truncate mb-1" title={video.originalName}>
                      {video.originalName}
                    </p>
                    <div className="flex items-center gap-2 text-zinc-500 flex-wrap">
                      {video.duration && <span>{Math.floor(video.duration)}s</span>}
                      {video.size && <span>{formatFileSize(Number(video.size))}</span>}
                      <Badge 
                        variant={
                          video.status === 'READY' ? 'default' :
                          video.status === 'PROCESSING' ? 'secondary' :
                          video.status === 'UPLOADING' ? 'outline' : 'destructive'
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {video.status}
                      </Badge>
                    </div>
                  </div>
                </button>

                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 text-xs text-muted-foreground">
        {videos.length} archivo{videos.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
