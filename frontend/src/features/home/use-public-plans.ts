'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  hasBadge: boolean;
  hasVerification: boolean;
  /** Ordered marketing bullet points supplied by admin. Falls back to
   *  the boolean flags below when empty. */
  highlights: string[];
  /** Optional override for the default "Get started" CTA copy. */
  ctaLabel: string | null;
  /** Which marketing surface the plan appears on. */
  audience: 'ALL' | 'BUSINESS' | 'PROFESSIONAL';
}

interface State {
  plans: PublicPlan[] | null;
  isLoading: boolean;
  isError: boolean;
}

const EMPTY_STATE: State = { plans: null, isLoading: true, isError: false };

/**
 * Fetches the public pricing plans once on mount. Used by the
 * /for-business and /for-professionals marketing pages.
 */
export function usePublicPlans(): State {
  const [state, setState] = useState<State>(EMPTY_STATE);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    let cancelled = false;

    apiClient
      .get<{ success: true; data: PublicPlan[] }>(`/plans`)
      .then((res) => {
        if (cancelled || seq !== requestSeq.current) return;
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setState({ plans: data, isLoading: false, isError: false });
      })
      .catch(() => {
        if (cancelled || seq !== requestSeq.current) return;
        setState({ plans: null, isLoading: false, isError: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
