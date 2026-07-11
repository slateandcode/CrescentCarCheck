import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        // 3.613:1 — the wordmark's own aspect. `Logo Non BG.png` bakes in ~30% of
        // transparent padding top and bottom, which forced an 88px box to render a
        // 27px wordmark (and forced the navbar tall to fit it). logo-wordmark.png is
        // that file trimmed to its ink plus a 16px margin, so the box is the glyph.
        'relative block h-9 w-[130px] md:h-11 md:w-[159px]',
        '[filter:drop-shadow(0_2px_10px_rgba(255,198,0,0.35))]',
        className
      )}
    >
      <Image
        src="/logo-wordmark.png"
        alt="Crescent Car Check"
        fill
        sizes="(min-width: 768px) 159px, 130px"
        preload
        className="object-contain object-left"
      />
    </span>
  )
}
