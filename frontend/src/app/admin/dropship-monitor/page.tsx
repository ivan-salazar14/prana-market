"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";

interface Metrics {
  totalDropshipOrders: number;
  syncedCount: number;
  pendingRetryCount: number;
}

interface FailedOrder {
  id: number;
  documentId?: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  customerName: string;
  customerEmail: string;
  syncMastershop: boolean;
  mastershopOrderId?: string | null;
  error: string;
}

export default function MastershopDropshipMonitor() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalDropshipOrders: 0,
    syncedCount: 0,
    pendingRetryCount: 0,
  });
  const [failedOrders, setFailedOrders] = useState<FailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMonitorStatus = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const response = await fetch(`${backendUrl}/api/orders/dropship-sync-status`);
      const resData = await response.json();

      if (response.ok && resData.success) {
        setMetrics(resData.metrics);
        setFailedOrders(resData.failedOrders || []);
      }
    } catch (err) {
      console.error("Monitor fetch error:", err);
      showToast("❌ Error al obtener el estado del monitor de Mastershop.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorStatus();
  }, []);

  const handleManualSync = async (orderId: number, docId?: string) => {
    setSyncingId(orderId);
    showToast(`🔄 Reintentando despacho de Pedido #${orderId} a Mastershop...`);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const targetId = docId || orderId;

      const response = await fetch(`${backendUrl}/api/orders/${targetId}/sync-mastershop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const resData = await response.json();

      if (response.ok) {
        showToast(`✅ Despacho de Pedido #${orderId} completado exitosamente.`);
        fetchMonitorStatus();
      } else {
        showToast(`❌ Error al despachar #${orderId}: ${resData.error || resData.message || "Error desconocido"}`);
      }
    } catch (err) {
      console.error("Manual sync error:", err);
      showToast(`❌ Error de conexión durante el despacho manual.`);
    } finally {
      setSyncingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatCOP = (val: number) => `$${(val || 0).toLocaleString("es-CO")} COP`;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF2EC] text-[#2C6E49] border border-emerald-200">
                🌿 Mastershop Dropshipping API
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text-main)] mt-2">
              Monitor de Sincronización & <span className="text-[var(--primary)] italic font-serif">Manual Override</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Supervisión de enrutamiento post-pago, aislamiento de fallas y reintentos manuales de dispatches a Mastershop.
            </p>
          </div>

          <button
            onClick={fetchMonitorStatus}
            className="py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-main)] flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar Estado</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-zinc-900 text-white font-bold text-xs shadow-xl animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Total Pedidos Dropship
              </span>
              <div className="text-2xl font-black font-heading text-[var(--text-main)]">
                {metrics.totalDropshipOrders}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Sincronizados Exitosos
              </span>
              <div className="text-2xl font-black font-heading text-emerald-700">
                {metrics.syncedCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-[var(--border-subtle)] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Reintentos Pendientes
              </span>
              <div className="text-2xl font-black font-heading text-rose-700">
                {metrics.pendingRetryCount}
              </div>
            </div>
          </div>
        </div>

        {/* Failed & Pending Retries Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[var(--border-subtle)] shadow-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-[var(--text-main)]">
              Despachos Fallidos o Pendientes de Reintento
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {failedOrders.length} orden(es)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              Cargando registros del monitor...
            </div>
          ) : failedOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <span>¡Excelente! No hay órdenes de dropshipping pendientes por reintentar.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {failedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)] hover:border-rose-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--primary)]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-semibold">
                        • {ord.customerName} ({ord.customerEmail})
                      </span>
                      <span className="text-xs font-bold text-[var(--text-main)] font-mono ml-2">
                        {formatCOP(ord.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{ord.error}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleManualSync(ord.id, ord.documentId)}
                      disabled={syncingId === ord.id}
                      className="py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                    >
                      {syncingId === ord.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Despachando...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Reintentar Despacho a Mastershop</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
