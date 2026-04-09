import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip,
  Slider, Divider, Avatar,
} from '@mui/material';
import { Savings, CalendarMonth, TrendingUp } from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { surfaceColors } from '../theme/theme';

// ── Simulation helpers ────────────────────────────────────────────────────────

function buildSnowball(
  investment: number,
  yieldPct: number,
  years: number,
  reinvest: boolean,
) {
  const data = [];
  let balance = investment;
  let totalDividends = 0;
  const annualYield = yieldPct / 100;

  for (let y = 0; y <= years; y++) {
    const annualDiv = balance * annualYield;
    totalDividends += annualDiv;
    if (reinvest) balance += annualDiv;

    data.push({
      year: y === 0 ? 'Now' : `Yr ${y}`,
      balance: Math.round(balance),
      totalDividends: Math.round(totalDividends),
      monthlyIncome: Math.round((balance * annualYield) / 12),
    });
  }
  return data;
}

function getPaydayDates(year: number, month: number): number[] {
  // XDIV.TO pays monthly — typically around the 10th
  return [10];
}

// ── Payday Calendar ───────────────────────────────────────────────────────────

function PaydayCalendar({ monthlyIncome }: { monthlyIncome: number }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthName = now.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const paydayDates = getPaydayDates(year, month);

  // Build calendar grid (pad with nulls for offset)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {monthName} {year} — Payday Calendar
            </Typography>
          </Box>
          <Chip
            label={`$${monthlyIncome.toFixed(2)}/mo`}
            size="small"
            sx={{ bgcolor: surfaceColors.greenZone, color: '#137333', fontWeight: 700 }}
          />
        </Stack>

        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <Typography key={d} variant="caption" align="center" color="text.secondary" fontWeight={600}>
              {d}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3 }}>
            {week.map((day, di) => {
              const isPayday = day !== null && paydayDates.includes(day);
              const isToday = day === today;
              const isPast = day !== null && day < today;

              return (
                <Box
                  key={di}
                  sx={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    position: 'relative',
                    bgcolor: isPayday
                      ? '#137333'
                      : isToday
                      ? 'primary.main'
                      : 'transparent',
                  }}
                >
                  {day !== null && (
                    <Typography
                      variant="caption"
                      fontWeight={isPayday || isToday ? 700 : 400}
                      sx={{
                        color: isPayday || isToday
                          ? '#fff'
                          : isPast
                          ? 'text.disabled'
                          : 'text.primary',
                      }}
                    >
                      {day}
                    </Typography>
                  )}
                  {isPayday && (
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: -4,
                        right: 0,
                        fontSize: 10,
                      }}
                    >
                      💰
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#137333' }} />
          <Typography variant="caption" color="text.secondary">
            Payday — XDIV.TO dividend deposit (~10th of month)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Snowball coin animation ───────────────────────────────────────────────────

function SnowballCoin({ balance, monthlyIncome }: { balance: number; monthlyIncome: number }) {
  const [animating, setAnimating] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [coins, setCoins] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate a dividend arriving
  const triggerPayout = () => {
    if (animating) return;
    setAnimating(true);
    const id = Date.now();
    setCoins((c) => [...c, id]);

    timerRef.current = setTimeout(() => {
      setCoins((c) => c.filter((x) => x !== id));
      setDisplayBalance((b) => b + monthlyIncome);
      setAnimating(false);
    }, 1200);
  };

  useEffect(() => {
    setDisplayBalance(balance);
  }, [balance]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <Card
      onClick={triggerPayout}
      sx={{
        cursor: 'pointer',
        bgcolor: surfaceColors.greenZone,
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.1s',
        '&:active': { transform: 'scale(0.98)' },
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        {/* Coin animation */}
        {coins.map((id) => (
          <Box
            key={id}
            sx={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 28,
              animation: 'coinDrop 1.2s ease-in forwards',
              '@keyframes coinDrop': {
                '0%': { transform: 'translateX(-50%) translateY(0)', opacity: 1 },
                '80%': { transform: 'translateX(-50%) translateY(60px)', opacity: 1 },
                '100%': { transform: 'translateX(-50%) translateY(80px)', opacity: 0 },
              },
            }}
          >
            🪙
          </Box>
        ))}

        <Typography variant="caption" color="success.dark" fontWeight={700}>
          SANDBOX SNOWBALL
        </Typography>

        <Typography
          variant="h3"
          fontWeight={700}
          color="success.dark"
          sx={{ my: 1, transition: 'all 0.3s' }}
        >
          ${displayBalance.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>

        <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">MONTHLY INCOME</Typography>
            <Typography variant="body1" fontWeight={700} color="success.dark">
              ${monthlyIncome.toFixed(2)}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label="Tap to simulate a dividend payout 💰"
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}
        />
      </CardContent>
    </Card>
  );
}

// ── Snowball growth chart ─────────────────────────────────────────────────────

function SnowballChart({
  investment, yieldPct, years,
}: { investment: number; yieldPct: number; years: number }) {
  const withReinvest = buildSnowball(investment, yieldPct, years, true);
  const withoutReinvest = buildSnowball(investment, yieldPct, years, false);

  const data = withReinvest.map((d, i) => ({
    year: d.year,
    withReinvest: d.balance,
    withoutReinvest: withoutReinvest[i].balance,
    monthlyIncome: d.monthlyIncome,
  }));

  const finalWith = withReinvest[withReinvest.length - 1];
  const finalWithout = withoutReinvest[withoutReinvest.length - 1];
  const advantage = finalWith.balance - finalWithout.balance;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            SNOWBALL GROWTH — REINVEST VS SPEND DIVIDENDS
          </Typography>
          <Box sx={{ width: '100%', height: 260, mt: 2 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Area
                  type="monotone" dataKey="withReinvest" name="Reinvest Dividends"
                  stroke="#137333" fill="#E6F4EA" strokeWidth={2}
                />
                <Area
                  type="monotone" dataKey="withoutReinvest" name="Spend Dividends"
                  stroke="#1A73E8" fill="#E8F0FE" strokeWidth={2} strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Stack direction="row" spacing={2}>
        <Card sx={{ flex: 1, bgcolor: surfaceColors.greenZone }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="caption" color="success.dark" fontWeight={700}>
              REINVESTED
            </Typography>
            <Typography variant="h6" fontWeight={700} color="success.dark">
              ${finalWith.balance.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ${finalWith.monthlyIncome}/mo income
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#E8F0FE' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="caption" color="primary.dark" fontWeight={700}>
              SPENT
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              ${finalWithout.balance.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ${withoutReinvest[withoutReinvest.length - 1].monthlyIncome}/mo income
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ bgcolor: '#FFF8E1' }}>
        <CardContent>
          <Typography variant="caption" fontWeight={700} color="warning.dark">
            THE SNOWBALL ADVANTAGE
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            By reinvesting dividends, you end up with{' '}
            <strong>${advantage.toLocaleString()} more</strong> after {years} years.
            Each dividend buys more shares, which pay more dividends — the snowball keeps rolling.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SnowballPage() {
  const [investment, setInvestment] = useState(10000);
  const [yieldPct, setYieldPct] = useState(3.6);
  const [years, setYears] = useState(10);

  const monthlyIncome = (investment * (yieldPct / 100)) / 12;

  return (
    <Box sx={{ p: 3, pt: 4, maxWidth: 560, mx: 'auto', pb: 6 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Snowball Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Watch your dividends buy more shares, which pay more dividends. This is the compound growth loop.
      </Typography>

      {/* Sandbox coin */}
      <SnowballCoin balance={investment} monthlyIncome={monthlyIncome} />

      {/* Settings */}
      <Card sx={{ my: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">INVESTMENT</Typography>
              <Typography variant="h6" fontWeight={700}>${investment.toLocaleString()}</Typography>
              <Slider value={investment} onChange={(_, v) => setInvestment(v as number)}
                min={1000} max={100000} step={1000} sx={{ color: 'primary.main' }} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">DIVIDEND YIELD</Typography>
              <Typography variant="h6" fontWeight={700}>{yieldPct}%</Typography>
              <Slider value={yieldPct} onChange={(_, v) => setYieldPct(v as number)}
                min={1} max={12} step={0.1} sx={{ color: '#137333' }} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">TIME HORIZON</Typography>
              <Typography variant="h6" fontWeight={700}>{years} years</Typography>
              <Slider value={years} onChange={(_, v) => setYears(v as number)}
                min={1} max={30} step={1} sx={{ color: '#B45309' }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Payday calendar */}
      <PaydayCalendar monthlyIncome={monthlyIncome} />

      {/* Snowball chart */}
      <Box sx={{ mt: 3 }}>
        <SnowballChart investment={investment} yieldPct={yieldPct} years={years} />
      </Box>
    </Box>
  );
}
