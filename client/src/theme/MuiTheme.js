import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#0B1F3B', contrastText: '#fff' },
    secondary: { main: '#B0125B', contrastText: '#fff' },
    success: { main: '#00C853' },
    background: {
      default: mode === 'light' ? '#F5F7FA' : '#121212',
      paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
    },
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
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
      },
    },
  },
});

export default getTheme;