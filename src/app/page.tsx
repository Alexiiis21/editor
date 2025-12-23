import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-4">
      <div className="max-w-4xl text-center">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-7xl mb-6">🎬</div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Video Editor <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Edita videos con el poder de la Inteligencia Artificial. Transcripción automática, detección de escenas y más.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/signup"
            className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Comenzar Gratis
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg border border-zinc-700 px-8 py-4 text-lg font-medium text-white hover:bg-zinc-900 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="text-3xl mb-3">🎙️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Transcripción IA</h3>
            <p className="text-sm text-zinc-400">
              Convierte audio a texto automáticamente con DeepSeek AI
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="text-lg font-semibold text-white mb-2">Detección de Escenas</h3>
            <p className="text-sm text-zinc-400">
              Identifica cambios de escena automáticamente
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Edición Inteligente</h3>
            <p className="text-sm text-zinc-400">
              IA que sugiere cortes y mejoras para tus videos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
