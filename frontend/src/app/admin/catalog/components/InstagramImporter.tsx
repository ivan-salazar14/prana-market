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
} from "lucide-react";

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
}

export default function InstagramImporter() {
  const [postUrl, setPostUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);
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

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) {
      setError("Por favor ingresa una URL de una publicación de Instagram.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDraft(null);

    try {
      const res = await fetch("/api/admin/catalog/instagram/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl: postUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.draft) {
        throw new Error(data.error || "No se pudo extraer la información del post. Verifica que la cuenta sea pública.");
      }

      const d = data.draft;
      setDraft(d);
      setFormName(d.name || "Nuevo Producto");
      setFormPrice(d.price || 0);
      setFormStock(5);
      setFormCategory(d.suggested_category_slug || "rostro");
      setFormSku(d.sku || `PRANA-IG-${Date.now().toString().slice(-6)}`);
      setFormDescription(d.description || "");
      setSelectedImageIndex(0);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
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
      setDraft(null);
      setPostUrl("");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al publicar el producto.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-amber-50/30 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
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
              Pega el enlace de cualquier publicación o reel de tu cuenta para convertirlo automáticamente en un producto local con fotos y precios en COP.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleExtract} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="https://www.instagram.com/p/..."
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
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">Previsualización del Producto</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Catálogo Local (Bodega)
              </span>
            </div>
            <a
              href={draft.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              Ver post original en Instagram <ArrowRight className="w-3 h-3" />
            </a>
          </div>

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
                    <p className="text-sm">Imagen de Instagram</p>
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
              {draft.variants && (
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
              )}
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
                  <span className="text-xs text-neutral-500 mt-1 block">
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
                    <option value="rostro">Rostro</option>
                    <option value="ojos">Ojos</option>
                    <option value="labios">Labios</option>
                    <option value="skincare">Skincare</option>
                    <option value="accesorios">Accesorios</option>
                    <option value="sets">Sets / Kits</option>
                    <option value="moda">Moda / Ropa</option>
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
                  disabled={publishing}
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
                      <span>Aprobar y Publicar en Catálogo</span>
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
