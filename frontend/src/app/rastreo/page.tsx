"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

interface PackageItem {
  id?: number;
  name: string;
  quantity: number;
  price: number;
  sourcing_type?: string;
}

interface TrackingData {
  orderNumber: string;
  rawId: number;
  createdAt: string;
  status: string;
  shippingStatus: string;
  currentStep: number;
  total: number;
  subtotal: number;
  deliveryCost: number;
  paymentMethod: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrierName: string;
  shippingAddress: {
    fullName: string;
    city: string;
    department: string;
    address: string;
  };
  packages: {
    local: {
      count: number;
      items: PackageItem[];
      badge: string;
    };
    dropship: {
      count: number;
      items: PackageItem[];
      badge: string;
      mastershopOrderId: string | null;
    };
  };
}

function TrackingPortalContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const initialContact = searchParams.get("contact") || "";

  const [orderId, setOrderId] = useState(initialOrder);
  const [contact, setContact] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (searchOrder: string, searchContact: string) => {
    if (!searchOrder.trim() || !searchContact.trim()) {
      setError("Por favor ingresa tu número de pedido y correo o teléfono.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const response = await fetch(`${backendUrl}/api/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: searchOrder.trim(),
          contact: searchContact.trim(),
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setTrackingData(resData.data);
      } else {
        setError(resData.error?.message || resData.error || "No encontramos un pedido con los datos proporcionados.");
        setTrackingData(null);
      }
    } catch (err: any) {
      console.error("Tracking lookup error:", err);
      setError("Error de conexión al consultar la guía de rastreo.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder && initialContact) {
      fetchTracking(initialOrder, initialContact);
    }
  }, [initialOrder, initialContact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderId, contact);
  };

  const copyTrackingNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCOP = (amount: number) => {
    return `$${amount.toLocaleString("es-CO")} COP`;
  };

  const milestones = [
    { step: 1, title: "Pago Confirmado", desc: "Orden registrada y verified", icon: CheckCircle2 },
    { step: 2, title: "En Preparación", desc: "Empacando cosméticos en bodega", icon: Clock },
    { step: 3, title: "Despachado", desc: "En tránsito con la transportadora", icon: Truck },
    { step: 4, title: "Entregado", desc: "Recibido en tu dirección", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-base)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Strip */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-tint)] text-[var(--primary)] border border-[var(--border-subtle)]">
            <Truck className="w-3.5 h-3.5" /> Portal Oficial de Rastreo Prana Market
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-[var(--text-main)]">
            Sigue el Estado de tu <span className="text-[var(--primary)] italic font-serif">Pedido</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
            Ingresa tu número de pedido (ej. PM-1001) y tu correo o celular registrado para consultar el estado en tiempo real y guías de transporte nacional.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-heading">
                Número de Pedido
              </label>
              <input
                type="text"
                placeholder="ej. PM-1001 o 1001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-base)] border border-[var(--border-subtle)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-main)]"
                required
              />
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-heading">
                Correo o Celular Registrado
              </label>
              <input
                type="text"
                placeholder="ej. cliente@email.com o 3001234567"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-base)] border border-[var(--border-subtle)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-main)]"
                required
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        {trackingData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Order Overview Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black font-heading text-[var(--text-main)]">
                    Pedido {trackingData.orderNumber}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent-tint)] text-[var(--primary)]">
                    {trackingData.status === "shipped"
                      ? "Despachado"
                      : trackingData.status === "delivered"
                      ? "Entregado"
                      : trackingData.status === "paid"
                      ? "Pago Confirmado"
                      : trackingData.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Fecha de compra: {new Date(trackingData.createdAt).toLocaleDateString("es-CO", { dateStyle: "long" })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/573001234567?text=${encodeURIComponent(`Hola Prana Market, tengo una consulta sobre mi envío ${trackingData.orderNumber}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Soporte WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Visual Milestones Bar */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-xl">
              <h3 className="text-sm font-bold font-heading text-[var(--text-main)] uppercase tracking-wider mb-6">
                Progreso de tu Pedido
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {milestones.map((m) => {
                  const Icon = m.icon;
                  const isActive = trackingData.currentStep >= m.step;
                  const isCurrent = trackingData.currentStep === m.step;

                  return (
                    <div
                      key={m.step}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-[var(--accent-tint)] border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                          : isActive
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-[var(--surface-base)] border-[var(--border-subtle)] opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isActive
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-main)]">{m.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-snug">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carrier & Tracking Link Highlight */}
            {trackingData.trackingNumber && (
              <div className="bg-gradient-to-r from-[var(--surface-base)] to-[var(--accent-tint)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Transportadora Nacional
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[var(--text-main)] font-heading">
                      {trackingData.carrierName}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white border border-[var(--border-subtle)] text-[var(--primary)]">
                      {trackingData.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyTrackingNumber(trackingData.trackingNumber!)}
                      className="p-1.5 rounded-lg bg-white border border-[var(--border-subtle)] hover:bg-stone-50 text-[var(--text-muted)]"
                      title="Copiar guía"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {trackingData.trackingUrl && (
                  <a
                    href={trackingData.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shrink-0"
                  >
                    <span>Rastrear en {trackingData.carrierName}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {/* Package Sourcing Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local Express Package */}
              {trackingData.packages.local.count > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCE7ED] text-[#B33959]">
                      {trackingData.packages.local.badge}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-semibold">
                      {trackingData.packages.local.count} ítem(s)
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {trackingData.packages.local.items.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-main)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-bold">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mastershop Dropshipping Package */}
              {trackingData.packages.dropship.count > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF2EC] text-[#2C6E49]">
                      {trackingData.packages.dropship.badge}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-semibold">
                      {trackingData.packages.dropship.count} ítem(s)
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {trackingData.packages.dropship.items.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-main)]">{item.name}</span>
                        <span className="text-[var(--text-muted)] font-bold">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Address & Payment Summary Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-heading mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[var(--primary)]" /> Dirección de Entrega
                </h4>
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  {trackingData.shippingAddress.fullName}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {trackingData.shippingAddress.city}, {trackingData.shippingAddress.department}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-heading mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[var(--secondary)]" /> Resumen de Compra
                </h4>
                <div className="space-y-1 text-xs text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-[var(--text-main)]">{formatCOP(trackingData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {trackingData.deliveryCost === 0 ? "GRATIS" : formatCOP(trackingData.deliveryCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[var(--primary)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>Total Pagado:</span>
                    <span>{formatCOP(trackingData.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--surface-base)]">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackingPortalContent />
    </Suspense>
  );
}
