"use client";

import * as React from "react";
import { cn, normalizeImageUrl } from "@/lib/utils";
import { Plus, Minus, ShoppingBag, AlertCircle, Star, Edit3, Percent } from "lucide-react";

// --- PROPS INTERFACE ---
export interface InteractiveProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  className?: string;
  imageUrl: string;
  logoUrl?: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  ivaRate?: number;
  discount?: number;
  stock?: number;
  stockText?: string;
  category?: string;
  onAddToCart?: () => void;
  cartQuantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  isCompact?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onEditProduct?: () => void;
}

// --- COMPONENT DEFINITION ---
export const InteractiveProductCard: React.FC<InteractiveProductCardProps> = ({
  className,
  imageUrl,
  logoUrl,
  title,
  description,
  price,
  originalPrice,
  ivaRate,
  discount,
  stock = 0,
  stockText,
  category,
  onAddToCart,
  cartQuantity = 0,
  onIncrement,
  onDecrement,
  isCompact = false,
  isFavorite = false,
  onToggleFavorite,
  onEditProduct,
  ...props
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  const isOutOfStock = stock <= 0;

  // --- MOUSE MOVE HANDLER ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = ((y - height / 2) / (height / 2)) * -5;
    const rotateY = ((x - width / 2) / (width / 2)) * 5;

    setStyle({
      transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: "transform 0.1s ease-out",
    });
  };

  // --- MOUSE LEAVE HANDLER ---
  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.3s ease-in-out",
    });
  };

  const displayStockText = stockText || `${stock} unidades`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      onClick={() => {
        if (!isOutOfStock && onAddToCart) {
          onAddToCart();
        }
      }}
      className={cn(
        "group relative w-full select-none cursor-pointer overflow-hidden rounded-none glass-card glass-card-hover shadow-lg transition-all duration-200 border border-white/70 hover:border-[#BC6343]",
        isCompact ? "aspect-[4/5] max-w-full" : "aspect-[9/12] max-w-[340px] mx-auto",
        "transform-style-3d",
        isOutOfStock && "opacity-60 grayscale-[30%] cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Background Image */}
      <img
        src={normalizeImageUrl(imageUrl)}
        alt={title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover rounded-none transition-transform duration-500 group-hover:scale-105"
        style={{ transform: "translateZ(-15px) scale(1.05)" }}
        loading="lazy"
      />

      {/* Gradient Overlay for high text contrast with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b2631]/90 via-[#214C6A]/45 to-transparent rounded-none transition-opacity duration-300 group-hover:via-[#214C6A]/55" />

      {/* Main Content with 3D effect */}
      <div
        className="absolute inset-0 p-3.5 sm:p-4 flex flex-col justify-between"
        style={{ transform: "translateZ(30px)" }}
      >
        {/* Header with Category, IVA, Discount, Favorite & Edit Buttons */}
        <div className="flex items-start justify-between gap-2 rounded-none border border-white/35 bg-[#214C6A]/75 p-2.5 sm:p-3 backdrop-blur-xl shadow-md transition-all duration-200 group-hover:bg-[#214C6A]/85 group-hover:border-white/50">
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {category && (
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFF9F0] px-2 py-0.5 rounded-none bg-[#BC6343] border border-white/20 shadow-2xs">
                  {category}
                </span>
              )}
              {/* IVA rate indicator */}
              <span className={cn(
                "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-none border border-white/20",
                ivaRate && ivaRate > 0 ? "bg-[#214C6A] text-[#FFF9F0]" : "bg-emerald-800 text-emerald-100"
              )}>
                {ivaRate && ivaRate > 0 ? `IVA ${ivaRate}%` : 'Exento (0%)'}
              </span>

              {/* Discount Tag */}
              {discount !== undefined && discount > 0 && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-none bg-rose-600 text-white border border-rose-300 animate-pulse">
                  -{discount}%
                </span>
              )}

              {cartQuantity > 0 && (
                <span className="text-[10px] font-black text-[#FFF9F0] px-2 py-0.5 rounded-none bg-[#4caf50] border border-white/20">
                  {cartQuantity} en cuenta
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-[#FFF9F0] leading-snug line-clamp-2 drop-shadow-sm font-title">
              {title}
            </h3>
            <p className="text-[11px] text-[#F6E1C6]/90 line-clamp-1 mt-0.5 font-medium">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Edit Product Button */}
            {onEditProduct && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProduct();
                }}
                className="h-7 w-7 rounded-none flex items-center justify-center transition-all cursor-pointer bg-[#FFF9F0]/15 hover:bg-[#BC6343] text-[#F6E1C6] hover:text-white border border-white/10"
                title="Modificar producto, IVA o descuento"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Favorite Star Button */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  "h-7 w-7 rounded-none flex items-center justify-center transition-all cursor-pointer border",
                  isFavorite
                    ? "bg-[#EB9D52] text-[#222E3A] border-white shadow-xs font-bold"
                    : "bg-[#FFF9F0]/15 text-[#F6E1C6] hover:text-[#EB9D52] border-white/10 hover:bg-[#FFF9F0]/25"
                )}
                title={isFavorite ? "Quitar de botones rápidos" : "Añadir a botones rápidos"}
              >
                <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-[#222E3A]")} />
              </button>
            )}

            {logoUrl ? (
              <img src={logoUrl} alt="Brand Logo" className="h-5 w-auto object-contain shrink-0 opacity-90" />
            ) : null}
          </div>
        </div>

        {/* Stock & Price Row */}
        <div className="flex items-end justify-between gap-2 pt-2">
          {/* Price Tag & Stock info */}
          <div className="flex flex-col gap-1">
            {/* Stock Tag */}
            <div className="inline-flex items-center gap-1.5 rounded-none bg-[#222E3A]/90 border border-white/20 px-2 py-0.5 backdrop-blur-md w-fit shadow-xs">
              {isOutOfStock ? (
                <>
                  <AlertCircle className="w-3 h-3 text-[#e74c3c]" />
                  <span className="text-[10px] font-bold text-[#e74c3c]">Agotado</span>
                </>
              ) : (
                <>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-none",
                    stock < 10 ? "bg-[#EB9D52] animate-ping" : "bg-[#4caf50]"
                  )} />
                  <span className="text-[10px] font-medium text-[#F6E1C6]">
                    Stock: <strong className="text-[#FFF9F0] font-bold">{displayStockText}</strong>
                  </span>
                </>
              )}
            </div>

            {/* Price Tag in Colombian Pesos with strikethrough if discounted */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="rounded-none bg-[#BC6343] px-2.5 py-1 shadow-md border border-[#EB9D52]/40 w-fit backdrop-blur-md">
                <span className="text-[9px] font-bold text-[#F6E1C6] mr-1 font-secondary">COP</span>
                <span className="text-xs sm:text-sm md:text-base font-black text-[#FFF9F0] tracking-tight font-secondary">
                  {price}
                </span>
              </div>
              {originalPrice && (
                <span className="text-[10px] text-[#F6E1C6]/70 line-through font-semibold">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center">
            {cartQuantity > 0 ? (
              <div 
                className="flex items-center gap-1 bg-[#214C6A] border border-[#EB9D52]/40 rounded-none p-1 shadow-lg text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement?.();
                  }}
                  className="w-6 h-6 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] active:scale-95 text-[#FFF9F0] flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-black text-[#EB9D52]">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement?.();
                  }}
                  disabled={cartQuantity >= stock}
                  className="w-6 h-6 rounded-none bg-[#4caf50] hover:bg-[#388e3c] disabled:bg-slate-800 disabled:opacity-40 active:scale-95 text-white flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold text-[#FFF9F0] transition-all shadow-md active:scale-95 cursor-pointer",
                  isOutOfStock
                    ? "bg-[#63665B]/60 text-[#222E3A]/50 border border-white/10 cursor-not-allowed"
                    : "bg-[#214C6A] hover:bg-[#1a3d55] border border-white/20 shadow-[#214C6A]/30 group-hover:border-[#EB9D52]"
                )}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Agregar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveProductCard;

