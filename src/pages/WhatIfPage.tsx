import { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Slider, Stack,
  ToggleButton, ToggleButtonGroup, Divider,
} from '@mui/material';
import { TrendingDown, ContentCut, Shield } from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { surfaceColors } from '../theme/theme';

// ── Simulation logic ──────────────────────────────────────────────────────────

function simulateCorrection(
  investment: number,
  yieldPct: number,
  correctionPct: number,
  months: number,
) {
  const data = [];
  const monthlyDiv = (investment * yieldPct) / 12;
  let portfolioValue = investment;
  let totalDividends = 0;
  let correctionApplied = false;

  for (let m = 0; m <= months; m++) {
    if (m === 3 && !correctionApplied) {
      // Correction hits at month 3
      portfolioValue *= (1 + correctionPct); // correctionPct is negative
      correctionApplied = true;
    } else if (m > 3 && correctionApplied) {
      // Gradual recovery: ~1% per month after correction
      portfolioValue *= 1.01;
    }

    if (m > 0) totalDividends += monthlyDiv;

    data.push({
      month: `Mo ${m}`,
      portfolio: Math.round(portfolioValue),
      dividends: Math.round(totalDividends),
      total: Math.round(portfolioValue + totalDividends),
    });
  }
  return { data, monthlyDiv, totalDividends: Math.round(totalDividends) };
}

function simulateDividendCut(
  investment: number,
  yieldPct: number,
  cutPct: number,
  months: number,
) {
  const normalMonthly = (investment * yieldPct) / 12;
  const cutMonthly = normalMonthly * (1 - cutPct);
  const data = [];

  for (let m = 0; m <= months; m++) {
    const cutApplied = m >= 4; // cut happens at month 4
    const monthly = cutApplied ? cutMonthly : normalMonthly;
    data.push({
      month: `Mo ${m}`,
      normal: Math.round(normalMonthly * m),
      withCut: Math.round(
        m <= 4 ? normalMonthly * m : (normalMonthly * 4) + cutMonthly * (m - 4)
      ),
      monthlyIncome: Math.round(monthly * 100) / 100,
    });
  }

  return {
    data,
    normalMonthly: Math.round(normalMonthly * 100) / 100,
    cutMonthly: Math.round(cutMonthly * 100) / 100,
    annualLoss: Math.round((normalMonthly - cutMonthly) * 12 * 100) / 100,
  };
}

// ── Components ────────────────────────────────────────────────────────────────

