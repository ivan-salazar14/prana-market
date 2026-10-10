"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Edit3,
  Filter,
} from "lucide-react";

interface OrderData {
  id: number;
  documentId?: string;
  createdAt: string;
  status: string;
  shipping_status?: string;
  total: number;
  subtotal: number;
  deliveryCost: number;
  paymentMethod: string;
  tracking_number?: string;
  tracking_url?: string;
  shippingAddress?: {
    fullName?: string;
    city?: string;
    department?: string;
    address?: string;
    phone?: string;
  };
  items?: any[];
}

export default function CentralizedOrdersDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const response = await fetch(`${backendUrl}/api/orders?sort=createdAt:desc`);
      const resData = await response.json();

      if (response.ok && resData.data) {
        setOrders(resData.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const docId = selectedOrder.documentId || selectedOrder.id;

      const response = await fetch(`${backendUrl}/api/orders/${docId}/update-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus || selectedOrder.status,
          shipping_status: newStatus === "shipped" ? "shipped" : newStatus === "delivered" ? "delivered" : "pending",
          tracking_number: trackingNumber || selectedOrder.tracking_number,
          tracking_url: trackingUrl || selectedOrder.tracking_url,
        }),
      });

      if (response.ok) {
        showToast(`✅ Pedido #${selectedOrder.id} actualizado correctamente.`);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        showToast(`❌ Error al actualizar el pedido.`);
      }
    } catch (err) {
      console.error("Update error:", err);
      showToast(`❌ Error de conexión al actualizar.`);
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === "all" || ord.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      String(ord.id).includes(searchTerm) ||
      ord.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.shippingAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCOP = (val: number) => `$${(val || 0).toLocaleString("es-CO")} COP`;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] dark:!bg-[#FDF9F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text-main)] dark:!text-[#2D1B22]">
              Panel Centralizado de <span className="text-[var(--primary)] italic font-serif">Gestión de Pedidos</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] dark:!text-[#7A666D] mt-1">
              Orquestación del ciclo de vida de órdenes, asignación de guías multitransportadora y estados de entrega.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="py-2.5 px-4 rounded-xl bg-white dark:!bg-white border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] flex items-center gap-2 hover:bg-stone-50 dark:!hover:bg-[#F7EEF1] transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:!bg-white rounded-2xl p-4 border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-muted)] mr-1" />
            {[
              { id: "all", label: "Todos" },
              { id: "pending", label: "Pendientes" },
              { id: "paid", label: "Pagados" },
              { id: "processing", label: "En Preparación" },
              { id: "shipped", label: "Despachados" },
              { id: "delivered", label: "Entregados" },
              { id: "cancelled", label: "Cancelados" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === tab.id
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-base)] dark:!bg-[#FDF9F7] text-[var(--text-muted)] dark:!text-[#7A666D] hover:text-[var(--text-main)] dark:!hover:text-[#2D1B22]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por ID o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-semibold focus:outline-none text-[var(--text-main)] dark:!text-[#2D1B22]"
            />
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-[#2D1B22] dark:!bg-[#2D1B22] text-white font-bold text-xs shadow-xl animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white dark:!bg-white rounded-3xl border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border-b border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-[11px] font-bold text-[var(--text-muted)] dark:!text-[#7A666D] uppercase tracking-wider font-heading">
                  <th className="p-4">Pedido ID</th>
                  <th className="p-4">Cliente / Ciudad</th>
                  <th className="p-4">Estado Ciclo de Vida</th>
                  <th className="p-4">Total (COP)</th>
                  <th className="p-4">Guía Transportadora</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] dark:!divide-[#F2E3E7] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-muted)] dark:!text-[#7A666D]">
                      Cargando órdenes...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-muted)] dark:!text-[#7A666D]">
                      No se encontraron pedidos con el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/50 dark:!hover:bg-[#F7EEF1] transition-colors">
                      <td className="p-4 font-bold font-mono text-[var(--primary)]">#PM-{ord.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-main)] dark:!text-[#2D1B22]">
                          {ord.shippingAddress?.fullName || "Cliente Prana"}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] dark:!text-[#7A666D]">
                          {ord.shippingAddress?.city || "Colombia"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : ord.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "paid"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[var(--text-main)] dark:!text-[#2D1B22]">{formatCOP(ord.total)}</td>
                      <td className="p-4">
                        {ord.tracking_number ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--text-main)] dark:!text-[#2D1B22]">
                            <Truck className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{ord.tracking_number}</span>
                            {ord.tracking_url && (
                              <a
                                href={ord.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--primary)] hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] dark:!text-[#7A666D] italic">Sin guía asignada</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setNewStatus(ord.status);
                            setTrackingNumber(ord.tracking_number || "");
                            setTrackingUrl(ord.tracking_url || "");
                          }}
                          className="py-1.5 px-3 rounded-xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] hover:bg-stone-100 dark:!hover:bg-[#F7EEF1] font-bold text-xs flex items-center gap-1.5 inline-flex"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>Gestionar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Order Management */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:!bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[var(--border-subtle)] dark:!border-[#F2E3E7] shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] dark:!border-[#F2E3E7]">
                <h3 className="text-lg font-bold font-heading text-[var(--text-main)] dark:!text-[#2D1B22]">
                  Gestionar Pedido #PM-{selectedOrder.id}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-[var(--text-muted)] dark:!text-[#7A666D] hover:text-[var(--text-main)] dark:!hover:text-[#2D1B22] text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] uppercase tracking-wider font-heading">
                    Nuevo Estado de Orden
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-semibold focus:outline-none text-[var(--text-main)] dark:!text-[#2D1B22]"
                  >
                    <option value="pending">pending (Pendiente)</option>
                    <option value="paid">paid (Pago Confirmado)</option>
                    <option value="processing">processing (En Preparación)</option>
                    <option value="shipped">shipped (Despachado en Tránsito)</option>
                    <option value="delivered">delivered (Entregado)</option>
                    <option value="cancelled">cancelled (Cancelado)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] uppercase tracking-wider font-heading">
                    Número de Guía (Servientrega, Coordinadora, etc.)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. SER-987654321"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-semibold focus:outline-none text-[var(--text-main)] dark:!text-[#2D1B22]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] dark:!text-[#2D1B22] uppercase tracking-wider font-heading">
                    URL de Rastreo Oficial
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.servientrega.com/..."
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-base)] dark:!bg-[#FDF9F7] border border-[var(--border-subtle)] dark:!border-[#F2E3E7] text-xs font-semibold focus:outline-none text-[var(--text-main)] dark:!text-[#2D1B22]"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="py-2.5 px-4 rounded-xl bg-stone-100 dark:!bg-[#F7EEF1] text-stone-700 dark:!text-[#2D1B22] font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="py-2.5 px-5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md"
                  >
                    {updating ? "Guardando..." : "Guardar Cambios"}
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
