import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server'

/**
 * Best-effort client IP. Netlify sets x-nf-client-connection-ip; fall back to
 * the standard proxy headers. Used only as a rate-limit bucket key, never for
 * auth, so a spoofed/absent value at worst shares a bucket.
 */
export function clientIp(req: Request): string {
  const h = req.headers
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Fixed-window rate limit via the shared DB (check_rate_limit RPC, migration
 * 014 in the Crescent Car Reports repo). Returns true when the request is
 * ALLOWED.
 *
 * Fails OPEN (returns true) when Supabase isn't configured or the RPC errors:
 * rate limiting is best-effort abuse mitigation, not an auth gate, and must
 * never take down a legitimate booking/contact on an infra blip or before the
 * migration is applied. Over-limit requests get a 429 from the caller.
 */
export async function rateLimitOk(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  try {
    const { data, error } = await createServerClient().rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('[rate-limit] rpc error (allowing request)', error)
      return true
    }
    return data !== false
  } catch (err) {
    console.error('[rate-limit] unexpected error (allowing request)', err)
    return true
  }
}
