'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Check, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field, inputBase, fieldBorder, labelClass } from '@/components/ui/Field'
import { SLOTS } from '@/lib/packages'
import { dubaiTodayISO } from '@/lib/validation'
import type { DistanceClass, SlotTime } from '@/types/booking'

interface ScheduleSlotProps {
  idPrefix: string
  inspectionDate: string
  slotTime: SlotTime | ''
  distance: DistanceClass
  errors: { inspectionDate?: string; slotTime?: string }
  onChange: (patch: { inspectionDate?: string; slotTime?: SlotTime | '' }) => void
  /** Bumped by the parent (e.g. after a 409 on submit) to force a re-check. */
  refreshKey?: number
}

/** Availability for one slot, keyed by its SlotTime value. */
type SlotState = { available: boolean; reason: string | null }
type Availability = Partial<Record<SlotTime, SlotState>>

/** API row shape from /api/availability. */
type ApiSlot = { slot: SlotTime; available: boolean; reason: string | null }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** Number of quick-pick days shown in the strip; furthest bookable date. */
const STRIP_DAYS = 14
const MAX_DAYS = 60

// dubaiTodayISO() lives in lib/validation so the form's lower-bound check and the
// date this component pre-selects share ONE resolver and can never disagree.

/** Add n days to a yyyy-mm-dd string without timezone drift. */
function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Weekday / day-of-month / month labels for a yyyy-mm-dd string (UTC-safe). */
function dayParts(iso: string): { wd: string; day: number; mon: string } {
  const d = new Date(`${iso}T00:00:00Z`)
  return { wd: WEEKDAYS[d.getUTCDay()], day: d.getUTCDate(), mon: MONTHS[d.getUTCMonth()] }
}

/** Short human hint for why a slot can't be booked (best-effort — unknown reasons
 *  just fall back to the generic "Unavailable" tag with no hint). */
function reasonHint(reason: string | null): string | null {
  switch (reason) {
    // long_distance_first_slot_only intentionally has no per-slot hint — the
    // single note above the grid (shown for long-distance emirates) explains it.
    case 'travel_buffer':
    case 'travel_buffer_unavailable':
      return 'Blocked by a long-distance trip'
    case 'cutoff':
      return 'Too soon to book'
    case 'booked':
      return 'Already booked'
    case 'blocked':
      return 'Not available'
    default:
      return null
  }
}

