"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { trackWhatsAppClick } from "@/utils/analytics";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function FloatingWhatsApp({
  phoneNumber = "573001234567",
  defaultMessage = "Hola Prana Market, me gustaría recibir asesoría sobre productos o consultar un pedido.",
}: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenWhatsApp = (msg?: string) => {
    trackWhatsAppClick({
      origin: "floating_whatsapp_widget",
      url: typeof window !== "undefined" ? window.location.href : "",
    });
    const textToUse = msg || defaultMessage;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textToUse)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Quick Popup Card */}
      {isOpen && (
        <div className="mb-3 w-72 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)] font-heading">
                  Atención Prana Market
                </h4>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En línea | Asesoría de Belleza
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
              aria-label="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-[var(--text-muted)] leading-relaxed">
            ¡Hola! ✨ ¿Tienes dudas sobre tu tono ideal, envíos a tu ciudad o el estado de tu compra?
          </div>

          <button
            onClick={() => handleOpenWhatsApp()}
            className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Iniciar Chat por WhatsApp</span>
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir soporte WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-200 group relative"
      >
        <MessageCircle className="w-7 h-7" />

        {/* Status Indicator */}
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
      </button>
    </div>
  );
}
