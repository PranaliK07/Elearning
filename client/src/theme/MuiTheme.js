import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#0B1F3B', contrastText: '#fff' },
    secondary: { main: '#B0125B', contrastText: '#fff' },
    success: { main: '#00C853' },
    text: {
      primary: mode === 'light' ? '#183153' : '#F5F7FA',
      secondary: mode === 'light' ? '#5F6B7A' : '#AAB4C3'
    },
    background: {
      default: mode === 'light' ? '#F5F7FA' : '#0F1724',
      paper: mode === 'light' ? '#FFFFFF' : '#182235',
    },
    divider: mode === 'light' ? 'rgba(11, 31, 59, 0.08)' : 'rgba(255, 255, 255, 0.10)',
    action: {
      hover: mode === 'light' ? 'rgba(11, 31, 59, 0.04)' : 'rgba(255, 255, 255, 0.06)',
      selected: mode === 'light' ? 'rgba(11, 31, 59, 0.08)' : 'rgba(255, 255, 255, 0.10)'
    }
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, boxShadow: 'none' },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: mode === 'light'
            ? 'radial-gradient(circle at top left, rgba(11, 31, 59, 0.08), transparent 28%), radial-gradient(circle at 80% 20%, rgba(176, 18, 91, 0.14), transparent 22%), linear-gradient(180deg, #ffffff 0%, #fffef8 48%, #ffffff 100%)'
            : 'radial-gradient(circle at top left, rgba(64, 103, 178, 0.18), transparent 28%), radial-gradient(circle at 80% 20%, rgba(176, 18, 91, 0.18), transparent 24%), linear-gradient(180deg, #0f1724 0%, #111b2e 52%, #0f1724 100%)',
          color: mode === 'light' ? '#183153' : '#F5F7FA'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light'
            ? '0 4px 20px rgba(0,0,0,0.05)'
            : '0 10px 30px rgba(0,0,0,0.24)'
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  },
});

export default getTheme;
