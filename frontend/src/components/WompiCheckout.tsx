'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Printer,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface WompiCheckoutProps {
  amount: number;
  items?: any[];
  shippingAddress?: any;
  deliveryMethod?: string;
  subtotal?: number;
  deliveryCost?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchPaymentMethod?: () => void;
}

type PaymentTab = 'PSE' | 'CARD' | 'CASH';

const COLOMBIAN_BANKS = [
  { code: '1007', name: 'Bancolombia' },
  { code: '1507', name: 'Nequi' },
  { code: '1051', name: 'Davivienda' },
  { code: '1001', name: 'Banco de Bogotá' },
  { code: '1013', name: 'BBVA Colombia' },
  { code: '1023', name: 'Banco de Occidente' },
  { code: '1019', name: 'Scotiabank Colpatria' },
  { code: '1052', name: 'Banco AV Villas' },
  { code: '1002', name: 'Banco Popular' },
  { code: '1551', name: 'Daviplata' },
  { code: '1040', name: 'Banco Agrario' }
];

export default function WompiCheckout({
  amount,
  items = [],
  shippingAddress,
  deliveryMethod,
  subtotal,
  deliveryCost,
  onSuccess,
  onError,
  onSwitchPaymentMethod
}: WompiCheckoutProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('PSE');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedBank, setSelectedBank] = useState('1007'); // Default Bancolombia
  const [docType, setDocType] = useState('CC');
  const [docNumber, setDocNumber] = useState('');
  const [userType, setUserType] = useState('0'); // 0: Natural, 1: Jurídica
  const [customerEmail, setCustomerEmail] = useState(shippingAddress?.email || 'cliente@pranamarket.com');
  const [customerName, setCustomerName] = useState(shippingAddress?.name || 'Cliente Prana');

  // Cash Voucher state
  const [cashNetwork, setCashNetwork] = useState<'EFECTY' | 'BALOTO'>('EFECTY');
  const [generatedVoucher, setGeneratedVoucher] = useState<{
    reference_pin: string;
    convenio_number: string;
    entity_name: string;
    expires_at: string;
    amount_cop: number;
    instructions: string;
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);

  const handleCopyPin = async (pin: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pin);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = pin;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch (e) {
      console.warn('Clipboard write fallback triggered:', e);
    }
  };

  const handleCreateTransaction = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const reference = `PRANA-${Date.now().toString().slice(-6)}`;
      const payload: any = {
        amount_in_cents: Math.round(amount * 100),
        currency: 'COP',
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: shippingAddress?.phone || '3001234567',
        reference,
        payment_method_type: activeTab === 'CASH' ? cashNetwork : activeTab,
        redirect_url: typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : undefined
      };

      if (activeTab === 'PSE') {
        if (!docNumber.trim()) {
          throw new Error('Por favor ingresa tu número de documento para PSE.');
        }
        payload.bank_code = selectedBank;
        payload.user_type = userType;
        payload.user_legal_id = docNumber.trim();
        payload.user_legal_id_type = docType;
      }

      const response = await fetch('/api/wompi/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'No se pudo crear la transacción con Wompi.');
      }

      // If Cash voucher received
      if (data.voucher) {
        setGeneratedVoucher(data.voucher);
        setLoading(false);
        return;
      }

      // If redirect URL provided
      if (data.checkout_url) {
        if (data.checkout_url.includes('mock=true')) {
          onSuccess();
        } else {
          window.location.href = data.checkout_url;
        }
      } else {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.message || 'Error al procesar el pago.';
      setErrorMsg(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
              Wompi Colombia
            </span>
            <div className="flex items-center text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              100% Seguro
            </div>
          </div>
          <h3 className="text-lg font-black text-stone-900 mt-2">
            Pasarela de Pago Wompi
          </h3>
          <p className="text-xs text-stone-500 font-medium">
            Tarjetas, transferencias PSE y redes físicas de efectivo en Colombia
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-stone-400 uppercase font-black tracking-wider block">Total a Pagar</span>
          <span className="text-lg font-black text-stone-900">{formattedAmount}</span>
        </div>
      </div>

      {/* Tabs */}
      {!generatedVoucher && (
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('PSE')}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all',
              activeTab === 'PSE'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            )}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>PSE Bancos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CARD')}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all',
              activeTab === 'CARD'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            )}
          >
            <CreditCard className="w-4 h-4 text-purple-600" />
            <span>Tarjetas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CASH')}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all',
              activeTab === 'CASH'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            )}
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Efecty / Baloto</span>
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: PSE */}
      {!generatedVoucher && activeTab === 'PSE' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
              Banco Emisor (PSE)
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-stone-200 bg-stone-50 font-medium text-stone-900 text-sm focus:outline-none focus:border-brand-primary"
            >
              {COLOMBIAN_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                Tipo Doc.
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl border border-stone-200 bg-stone-50 font-medium text-stone-900 text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="PP">Pasaporte</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                Número de Documento
              </label>
              <input
                type="text"
                placeholder="Ej. 1020304050"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-stone-200 bg-stone-50 font-medium text-stone-900 text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Al pulsar el botón serás redirigido con total seguridad al portal de tu banco mediante PSE.</span>
          </div>

          <Button
            onClick={handleCreateTransaction}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
          >
            {loading ? 'Conectando con PSE...' : `Pagar ${formattedAmount} con PSE`}
          </Button>
        </div>
      )}

      {/* TAB 2: CREDIT / DEBIT CARDS */}
      {!generatedVoucher && activeTab === 'CARD' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
                Tarjetas Aceptadas
              </span>
              <div className="flex gap-2 text-xs font-bold text-stone-600">
                <span className="bg-white px-2 py-0.5 rounded border border-purple-200">Visa</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-200">Mastercard</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-200">Amex</span>
              </div>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Cumplimiento estricto <strong>PCI-DSS Nivel 1</strong>. Tus datos de tarjeta son procesados directamente por la infraestructura segura de Wompi Bancolombia; ningún dato sensible toca los servidores de Prana.
            </p>
          </div>

          <Button
            onClick={handleCreateTransaction}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-black bg-stone-900 hover:bg-stone-800 text-white shadow-xl"
          >
            {loading ? 'Iniciando Wompi...' : `Pagar ${formattedAmount} con Tarjeta`}
          </Button>
        </div>
      )}

      {/* TAB 3: CASH NETWORKS (EFECTY / BALOTO) */}
      {!generatedVoucher && activeTab === 'CASH' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
              Selecciona la Red de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCashNetwork('EFECTY')}
                className={cn(
                  'p-3.5 rounded-2xl border-2 text-left transition-all',
                  cashNetwork === 'EFECTY'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
              >
                <span className="text-xs font-black block text-stone-900">Efecty</span>
                <span className="text-[10px] text-stone-500">Más de 10,000 puntos en Colombia</span>
              </button>

              <button
                type="button"
                onClick={() => setCashNetwork('BALOTO')}
                className={cn(
                  'p-3.5 rounded-2xl border-2 text-left transition-all',
                  cashNetwork === 'BALOTO'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
              >
                <span className="text-xs font-black block text-stone-900">Baloto / SuRed</span>
                <span className="text-[10px] text-stone-500">Puntos Baloto y droguerías</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Al generar el comprobante tendrás 48 horas para pagar en efectivo en cualquier punto físico autorizado.</span>
          </div>

          <Button
            onClick={handleCreateTransaction}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-black bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
          >
            {loading ? 'Generando PIN...' : 'Generar Comprobante con PIN de Pago'}
          </Button>
        </div>
      )}

      {/* CASH VOUCHER PRESENTATION SCREEN */}
      {generatedVoucher && (
        <div className="space-y-5 animate-in zoom-in-95 duration-400">
          <div className="border-2 border-dashed border-stone-300 bg-stone-50 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Comprobante Oficial
                </span>
                <h4 className="text-base font-black text-stone-900 mt-1">
                  {generatedVoucher.entity_name}
                </h4>
              </div>
              <span className="text-xs font-bold text-stone-500">
                Vence en 48h
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Convenio</span>
                <span className="text-sm font-black text-stone-900">{generatedVoucher.convenio_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Valor a Pagar</span>
                <span className="text-sm font-black text-stone-900">{formattedAmount}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">
                  PIN / Referencia de Pago
                </span>
                <span className="text-lg font-mono font-black text-stone-900 tracking-wider">
                  {generatedVoucher.reference_pin}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPin(generatedVoucher.reference_pin)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
              >
                {copiedPin ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPin ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {generatedVoucher.instructions}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 h-12 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-black flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comprobante</span>
            </button>

            <Button
              onClick={onSuccess}
              className="flex-1 h-12 rounded-2xl text-xs font-black bg-stone-900 text-white"
            >
              <span>Finalizar y Guardar</span>
            </Button>
          </div>
        </div>
      )}

      {/* Switch method CTA */}
      {onSwitchPaymentMethod && !generatedVoucher && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchPaymentMethod}
            className="text-xs text-stone-500 hover:text-stone-900 font-bold underline"
          >
            Cambiar a otro método de pago
          </button>
        </div>
      )}
    </div>
  );
}