export function ScheduleSlot({
  idPrefix,
  inspectionDate,
  slotTime,
  distance,
  errors,
  onChange,
  refreshKey = 0,
}: ScheduleSlotProps) {
  const id = (k: string) => `${idPrefix}-${k}`

  const [availability, setAvailability] = useState<Availability | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [clearedMessage, setClearedMessage] = useState(false)
  // Resolve "today" (Dubai tz) SYNCHRONOUSLY so the native date input always
  // renders with its `min` set — never a brief window with no lower bound.
  const [today, setToday] = useState(dubaiTodayISO)

  // Refresh "today" when the tab regains focus/visibility. Captured once at mount,
  // it would otherwise go stale on a session left open across Dubai midnight —
  // mislabeling yesterday as "Today" and keeping the date floor (min) a day behind
  // the server, letting the user pick a now-past day that only fails on submit.
  useEffect(() => {
    const refresh = () => setToday(dubaiTodayISO())
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // Keep the latest onChange + current date/slot in refs so the effects can use
  // them without re-running on every parent render. Synced in an effect.
  const onChangeRef = useRef(onChange)
  const selectedRef = useRef(slotTime)
  const dateRef = useRef(inspectionDate)
  useEffect(() => {
    onChangeRef.current = onChange
    selectedRef.current = slotTime
    dateRef.current = inspectionDate
  })

  // On mount: default the date to today (already resolved synchronously above) if
  // it's unset, so the current day is pre-selected and availability loads
  // immediately. Deferred to a task so we never call setState synchronously in
  // the effect body (the parent's onChange triggers a state update).
  useEffect(() => {
    const apply = setTimeout(() => {
      if (!DATE_RE.test(dateRef.current)) onChangeRef.current({ inspectionDate: today })
    }, 0)
    return () => clearTimeout(apply)
  }, [today])

  // Long-distance areas are 9:30 AM only. If the customer already had another
  // slot selected, clear it the moment they switch to a long-distance emirate —
  // no need to wait for the availability fetch (which only runs once a date is set).
  useEffect(() => {
    if (distance === 'long' && selectedRef.current && selectedRef.current !== '09:30') {
      onChangeRef.current({ slotTime: '' })
      setClearedMessage(true)
    }
  }, [distance])

  useEffect(() => {
    let active = true
    const valid = DATE_RE.test(inspectionDate)

    if (!valid) {
      // Defer to a task so we never call setState synchronously in the effect body.
      const reset = setTimeout(() => {
        if (!active) return
        setAvailability(null)
        setLoadError(false)
        setLoading(false)
      }, 0)
      return () => {
        active = false
        clearTimeout(reset)
      }
    }

    const start = setTimeout(() => {
      if (!active) return
      setLoading(true)
      setLoadError(false)
      // Drop the previous date's map so the grid shows "Checking availability…"
      // instead of briefly flashing the old date's slot states for one frame.
      setAvailability(null)
      // NOTE: do NOT reset clearedMessage here. A distance change to a
      // long-distance emirate clears an incompatible slot and sets clearedMessage
      // in a separate effect; this fetch fires on the same change, so resetting it
      // here would wipe that explanation before the user can read it. The message
      // is cleared when the user explicitly clicks a slot.
    }, 0)

    fetch(
      `/api/availability?date=${encodeURIComponent(inspectionDate)}&distance=${distance}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
      .then((data: { ok?: boolean; slots?: ApiSlot[] }) => {
        if (!active) return
        if (!data.ok || !data.slots) {
          setLoadError(true)
          setAvailability(null)
          return
        }
        const map: Availability = {}
        for (const s of data.slots) {
          map[s.slot] = { available: s.available, reason: s.reason }
        }
        setAvailability(map)
        // If the currently selected slot is now unavailable, clear it.
        const selected = selectedRef.current
        if (selected && map[selected] && !map[selected]!.available) {
          onChangeRef.current({ slotTime: '' })
          setClearedMessage(true)
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(true)
          setAvailability(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      clearTimeout(start)
    }
  }, [inspectionDate, distance, refreshKey])

  const dateChosen = DATE_RE.test(inspectionDate)
  const maxDate = today ? addDaysISO(today, MAX_DAYS) : ''
  const stripDays = today ? Array.from({ length: STRIP_DAYS }, (_, i) => addDaysISO(today, i)) : []

  return (
    <div>
      <Field id={id('inspectionDate')} label="Date" required error={errors.inspectionDate}>
        {/* Quick-pick day strip — nicer than a bare date box, and defaults to today. */}
        <div
          role="group"
          aria-label="Pick a day"
          className="flex gap-2 overflow-x-auto pb-1.5 -mx-0.5 px-0.5"
        >
          {stripDays.map((iso) => {
            const p = dayParts(iso)
            const isToday = iso === today
            const selected = inspectionDate === iso
            return (
              <button
                key={iso}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ inspectionDate: iso })}
                className={cn(
                  'shrink-0 w-[58px] rounded-card border px-2 py-2.5 text-center transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  selected
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-light-border bg-light-card hover:border-accent/50',
                )}
              >
                <span
                  className={cn(
                    'block text-[11px] font-semibold uppercase tracking-wide',
                    isToday ? 'text-accent' : 'text-light-text-muted',
                  )}
                >
                  {isToday ? 'Today' : p.wd}
                </span>
                <span className="block text-lg font-bold leading-none mt-1 text-light-text">
                  {p.day}
                </span>
                <span className="block text-[11px] text-light-text-muted mt-0.5">{p.mon}</span>
              </button>
            )
          })}
        </div>

        {/* Fallback for dates beyond the strip. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-light-text-muted">Or pick another date:</span>
          <input
            id={id('inspectionDate')}
            type="date"
            value={inspectionDate}
            min={today || undefined}
            max={maxDate || undefined}
            onChange={(e) => onChange({ inspectionDate: e.target.value })}
            className={cn(inputBase, 'w-auto', fieldBorder(errors.inspectionDate))}
          />
        </div>
      </Field>

      <div id={`field-${id('slotTime')}`} className="mt-5">
        <span className={labelClass}>
          Time slot
          <span className="text-error ml-1" aria-hidden="true">
            *
          </span>
        </span>

        {distance === 'long' && (
          <p className="text-light-text-muted text-xs mt-1 mb-2 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              For long-distance areas (Abu Dhabi, Al Ain, Ras Al Khaimah, Fujairah)
              inspections run at <strong>9:30 AM only</strong>, so the inspector can make the
              round trip in time. Other slots are unavailable for these locations.
            </span>
          </p>
        )}

        {dateChosen && loading && (
          <p className="text-light-text-muted text-xs mt-1 mb-2 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            Checking availability…
          </p>
        )}

        <div
          role="group"
          aria-label="Time slot"
          aria-busy={loading}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {SLOTS.map((s) => {
            // Long-distance: every slot except 9:30 is blocked immediately,
            // client-side — no dependence on the date or the availability fetch.
            const longBlocked = distance === 'long' && s.value !== '09:30'
            const apiState = availability?.[s.value]
            const apiUnavailable = dateChosen && !loading && apiState ? !apiState.available : false
            const unavailable = longBlocked || apiUnavailable
            const disabled = unavailable || (dateChosen && loading)
            // No per-slot hint for the long-distance block — the note above covers it.
            const hint = !longBlocked && apiUnavailable ? reasonHint(apiState?.reason ?? null) : null
            const active = slotTime === s.value

            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => {
                  setClearedMessage(false)
                  onChange({ slotTime: s.value })
                }}
                className={cn(
                  'relative rounded-card border p-4 text-left transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  unavailable
                    ? 'border-light-border bg-light-bg opacity-60 cursor-not-allowed'
                    : disabled
                      ? 'border-light-border bg-light-card opacity-70 cursor-wait'
                      : active
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-light-border bg-light-card hover:border-accent/50',
                )}
              >
                {active && !unavailable && (
                  <span
                    aria-hidden="true"
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-background grid place-items-center"
                  >
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <Clock
                  className={cn('w-5 h-5', active && !unavailable ? 'text-accent' : 'text-light-text-muted')}
                  aria-hidden="true"
                />
                <span className="block font-bold text-light-text mt-2">{s.label}</span>
                {unavailable ? (
                  <>
                    <span className="mt-2 inline-block text-xs font-semibold text-error uppercase tracking-wide">
                      Unavailable
                    </span>
                    {hint && (
                      <span className="block text-light-text-muted text-xs mt-1">{hint}</span>
                    )}
                  </>
                ) : null}
              </button>
            )
          })}
        </div>

        {clearedMessage && (
          <p role="alert" className="text-error text-xs mt-2">
            That slot isn&apos;t available. Please choose another time.
          </p>
        )}

        {loadError && dateChosen && (
          <p className="text-light-text-muted text-xs mt-2">
            We couldn&apos;t check availability — you can still pick a slot and we&apos;ll
            confirm by WhatsApp.
          </p>
        )}

        <p className="text-light-text-muted text-xs mt-3 leading-relaxed">
          Choose a date and time slot. Our team will contact you on WhatsApp to confirm the
          exact arrival timing.
        </p>

        {errors.slotTime && !clearedMessage && (
          <p role="alert" className="text-error text-xs mt-2">
            {errors.slotTime}
          </p>
        )}
      </div>
    </div>
  )
}
