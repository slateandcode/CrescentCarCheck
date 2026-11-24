'use client'

import { useReveal } from '@/hooks/useReveal'
import { StatsCounter } from '@/components/ui/StatsCounter'

const STATS = [
  { value: 24, suffix: 'h', label: 'Report Turnaround' },
  { value: 7, suffix: '', label: 'Emirates Covered' },
  { value: 600, suffix: '+', label: 'Inspection Points' },
  { value: 100, suffix: '%', label: 'Certified Inspectors' },
]

export function StatsSection() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-background section-padding">
      <div ref={ref} className="reveal container-wide">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={
                i > 0
                  ? 'lg:border-l lg:border-border lg:pl-8'
                  : ''
              }
            >
              <StatsCounter value={stat.value} suffix={stat.suffix} label={stat.label} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
