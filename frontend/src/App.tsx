import React from 'react';
import { Button, Typography, Container, Box } from '@mui/material';

function App() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          🥙 Kumashaurma
        </Typography>
        <Typography variant="h5" gutterBottom>
          Добро пожаловать в приложение для заказа шаурмы!
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          sx={{ mt: 3 }}
          onClick={() => alert('React и MUI работают!')}
        >
          Тестовая кнопка
        </Button>
      </Box>
    </Container>
  );
}

export default App;
