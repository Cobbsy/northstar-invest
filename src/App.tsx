import { useState } from 'react';
import {
  ThemeProvider, CssBaseline, Box, AppBar, Toolbar,
  Typography, Chip, BottomNavigation, BottomNavigationAction, Paper,
} from '@mui/material';
import {
  Stars, Search, Home, TuneRounded, Savings, Assignment,
  FiberManualRecord,
} from '@mui/icons-material';
import { northstarTheme } from './theme/theme';
import OnboardingPage from './pages/OnboardingPage';
import StockLookupPage from './pages/StockLookupPage';
import WhatIfPage from './pages/WhatIfPage';
import SnowballPage from './pages/SnowballPage';
import ExecutionPage from './pages/ExecutionPage';

function GreenZoneIndicator() {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  // Convert to EST offset (UTC-4 during EDT)
  const isGreenZone = totalMinutes >= 600 && totalMinutes <= 930;

  return (
    <Chip
      icon={
        <FiberManualRecord
          sx={{
            fontSize: '10px !important',
            color: isGreenZone ? '#137333 !important' : '#5F6368 !important',
            animation: isGreenZone ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.4 },
              '100%': { opacity: 1 },
            },
          }}
        />
      }
      size="small"
      label={isGreenZone ? 'TSX Green Zone' : 'Market Closed'}
      sx={{
        backgroundColor: isGreenZone ? '#E6F4EA' : '#F1F3F4',
        color: isGreenZone ? '#137333' : '#5F6368',
        fontWeight: 600,
        fontSize: '0.72rem',
        border: `1px solid ${isGreenZone ? '#C8E6C9' : '#E0E0E0'}`,
      }}
    />
  );
}

export default function App() {
  const [page, setPage] = useState(0);

  return (
    <ThemeProvider theme={northstarTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            top: 0,
            zIndex: 20,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stars sx={{ color: 'primary.main', fontSize: 22 }} />
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                NorthStar Invest
              </Typography>
            </Box>
            <GreenZoneIndicator />
          </Toolbar>
        </AppBar>

        {/* Page content — pb accounts for fixed bottom nav (64px) + extra breathing room */}
        <Box sx={{ pb: '80px' }}>
          {page === 0 && <OnboardingPage />}
          {page === 1 && <StockLookupPage />}
          {page === 2 && <WhatIfPage />}
          {page === 3 && <SnowballPage />}
          {page === 4 && <ExecutionPage />}
        </Box>

        {/* Bottom navigation */}
        <Paper
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}
          elevation={0}
        >
          <BottomNavigation value={page} onChange={(_, v) => setPage(v)} showLabels>
            <BottomNavigationAction label="Start" icon={<Home />} />
            <BottomNavigationAction label="Lookup" icon={<Search />} />
            <BottomNavigationAction label="What-If" icon={<TuneRounded />} />
            <BottomNavigationAction label="Snowball" icon={<Savings />} />
            <BottomNavigationAction label="Execute" icon={<Assignment />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
