'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Copy,
    Smartphone,
    MessageCircle,
    AlertCircle,
    QrCode,
    Info
} from 'lucide-react';
import { DeliveryMethod, ShippingAddress } from '@/context/CartContext';

interface ManualNequiCheckoutProps {
    items: any[];
    deliveryMethod: DeliveryMethod | null;
    shippingAddress: ShippingAddress | null;
    subtotal: number;
    deliveryCost: number;
    total: number;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export default function ManualNequiCheckout({
    items,
    deliveryMethod,
    shippingAddress,
    subtotal,
    deliveryCost,
    total,
    onSuccess,
    onError
}: ManualNequiCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);

    // CONFIGURACIÓN DE NEQUI - El usuario puede cambiar esto fácilmente
    const NEQUI_NUMBER = "318 202 6212"; // Cambiar por el número real
    const NEQUI_NAME = "PRANA MARKET";

    const handleCopy = () => {
        navigator.clipboard.writeText(NEQUI_NUMBER.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmOrder = async () => {
        if (!deliveryMethod) {
            onError('Por favor selecciona un método de entrega');
            return;
        }

        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user || !user.id) {
                throw new Error('Debes iniciar sesión para realizar un pedido');
            }

            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    deliveryMethod,
                    shippingAddress,
                    subtotal,
                    deliveryCost,
                    total,
                    paymentMethod: 'nequi_manual',
                    userId: user.id
                }),
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.error || 'No se pudo crear el pedido');
            }

            const orderData = await orderResponse.json();

            // Guardar detalles del pedido
            const orderDetails = {
                items,
                deliveryMethod,
                subtotal,
                deliveryCost,
                total,
                paymentMethod: 'nequi_manual',
                orderId: orderData.data?.id,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

            setOrderCreated(true);
            onSuccess();
        } catch (error) {
            console.error('Error creating order:', error);
            onError(error instanceof Error ? error.message : 'Hubo un error al crear la orden.');
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppNotify = () => {
        const message = `¡Hola Prana Market! Acabo de realizar una transferencia Nequi por mi pedido. El total es COP ${total.toLocaleString('es-CO')}. Adjunto el comprobante.`;
        const whatsappUrl = `https://wa.me/573000000000?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="manual-nequi-checkout space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#FF0082]/5 border-2 border-[#FF0082]/10 rounded-2xl p-5 overflow-hidden relative">
                {/* Decoración de fondo */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF0082]/5 rounded-full blur-2xl" />

                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-[#FF0082] p-2.5 rounded-xl shadow-lg shadow-[#FF0082]/20">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Transferencia Nequi</h4>
                        <p className="text-[10px] text-[#FF0082] font-bold uppercase tracking-widest">Pago inmediato</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex flex-col items-center justify-center py-4 bg-white/50 backdrop-blur-sm rounded-xl border border-[#FF0082]/10">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Número Nequi</span>
                        <div className="flex items-center space-x-3 py-1">
                            <span className="text-2xl font-black text-gray-900 tracking-tighter">{NEQUI_NUMBER}</span>
                            <button
                                onClick={handleCopy}
                                className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <span className="text-xs font-bold text-[#FF0082] mt-1">{NEQUI_NAME}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <div className="flex items-start">
                            <Info className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                                Transfiere exactamente <strong>COP {total.toLocaleString('es-CO')}</strong> a este número y luego confirma tu pedido.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Pasos a seguir:</h5>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400">1</span>
                        <p className="text-xs text-gray-600">Realiza la transferencia en tu app <strong>Nequi</strong></p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400">2</span>
                        <p className="text-xs text-gray-600">Presiona el botón <strong>"Confirmar Pedido"</strong> abajo</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400">3</span>
                        <p className="text-xs text-gray-600">Envía el comprobante por <strong>WhatsApp</strong></p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <button
                    onClick={handleConfirmOrder}
                    disabled={loading || orderCreated}
                    className="w-full bg-[#FF0082] text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl shadow-[#FF0082]/10 hover:bg-[#E60075] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>PROCESANDO...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>CONFIRMAR PEDIDO</span>
                        </>
                    )}
                </button>

                <button
                    onClick={handleWhatsAppNotify}
                    className="w-full bg-white text-[#25D366] border-2 border-emerald-100 py-3 px-6 rounded-2xl font-bold text-xs hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>INFORMAR POR WHATSAPP</span>
                </button>
            </div>

            <p className="text-[10px] text-center text-gray-400 px-4">
                Tu pedido será procesado una vez verifiquemos la recepción de la transferencia.
            </p>
        </div>
    );
}
