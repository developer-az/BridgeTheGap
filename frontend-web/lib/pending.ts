const KEY = 'btg:pendingPlan';

export type PendingPlan = {
  origin: string;
  destination: string;
  travel_date: string;
  return_date?: string;
  saved_routes?: unknown;
};

export function stashPendingPlan(plan: PendingPlan) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(plan));
}

export function readPendingPlan(): PendingPlan | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPlan;
  } catch {
    return null;
  }
}

export function clearPendingPlan() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
