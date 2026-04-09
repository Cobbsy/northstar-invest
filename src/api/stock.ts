export interface StockAudit {
  ticker: string;
  name: string;
  price: number | null;
  currency: string;
  dividend_yield: number | null;
  annual_dividend: number | null;
  payout_ratio: number | null;
  pe_ratio: number | null;
  price_change_1y: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  yield_trap: boolean;
  laggard_alert: boolean;
  flags: string[];
  mentor_status: 'Green' | 'Amber' | 'Red';
}

export async function fetchStockAudit(ticker: string): Promise<StockAudit> {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
  const res = await fetch(`${base}/stock/${ticker}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}
