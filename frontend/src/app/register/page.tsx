'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, Lock, User, ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, state } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      router.push('/');
    } catch (err) {
      setError('El registro ha fallado. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in zoom-in duration-700">

        {/* Left Side: Branding/Image Section */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-primary/90 to-brand-accent text-white relative overflow-hidden order-last">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Prana Market</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Sé parte de <br /> Prana Market
            </h1>
            <p className="text-brand-secondary text-lg max-w-sm leading-relaxed">
              Regístrate hoy y obtén acceso exclusivo a las últimas tendencias en belleza y ofertas especiales personalizadas para ti.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-secondary/30 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">Registro Rápido</p>
                <p className="text-xs text-brand-secondary">Menos de 1 minuto</p>
              </div>
            </div>
            <p className="text-sm text-brand-secondary">
              "La mejor plataforma para encontrar mis productos favoritos. El proceso de registro fue súper sencillo."
            </p>
            <p className="text-xs font-bold mt-2">— Maria Garcia</p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Register Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10 lg:hidden text-center">
              <h1 className="text-3xl font-extrabold text-stone-900 mb-2">Prana Market</h1>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-stone-900 mb-2">Crear Cuenta</h2>
              <p className="text-stone-500">Completa tus datos para empezar tu experiencia.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Nombre de Usuario"
                placeholder="tu_usuario"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<User className="w-5 h-5" />}
              />

              <Input
                label="Correo Electrónico"
                placeholder="ejemplo@email.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in shake duration-500">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg shadow-brand-primary/20 mt-4"
                isLoading={state.loading}
              >
                {!state.loading && (
                  <>
                    Registrarme <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
                {state.loading && 'Creando cuenta...'}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-stone-100 text-center">
              <p className="text-stone-500 text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-brand-primary font-bold hover:underline transition-all">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
