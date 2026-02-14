'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, state } = useAuth();
  const router = useRouter();

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (state.user && state.token && !state.loading) {
      router.push('/');
    }
  }, [state.user, state.token, state.loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in zoom-in duration-700">

        {/* Left Side: Branding/Image Section */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-primary to-brand-accent text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Prana Market</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Bienvenido de <br /> nuevo a Prana
            </h1>
            <p className="text-brand-secondary text-lg max-w-sm leading-relaxed">
              Tu portal exclusivo para descubrir los mejores productos de belleza y cuidado personal con la mejor calidad.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-sm font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-primary bg-stone-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-brand-secondary">Únete a más de <span className="text-white font-bold">2,000+</span> clientes felices.</p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10 lg:hidden text-center">
              <h1 className="text-3xl font-extrabold text-stone-900 mb-2">Prana Market</h1>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-stone-900 mb-2">Iniciar Sesión</h2>
              <p className="text-stone-500">Ingresa tus credenciales para acceder a tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Correo o Usuario"
                placeholder="ejemplo@email.com"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
              />

              <div className="space-y-1">
                <Input
                  label="Contraseña"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                />
                <div className="flex justify-end p-1">
                  <Link href="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in shake duration-500">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg shadow-brand-primary/20"
                isLoading={state.loading}
              >
                {!state.loading && (
                  <>
                    Entrar <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
                {state.loading && 'Iniciando sesión...'}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-stone-100 text-center">
              <p className="text-stone-500 text-sm">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-brand-primary font-bold hover:underline transition-all">
                  Crea una aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
