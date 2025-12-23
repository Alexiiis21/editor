import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Excluir paquetes de FFmpeg del bundling de webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
      });
    }
    return config;
  },
  
  // Permitir que estos paquetes se ejecuten en el servidor
  serverComponentsExternalPackages: [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
  ],
};

export default nextConfig;
