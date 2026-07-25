import { useQuery } from '@tanstack/react-query'
import { type ApiError, api, endpoints } from '../client'
import { qk } from '../keys'
import { type Info, InfoSchema } from '../schemas'

/** GET /api/v1/info — unauthenticated instance facts (version, auth providers,
 *  registration flag, feature flags). Static per page load. */
export function useInfo() {
  return useQuery<Info, ApiError>({
    queryKey: qk.info,
    queryFn: () => api(endpoints.info, { schema: InfoSchema }),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
}

/**
 * Demo-instance facts, or `null` on every normal (self-hosted) instance — which is the
 * common case, so every consumer must treat null as "render nothing at all".
 *
 * `undefined` while /info is still loading is deliberately collapsed to null: a banner that
 * flashes in after first paint is worse than one that appears a beat late.
 */
export function useDemo(): NonNullable<Info['demo_mode']> | null {
  const { data } = useInfo()
  return data?.demo_mode ?? null
}