function CorrectionSimulator({
  investment, yieldPct,
}: { investment: number; yieldPct: number }) {
  const [correction, setCorrection] = useState(-10);

  const { data, monthlyDiv, totalDividends } = useMemo(
    () => simulateCorrection(investment, yieldPct, correction / 100, 12),
    [investment, yieldPct, correction],
  );

  const lowestPortfolio = Math.min(...data.map((d) => d.portfolio));
  const paperLoss = investment - lowestPortfolio;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Market correction severity
        </Typography>
        <Slider
          value={correction}
          onChange={(_, v) => setCorrection(v as number)}
          min={-50}
          max={-5}
          step={5}
          valueLabelDisplay="on"
          valueLabelFormat={(v) => `${v}%`}
          sx={{ color: '#C5221F' }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">-50% (Crash)</Typography>
          <Typography variant="caption" color="text.secondary">-5% (Dip)</Typography>
        </Stack>
      </Box>

      {/* Chart */}
      <Card>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom>
            PORTFOLIO VALUE VS DIVIDEND INCOME (12 MONTHS)
          </Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <ReferenceLine y={investment} stroke="#999" strokeDasharray="3 3" label="Start" />
                <Area
                  type="monotone" dataKey="portfolio" name="Portfolio Value"
                  stroke="#C5221F" fill="#FCE8E6" strokeWidth={2}
                />
                <Area
                  type="monotone" dataKey="dividends" name="Dividend Income"
                  stroke="#137333" fill="#E6F4EA" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Key insight cards */}
      <Card sx={{ bgcolor: '#FCE8E6' }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="error.dark">
            THE PAPER LOSS
          </Typography>
          <Typography variant="h5" fontWeight={700} color="error.dark">
            -${paperLoss.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            At the worst point, your ${investment.toLocaleString()} investment drops to ${lowestPortfolio.toLocaleString()}.
            This is a <strong>paper loss</strong> — you only lose money if you sell.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: surfaceColors.greenZone }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="success.dark">
            THE DIVIDEND SHIELD
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.dark">
            +${totalDividends.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your dividends kept paying <strong>${monthlyDiv.toFixed(2)}/month</strong> through the entire crash.
            That's ${totalDividends.toLocaleString()} in real income over 12 months — regardless of the stock price.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

function DividendCutSimulator({
  investment, yieldPct,
}: { investment: number; yieldPct: number }) {
  const [cutPct, setCutPct] = useState(50);

  const { data, normalMonthly, cutMonthly, annualLoss } = useMemo(
    () => simulateDividendCut(investment, yieldPct, cutPct / 100, 12),
    [investment, yieldPct, cutPct],
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Dividend cut severity
        </Typography>
        <Slider
          value={cutPct}
          onChange={(_, v) => setCutPct(v as number)}
          min={10}
          max={100}
          step={10}
          valueLabelDisplay="on"
          valueLabelFormat={(v) => `${v}%`}
          sx={{ color: '#B45309' }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">10% (Trim)</Typography>
          <Typography variant="caption" color="text.secondary">100% (Suspended)</Typography>
        </Stack>
      </Box>

      {/* Chart */}
      <Card>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom>
            CUMULATIVE DIVIDEND INCOME: NORMAL VS CUT
          </Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Area
                  type="monotone" dataKey="normal" name="Normal Dividends"
                  stroke="#137333" fill="#E6F4EA" strokeWidth={2}
                />
                <Area
                  type="monotone" dataKey="withCut" name="With Dividend Cut"
                  stroke="#B45309" fill="#FFF4E5" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Impact cards */}
      <Card sx={{ bgcolor: surfaceColors.redFlag }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="warning.dark">
            MONTHLY INCOME IMPACT
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">BEFORE</Typography>
              <Typography variant="h6" fontWeight={700}>${normalMonthly}/mo</Typography>
            </Box>
            <Typography variant="h5" color="warning.dark">→</Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">AFTER CUT</Typography>
              <Typography variant="h6" fontWeight={700} color="warning.dark">${cutMonthly}/mo</Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Annual income loss: <strong>${annualLoss}</strong>
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#E8F0FE' }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="primary.dark">
            MENTOR INSIGHT
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            This is why <strong>diversification</strong> matters. An ETF like XDIV.TO holds dozens of companies.
            If one cuts its dividend, the others keep paying. A single stock cutting dividends
            hurts much more than one company inside an ETF doing the same.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WhatIfPage() {
  const [mode, setMode] = useState<'correction' | 'cut'>('correction');
  const [investment, setInvestment] = useState(10000);
  const [yieldPct, setYieldPct] = useState(3.6);

  return (
    <Box sx={{ p: 3, pt: 4, maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        What-If Simulator
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        See how your investment survives market stress. Adjust the sliders and watch what happens
        to your portfolio and dividend income.
      </Typography>

      {/* Investment inputs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">INVESTMENT AMOUNT</Typography>
              <Typography variant="h5" fontWeight={700}>${investment.toLocaleString()}</Typography>
              <Slider
                value={investment}
                onChange={(_, v) => setInvestment(v as number)}
                min={1000}
                max={100000}
                step={1000}
                sx={{ color: 'primary.main' }}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">$1,000</Typography>
                <Typography variant="caption" color="text.secondary">$100,000</Typography>
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">DIVIDEND YIELD</Typography>
              <Typography variant="h6" fontWeight={700}>{yieldPct}%</Typography>
              <Slider
                value={yieldPct}
                onChange={(_, v) => setYieldPct(v as number)}
                min={1}
                max={12}
                step={0.1}
                sx={{ color: '#137333' }}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">1% (Conservative)</Typography>
                <Typography variant="caption" color="text.secondary">12% (Aggressive)</Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Scenario toggle */}
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="correction" sx={{ borderRadius: 28, textTransform: 'none', fontWeight: 600 }}>
          <TrendingDown sx={{ mr: 1 }} /> Market Crash
        </ToggleButton>
        <ToggleButton value="cut" sx={{ borderRadius: 28, textTransform: 'none', fontWeight: 600 }}>
          <ContentCut sx={{ mr: 1 }} /> Dividend Cut
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Scenario content */}
      {mode === 'correction' ? (
        <CorrectionSimulator investment={investment} yieldPct={yieldPct / 100} />
      ) : (
        <DividendCutSimulator investment={investment} yieldPct={yieldPct / 100} />
      )}

      {/* Bottom shield */}
      <Card sx={{ bgcolor: surfaceColors.greenZone, mt: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Shield sx={{ fontSize: 40, color: '#137333' }} />
          <Box>
            <Typography variant="body2" fontWeight={700} color="success.dark">
              The lesson
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dividend income is your floor. Markets crash and recover, but quality companies keep
              paying. The key is <strong>not selling during a dip</strong> and letting reinvested
              dividends buy cheap shares.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
