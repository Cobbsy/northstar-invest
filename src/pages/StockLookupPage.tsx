import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Chip, Stack, Divider, Alert, Collapse,
} from '@mui/material';
import {
  Search, CheckCircle, Warning, Error as ErrorIcon,
  TrendingUp, TrendingDown, Payments, ManageSearch,
} from '@mui/icons-material';
import { fetchStockAudit, type StockAudit } from '../api/stock';
import { surfaceColors } from '../theme/theme';

function pct(v: number | null, decimals = 1) {
  if (v === null || v === undefined) return 'N/A';
  return `${(v * 100).toFixed(decimals)}%`;
}

function statusSurface(status: StockAudit['mentor_status']) {
  if (status === 'Green') return surfaceColors.greenZone;
  if (status === 'Amber' || status === 'Red') return surfaceColors.redFlag;
  return surfaceColors.neutral;
}

function Metric({ icon, label, value, alert }: {
  icon: React.ReactNode; label: string; value: string; alert?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ color: alert ? 'warning.main' : 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={600} color={alert ? 'warning.dark' : 'text.primary'}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function MentorChip({ status }: { status: StockAudit['mentor_status'] }) {
  const map = {
    Green: { label: 'Clean Audit', color: '#137333', bg: '#E6F4EA', icon: <CheckCircle fontSize="small" /> },
    Amber: { label: 'Review Required', color: '#B45309', bg: '#FFF4E5', icon: <Warning fontSize="small" /> },
    Red:   { label: 'High Risk', color: '#C5221F', bg: '#FCE8E6', icon: <ErrorIcon fontSize="small" /> },
  };
  const m = map[status];
  return (
    <Chip
      icon={m.icon}
      label={`Mentor: ${m.label}`}
      sx={{ bgcolor: m.bg, color: m.color, fontWeight: 700, px: 1 }}
    />
  );
}

function ExecutionBriefing({ stock }: { stock: StockAudit }) {
  if (stock.mentor_status !== 'Green') return null;
  const limitPrice = stock.price ? (stock.price + 0.05).toFixed(2) : 'N/A';
  return (
    <Card sx={{ bgcolor: surfaceColors.greenZone }}>
      <CardContent>
        <Typography variant="caption" fontWeight={700} color="success.dark">
          EXECUTION BRIEFING
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={0.5}>
          <Typography variant="body2"><strong>Asset:</strong> {stock.ticker} — {stock.name}</Typography>
          <Typography variant="body2"><strong>Limit Price:</strong> ${limitPrice} {stock.currency}</Typography>
          <Typography variant="body2"><strong>Account:</strong> TFSA (tax-free dividend growth)</Typography>
          <Typography variant="body2" color="success.dark" fontWeight={600} sx={{ mt: 1 }}>
            High Confidence Entry. Proceed with Limit Order.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function StockLookupPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<StockAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setStock(null);
    try {
      const data = await fetchStockAudit(ticker);
      setStock(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not fetch stock data.');
    } finally {
      setLoading(false);
    }
  };

  const surface = stock ? statusSurface(stock.mentor_status) : surfaceColors.neutral;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surface, transition: 'background-color 0.6s ease', p: 3, pt: 4 }}>
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Stock Lookup</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Search any TSX ticker (e.g. <strong>XDIV.TO</strong>, <strong>RY.TO</strong>, <strong>TD.TO</strong>).
          Your Professional Mentor will audit it instantly.
        </Typography>

        {/* Search */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Enter ticker (e.g. XDIV.TO)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
            sx={{ whiteSpace: 'nowrap', px: 3, flexShrink: 0 }}
          >
            {loading ? 'Auditing…' : 'Audit'}
          </Button>
        </Stack>

        {/* Quick picks */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
          {['XDIV.TO', 'RY.TO', 'TD.TO', 'ENB.TO', 'BCE.TO'].map((t) => (
            <Chip
              key={t} label={t} size="small" variant="outlined"
              onClick={() => setQuery(t)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' } }}
            />
          ))}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Empty state */}
        {!stock && !loading && !error && (
          <Card sx={{ textAlign: 'center', py: 5, bgcolor: 'background.paper' }}>
            <CardContent>
              <ManageSearch sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Search a TSX ticker to begin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your Professional Mentor will audit the fundamentals,<br />
                flag any risks, and generate a limit order brief.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Collapse in={!!stock}>
          {stock && (
            <Stack spacing={2}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{stock.ticker}</Typography>
                  <Typography variant="body2" color="text.secondary">{stock.name}</Typography>
                </Box>
                <MentorChip status={stock.mentor_status} />
              </Box>

              {/* Price card */}
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">CURRENT PRICE</Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ${stock.price?.toFixed(2) ?? 'N/A'} {stock.currency}
                      </Typography>
                    </Box>
                    {stock.price_change_1y !== null && (
                      <Chip
                        icon={stock.price_change_1y >= 0 ? <TrendingUp /> : <TrendingDown />}
                        label={`${pct(stock.price_change_1y)} (1Y)`}
                        sx={{
                          bgcolor: stock.price_change_1y >= 0 ? '#E6F4EA' : '#FCE8E6',
                          color: stock.price_change_1y >= 0 ? '#137333' : '#C5221F',
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Stack>
                  {/* 52-week range */}
                  {stock.week_52_high && stock.week_52_low && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        52-WEEK RANGE: ${stock.week_52_low} – ${stock.week_52_high}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Dividend card */}
              <Card>
                <CardContent>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    DIVIDEND AUDIT
                  </Typography>
                  <Stack spacing={2} divider={<Divider />}>
                    <Metric
                      icon={<Payments fontSize="small" />}
                      label="Annual Dividend Per Share"
                      value={stock.annual_dividend ? `$${stock.annual_dividend.toFixed(4)} ${stock.currency}` : 'N/A'}
                    />
                    <Metric
                      icon={<TrendingUp fontSize="small" />}
                      label="Dividend Yield"
                      value={pct(stock.dividend_yield)}
                      alert={stock.yield_trap}
                    />
                    <Metric
                      icon={stock.price_change_1y !== null && stock.price_change_1y >= 0
                        ? <TrendingUp fontSize="small" />
                        : <TrendingDown fontSize="small" />}
                      label="1-Year Price Change"
                      value={pct(stock.price_change_1y)}
                      alert={stock.laggard_alert}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Red flags */}
              {stock.flags.length > 0 && (
                <Card sx={{ bgcolor: surfaceColors.redFlag }}>
                  <CardContent>
                    <Typography variant="caption" fontWeight={700} color="warning.dark" sx={{ display: 'block', mb: 1.5 }}>
                      MENTOR AUDIT FLAGS
                    </Typography>
                    <Stack spacing={1.5}>
                      {stock.flags.map((flag, i) => {
                        const colonIdx = flag.indexOf(':');
                        const title = flag.slice(0, colonIdx);
                        const body = flag.slice(colonIdx + 1).trim();
                        return (
                          <Alert key={i} severity={stock.mentor_status === 'Red' ? 'error' : 'warning'} sx={{ borderRadius: 3 }}>
                            <Typography variant="body2">
                              <strong>{title}:</strong> {body}
                            </Typography>
                          </Alert>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Execution briefing */}
              <ExecutionBriefing stock={stock} />

              {/* TFSA nudge */}
              <Card sx={{ bgcolor: '#E8F0FE' }}>
                <CardContent>
                  <Typography variant="caption" fontWeight={700} color="primary.dark">
                    MENTOR RECOMMENDATION
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Hold dividend assets in your <strong>TFSA</strong> first — your 2026 limit is $7,000.
                    Dividends earned inside a TFSA are 100% tax-free.
                    Settlement is <strong>T+1</strong> — funds clear within 24 hours of your trade.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Collapse>
      </Box>
    </Box>
  );
}
