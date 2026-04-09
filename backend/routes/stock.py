import os
import time
import urllib.request
import urllib.parse
import json
import ssl
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/stock", tags=["stock"])

SSL_CTX = ssl.create_default_context()
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

# In-memory cache: {ticker: (timestamp, StockAudit dict)}
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes


def _get(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15, context=SSL_CTX) as r:
        return json.loads(r.read())


# ── Alpha Vantage data fetching ────────────────────────────────────────────────

def _av_url(function: str, ticker: str, **extra) -> str:
    api_key = os.environ.get("ALPHA_VANTAGE_KEY", "demo")
    params = {"function": function, "symbol": ticker, "apikey": api_key, **extra}
    return "https://www.alphavantage.co/query?" + urllib.parse.urlencode(params)


def fetch_av_quote(ticker: str) -> dict:
    """Get current price and basic info from Alpha Vantage GLOBAL_QUOTE."""
    data = _get(_av_url("GLOBAL_QUOTE", ticker))
    quote = data.get("Global Quote", {})
    if not quote or "05. price" not in quote:
        raise ValueError(f"No quote data for {ticker}")
    return quote


def fetch_av_overview(ticker: str) -> dict:
    """Get company overview (PE, yield, payout ratio, etc.) from Alpha Vantage."""
    data = _get(_av_url("OVERVIEW", ticker))
    if not data or "Symbol" not in data:
        return {}  # ETFs often don't have overview data
    return data


def fetch_av_monthly(ticker: str) -> list[dict]:
    """Get monthly prices for 1-year change calculation."""
    data = _get(_av_url("TIME_SERIES_MONTHLY", ticker))
    series = data.get("Monthly Time Series", {})
    items = sorted(series.items(), reverse=True)[:13]  # ~1 year
    return [{"date": d, "close": float(v["4. close"])} for d, v in items]


# ── Yahoo Finance fallback ─────────────────────────────────────────────────────

def fetch_yahoo(ticker: str) -> dict:
    """Fallback: Yahoo Finance chart API for price and dividends."""
    for host in ["query1", "query2"]:
        url = (
            f"https://{host}.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(ticker)}"
            f"?interval=1d&range=1y&events=dividends"
        )
        try:
            data = _get(url)
            result = data.get("chart", {}).get("result", [])
            if result:
                return result[0]
        except Exception:
            continue
    raise ValueError("Yahoo Finance unavailable")


# ── Model ──────────────────────────────────────────────────────────────────────

class StockAudit(BaseModel):
    ticker: str
    name: str
    price: Optional[float]
    currency: str
    dividend_yield: Optional[float]
    annual_dividend: Optional[float]
    payout_ratio: Optional[float]
    pe_ratio: Optional[float]
    week_52_high: Optional[float]
    week_52_low: Optional[float]
    price_change_1y: Optional[float]
    # Audit flags
    yield_trap: bool
    laggard_alert: bool
    flags: list[str]
    mentor_status: str  # "Green" | "Amber" | "Red"


# ── Route ──────────────────────────────────────────────────────────────────────

@router.get("/{ticker}", response_model=StockAudit)
def get_stock_audit(ticker: str):
    ticker = ticker.upper().strip()

    # Check cache
    cached = _cache.get(ticker)
    if cached and (time.time() - cached[0]) < CACHE_TTL:
        return cached[1]

    api_key = os.environ.get("ALPHA_VANTAGE_KEY", "")
    if api_key:
        return _audit_alpha_vantage(ticker)
    else:
        return _audit_yahoo(ticker)


def _audit_alpha_vantage(ticker: str) -> StockAudit:
    """Primary path: Alpha Vantage, falls back to Yahoo Finance on failure."""
    try:
        quote = fetch_av_quote(ticker)
    except Exception as e:
        print(f"[ERROR] Alpha Vantage quote failed for {ticker}: {e} — falling back to Yahoo Finance")
        return _audit_yahoo(ticker)

    price = float(quote.get("05. price", 0))
    prev_close = float(quote.get("08. previous close", 0))
    change_pct_str = quote.get("10. change percent", "0%").replace("%", "")
    name = ticker  # GLOBAL_QUOTE doesn't include name

    # Get overview for fundamentals (works for stocks, not always for ETFs)
    overview = {}
    try:
        overview = fetch_av_overview(ticker)
        if overview.get("Name"):
            name = overview["Name"]
    except Exception:
        pass

    dividend_yield = _safe_float(overview.get("DividendYield"))
    annual_dividend = _safe_float(overview.get("DividendPerShare"))
    payout_ratio = _safe_float(overview.get("PayoutRatio"))
    pe_ratio = _safe_float(overview.get("TrailingPE"))
    week_52_high = _safe_float(overview.get("52WeekHigh"))
    week_52_low = _safe_float(overview.get("52WeekLow"))

    # 1-year price change from monthly data
    price_change_1y = None
    try:
        monthly = fetch_av_monthly(ticker)
        if len(monthly) >= 2:
            newest = monthly[0]["close"]
            oldest = monthly[-1]["close"]
            price_change_1y = (newest - oldest) / oldest
    except Exception:
        pass

    return _build_audit(
        ticker=ticker, name=name, price=price, currency="CAD",
        dividend_yield=dividend_yield, annual_dividend=annual_dividend,
        payout_ratio=payout_ratio, pe_ratio=pe_ratio,
        week_52_high=week_52_high, week_52_low=week_52_low,
        price_change_1y=price_change_1y,
    )


