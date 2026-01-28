'use client';

import { useState, useEffect, useRef } from 'react';
import QRCodeSVG from 'react-qr-code';

interface NequiCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * Componente para procesar pagos con Nequi
 * Genera un código QR que el usuario puede escanear con la app de Nequi
 */
import { AlertCircle, CheckCircle2, QrCode, Timer, Wallet } from 'lucide-react';

interface NequiCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function NequiCheckout({ amount, onSuccess, onError }: NequiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(600);
  const [error, setError] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nequi/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          description: `Prana Market Order - COP ${amount.toLocaleString()}`,
          reference: `prana-nequi-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Nequi payment');
      }

      const data = await response.json();
      const qrData = data.qr_code || data.qr_data || `nequi://pay?amount=${Math.round(amount * 100)}&ref=${data.payment_id}`;

      setQrCodeData(qrData);
      setPaymentId(data.payment_id);
      setIsSandbox(data.is_sandbox || false);
      setTimeRemaining(600);
      setStatus('pending');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/nequi/payment-status/${paymentId}`);
        if (!response.ok) throw new Error('Failed to check status');
        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onSuccess();
        } else if (data.status === 'expired') {
          setStatus('expired');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onError('Pago expirado. Intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error status check:', error);
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      setStatus('expired');
      setTimeRemaining(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(countdownInterval);
      onError('Sesión expirada. Intenta nuevamente.');
    }, 10 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(countdownInterval);
    };
  }, [paymentId, onSuccess, onError]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const simulateSuccess = async () => {
    if (!paymentId) return;
    try {
      await fetch(`/api/nequi/payment-status/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      // La verificación periódica detectará el cambio:
      setStatus('completed');
      onSuccess();
    } catch (error) {
      console.error('Error simulating success:', error);
    }
  };

  return (
    <div className="nequi-checkout animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!qrCodeData && !loading && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
            <div className="flex items-start">
              <div className="bg-emerald-600 p-2 rounded-xl mr-3 shadow-lg shadow-emerald-200 dark:shadow-none">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pago con Nequi</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Paga de forma segura y rápida usando tu billetera digital Nequi.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={createPayment}
            className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-xl shadow-emerald-100 dark:shadow-none"
          >
            <QrCode className="w-5 h-5" />
            <span>Generar QR de Pago</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 flex flex-col items-center">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-4">Generando código QR...</p>
          <p className="text-xs text-gray-500 mt-1">Conectando con Nequi</p>
        </div>
      )}

      {qrCodeData && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-emerald-100 dark:border-white/5 shadow-inner flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
              {qrCodeData.startsWith('data:image') ? (
                <img src={qrCodeData} alt="Nequi QR Code" className="w-[180px] h-[180px] object-contain" />
              ) : (
                <QRCodeSVG value={qrCodeData} size={180} level="M" />
              )}
            </div>

            {status === 'pending' && timeRemaining > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center space-x-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                  <Timer className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                    EXPIRA EN {formatTime(timeRemaining)}
                  </span>
                </div>

                {isSandbox && (
                  <button
                    onClick={simulateSuccess}
                    className="mt-2 text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-200 transition-colors font-bold uppercase tracking-wider"
                  >
                    Simular Pago Exitoso (Sandbox)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Instrucciones</span>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border-2 border-emerald-500 flex flex-shrink-0 items-center justify-center font-black text-emerald-600 text-[10px]">1</span>
                  <span>Abre tu app <strong>Nequi</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border-2 border-emerald-500 flex flex-shrink-0 items-center justify-center font-black text-emerald-600 text-[10px]">2</span>
                  <span>Escanea el código QR superior</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border-2 border-emerald-500 flex flex-shrink-0 items-center justify-center font-black text-emerald-600 text-[10px]">3</span>
                  <span>Confirma el pago de <strong>COP {amount.toLocaleString('es-CO')}</strong></span>
                </li>
              </ol>
            </div>
          </div>

          {status === 'completed' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center justify-center animate-in zoom-in duration-300">
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-3" />
                ¡Pago confirmado exitosamente!
              </span>
            </div>
          )}

          {status === 'expired' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold text-red-800 dark:text-red-400 mb-4">El código QR ha expirado</p>
              <button
                onClick={createPayment}
                className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-red-700 transition-all active:scale-95"
              >
                Generar Nuevo Código
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}