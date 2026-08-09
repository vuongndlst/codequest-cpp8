import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StarRatingProps {
  stars: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' } as const;

/**
 * Hiển thị số sao đạt được.
 *
 * Số sao KHÔNG phụ thuộc số lần thử hay số gợi ý đã dùng
 * (docs/phase-1-architecture.md mục 5.4) — chỉ phụ thuộc test case và clean code.
 */
export function StarRating({ stars, max = 3, size = 'md', className }: StarRatingProps) {
  const earned = Math.min(Math.max(stars, 0), max);

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${earned} trên ${max} sao`}
    >
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          className={cn(
            SIZES[size],
            index < earned
              ? 'text-treasure-400 fill-treasure-400'
              : 'text-abyss-500 fill-abyss-700',
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