def _audit_yahoo(ticker: str) -> StockAudit:
    """Fallback path: Yahoo Finance (no API key needed)."""
    try:
        chart = fetch_yahoo(ticker)
    except urllib.error.HTTPError as e:
        print(f"[ERROR] Yahoo HTTP {e.code} for {ticker}: {e.reason}")
        if e.code == 404:
            raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found.")
        raise HTTPException(status_code=502, detail=f"Yahoo Finance HTTP {e.code}: {e.reason}")
    except Exception as e:
        print(f"[ERROR] {type(e).__name__} for {ticker}: {e}")
        raise HTTPException(status_code=502, detail=f"Data error: {e}")

    meta = chart.get("meta", {})
    price = meta.get("regularMarketPrice")
    if not price:
        raise HTTPException(status_code=404, detail=f"No price data for '{ticker}'.")

    name = meta.get("longName") or meta.get("shortName") or ticker
    currency = meta.get("currency", "CAD")

    dividends = chart.get("events", {}).get("dividends", {})
    annual_dividend = sum(d["amount"] for d in dividends.values()) if dividends else None
    dividend_yield = (annual_dividend / price) if (annual_dividend and price) else None

    closes = chart.get("indicators", {}).get("quote", [{}])[0].get("close", [])
    closes = [c for c in closes if c is not None]
    price_change_1y = None
    if len(closes) >= 2:
        price_change_1y = (closes[-1] - closes[0]) / closes[0]

    return _build_audit(
        ticker=ticker, name=name, price=price, currency=currency,
        dividend_yield=dividend_yield, annual_dividend=annual_dividend,
        payout_ratio=None, pe_ratio=None,
        week_52_high=meta.get("fiftyTwoWeekHigh"),
        week_52_low=meta.get("fiftyTwoWeekLow"),
        price_change_1y=price_change_1y,
    )


# ── Shared audit logic ────────────────────────────────────────────────────────

def _build_audit(
    *, ticker, name, price, currency,
    dividend_yield, annual_dividend, payout_ratio, pe_ratio,
    week_52_high, week_52_low, price_change_1y,
) -> StockAudit:
    flags: list[str] = []
    yield_trap = False
    laggard_alert = False

    if dividend_yield and dividend_yield > 0.08:
        if payout_ratio and payout_ratio > 1.0:
            yield_trap = True
            flags.append(
                f"YIELD TRAP: Yield is {dividend_yield*100:.1f}% and Payout Ratio is "
                f"{payout_ratio*100:.0f}% — the company pays more than it earns. "
                "This dividend may not be sustainable."
            )
        else:
            yield_trap = True
            flags.append(
                f"YIELD TRAP: Dividend yield is {dividend_yield*100:.1f}% — unusually high. "
                "Research the payout ratio carefully before buying."
            )

    if price_change_1y is not None and price_change_1y < 0:
        laggard_alert = True
        flags.append(
            f"LAGGARD ALERT: Down {abs(price_change_1y*100):.1f}% over the past year. "
            "Verify whether this is a temporary dip or a deteriorating business."
        )

    if not flags:
        mentor_status = "Green"
    elif yield_trap:
        mentor_status = "Red"
    else:
        mentor_status = "Amber"

    audit = StockAudit(
        ticker=ticker,
        name=name,
        price=round(price, 2) if price else None,
        currency=currency,
        dividend_yield=round(dividend_yield, 4) if dividend_yield else None,
        annual_dividend=round(annual_dividend, 4) if annual_dividend else None,
        payout_ratio=round(payout_ratio, 4) if payout_ratio else None,
        pe_ratio=round(pe_ratio, 2) if pe_ratio else None,
        week_52_high=round(week_52_high, 2) if week_52_high else None,
        week_52_low=round(week_52_low, 2) if week_52_low else None,
        price_change_1y=round(price_change_1y, 4) if price_change_1y is not None else None,
        yield_trap=yield_trap,
        laggard_alert=laggard_alert,
        flags=flags,
        mentor_status=mentor_status,
    )
    _cache[ticker] = (time.time(), audit)
    return audit


def _safe_float(val) -> Optional[float]:
    if val is None or val == "None" or val == "-" or val == "0":
        return None
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None
