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
  shippingAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    department?: string;
    phone?: string;
    email?: string;
  };
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

  // Story 5.5: Edit Address & Manual Mark state
  const [editingOrder, setEditingOrder] = useState<FailedOrder | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    address: "",
    city: "",
    department: "",
    phone: "",
    email: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

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

  const handleMarkManual = async (orderId: number, docId?: string) => {
    const trackingNum = prompt("Ingrese número de guía o nota para despacho manual (opcional):");
    if (trackingNum === null) return;

    setSyncingId(orderId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const targetId = docId || orderId;

      const response = await fetch(`${backendUrl}/api/orders/${targetId}/mark-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: trackingNum }),
      });

      if (response.ok) {
        showToast(`✅ Orden #${orderId} marcada como resuelta/despachada manualmente.`);
        fetchMonitorStatus();
      } else {
        showToast(`❌ Error al marcar orden #${orderId}.`);
      }
    } catch (err) {
      console.error("Mark manual error:", err);
      showToast("❌ Error de conexión al actualizar orden.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleTriggerAlert = async (orderId: number, docId?: string, currentError?: string) => {
    const summary = prompt("Detalle de la novedad de entrega / excepción logística:", currentError || "Novedad en entrega registrada por transportadora");
    if (!summary) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const targetId = docId || orderId;

      const response = await fetch(`${backendUrl}/api/orders/${targetId}/trigger-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertType: "DELIVERY_EXCEPTION",
          issueSummary: summary,
        }),
      });

      if (response.ok) {
        showToast(`📬 Alerta operativa de emergencia enviada para Orden #${orderId}.`);
      } else {
        showToast(`❌ Error al despachar alerta operativa.`);
      }
    } catch (err) {
      console.error("Trigger alert error:", err);
      showToast("❌ Error de conexión al notificar alerta.");
    }
  };

  const openAddressModal = (ord: FailedOrder) => {
    setEditingOrder(ord);
    setAddressForm({
      fullName: ord.shippingAddress?.fullName || ord.customerName || "",
      address: ord.shippingAddress?.address || "",
      city: ord.shippingAddress?.city || "",
      department: ord.shippingAddress?.department || "",
      phone: ord.shippingAddress?.phone || "",
      email: ord.shippingAddress?.email || ord.customerEmail || "",
    });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setSavingAddress(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const targetId = editingOrder.documentId || editingOrder.id;

      const response = await fetch(`${backendUrl}/api/orders/${targetId}/update-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress: addressForm }),
      });

      if (response.ok) {
        showToast(`✅ Dirección actualizada para Orden #${editingOrder.id}.`);
        setEditingOrder(null);
        fetchMonitorStatus();
      } else {
        showToast("❌ Error al guardar la nueva dirección.");
      }
    } catch (err) {
      console.error("Save address error:", err);
      showToast("❌ Error de conexión al guardar dirección.");
    } finally {
      setSavingAddress(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatCOP = (val: number) => `$${(val || 0).toLocaleString("es-CO")} COP`;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] dark:!bg-[#FDF9F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF2EC] text-[#2C6E49] border border-emerald-200 dark:!border-emerald-200">
                🌿 Mastershop Dropshipping API
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text-main)] dark:!text-[#2D1B22] mt-2">
              Monitor de Sincronización & <span className="text-[var(--primary)] italic font-serif">Manual Override</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] dark:!text-[#7A666D] mt-1">
              Supervisión de enrutamiento post-pago, aislamiento de fallas, edición de direcciones y reintentos manuales de dispatches a Mastershop.
            </p>
          </div>

          <button
            onClick={fetchMonitorStatus}
            className="py-2.5 px-4 rounded-xl bg-white dark:!bg-white border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] flex items-center gap-2 hover:bg-stone-50 dark:!hover:bg-[#F7EEF1] transition-colors shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar Estado</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-[#2D1B22] dark:!bg-[#2D1B22] text-white font-bold text-xs shadow-xl animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:!bg-white rounded-3xl p-6 border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] dark:!bg-[#FCE7ED] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] dark:!text-[#7A666D] uppercase tracking-wider">
                Total Pedidos Dropship
              </span>
              <div className="text-2xl font-black font-heading text-[var(--text-main)] dark:!text-[#2D1B22]">
                {metrics.totalDropshipOrders}
              </div>
            </div>
          </div>

          <div className="bg-white dark:!bg-white rounded-3xl p-6 border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] dark:!text-[#7A666D] uppercase tracking-wider">
                Sincronizados Exitosos
              </span>
              <div className="text-2xl font-black font-heading text-emerald-700">
                {metrics.syncedCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:!bg-white rounded-3xl p-6 border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-muted)] dark:!text-[#7A666D] uppercase tracking-wider">
                Reintentos Pendientes
              </span>
              <div className="text-2xl font-black font-heading text-rose-700">
                {metrics.pendingRetryCount}
              </div>
            </div>
          </div>
        </div>

        {/* Failed & Pending Retries Table */}
        <div className="bg-white dark:!bg-white rounded-3xl border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-[var(--text-main)] dark:!text-[#2D1B22]">
              Centro de Control de Excepciones de Despacho
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {failedOrders.length} orden(es)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] dark:!text-[#7A666D]">
              Cargando registros del monitor...
            </div>
          ) : failedOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50 dark:!bg-emerald-50 border border-emerald-200 dark:!border-emerald-200 text-emerald-800 dark:!text-emerald-800 text-xs font-bold text-center flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <span>¡Excelente! No hay órdenes de dropshipping pendientes por reintentar.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {failedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] hover:border-rose-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--primary)]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] dark:!text-[#7A666D] font-semibold">
                        • {ord.customerName} ({ord.customerEmail})
                      </span>
                      <span className="text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] font-mono ml-2">
                        {formatCOP(ord.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 dark:!bg-rose-50 p-2.5 rounded-xl border border-rose-200 dark:!border-rose-200 mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span><strong>Causa del Fallo:</strong> {ord.error}</span>
                    </div>
                  </div>

                  {/* Actions Bar for Story 5.5 & 5.6 */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTriggerAlert(ord.id, ord.documentId, ord.error)}
                      className="py-2 px-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Enviar Alerta Operativa
                    </button>

                    <button
                      onClick={() => openAddressModal(ord)}
                      className="py-2 px-3 rounded-xl bg-white dark:!bg-white border border-[var(--border-subtle)] dark:!border-[#F2E3E7] hover:bg-stone-50 dark:!hover:bg-[#F7EEF1] text-[var(--text-main)] dark:!text-[#2D1B22] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      ✏️ Editar Dirección
                    </button>

                    <button
                      onClick={() => handleMarkManual(ord.id, ord.documentId)}
                      disabled={syncingId === ord.id}
                      className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Marcar Manual
                    </button>

                    <button
                      onClick={() => handleManualSync(ord.id, ord.documentId)}
                      disabled={syncingId === ord.id}
                      className="py-2 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                    >
                      {syncingId === ord.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Despachando...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Reintentar Despacho</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Editar Dirección de Envío */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:!bg-white rounded-3xl p-6 max-w-lg w-full border border-[#F2E3E7] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2E3E7] pb-3">
                <h4 className="font-bold text-base text-[#2D1B22]">
                  Editar Dirección - {editingOrder.orderNumber}
                </h4>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800"
                >
                  ✕ Cerrar
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A666D] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A666D] mb-1">Departamento</label>
                    <input
                      type="text"
                      required
                      value={addressForm.department}
                      onChange={(e) => setAddressForm({ ...addressForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A666D] mb-1">Municipio / Ciudad</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A666D] mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    required
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A666D] mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A666D] mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={addressForm.email}
                      onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#F2E3E7] text-xs font-semibold text-[#2D1B22] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E3E7]">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="py-2 px-4 rounded-xl border border-[#F2E3E7] text-xs font-bold text-stone-600 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="py-2 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50"
                  >
                    {savingAddress ? "Guardando..." : "Guardar Dirección"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
