import React, { useRef, useState, useEffect } from 'react';
import { CategoryInfo, CategoryName, ProductItem } from '@/types';
import HoverRevealCards, { CardItem } from '@/components/ui/cards';
import { normalizeImageUrl } from '@/lib/utils';
import { 
  Package, 
  Milk, 
  Sparkles, 
  CupSoda, 
  Beef, 
  Croissant, 
  Apple, 
  Wine, 
  Cookie, 
  MoreHorizontal,
  Layers,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  Settings,
  Plus
} from 'lucide-react';

interface CategoryNavProps {
  categories: CategoryInfo[];
  selectedCategory: CategoryName | 'Todos';
  onSelectCategory: (category: CategoryName | 'Todos') => void;
  products: ProductItem[];
  showCategoryGallery: boolean;
  onToggleCategoryGallery: () => void;
  onOpenManageCategories: () => void;
}

const getCategoryIcon = (name: string, iconName?: string) => {
  switch (iconName || name) {
    case 'Package':
    case 'Abarrotes':
      return <Package className="w-4 h-4" />;
    case 'Milk':
    case 'Lácteos':
      return <Milk className="w-4 h-4" />;
    case 'Sparkles':
    case 'Aseo':
      return <Sparkles className="w-4 h-4" />;
    case 'CupSoda':
    case 'Bebidas':
      return <CupSoda className="w-4 h-4" />;
    case 'Beef':
    case 'Carnes':
      return <Beef className="w-4 h-4" />;
    case 'Croissant':
    case 'Panadería':
      return <Croissant className="w-4 h-4" />;
    case 'Apple':
    case 'Frutas y verduras':
      return <Apple className="w-4 h-4" />;
    case 'Wine':
    case 'Licores':
      return <Wine className="w-4 h-4" />;
    case 'Cookie':
    case 'Mecato':
      return <Cookie className="w-4 h-4" />;
    case 'MoreHorizontal':
    case 'Otros':
      return <MoreHorizontal className="w-4 h-4" />;
    default:
      return <Layers className="w-4 h-4" />;
  }
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  products,
  showCategoryGallery,
  onToggleCategoryGallery,
  onOpenManageCategories,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isWrapMode, setIsWrapMode] = useState(false);

  // Map category data to CardItem interface for HoverRevealCards component
  const galleryItems: CardItem[] = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.name).length;
    return {
      id: cat.name,
      title: cat.name,
      subtitle: cat.subtitle,
      imageUrl: normalizeImageUrl(cat.imageUrl),
      itemCount: count,
      badge: selectedCategory === cat.name ? '✓ Seleccionada' : undefined,
    };
  });

  const getProductCount = (catName: CategoryName | 'Todos') => {
    if (catName === 'Todos') return products.length;
    return products.filter((p) => p.category === catName).length;
  };

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && !isWrapMode) {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
        checkScroll();
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Category Gallery Showcase (HoverRevealCards) */}
      {showCategoryGallery && (
        <div className="glass-panel p-4.5 rounded-none border border-white/80 shadow-2xl transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div>
              <h2 className="text-sm font-bold text-[#214C6A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EB9D52] animate-pulse" />
                Catálogo Visual de Categorías
              </h2>
              <p className="text-xs text-[#63665B]">
                Pasa el cursor sobre una categoría para previsualizar o haz clic para filtrar los productos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenManageCategories}
                className="text-xs text-[#214C6A] hover:text-white bg-white/70 hover:bg-[#214C6A] px-3 py-1.5 rounded-none border border-white/80 backdrop-blur-md shadow-xs cursor-pointer transition-all font-bold flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-[#BC6343]" />
                <span>Gestionar Categorías</span>
              </button>
              <button
                onClick={onToggleCategoryGallery}
                className="text-xs text-[#56291D] hover:text-[#214C6A] bg-white/60 hover:bg-white px-3 py-1.5 rounded-none border border-white/80 backdrop-blur-md shadow-xs cursor-pointer transition-colors font-bold"
              >
                Cerrar Galería ✕
              </button>
            </div>
          </div>

          <HoverRevealCards
            items={galleryItems}
            selectedId={selectedCategory === 'Todos' ? undefined : selectedCategory}
            onItemClick={(item) => {
              onSelectCategory(item.id as CategoryName);
            }}
          />
        </div>
      )}

      {/* Header bar for Filters Navigation */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-[#214C6A] uppercase tracking-wider">
            Categorías del Inventario
          </h3>
          <span className="text-xs text-[#63665B] font-medium">
            ({categories.length})
          </span>
        </div>

        {/* View mode toggle and Manage Categories Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManageCategories}
            className="flex items-center gap-1.5 text-xs font-bold text-[#214C6A] bg-white/50 hover:bg-[#214C6A] hover:text-white px-3 py-1.5 rounded-none border border-white/80 hover:border-[#214C6A] transition-all shadow-xs cursor-pointer backdrop-blur-md"
            title="Añadir, modificar o eliminar categorías"
          >
            <Settings className="w-3.5 h-3.5 text-[#BC6343]" />
            <span className="hidden sm:inline">Gestionar</span> Categorías
          </button>

          <button
            onClick={() => setIsWrapMode(!isWrapMode)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#214C6A] bg-white/50 hover:bg-white px-3 py-1.5 rounded-none border border-white/80 hover:border-[#BC6343] transition-colors shadow-xs cursor-pointer backdrop-blur-md"
            title={isWrapMode ? "Cambiar a barra deslizable" : "Ver todas las categorías sin deslizar"}
          >
            {isWrapMode ? (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#BC6343]" />
                <span>Modo Deslizable</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-[#BC6343]" />
                <span>Ver Todas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Container with Left/Right Arrows */}
      <div className="relative group">
        {/* Left Arrow Button (visible when not in wrap mode) */}
        {!isWrapMode && (
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Ver categorías anteriores"
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-9 h-9 flex items-center justify-center rounded-none bg-[#214C6A] text-[#FFF9F0] shadow-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer ${
              canScrollLeft
                ? 'opacity-100 hover:scale-110 hover:bg-[#1a3d55] hover:border-[#EB9D52]'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Categories Bar */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          className={`${
            isWrapMode
              ? 'flex flex-wrap gap-2 pb-1 pt-1'
              : 'flex items-center gap-2.5 overflow-x-auto pb-2.5 pt-1 scroll-smooth no-scrollbar'
          }`}
        >
          {/* 'Todos' Button */}
          <button
            onClick={() => onSelectCategory('Todos')}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-none text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer active:scale-95 border ${
              selectedCategory === 'Todos'
                ? 'bg-[#214C6A] text-[#FFF9F0] border-white shadow-md'
                : 'glass-card glass-card-hover text-[#222E3A] border-white/70'
            }`}
          >
            <div className={selectedCategory === 'Todos' ? 'text-[#EB9D52]' : 'text-[#BC6343]'}>
              {getCategoryIcon('Todos')}
            </div>
            <span className="tracking-tight whitespace-nowrap font-secondary">Todos</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-none font-bold ${
                selectedCategory === 'Todos'
                  ? 'bg-[#EB9D52] text-[#222E3A]'
                  : 'bg-white/80 text-[#56291D] border border-white/80'
              }`}
            >
              {getProductCount('Todos')}
            </span>
          </button>

          {/* Dynamic Category List */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = getProductCount(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-none text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer active:scale-95 border ${
                  isSelected
                    ? 'bg-[#214C6A] text-[#FFF9F0] border-white shadow-md ring-1 ring-white/60'
                    : 'glass-card glass-card-hover text-[#222E3A] border-white/70'
                }`}
              >
                <div className={isSelected ? 'text-[#EB9D52]' : 'text-[#BC6343]'}>
                  {getCategoryIcon(cat.name, cat.iconName)}
                </div>
                <span className="tracking-tight whitespace-nowrap font-secondary">{cat.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-none font-bold ${
                    isSelected
                      ? 'bg-[#EB9D52] text-[#222E3A]'
                      : 'bg-white/80 text-[#56291D] border border-white/80'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Quick Add Category Button on the bar */}
          <button
            onClick={onOpenManageCategories}
            className="flex items-center gap-1.5 px-3 py-2 rounded-none text-xs font-bold text-[#214C6A] hover:text-[#214C6A] bg-white/40 hover:bg-white/70 border border-dashed border-white/80 transition-all shrink-0 cursor-pointer backdrop-blur-md shadow-2xs"
            title="Añadir nueva categoría"
          >
            <Plus className="w-3.5 h-3.5 text-[#BC6343]" />
            <span className="whitespace-nowrap font-secondary">+ Categoría</span>
          </button>
        </div>

        {/* Right Arrow Button (visible when not in wrap mode) */}
        {!isWrapMode && (
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Ver categorías siguientes"
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-9 h-9 flex items-center justify-center rounded-none bg-[#214C6A] text-[#FFF9F0] shadow-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer ${
              canScrollRight
                ? 'opacity-100 hover:scale-110 hover:bg-[#1a3d55] hover:border-[#EB9D52]'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};


