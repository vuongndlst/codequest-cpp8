import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  id?: string;
}

export function Card({ children, className, as: Tag = 'div', id }: CardProps) {
  return <Tag id={id} className={cn('cq-card p-5', className)}>{children}</Tag>;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Cấp heading — giữ đúng thứ bậc h1 → h2 → h3 cho screen reader */
  headingLevel?: 2 | 3 | 4;
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  headingLevel = 2,
}: CardHeaderProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
        <div className="min-w-0">
          <Heading className="text-lg font-bold text-slate-100">{title}</Heading>
          {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'quest' | 'treasure' | 'mage' | 'verdant';
  sublabel?: string;
  /** Khi có `to`, toàn bộ ô trở thành một lối tắt có thể bấm và dùng bàn phím. */
  to?: string;
}

const STAT_TONES = {
  quest: 'text-quest-400 bg-quest-500/10',
  treasure: 'text-treasure-400 bg-treasure-400/10',
  mage: 'text-mage-300 bg-mage-500/10',
  verdant: 'text-verdant-400 bg-verdant-500/10',
} as const;

export function StatTile({ label, value, icon, tone = 'quest', sublabel, to }: StatTileProps) {
  const content = (
    <>
      <span
        className={cn('grid place-items-center size-11 rounded-xl shrink-0', STAT_TONES[tone])}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-100 leading-none tabular-nums">
          {value}
        </p>
        <p className="text-xs text-slate-400 mt-1 truncate">{label}</p>
        {sublabel && <p className="text-xs text-slate-500 truncate">{sublabel}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`Xem ${label}`}
        className="cq-card p-4 flex items-center gap-3 transition hover:-translate-y-0.5 hover:border-quest-400/60 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quest-400"
      >
        {content}
      </Link>
    );
  }

  return <div className="cq-card p-4 flex items-center gap-3">{content}</div>;
}
