import React from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { WhatsApp, HelpOutline } from '@mui/icons-material';

const Doubts = () => {
  const handleWhatsAppClick = () => {
    const phone = '919579323670';
    const message = encodeURIComponent('Hello! I have a doubt and need help.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: '1px solid rgba(17,24,39,0.08)',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)'
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HelpOutline color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Ask a Doubt
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: '#6B7280' }}>
            Need help with a concept or assignment? Tap below to message us on WhatsApp.
          </Typography>
          <Box>
            <Button
              onClick={handleWhatsAppClick}
              variant="contained"
              startIcon={<WhatsApp />}
              sx={{
                bgcolor: '#22C55E',
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.2,
                '&:hover': { bgcolor: '#16A34A' }
              }}
            >
              Message on WhatsApp
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
            WhatsApp: +91 95793 23670
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Doubts;
