'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeSVG from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Timer,
  RotateCcw,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import { DeliveryMethod, ShippingAddress } from '@/context/CartContext';

interface NequiCheckoutProps {
  amount: number;
  items?: any[];
  deliveryMethod?: DeliveryMethod | null;
  shippingAddress?: ShippingAddress | null;
  subtotal?: number;
  deliveryCost?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchPaymentMethod?: () => void;
}

export default function NequiCheckout({
  amount,
  items,
  deliveryMethod,
  shippingAddress,
  subtotal,
  deliveryCost,
  onSuccess,
  onError,
  onSwitchPaymentMethod,
}: NequiCheckoutProps) {
  const [activeTab, setActiveTab] = useState<'push' | 'qr'>('push');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'expired'>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleOrderCreation = useCallback(async (paymentRef: string) => {
    try {
      const userString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userString ? JSON.parse(userString) : null;

      if (items && items.length > 0) {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            deliveryMethod,
            shippingAddress,
            subtotal,
            deliveryCost,
            total: amount,
            paymentMethod: 'nequi',
            paymentReference: paymentRef,
            userId: user?.id || null,
          }),
        });

        const orderDetails = {
          items,
          deliveryMethod,
          subtotal,
          deliveryCost,
          total: amount,
          paymentMethod: 'nequi',
          paymentReference: paymentRef,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
      }
    } catch (err) {
      console.error('Error recording order after Nequi approval:', err);
    }
  }, [items, deliveryMethod, shippingAddress, subtotal, deliveryCost, amount]);

  // Confetti particles generator
  const confettiParticles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: Math.random() * -200 - 50,
    rotate: Math.random() * 360,
    scale: Math.random() * 0.8 + 0.4,
    color: ['#FF0082', '#D45B7A', '#C89D66', '#10B981', '#3B82F6'][i % 5],
  }));

  const validatePhone = (): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== 10 || !cleaned.startsWith('3')) {
      setPhoneError('Ingresa un número de celular Nequi válido (10 dígitos comenzando con 3)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleInitiatePayment = async (mode: 'push' | 'qr') => {
    if (mode === 'push' && !validatePhone()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nequi/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          description: `Prana Market - COP $${amount.toLocaleString('es-CO')}`,
          reference: `prana-nequi-${Date.now()}`,
          phone_number: mode === 'push' ? phone.replace(/\D/g, '') : undefined,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo iniciar la transacción con Nequi');
      }

      const data = await response.json();
      const qrData =
        data.qr_code ||
        data.qr_data ||
        `nequi://pay?amount=${Math.round(amount * 100)}&ref=${data.payment_id}`;

      setQrCodeData(qrData);
      setPaymentId(data.payment_id);
      setIsSandbox(data.is_sandbox || false);
      setTimeRemaining(60); // 60s countdown as per acceptance criteria
      setStatus('pending');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la conexión con Nequi';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Status Polling & Countdown
  useEffect(() => {
    if (status !== 'pending' || !paymentId) return;

    // 2-second status polling as per acceptance criteria
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/nequi/payment-status/${paymentId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.status === 'completed') {
          setStatus('completed');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          await handleOrderCreation(paymentId);
          setTimeout(() => {
            if (isMountedRef.current) {
              onSuccess();
            }
          }, 2500); // Allow user to enjoy confetti
        } else if (data.status === 'expired') {
          setStatus('expired');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      } catch (err) {
        console.error('Error polling Nequi status:', err);
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 2000);

    // 60-second countdown
    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status, paymentId, onSuccess, handleOrderCreation]);

  const simulateSuccess = async () => {
    if (!paymentId) return;
    try {
      await fetch(`/api/nequi/payment-status/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      await handleOrderCreation(paymentId);
      setStatus('completed');
      setTimeout(() => {
        if (isMountedRef.current) {
          onSuccess();
        }
      }, 2500);
    } catch (err) {
      console.error('Error simulating Nequi approval:', err);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setPaymentId(null);
    setQrCodeData(null);
    setError(null);
    setTimeRemaining(60);
  };

  return (
    <div className="nequi-checkout-card space-y-6">
      {/* Header Tabs */}
      {status === 'idle' && (
        <div className="space-y-4">
          <div className="flex bg-stone-100 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('push');
                setPhoneError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'push'
                  ? 'bg-[#FF0082] text-white shadow-lg shadow-[#FF0082]/20'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Notificación Push (App)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('qr');
                setPhoneError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'qr'
                  ? 'bg-[#FF0082] text-white shadow-lg shadow-[#FF0082]/20'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Código QR Dinámico</span>
            </button>
          </div>

          {activeTab === 'push' ? (
            <div className="bg-[#FF0082]/5 border-2 border-[#FF0082]/10 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-[#FF0082] p-2.5 rounded-2xl text-white shadow-md shadow-[#FF0082]/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                    Aprobación Directa Nequi
                  </h4>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                    Recibirás una notificación en tu app Nequi
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">
                  Número Celular Nequi
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="300 123 4567"
                  className={`w-full h-12 px-4 bg-white border rounded-2xl text-sm font-black text-stone-900 outline-none transition-all ${
                    phoneError
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-stone-200 focus:border-[#FF0082] focus:ring-2 focus:ring-[#FF0082]/20'
                  }`}
                />
                {phoneError && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{phoneError}</p>
                )}
              </div>

              <button
                onClick={() => handleInitiatePayment('push')}
                disabled={loading}
                className="w-full h-14 bg-[#FF0082] hover:bg-[#D4006B] text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-[#FF0082]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Solicitar Aprobación en Nequi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#FF0082]/5 border-2 border-[#FF0082]/10 rounded-[2rem] p-6 space-y-4 text-center">
              <div className="flex justify-center">
                <div className="bg-[#FF0082] p-3 rounded-2xl text-white shadow-md shadow-[#FF0082]/20">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                    Pago por QR Dinámico
                  </h4>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Genera un código QR listo para escanear con Nequi
                </p>
              </div>
              <button
                onClick={() => handleInitiatePayment('qr')}
                disabled={loading}
                className="w-full h-14 bg-[#FF0082] hover:bg-[#D4006B] text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-[#FF0082]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Generar Código QR</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Approval Modal / Card */}
      {status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-[#FF0082]/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center relative overflow-hidden"
        >
          {/* Animated Pulse Ring */}
          <div className="relative flex justify-center items-center py-4">
            <motion.div
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.6, 0.1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-24 h-24 bg-[#FF0082] rounded-full"
            />
            <div className="relative z-10 bg-[#FF0082] p-5 rounded-full text-white shadow-xl shadow-[#FF0082]/30">
              <Smartphone className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">
              Esperando Confirmación
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {activeTab === 'push'
                ? `Hemos enviado una notificación al número ${phone}`
                : 'Escanea el código QR desde tu app Nequi'}
            </p>
          </div>

          {/* 60s Countdown Timer Ring */}
          <div className="inline-flex items-center space-x-2 bg-[#FF0082]/10 border border-[#FF0082]/20 px-5 py-2 rounded-full">
            <Timer className="w-4 h-4 text-[#FF0082] animate-pulse" />
            <span className="text-xs font-black text-[#FF0082]">
              TIEMPO RESTANTE: {timeRemaining}s
            </span>
          </div>

          {/* QR Code display if QR tab active */}
          {activeTab === 'qr' && qrCodeData && (
            <div className="flex flex-col items-center pt-2 space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-md">
                {qrCodeData.startsWith('data:image') ? (
                  <img src={qrCodeData} alt="Nequi QR Code" className="w-40 h-40 object-contain" />
                ) : (
                  <QRCodeSVG value={qrCodeData} size={160} level="M" />
                )}
              </div>
              <div className="w-full bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
                  Texto QR / Llave Nequi (Alternativa)
                </p>
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-100">
                  <span className="text-xs font-mono font-bold text-stone-800 truncate">
                    {qrCodeData}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(qrCodeData);
                      alert('Texto QR copiado al portapapeles');
                    }}
                    className="text-[10px] bg-[#FF0082] text-white px-2 py-1 rounded font-bold uppercase hover:bg-[#D4006B] transition-colors flex-shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Polling Indicator */}
          <div className="flex items-center justify-center space-x-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest pt-2">
            <div className="w-2 h-2 rounded-full bg-[#FF0082] animate-ping" />
            <span>Verificando estado cada 2 segundos...</span>
          </div>

          {/* Sandbox Simulation Trigger */}
          {isSandbox && (
            <button
              onClick={simulateSuccess}
              className="mt-2 text-[10px] bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full border border-amber-200 font-bold uppercase tracking-widest hover:bg-amber-200 transition-colors"
            >
              Simular Aprobación Nequi (Modo Sandbox)
            </button>
          )}
        </motion.div>
      )}

      {/* Confetti Celebration Screen */}
      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border-2 border-emerald-500/30 rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden"
        >
          {/* Confetti particles */}
          {confettiParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y + 300,
                opacity: [1, 1, 0],
                rotate: p.rotate + 360,
              }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: 10 * p.scale,
                height: 10 * p.scale,
                backgroundColor: p.color,
                borderRadius: '2px',
              }}
            />
          ))}

          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡Pago Exitoso!</span>
              </div>
              <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                ¡Pago con Nequi Aprobado!
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Tu transacción fue procesada de forma instantánea.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">Monto:</span>
                <span className="font-black text-stone-900">COP ${amount.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">Método:</span>
                <span className="font-black text-[#FF0082]">Nequi Directo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">Referencia:</span>
                <span className="font-bold text-stone-500 text-[10px]">{paymentId}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeout / Failure State */}
      {status === 'expired' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-[2.5rem] p-8 space-y-6 text-center"
        >
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-lg font-black text-red-900 uppercase tracking-tight">
              Solicitud Expirada o Rechazada
            </h4>
            <p className="text-xs text-red-700 font-medium mt-1">
              No recibimos la confirmación de Nequi a tiempo. Tu carrito se ha conservado intacto.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar con Nequi</span>
            </button>

            {onSwitchPaymentMethod && (
              <button
                onClick={onSwitchPaymentMethod}
                className="w-full h-12 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Probar otro medio de pago (PSE / Tarjeta)
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}