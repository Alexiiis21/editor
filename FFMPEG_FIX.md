# Solución al Error de FFmpeg en Next.js

## Problema

El error original:
```
Module not found: Can't resolve './ROOT/Documents/editor/node_modules/.pnpm/@ffmpeg-installer+ffmpeg@1.1.0/node_modules/@ffmpeg-installer/ffmpeg/node_modules/@ffmpeg-installer/win32-x64/package.json'
```

Este error ocurre porque:
1. **FFmpeg-installer** intenta resolver rutas de archivos binarios de forma dinámica
2. **Webpack** (usado por Next.js) no puede empaquetar correctamente estos archivos nativos
3. Las rutas absolutas generadas por el instalador entran en conflicto con el sistema de módulos de Next.js

## Solución Implementada

### 1. Configuración de Next.js (`next.config.ts`)

Se agregaron dos configuraciones importantes:

```typescript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push({
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
    });
  }
  return config;
}
```

Esto le indica a webpack que **NO empaquete** estos módulos, sino que los deje como dependencias externas.

```typescript
serverComponentsExternalPackages: [
  'fluent-ffmpeg',
  '@ffmpeg-installer/ffmpeg',
]
```

Esto permite que estos paquetes se ejecuten directamente en el servidor sin ser procesados por el bundler.

### 2. Importación Dinámica (`render-service.ts`)

Se cambió de:
```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
```

A importación dinámica:
```typescript
let ffmpegModule: typeof import('fluent-ffmpeg') | null = null;

async function getFFmpeg() {
  if (!ffmpegModule) {
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
    const fluent = await import('fluent-ffmpeg');
    ffmpegModule = fluent.default;
    ffmpegModule.setFfmpegPath(ffmpegInstaller.default.path);
  }
  return ffmpegModule;
}
```

Esto retrasa la carga de FFmpeg hasta que realmente se necesita, evitando problemas durante el build.

## Cómo Aplicar los Cambios

1. **Los archivos ya están actualizados**
2. **Reinicia el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

3. **Verifica que funciona:**
   - Ve al editor
   - Intenta exportar un proyecto
   - No deberías ver el error de módulo

## Archivos Modificados

- ✅ `next.config.ts` - Configuración de webpack
- ✅ `src/lib/services/render-service.ts` - Importación dinámica

## Notas Técnicas

- Esta solución es necesaria solo en entornos de Next.js/webpack
- Los paquetes FFmpeg siguen funcionando normalmente
- El binario de FFmpeg se carga desde `node_modules/@ffmpeg-installer/win32-x64` (en Windows)
- No afecta el rendimiento en producción

## Testing

Después de reiniciar el servidor, prueba:

1. Subir un video a un proyecto
2. Hacer clic en "📤 Exportar"
3. El proceso debería iniciar sin errores de módulo
4. El progreso debería mostrarse correctamente

Si aún hay problemas, verifica:
- Los paquetes están instalados: `pnpm list @ffmpeg-installer/ffmpeg fluent-ffmpeg`
- El servidor se reinició completamente
- No hay errores en la consola del navegador
