import React from 'react';
import { cn } from '@/lib/utils';

export interface CardItem {
  id: string | number;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  itemCount?: number;
}

export interface HoverRevealCardsProps {
  items: CardItem[];
  className?: string;
  cardClassName?: string;
  selectedId?: string | number;
  onItemClick?: (item: CardItem) => void;
}

export const HoverRevealCards: React.FC<HoverRevealCardsProps> = ({
  items,
  className,
  cardClassName,
  selectedId,
  onItemClick,
}) => {
  return (
    <div
      role="list"
      className={cn(
        'group grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5',
        className
      )}
    >
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <div
            key={item.id}
            role="listitem"
            aria-label={`${item.title}, ${item.subtitle}`}
            tabIndex={0}
            onClick={() => onItemClick?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onItemClick?.(item);
              }
            }}
            className={cn(
              'relative h-40 cursor-pointer overflow-hidden rounded-none bg-cover bg-center shadow-xs transition-all duration-200 ease-in-out border border-[#214C6A]/20 select-none',
              'group-hover:opacity-90',
              'hover:!scale-[1.02] hover:!opacity-100 hover:shadow-md hover:border-[#BC6343] focus-visible:!scale-[1.02] focus-visible:!opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#214C6A]',
              isSelected && '!scale-[1.02] !opacity-100 ring-2 ring-[#EB9D52] shadow-md border-[#EB9D52]',
              cardClassName
            )}
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          >
            {/* Dark glass gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#222E3A]/95 via-[#222E3A]/60 to-[#214C6A]/30 transition-opacity duration-200" />
            
            {/* Top Badge if present */}
            {item.badge && (
              <div className="absolute top-2 right-2 z-10">
                <span className="rounded-none bg-[#BC6343] px-2 py-0.5 text-[10px] font-black text-[#FFF9F0] tracking-wide shadow-xs border border-white/20">
                  {item.badge}
                </span>
              </div>
            )}

            {/* Card Content */}
            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#EB9D52]">
                {item.subtitle}
              </p>
              <h3 className="mt-0.5 text-base font-bold text-[#FFF9F0] tracking-tight font-title">
                {item.title}
              </h3>
              {item.itemCount !== undefined && (
                <p className="text-[10px] text-[#F6E1C6]/80 mt-0.5 font-semibold">
                  {item.itemCount} items
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HoverRevealCards;
