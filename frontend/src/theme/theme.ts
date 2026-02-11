import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#dc2626', // Ярко-красный
    },
    secondary: {
      main: '#fbbf24', // Желтый
    },
    background: {
      default: '#fefce8', // Светло-желтый фон
    },
    text: {
      primary: '#1f2937', // Темно-серый текст
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif'
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#dc2626',
    },
  },
});

export default theme;