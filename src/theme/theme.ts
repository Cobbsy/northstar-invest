import { createTheme } from '@mui/material/styles';

export const northstarTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1A73E8' },
    success: { main: '#137333', light: '#E6F4EA' },
    background: {
      default: '#F0F4F8',
      paper: '#FFFFFF',
    },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Google Sans", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    caption: { letterSpacing: '0.04em' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          border: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 28,
          textTransform: 'none',
          fontWeight: 600,
          paddingTop: 10,
          paddingBottom: 10,
        },
        contained: {
          '&:not(:disabled)': { boxShadow: 'none' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 28,
            backgroundColor: '#FFFFFF',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: '#1A73E8',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#1558B0' },
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { borderTop: '1px solid rgba(0,0,0,0.08)', height: 64 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 0,
          padding: '8px 4px',
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 600,
            opacity: 1,          // always show labels
            transition: 'none',
          },
          '&.Mui-selected .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 8, height: 6 } },
    },
  },
});

export const surfaceColors = {
  neutral: '#F0F4F8',
  greenZone: '#E6F4EA',
  redFlag: '#FFF4E5',
};
