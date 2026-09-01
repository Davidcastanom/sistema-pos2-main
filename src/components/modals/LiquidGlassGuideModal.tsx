import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Shield, 
  Eye, 
  CheckCircle2, 
  Sliders, 
  X, 
  Maximize2,
  Box,
  Palette,
  Droplets,
  Sun
} from 'lucide-react';

interface LiquidGlassGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiquidGlassGuideModal: React.FC<LiquidGlassGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#214C6A]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto liquid-glass-2 rounded-none border-2 border-white/90 shadow-[0_24px_70px_rgba(15,36,51,0.35)] text-[#222E3A] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A]/95 backdrop-blur-xl border-b border-white/20 text-[#FFF9F0] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#EB9D52]/90 border border-white/30 text-[#222E3A] flex items-center justify-center shadow-md">
              <Droplets className="w-5 h-5 text-[#222E3A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight font-title">
                  Guía de Arquitectura Liquid Glass
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-[#EB9D52] text-[#222E3A] rounded-none shadow-xs">
                  Sistema de 3 Niveles
                </span>
              </div>
              <p className="text-xs text-[#F6E1C6]/90">
                &ldquo;Use tiers early, stop inventing new glass per screen&rdquo; • Estándar de consistencia óptica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-white/15 hover:bg-rose-600 hover:text-white text-[#FFF9F0] flex items-center justify-center transition-colors cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Philosophy Banner */}
          <div className="liquid-glass-1 p-4 rounded-none border-l-4 border-l-[#BC6343] space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#BC6343] flex items-center gap-1.5">
              <Sun className="w-4 h-4" /> Principio del Modelo de Luz Bloqueado (Locked Light Model)
            </h3>
            <p className="text-xs text-[#222E3A] leading-relaxed">
              En lugar de inventar una fórmula de vidrio distinta por pantalla, el sistema define <strong>3 Niveles Jerárquicos Estables</strong>. Cada nivel equilibra la refracción del fondo, el bisel superior especular (`specular rim light`) y una placa interna estabilizada que garantiza 100% de legibilidad en el punto de venta.
            </p>
          </div>

          {/* 3 Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TIER 1: Glass-1 (Substrato / Paneles Base) */}
            <div className="liquid-glass-1 p-4 rounded-none border border-white/70 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#214C6A] text-[#FFF9F0] rounded-none">
                    TIER 1 • GLASS-1
                  </span>
                  <span className="text-[10px] text-[#63665B] font-bold">Substrato Base</span>
                </div>
                <h4 className="text-sm font-bold text-[#214C6A] font-title">
                  Paneles y Contenedores
                </h4>
                <p className="text-xs text-[#63665B] leading-snug">
                  Translucidez sutil con desenfoque de 16px. Permite ver el fondo ambiental cálido sin interferir con la navegación.
                </p>
              </div>

              {/* Visual Demo */}
              <div className="p-3 bg-[#FFF9F0]/60 backdrop-blur-md border border-white/80 rounded-none text-center shadow-inner">
                <p className="text-[11px] font-bold text-[#214C6A]">Ejemplo: Cabecera & Barras</p>
                <span className="text-[10px] text-[#BC6343]">backdrop-blur-xl + border-white/65</span>
              </div>
            </div>

            {/* TIER 2: Glass-2 (Placas de Contenido / Tarjetas) */}
            <div className="liquid-glass-2 p-4 rounded-none border border-white/90 flex flex-col justify-between space-y-3 relative shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#BC6343] text-white rounded-none">
                    TIER 2 • GLASS-2
                  </span>
                  <span className="text-[10px] text-[#63665B] font-bold">Elevación Media</span>
                </div>
                <h4 className="text-sm font-bold text-[#BC6343] font-title">
                  Tarjetas de Producto & Kardex
                </h4>
                <p className="text-xs text-[#63665B] leading-snug">
                  Placa estabilizada de alto contraste (84% alfa) con borde especular superior y sombra refractiva difusa.
                </p>
              </div>

              {/* Visual Demo */}
              <div className="p-3 bg-white/90 backdrop-blur-xl border border-white rounded-none text-center shadow-sm">
                <p className="text-[11px] font-bold text-[#222E3A]">Ejemplo: Tarjeta Producto</p>
                <span className="text-[10px] text-[#4caf50] font-bold">Placa de Contraste 100% Legible</span>
              </div>
            </div>

            {/* TIER 3: Glass-3 (Controles Interactivos / Botones) */}
            <div className="liquid-glass-1 p-4 rounded-none border border-white/70 flex flex-col justify-between space-y-3 relative">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#EB9D52] text-[#222E3A] rounded-none">
                    TIER 3 • GLASS-3
                  </span>
                  <span className="text-[10px] text-[#63665B] font-bold">Acción Inmediata</span>
                </div>
                <h4 className="text-sm font-bold text-[#56291D] font-title">
                  Píldoras, Gatillos & CTA Cobro
                </h4>
                <p className="text-xs text-[#63665B] leading-snug">
                  Bisel brillante exterior con relieve táctil (`inset 0 1px 1px 0 rgba(255,255,255,1)`) y brillo cromático en interacción.
                </p>
              </div>

              {/* Visual Demo */}
              <div className="liquid-glass-3-terracotta p-2.5 rounded-none text-center text-white cursor-pointer active:scale-95 transition-all">
                <p className="text-xs font-black tracking-wide">Ejemplo: Botón Cobrar Factura</p>
                <span className="text-[9px] text-white/90">Borde especular de luz 1px</span>
              </div>
            </div>
          </div>

          {/* Interactive Guidelines Checklist */}
          <div className="liquid-glass-2 p-4 rounded-none border border-white/80 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#214C6A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#BC6343]" />
              Reglas de Oro del Sistema Liquid Glass
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#214C6A]">No apilar vidrio sobre vidrio idéntico:</strong>
                  <p className="text-[#63665B] text-[11px]">Evita la turbidez visual alternando entre Tier 1 y Tier 2.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#214C6A]">Placa estabilizada de texto:</strong>
                  <p className="text-[#63665B] text-[11px]">Los precios y títulos conservan contraste pleno sin depender del fondo.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#214C6A]">Luz direccional fija:</strong>
                  <p className="text-[#63665B] text-[11px]">El brillo blanco superior simula iluminación cenital natural.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#214C6A]">Respuesta táctil física:</strong>
                  <p className="text-[#63665B] text-[11px]">Al hacer clic, el botón reduce sutilmente su elevación refractiva.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FFF9F0]/90 backdrop-blur-md border-t border-[#214C6A]/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#63665B]">
            <Sparkles className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Sistema Liquid Glass 100% activo en toda la interfaz</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
