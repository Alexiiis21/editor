'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Error de configuración del servidor.';
      case 'AccessDenied':
        return 'Acceso denegado.';
      case 'Verification':
        return 'El token de verificación ha expirado o ya ha sido utilizado.';
      case 'OAuthSignin':
        return 'Error al intentar iniciar sesión con el proveedor OAuth.';
      case 'OAuthCallback':
        return 'Error en el callback de OAuth.';
      case 'OAuthCreateAccount':
        return 'No se pudo crear la cuenta con OAuth.';
      case 'EmailCreateAccount':
        return 'No se pudo crear la cuenta con email.';
      case 'Callback':
        return 'Error en el callback de autenticación.';
      case 'OAuthAccountNotLinked':
        return 'Este email ya está asociado con otra cuenta. Por favor usa el método original de inicio de sesión.';
      case 'EmailSignin':
        return 'No se pudo enviar el email de verificación.';
      case 'CredentialsSignin':
        return 'Credenciales inválidas. Por favor verifica tu email y contraseña.';
      case 'SessionRequired':
        return 'Debes iniciar sesión para acceder a esta página.';
      default:
        return 'Ha ocurrido un error durante la autenticación.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Error de Autenticación
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8 shadow-2xl">
          {/* Error Message */}
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-4 text-sm text-red-400">
            {getErrorMessage(error)}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Volver a Iniciar Sesión
            </Link>
            
            <Link
              href="/auth/signup"
              className="block w-full rounded-lg border border-zinc-700 px-4 py-3 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Crear Nueva Cuenta
            </Link>
          </div>
        </div>

        {/* Help */}
        <p className="mt-8 text-center text-sm text-zinc-500">
          Si el problema persiste, contacta a soporte
        </p>
      </div>
    </div>
  );
}
