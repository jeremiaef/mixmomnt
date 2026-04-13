import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Hook to get the currently logged-in user's username.
 * Returns null if not authenticated or still loading.
 */
export function useLoggedInUsername(): string | null {
  return useQuery(api.github.getCurrentUsername) ?? null;
}
