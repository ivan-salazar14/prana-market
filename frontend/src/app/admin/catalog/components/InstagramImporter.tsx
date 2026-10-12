"use client";

import React, { useState } from "react";
import {
  Instagram,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Tag,
  DollarSign,
  ShieldCheck,
  FileText,
  Copy,
  Zap,
} from "lucide-react";

interface ExtractedItem {
  id: string;
  name: string;
  raw_label: string;
  price: number;
  description: string;
  suggested_category_slug?: string;
  sku: string;
}

interface ExtractedDraft {
  shortcode: string;
  original_url: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  variants?: {
    sizes?: string[];
    colors?: string[];
  };
  suggested_category_slug?: string;
  sku: string;
  sourcing_type: string;
  brand?: string;
  items?: ExtractedItem[];
}

const PURPURE_EXAMPLE = `Splash piña colada y mini mantequilla corporal de Purpure.
Huelen delicioso, tienen una duración increíble y la mantequilla tiene unos destellos hermosos.

Splash: 26.000
Mini mantequilla: 13.000`;

export default function InstagramImporter() {
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [postUrl, setPostUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | "combo">(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable form fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(5);
  const [formCategory, setFormCategory] = useState("rostro");
  const [formSku, setFormSku] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const applyItemToForm = (item: ExtractedItem | null, fallbackDraft: ExtractedDraft) => {
    if (item) {
      setFormName(item.name);
      setFormPrice(item.price);
      setFormCategory(item.suggested_category_slug || fallbackDraft.suggested_category_slug || "skincare");
      setFormSku(item.sku);
      setFormDescription(item.description || fallbackDraft.description);
    } else {
      // Combo mode or main draft
      const comboPrice =
        fallbackDraft.items && fallbackDraft.items.length > 0
          ? fallbackDraft.items.reduce((acc, curr) => acc + curr.price, 0)
          : fallbackDraft.price;
      setFormName(fallbackDraft.name);
      setFormPrice(comboPrice);
      setFormCategory(fallbackDraft.suggested_category_slug || "sets");
      setFormSku(fallbackDraft.sku);
      setFormDescription(fallbackDraft.description);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();

    const textToSubmit = inputMode === "text" ? rawText.trim() : postUrl.trim();
    if (!textToSubmit) {
      setError(
        inputMode === "text"
          ? "Por favor pega el texto o desglose de la publicación."
          : "Por favor ingresa una URL de una publicación de Instagram."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDraft(null);

    try {
      const isUrl = /^https?:\/\//i.test(textToSubmit) || /instagram\.com/i.test(textToSubmit);
      const payload = isUrl ? { postUrl: textToSubmit } : { rawText: textToSubmit };

      const res = await fetch("/api/admin/catalog/instagram/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.draft) {
        throw new Error(data.error || "No se pudo extraer la información del post. Verifica el contenido ingresado.");
      }

      const d: ExtractedDraft = data.draft;
      setDraft(d);
      setSelectedImageIndex(0);

      if (d.items && d.items.length > 0) {
        setSelectedItemIndex(0);
        applyItemToForm(d.items[0], d);
      } else {
        setSelectedItemIndex(0);
        setFormName(d.name || "Nuevo Producto");
        setFormPrice(d.price || 0);
        setFormStock(5);
        setFormCategory(d.suggested_category_slug || "rostro");
        setFormSku(d.sku || `PRANA-IG-${Date.now().toString().slice(-6)}`);
        setFormDescription(d.description || "");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (idx: number | "combo") => {
    if (!draft) return;
    setSelectedItemIndex(idx);
    if (idx === "combo") {
      applyItemToForm(null, draft);
    } else if (draft.items && draft.items[idx]) {
      applyItemToForm(draft.items[idx], draft);
    }
  };

  const handlePublish = async () => {
    if (!formName.trim()) {
      setError("El nombre del producto no puede estar vacío.");
      return;
    }
    if (formPrice <= 0) {
      setError("Por favor ingresa un precio válido en pesos colombianos (COP).");
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: formName.trim(),
        price: formPrice,
        stock: formStock,
        category_slug: formCategory,
        sku: formSku.trim(),
        description: formDescription,
        images: draft?.images || [],
        sourcing_type: "local",
      };

      const res = await fetch("/api/admin/catalog/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el producto en Strapi.");
      }

      setSuccessMessage(`¡Producto "${formName}" publicado con éxito en el catálogo local con SKU: ${formSku}!`);
      
      // If there are more items, switch to the next one or clear
      if (draft && draft.items && draft.items.length > 1 && typeof selectedItemIndex === "number") {
        const nextIdx = selectedItemIndex + 1;
        if (nextIdx < draft.items.length) {
          handleSelectItem(nextIdx);
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al publicar el producto.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishAll = async () => {
    if (!draft || !draft.items || draft.items.length === 0) return;

    setPublishingAll(true);
    setError(null);
    setSuccessMessage(null);

    const publishedNames: string[] = [];

    try {
      for (const item of draft.items) {
        const payload = {
          name: item.name.trim(),
          price: item.price,
          stock: formStock,
          category_slug: item.suggested_category_slug || formCategory,
          sku: item.sku.trim(),
          description: item.description || draft.description,
          images: draft.images || [],
          sourcing_type: "local",
        };

        const res = await fetch("/api/admin/catalog/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Error publicando producto ${item.name}`);
        }
        publishedNames.push(item.name);
      }

      setSuccessMessage(`¡Se publicaron con éxito ${publishedNames.length} productos en el catálogo local: ${publishedNames.join(", ")}!`);
      setDraft(null);
      setPostUrl("");
      setRawText("");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al publicar los productos.");
    } finally {
      setPublishingAll(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-amber-50/30 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                Importador Inteligente desde Instagram
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                  <Sparkles className="w-3 h-3" /> IA Asistida
                </span>
              </h2>
              <p className="text-sm text-neutral-600 mt-0.5">
                Extrae productos mediante enlace de Instagram o pegando directamente el copy/desglose de precios en COP.
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="inline-flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                inputMode === "url"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              Enlace Instagram
            </button>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                inputMode === "text"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Texto / Desglose Copy
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleExtract} className="mt-6 space-y-3">
          {inputMode === "url" ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://www.instagram.com/p/... o pega directamente el texto"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm transition-all text-neutral-900 bg-white placeholder-neutral-400"
                  disabled={loading}
                />
                <Instagram className="w-5 h-5 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={loading || !postUrl.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Extrayendo datos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>Extraer Producto</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={4}
                  placeholder={`Ejemplo:\nSplash piña colada y mini mantequilla corporal de Purpure.\nHuelen delicioso, tienen una duración increíble...\n\nSplash: 26.000\nMini mantequilla: 13.000`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm transition-all text-neutral-900 bg-white placeholder-neutral-400 font-mono"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRawText(PURPURE_EXAMPLE)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/60 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Copy className="w-3.5 h-3.5" /> Cargar Ejemplo Purpure (Splash & Mantequilla)
                </button>
                <button
                  type="submit"
                  disabled={loading || !rawText.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow ml-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                      <span>Analizando publicación...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      <span>Extraer Estructura de Publicación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Alerts */}
      {error && (
        <div className="m-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <span className="font-semibold">Error al procesar: </span>
            {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="m-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <span className="font-semibold">¡Completado! </span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Extracted Product Preview Card */}
      {draft && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-neutral-700">Previsualización del Producto</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Catálogo Local (Bodega)
              </span>
              {draft.brand && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  Marca: {draft.brand}
                </span>
              )}
            </div>
            {draft.original_url && (
              <a
                href={draft.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                Ver post original en Instagram <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Multi-product Breakdown Selector Banner */}
          {draft.items && draft.items.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <Package className="w-4 h-4 text-amber-700" />
                  <span>Se detectaron {draft.items.length} productos con precio individual en esta publicación:</span>
                </div>
                <button
                  type="button"
                  onClick={handlePublishAll}
                  disabled={publishingAll || publishing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {publishingAll ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publicando {draft.items.length} productos...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Publicar Todos ({draft.items.length}) en 1 Clic</span>
                    </>
                  )}
                </button>
              </div>

              {/* Items Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {draft.items.map((item, idx) => {
                  const isSelected = selectedItemIndex === idx;
                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => handleSelectItem(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-600/20"
                          : "bg-white text-neutral-800 border-neutral-300 hover:border-rose-400"
                      }`}
                    >
                      <Tag className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-rose-500"}`} />
                      <span>{item.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                        isSelected ? "bg-rose-700 text-white" : "bg-neutral-100 text-neutral-700"
                      }`}>
                        ${Number(item.price).toLocaleString("es-CO")} COP
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleSelectItem("combo")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                    selectedItemIndex === "combo"
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                      : "bg-white text-neutral-600 border-dashed border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Combo Completo / Pack</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Photos */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner flex items-center justify-center">
                {draft.images && draft.images[selectedImageIndex] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={draft.images[selectedImageIndex]}
                    alt={formName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-neutral-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Imagen de Catálogo Local</p>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium">
                  Foto {selectedImageIndex + 1} de {draft.images?.length || 1}
                </div>
              </div>

              {/* Thumbnails */}
              {draft.images && draft.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {draft.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? "border-rose-500 ring-2 ring-rose-500/20"
                          : "border-neutral-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Detected variants preview */}
              {draft.variants && (draft.variants.sizes?.length || draft.variants.colors?.length) ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2">
                  <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-500" /> Variantes Detectadas en el Post:
                  </div>
                  {draft.variants.sizes && draft.variants.sizes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-neutral-500">Tallas:</span>
                      {draft.variants.sizes.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-neutral-300 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {draft.variants.colors && draft.variants.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-neutral-500">Colores:</span>
                      {draft.variants.colors.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-neutral-300 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right: Editable Form */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-medium text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Precio en COP *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-semibold text-neutral-900"
                    />
                    <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block font-mono">
                    Formato: ${Number(formPrice || 0).toLocaleString("es-CO")} COP
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Stock en Bodega Local *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-medium text-neutral-900"
                  />
                  <span className="text-xs text-neutral-500 mt-1 block">Unidades físicas disponibles</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-medium text-neutral-900 bg-white"
                  >
                    <option value="skincare">Skincare / Corporal</option>
                    <option value="rostro">Rostro</option>
                    <option value="ojos">Ojos</option>
                    <option value="labios">Labios</option>
                    <option value="accesorios">Accesorios</option>
                    <option value="sets">Sets / Kits</option>
                    <option value="moda">Moda / Ropa</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    SKU Local
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Descripción Comercial (Limpia)
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm text-neutral-900"
                  placeholder="Detalles y atributos del producto..."
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || publishingAll}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando en Strapi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Aprobar y Publicar este Producto en Catálogo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
