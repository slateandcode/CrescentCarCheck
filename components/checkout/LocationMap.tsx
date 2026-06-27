'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { Loader } from '@googlemaps/js-api-loader'

type Coords = { lat: number; lng: number }

interface LocationMapProps {
  /** Initial pin location. Defaults to central Dubai. */
  initialCoords?: Coords
  /** Fires when the user moves the pin or selects a search result. */
  onChange?: (coords: Coords, address: string) => void
  /** Map height. Defaults to 320px / 400px on sm+. */
  className?: string
}

const UAE_CENTER: Coords = { lat: 25.2048, lng: 55.2708 } // Downtown Dubai
// Keep panning/zoom inside the UAE so the picker stays on-region.
const UAE_BOUNDS = { north: 26.4, south: 22.5, east: 56.4, west: 51.4 }

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

// Custom accent teardrop pin (matches the brand yellow + black).
const PIN_URL =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">' +
      '<path d="M16 0C7.7 0 1 6.7 1 15c0 9.5 13 23.5 13.6 24.1a1 1 0 0 0 1.4 0C16.9 38.5 31 24.5 31 15 31 6.7 24.3 0 16 0z" fill="#FFC600" stroke="#000" stroke-width="2"/>' +
      '<circle cx="16" cy="15" r="5" fill="#000"/>' +
      '</svg>'
  )

/** A normalised search prediction backed by a Google place prediction. */
type Prediction = {
  id: string
  label: string
  place: google.maps.places.PlacePrediction
}

export function LocationMap({ initialCoords, onChange, className }: LocationMapProps) {
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  // Session token groups autocomplete keystrokes + the final pick into one
  // billable session; it's regenerated after each selection.
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  // Holds the address written into the input by selectResult(). The autocomplete
  // effect skips searching while `query` equals it, so picking a result doesn't
  // immediately re-open the predictions dropdown over the place just chosen.
  const selectedAddressRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)

  const [ready, setReady] = useState(false)
  // No key (or a failed load) → hide the map; the address textarea below still
  // lets the customer give their location, so booking is never blocked.
  const [unavailable, setUnavailable] = useState(!API_KEY)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Prediction[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Keep the latest onChange in a ref so the map setup effect stays mount-once.
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Reverse-geocode a dropped/clicked pin to a human address, then notify.
  const emitFromLatLng = useCallback(
    async (lat: number, lng: number, recenter: boolean) => {
      if (recenter && mapRef.current) mapRef.current.panTo({ lat, lng })
      let address = ''
      try {
        const res = await geocoderRef.current?.geocode({ location: { lat, lng } })
        address = res?.results[0]?.formatted_address ?? ''
      } catch {
        address = ''
      }
      onChangeRef.current?.({ lat, lng }, address)
    },
    [],
  )

  // Mount the map once on first client render.
  useEffect(() => {
    if (!API_KEY) return
    let cancelled = false

    const loader = new Loader({ apiKey: API_KEY, version: 'weekly' })

    ;(async () => {
      try {
        await loader.importLibrary('maps')
        await loader.importLibrary('marker')
        await loader.importLibrary('places')
        await loader.importLibrary('geocoding')
        if (cancelled || !mapElRef.current) return

        const start = initialCoords ?? UAE_CENTER
        const map = new google.maps.Map(mapElRef.current, {
          center: start,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          restriction: { latLngBounds: UAE_BOUNDS, strictBounds: false },
        })

        const marker = new google.maps.Marker({
          map,
          position: start,
          draggable: true,
          icon: {
            url: PIN_URL,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
          },
        })

        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) void emitFromLatLng(pos.lat(), pos.lng(), false)
        })
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          marker.setPosition(e.latLng)
          void emitFromLatLng(e.latLng.lat(), e.latLng.lng(), false)
        })

        mapRef.current = map
        markerRef.current = marker
        geocoderRef.current = new google.maps.Geocoder()
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
        setReady(true)
      } catch {
        if (!cancelled) setUnavailable(true)
      }
    })()

    return () => {
      cancelled = true
      mapRef.current = null
      markerRef.current = null
      geocoderRef.current = null
    }
    // Mount once; live updates flow through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autocomplete via the Places (New) suggestions API. All state
  // updates run inside the timer so a short/empty query clears cleanly.
  useEffect(() => {
    if (unavailable) return
    // `query` was just set programmatically by selecting a result — don't fire a
    // fresh search (it would re-open the dropdown over the chosen place). Resets
    // naturally once the user edits the field to anything else.
    if (selectedAddressRef.current !== null && query === selectedAddressRef.current) return
    const q = query.trim()
    if (q.length < 3) {
      const clear = setTimeout(() => {
        setResults([])
        setShowResults(false)
      }, 0)
      return () => clearTimeout(clear)
    }
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            includedRegionCodes: ['ae'],
            language: 'en',
            sessionToken: sessionTokenRef.current ?? undefined,
          })
        const mapped: Prediction[] = suggestions
          .map((s) => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => p != null)
          .map((p) => ({ id: p.placeId, label: p.text.text, place: p }))
        setResults(mapped)
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [query, unavailable])

  const selectResult = async (r: Prediction) => {
    setShowResults(false)
    try {
      const place = r.place.toPlace()
      await place.fetchFields({ fields: ['location', 'formattedAddress'] })
      const loc = place.location
      if (!loc || !markerRef.current || !mapRef.current) return
      const lat = loc.lat()
      const lng = loc.lng()
      const address = place.formattedAddress ?? r.label
      markerRef.current.setPosition({ lat, lng })
      mapRef.current.panTo({ lat, lng })
      mapRef.current.setZoom(16)
      // Mark this value as programmatic so the autocomplete effect skips it.
      selectedAddressRef.current = address
      setQuery(address)
      onChangeRef.current?.({ lat, lng }, address)
    } finally {
      // New token for the next search session.
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
    }
  }

  // No API key configured: skip the map entirely (the address field still works).
  if (unavailable && !ready) {
    return (
      <div className={className}>
        <p className="text-light-text-muted text-xs flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
          Enter your address below — we&apos;ll confirm the exact spot with you before the
          inspection.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder="Search for a location (e.g. JLT Cluster D, Dubai)"
          className="
            w-full rounded-input border border-light-border bg-light-card
            text-light-text placeholder-light-text-muted
            pl-10 pr-10 py-2.5 text-sm
            focus:outline-none focus:border-accent focus:shadow-input-focus
          "
          aria-label="Search location in the UAE"
          autoComplete="off"
        />
        {searching && (
          <Loader2
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-muted animate-spin"
            aria-hidden="true"
          />
        )}

        {showResults && results.length > 0 && (
          <ul
            className="
              absolute z-[1000] left-0 right-0 mt-1
              bg-light-card border border-light-border rounded-card
              shadow-[0_12px_36px_rgba(0,0,0,0.18)]
              max-h-72 overflow-y-auto
            "
            role="listbox"
          >
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectResult(r)}
                  className="
                    w-full text-left px-4 py-2.5 text-sm text-light-text
                    hover:bg-light-bg flex items-start gap-2
                  "
                >
                  <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative mt-3">
        <div
          ref={mapElRef}
          className="w-full h-72 sm:h-80 rounded-card border border-light-border bg-light-bg overflow-hidden"
          aria-label="Drag the pin to set the exact car location"
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-light-text-muted text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Loading map…
            </div>
          </div>
        )}
      </div>

      <p className="text-light-text-muted text-xs mt-2 flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
        Tap or drag the pin to set the exact spot. We use this to find the car on
        inspection day.
      </p>
    </div>
  )
}
