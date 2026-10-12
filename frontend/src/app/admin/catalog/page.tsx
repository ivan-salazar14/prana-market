"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  UploadCloud,
  Instagram,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Truck,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import InstagramImporter from "./components/InstagramImporter";

interface ParsedPreviewRow {
  sku: string;
  name: string;
  category_slug: string;
  price: string;
  stock: string;
  cost_price?: string;
  status: "valid" | "error";
  errorReason?: string;
}

export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<"instagram" | "csv">("instagram");

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<any | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      "sku,name,category_slug,price,cost_price,stock,description,is_active\n" +
      "PRANA-LOC-001,Labial Hidratante Rosa,labios,45000,25000,20,Labial enriquecido con ácido hialurónico,true\n" +
      "PRANA-LOC-002,Serum Facial Vitamina C,skincare,85000,45000,15,Serum antioxidante iluminador,true\n" +
      "PRANA-LOC-003,Brocha Kabuki Profesional,accesorios,32000,18000,30,Brocha para base líquida y polvo,true\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template-productos-prana.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setCsvResult(null);
    setPreviewRows([]);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".csv")) {
        setCsvError("Por favor selecciona un archivo con extensión .csv válido.");
        return;
      }
      setCsvFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvRawText(text);
        parseAndPreview(text);
      };
      reader.readAsText(file);
    }
  };

  const parseAndPreview = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      setCsvError("El archivo CSV está vacío o solo contiene la cabecera.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    const required = ["sku", "name", "category_slug", "price", "stock"];
    const missing = required.filter((r) => !headers.includes(r));

    if (missing.length > 0) {
      setCsvError(`Cabeceras obligatorias faltantes: ${missing.join(", ")}`);
      return;
    }

    const rows: ParsedPreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = parts[idx] !== undefined ? parts[idx] : "";
      });

      const sku = rowObj.sku || "";
      const name = rowObj.name || "";
      const category_slug = rowObj.category_slug || "";
      const price = rowObj.price || "";
      const stock = rowObj.stock || "";

      let status: "valid" | "error" = "valid";
      let errorReason = "";

      if (!sku || !name || !category_slug || !price || !stock) {
        status = "error";
        errorReason = "Faltan campos obligatorios";
      } else if (isNaN(Number(price)) || Number(price) < 0 || isNaN(Number(stock)) || Number(stock) < 0) {
        status = "error";
        errorReason = "Precio o stock inválidos";
      }

      rows.push({
        sku,
        name,
        category_slug,
        price,
        stock,
        cost_price: rowObj.cost_price,
        status,
        errorReason,
      });
    }

    setPreviewRows(rows);
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText) {
      setCsvError("Por favor carga un archivo CSV primero.");
      return;
    }

    setCsvUploading(true);
    setCsvError(null);
    setCsvResult(null);

    try {
      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csvRawText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el archivo en el servidor.");
      }

      setCsvResult(data.summary);
    } catch (err: any) {
      setCsvError(err.message || "Error al conectar con el servidor.");
    } finally {
      setCsvUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-16">
      {/* Top Admin Header / Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/orders" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                  P
                </div>
                <span className="font-bold text-neutral-900 text-base">Prana Market</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                  Admin
                </span>
              </Link>

              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  href="/admin/catalog"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-rose-50 text-rose-700"
                >
                  Catálogo Local
                </Link>
                <Link
                  href="/admin/orders"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  Pedidos
                </Link>
                <Link
                  href="/admin/dropship-monitor"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  Monitor Dropship
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Aislamiento de Dropship Activo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Page Title & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Gestión de Catálogo e Inventario Local
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Administra los productos de bodega física en Prana Market mediante importación desde Instagram o carga masiva CSV.
            </p>
          </div>

          <div className="flex p-1 rounded-xl bg-neutral-200/80 border border-neutral-200 self-start">
            <button
              onClick={() => setActiveTab("instagram")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "instagram"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Instagram className="w-4 h-4 text-rose-500" />
              Importar desde Instagram (IA)
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "csv"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Carga Masiva CSV
            </button>
          </div>
        </div>

        {/* Tab 1: Instagram Importer */}
        {activeTab === "instagram" && <InstagramImporter />}

        {/* Tab 2: CSV Bulk Import (Story 8.1) */}
        {activeTab === "csv" && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Carga Masiva de Productos Locales por CSV
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Sube un archivo delimitado por comas (.csv) para crear o actualizar masivamente los productos y stock de tu bodega.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-neutral-500" />
                Descargar Plantilla CSV
              </button>
            </div>

            {/* Error Message */}
            {csvError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Error de validación: </span>
                  {csvError}
                </div>
              </div>
            )}

            {/* Result Summary */}
            {csvResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ¡Proceso de Carga Completado!
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-neutral-500 block">Total Filas:</span>
                    <strong className="text-base text-neutral-900">{csvResult.total}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-neutral-500 block">Creados:</span>
                    <strong className="text-base text-emerald-700">{csvResult.created}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-neutral-500 block">Actualizados:</span>
                    <strong className="text-base text-blue-700">{csvResult.updated}</strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-neutral-500 block">Omitidos/Errores:</span>
                    <strong className="text-base text-amber-700">{csvResult.skipped}</strong>
                  </div>
                </div>

                {csvResult.errors && csvResult.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                    <span className="font-semibold block">Advertencias / Errores por Fila:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {csvResult.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Drag & Drop File Selector */}
            <form onSubmit={handleCsvSubmit} className="space-y-6">
              <label
                htmlFor="csv-file-input"
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-50/50"
              >
                <UploadCloud className="w-10 h-10 text-neutral-400 mb-2" />
                <span className="text-sm font-semibold text-neutral-800">
                  {csvFile ? csvFile.name : "Selecciona o arrastra tu archivo .CSV aquí"}
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  Columnas requeridas: <code>sku, name, category_slug, price, stock</code>
                </span>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-800">
                      Previsualización de Filas ({previewRows.length} productos detectados)
                    </h3>
                    <span className="text-xs text-neutral-500">
                      Verifica las filas antes de confirmar la importación
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded-xl overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-100 text-neutral-700 uppercase font-semibold sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Estado</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5">Nombre</th>
                          <th className="px-4 py-2.5">Categoría</th>
                          <th className="px-4 py-2.5">Precio (COP)</th>
                          <th className="px-4 py-2.5">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className={row.status === "error" ? "bg-red-50/50" : "hover:bg-neutral-50"}>
                            <td className="px-4 py-2">
                              {row.status === "valid" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                                  <Check className="w-3 h-3" /> Válido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold text-[11px]">
                                  <AlertCircle className="w-3 h-3" /> {row.errorReason}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 font-mono font-medium">{row.sku}</td>
                            <td className="px-4 py-2 font-medium">{row.name}</td>
                            <td className="px-4 py-2">{row.category_slug}</td>
                            <td className="px-4 py-2 font-semibold">
                              ${Number(row.price || 0).toLocaleString("es-CO")}
                            </td>
                            <td className="px-4 py-2">{row.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={csvUploading || previewRows.length === 0}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
                    >
                      {csvUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-neutral-300" />
                          <span>Importando productos a Strapi...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Confirmar e Importar Catálogo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
