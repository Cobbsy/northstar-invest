import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Stack, Chip, Divider, CircularProgress, Alert,
  ToggleButton, ToggleButtonGroup, Collapse,
} from '@mui/material';
import {
  Search, CheckCircle, Assignment, AccountBalance,
  ContentCopy, OpenInNew,
} from '@mui/icons-material';
import { fetchStockAudit, type StockAudit } from '../api/stock';
import { surfaceColors } from '../theme/theme';

// ── Account type ──────────────────────────────────────────────────────────────
type AccountType = 'TFSA' | 'RRSP' | 'FHSA' | 'Cash';

const ACCOUNT_INFO: Record<AccountType, { label: string; description: string; color: string }> = {
  TFSA: {
    label: 'TFSA',
    description: 'Tax-Free Savings Account — dividends grow 100% tax-free. Best for most Canadians.',
    color: '#137333',
  },
  RRSP: {
    label: 'RRSP',
    description: 'Registered Retirement Savings Plan — tax-deductible contributions, deferred tax on growth.',
    color: '#1A73E8',
  },
  FHSA: {
    label: 'FHSA',
    description: 'First Home Savings Account — tax-free growth for first-time home buyers. $8,000/yr limit.',
    color: '#B45309',
  },
  Cash: {
    label: 'Cash Account',
    description: 'Non-registered account — dividends are taxable. Use only after maxing registered accounts.',
    color: '#5F6368',
  },
};

// ── Broker links ───────────────────────────────────────────────────────────────
const BROKERS = [
  { name: 'Wealthsimple', url: 'https://www.wealthsimple.com' },
  { name: 'Questrade', url: 'https://www.questrade.com' },
];

