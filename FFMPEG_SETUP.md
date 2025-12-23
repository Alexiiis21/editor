# Configuración de FFmpeg para Exportación de Videos

## Requisitos

Para que la funcionalidad de exportación funcione, necesitas tener **FFmpeg** instalado en tu sistema.

## Instalación de FFmpeg

### Windows

1. **Descargar FFmpeg:**
   - Ve a https://www.gyan.dev/ffmpeg/builds/
   - Descarga "ffmpeg-release-essentials.zip"

2. **Instalar:**
   - Extrae el archivo ZIP
   - Copia la carpeta a `C:\ffmpeg`
   - Agrega `C:\ffmpeg\bin` a las variables de entorno PATH

3. **Verificar instalación:**
   ```bash
   ffmpeg -version
   ```

### macOS

Usando Homebrew:
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

## Verificar que está funcionando

Una vez instalado FFmpeg, reinicia tu terminal y ejecuta:

```bash
ffmpeg -version
```

Deberías ver la información de versión de FFmpeg.

## Alternativa: FFmpeg desde Node.js

Si prefieres no instalar FFmpeg globalmente, puedes usar las dependencias de npm:

```bash
pnpm add @ffmpeg-installer/ffmpeg fluent-ffmpeg
pnpm add -D @types/fluent-ffmpeg
```

Luego necesitarás modificar `src/lib/services/render-service.ts` para usar `fluent-ffmpeg` en lugar de spawn directo.

## Configuración del proyecto

Asegúrate de que tu archivo `.env` tenga configurada la ruta de uploads:

```env
UPLOAD_DIR=./uploads
```

## Uso

1. Sube videos a tu proyecto
2. Haz clic en el botón "📤 Exportar" en el editor
3. El sistema procesará y renderizará tu video
4. Cuando termine, se descargará automáticamente

## Troubleshooting

### Error: "ffmpeg: command not found"
- FFmpeg no está instalado o no está en el PATH
- Sigue las instrucciones de instalación arriba

### Error al renderizar
- Verifica que los videos se hayan subido correctamente
- Revisa los logs del servidor para más detalles
- Asegúrate de tener espacio en disco suficiente en la carpeta `uploads/renders`

### Progreso bloqueado
- El renderizado puede tardar varios minutos dependiendo del tamaño del video
- Verifica los logs del servidor para ver el progreso
- Si está bloqueado por más de 10 minutos, puede haber un error
