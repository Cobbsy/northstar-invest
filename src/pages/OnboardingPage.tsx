import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Slider,
  Chip, Stack, MobileStepper,
} from '@mui/material';
import {
  TrackChanges, School, SportsScore, ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import { surfaceColors } from '../theme/theme';

// ── Flash card data ───────────────────────────────────────────────────────────
const flashCards = [
  {
    term: 'Dividend',
    emoji: '💰',
    simple: 'A company paying you just for owning its shares.',
    analogy: 'Think of it like rent. You own the property (the share), and the company pays you rent (the dividend) every month or quarter — whether the stock price goes up or down.',
  },
  {
    term: 'ETF',
    emoji: '🌳',
    simple: 'A single investment that holds dozens of stocks at once.',
    analogy: 'Instead of planting one tree (one stock), you buy a whole orchard. If one tree has a bad year, the others keep producing fruit.',
  },
  {
    term: 'TFSA',
    emoji: '🛡️',
    simple: 'A tax-free account where your dividends are yours to keep 100%.',
    analogy: 'Imagine a magic piggy bank — everything you earn inside it, the government can\'t touch. The 2026 contribution limit is $7,000.',
  },
  {
    term: 'Diversification',
    emoji: '🎯',
    simple: 'Spreading your money across many investments to reduce risk.',
    analogy: 'Don\'t put all your eggs in one basket. Owning XDIV.TO gives you exposure to Canada\'s biggest dividend-paying companies in one purchase.',
  },
  {
    term: 'Limit Order',
    emoji: '🔒',
    simple: 'Buying a stock only at a price you\'re comfortable with.',
    analogy: 'Like telling a car dealer "I\'ll buy it, but only if the price is $X or lower." You\'re in control — the purchase only happens on your terms.',
  },
];

// ── Step 1: Goal Getter ───────────────────────────────────────────────────────
function GoalGetter({ onNext }: { onNext: (goal: number) => void }) {
  const [income, setIncome] = useState(100);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <TrackChanges sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        What's your North Star?
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Set a monthly passive income goal. There's no wrong answer — we'll build toward it together.
      </Typography>

      <Card sx={{ bgcolor: surfaceColors.greenZone, mb: 3 }}>
        <CardContent>
          <Typography variant="h3" fontWeight={700} color="success.dark">
            ${income}
          </Typography>
          <Typography color="text.secondary">per month in dividend income</Typography>
          <Slider
            value={income}
            onChange={(_, v) => setIncome(v as number)}
            min={25}
            max={1000}
            step={25}
            sx={{ mt: 3, color: '#137333' }}
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">$25/mo</Typography>
            <Typography variant="caption" color="text.secondary">$1,000/mo</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        At a 3.6% yield (XDIV.TO), you'd need roughly{' '}
        <strong>${Math.round((income * 12) / 0.036).toLocaleString()}</strong> invested to hit this goal.
      </Typography>

      <Button variant="contained" size="large" onClick={() => onNext(income)}>
        Set My Goal
      </Button>
    </Box>
  );
}