// ── Briefing card ─────────────────────────────────────────────────────────────
function BriefingCard({ stock, shares, account }: {
  stock: StockAudit;
  shares: number;
  account: AccountType;
}) {
  const limitPrice = stock.price ? (stock.price + 0.05).toFixed(2) : 'N/A';
  const totalCost = stock.price ? (stock.price * shares).toFixed(2) : 'N/A';
  const annualIncome = stock.dividend_yield && stock.price
    ? (stock.price * shares * stock.dividend_yield).toFixed(2)
    : 'N/A';
  const monthlyIncome = annualIncome !== 'N/A'
    ? (parseFloat(annualIncome) / 12).toFixed(2)
    : 'N/A';

  const acct = ACCOUNT_INFO[account];
  const isHighRisk = stock.mentor_status === 'Red';

  const [copied, setCopied] = useState(false);

  const briefingText = `
NORTHSTAR INVEST — EXECUTION BRIEFING
======================================
Asset:        ${stock.ticker} — ${stock.name}
Shares:       ${shares}
Order Type:   Limit Order
Limit Price:  $${limitPrice} ${stock.currency}
Total Cost:   $${totalCost} ${stock.currency}
Account:      ${account}
Est. Annual:  $${annualIncome}
Est. Monthly: $${monthlyIncome}/mo
Mentor:       ${stock.mentor_status === 'Green' ? 'High Confidence Entry. Proceed.' : 'Review flags before proceeding.'}
======================================
Disclaimer: Educational simulation only. Not financial advice.
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={2}>
      {/* Status banner */}
      {isHighRisk ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          <strong>Mentor: High Risk.</strong> This ticker has active audit flags. Review them in Stock Lookup before proceeding.
        </Alert>
      ) : stock.mentor_status === 'Amber' ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          <strong>Mentor: Review Required.</strong> Some flags detected. Proceed with caution.
        </Alert>
      ) : (
        <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 3 }}>
          <strong>Mentor: High Confidence Entry.</strong> No audit flags detected. Proceed with Limit Order.
        </Alert>
      )}

      {/* Main briefing */}
      <Card sx={{ bgcolor: stock.mentor_status === 'Green' ? surfaceColors.greenZone : surfaceColors.redFlag }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                EXECUTION BRIEFING
              </Typography>
              <Typography variant="h6" fontWeight={700}>{stock.ticker}</Typography>
              <Typography variant="body2" color="text.secondary">{stock.name}</Typography>
            </Box>
            <Chip
              label={stock.mentor_status === 'Green' ? 'Clear' : stock.mentor_status}
              size="small"
              sx={{
                bgcolor: stock.mentor_status === 'Green' ? '#137333' : stock.mentor_status === 'Amber' ? '#B45309' : '#C5221F',
                color: '#fff',
                fontWeight: 700,
              }}
            />
          </Stack>

          <Stack spacing={1.5} divider={<Divider />}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Order Type</Typography>
              <Typography variant="body2" fontWeight={600}>Limit Order</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Limit Price</Typography>
              <Typography variant="body2" fontWeight={600}>${limitPrice} {stock.currency}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Shares</Typography>
              <Typography variant="body2" fontWeight={600}>{shares}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Cost</Typography>
              <Typography variant="body2" fontWeight={700}>${totalCost} {stock.currency}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Account</Typography>
              <Chip label={account} size="small" sx={{ bgcolor: acct.color, color: '#fff', fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Est. Annual Income</Typography>
              <Typography variant="body2" fontWeight={600} color="success.dark">${annualIncome}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Est. Monthly Income</Typography>
              <Typography variant="body2" fontWeight={700} color="success.dark">${monthlyIncome}/mo</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Account explanation */}
      <Card sx={{ bgcolor: '#E8F0FE' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
            <AccountBalance fontSize="small" sx={{ color: acct.color }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: acct.color }}>
              {acct.label}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">{acct.description}</Typography>
        </CardContent>
      </Card>

      {/* Copy + broker links */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={copied ? <CheckCircle /> : <ContentCopy />}
        onClick={handleCopy}
        sx={{ borderRadius: 28 }}
      >
        {copied ? 'Copied to Clipboard!' : 'Copy Briefing'}
      </Button>

      <Card>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            EXECUTE AT YOUR BROKER
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {BROKERS.map((b) => (
              <Button
                key={b.name}
                variant="outlined"
                size="small"
                endIcon={<OpenInNew fontSize="small" />}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 28, textTransform: 'none' }}
              >
                {b.name}
              </Button>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Use the briefing above to place a Limit Order at your broker.
          </Typography>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card sx={{ bgcolor: '#FFF8E1' }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="warning.dark">
            SIMULATION DISCLAIMER
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            NorthStar Invest is an educational tool only. This briefing is not financial advice.
            Always verify current prices at your broker before placing any real order.
            Consult a registered financial advisor before investing real money.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExecutionPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<StockAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState(10);
  const [account, setAccount] = useState<AccountType>('TFSA');

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

  return (
    <Box sx={{ p: 3, pt: 3, maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Execution Briefing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Generate a ready-to-use order brief before moving to your real broker.
        This is the final step before investing real money.
      </Typography>

      {/* Ticker search */}
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
          {loading ? 'Loading…' : 'Load'}
        </Button>
      </Stack>

      {/* Quick picks */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
        {['XDIV.TO', 'RY.TO', 'TD.TO', 'ENB.TO', 'BCE.TO'].map((t) => (
          <Chip
            key={t} label={t} size="small" variant="outlined"
            onClick={() => setQuery(t)} sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Empty state */}
      {!stock && !loading && !error && (
        <Card sx={{ textAlign: 'center', py: 5 }}>
          <CardContent>
            <Assignment sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Ready to place your first order?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search a ticker above. Your Mentor will generate a limit order brief<br />
              with the right price, account type, and confidence rating.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Configuration — only shown after ticker loaded */}
      <Collapse in={!!stock}>
        {stock && (
          <Stack spacing={3}>
            {/* Share count */}
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">NUMBER OF SHARES</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{shares} shares</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  ≈ ${stock.price ? (stock.price * shares).toFixed(2) : 'N/A'} {stock.currency} total
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <Chip
                      key={n} label={n} size="small"
                      variant={shares === n ? 'filled' : 'outlined'}
                      color={shares === n ? 'primary' : 'default'}
                      onClick={() => setShares(n)} sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Account type */}
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  ACCOUNT TYPE
                </Typography>
                <ToggleButtonGroup
                  value={account} exclusive
                  onChange={(_, v) => v && setAccount(v)}
                  fullWidth size="small"
                >
                  {(Object.keys(ACCOUNT_INFO) as AccountType[]).map((a) => (
                    <ToggleButton key={a} value={a} sx={{ fontSize: '0.75rem' }}>
                      {a}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </CardContent>
            </Card>

            {/* Generate briefing */}
            <BriefingCard stock={stock} shares={shares} account={account} />
          </Stack>
        )}
      </Collapse>
    </Box>
  );
}