// ── Step 2: Flash Cards ───────────────────────────────────────────────────────
function KnowledgeSeeker({ onNext }: { onNext: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = flashCards[index];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => i + 1), 150);
  };

  const handleBack = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 150);
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <School sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Learn the Basics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        5 concepts that'll make you a more confident investor. Tap a card to reveal the full explanation.
      </Typography>

      <Card
        onClick={() => setFlipped(!flipped)}
        sx={{
          cursor: 'pointer',
          bgcolor: flipped ? surfaceColors.greenZone : 'background.paper',
          transition: 'background-color 0.3s ease',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <CardContent>
          {!flipped ? (
            <>
              <Typography variant="h2" sx={{ mb: 1 }}>{card.emoji}</Typography>
              <Typography variant="h5" fontWeight={700}>{card.term}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>{card.simple}</Typography>
              <Chip label="Tap to learn more" size="small" sx={{ mt: 2 }} />
            </>
          ) : (
            <>
              <Typography variant="h6" fontWeight={700} color="success.dark" gutterBottom>
                The Analogy
              </Typography>
              <Typography>{card.analogy}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <MobileStepper
        variant="dots"
        steps={flashCards.length}
        position="static"
        activeStep={index}
        sx={{ justifyContent: 'center', bgcolor: 'transparent', mb: 3 }}
        backButton={
          <Button size="small" onClick={handleBack} disabled={index === 0}>
            <ChevronLeft /> Back
          </Button>
        }
        nextButton={
          index < flashCards.length - 1 ? (
            <Button size="small" onClick={handleNext}>
              Next <ChevronRight />
            </Button>
          ) : (
            <Button size="small" variant="contained" onClick={onNext}>
              I'm Ready <ChevronRight />
            </Button>
          )
        }
      />
    </Box>
  );
}

// ── Step 3: Sandbox ───────────────────────────────────────────────────────────
function SandboxSetup({ goal, onFinish }: { goal: number; onFinish: () => void }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <SportsScore sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Your Sandbox is Ready
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Practice with $10,000 in simulated capital — no real money, no risk. Everything looks and feels real so you can build confidence before investing a single dollar.
      </Typography>

      <Card sx={{ bgcolor: surfaceColors.greenZone, mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">SANDBOX BALANCE</Typography>
              <Typography variant="h4" fontWeight={700} color="success.dark">$10,000.00</Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 2 }}>
              <Typography variant="caption" color="text.secondary">YOUR NORTH STAR</Typography>
              <Typography variant="h6" fontWeight={700}>${goal}/month in dividends</Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 2 }}>
              <Typography variant="caption" color="text.secondary">RECOMMENDED ACCOUNT</Typography>
              <Chip label="TFSA — Tax-Free Growth" color="success" size="small" />
            </Box>
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 2, textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary">SIMULATED PORTFOLIO</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>XDIV.TO</strong> — iShares Canadian Quality Dividend ETF
              </Typography>
              <Typography variant="body2" color="text.secondary">~3.63% yield · Monthly payouts · TSX listed</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: '#FFF8E1', mb: 3 }}>
        <CardContent sx={{ textAlign: 'left' }}>
          <Typography variant="caption" fontWeight={700} color="warning.dark">
            SIMULATION DISCLAIMER
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            This is an educational simulation only. All balances, trades, and returns are fictional.
            NorthStar Invest is not a licensed financial advisor. Always consult a registered advisor before investing real money.
          </Typography>
        </CardContent>
      </Card>

      <Button variant="contained" size="large" onClick={onFinish}>
        Enter My Dashboard
      </Button>
    </Box>
  );
}

// ── Main Onboarding Page ──────────────────────────────────────────────────────
const steps = ['Set Your Goal', 'Learn the Basics', 'Launch Sandbox'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(100);

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', p: 3, pt: 3 }}>
      {/* Step indicator */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          {steps.map((label, i) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: i < steps.length - 1 ? 1 : 'none' }}>
              <Box
                sx={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: i < step ? '#137333' : i === step ? 'primary.main' : 'rgba(0,0,0,0.12)',
                  color: i <= step ? '#fff' : 'text.disabled',
                  fontSize: '0.75rem', fontWeight: 700,
                  transition: 'background-color 0.3s',
                }}
              >
                {i < step ? '✓' : i + 1}
              </Box>
              <Typography
                variant="caption"
                fontWeight={i === step ? 700 : 400}
                color={i === step ? 'primary.main' : i < step ? 'success.main' : 'text.disabled'}
                sx={{ flexShrink: 0 }}
              >
                {label}
              </Typography>
              {i < steps.length - 1 && (
                <Box sx={{ flex: 1, height: 2, bgcolor: i < step ? '#137333' : 'rgba(0,0,0,0.1)', borderRadius: 1, mx: 0.5 }} />
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Steps */}
      {step === 0 && (
        <GoalGetter onNext={(g) => { setGoal(g); setStep(1); }} />
      )}
      {step === 1 && (
        <KnowledgeSeeker onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <SandboxSetup goal={goal} onFinish={() => alert('Dashboard coming soon!')} />
      )}
    </Box>
  );
}
