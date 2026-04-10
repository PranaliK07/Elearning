import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  Paper,
  Fade,
  Grow,
  alpha
} from '@mui/material';
import {
  WhatsApp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import SiteHeader from './SiteHeader';
import contactBg from '../../img/contact-bg.jpg';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleFooterLinkClick = (target) => {
    if (target !== '/#features') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };

  const handleWhatsAppClick = () => {
    const phone = '917387275947';
    const message = encodeURIComponent(
      'Hello ELS team! I would like to know more about your learning platform.'
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <SiteHeader />
      
      {/* Hero Section */}
      <Box sx={{ 
        position: 'relative', 
        bgcolor: '#f1f1f1',
        minHeight: { xs: '300px', md: '450px' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 1, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${contactBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.4))',
            backdropFilter: 'blur(2px)',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 25%, rgba(11,31,59,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(176,18,91,0.15), transparent 45%)',
            zIndex: 2,
            backgroundSize: '120% 120%',
            animation: 'heroPulse 18s ease-in-out infinite',
            '@keyframes heroPulse': {
              '0%': { backgroundPosition: '0% 0%' },
              '50%': { backgroundPosition: '100% 100%' },
              '100%': { backgroundPosition: '0% 0%' }
            }
          }}
        />
        <Container sx={{ position: 'relative', zIndex: 3, py: { xs: 8, md: 12 } }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Stack spacing={2} sx={{ maxWidth: 760, mx: 'auto', textAlign: 'center' }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: '"Fraunces", "Sora", serif',
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-1.5px',
                  fontSize: { xs: '3.2rem', sm: '3.8rem', md: '5.2rem' },
                  color: '#0B1F3B'
                }}
              >
                Contact Us
              </Typography>
              <Typography variant="h6" sx={{ color: '#4B5563', fontWeight: 600, fontFamily: '"Sora", sans-serif' }}>
                We’re here to help and answer your questions
              </Typography>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={8} alignItems="flex-start">
          <Grid item xs={12} md={7}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B1F3B', mb: 2, fontFamily: '"Sora", sans-serif' }}>
                Visit Us
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, fontSize: '1.1rem' }}>
                Find us on the map and drop by anytime during business hours.
              </Typography>
              <Box
                sx={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 30px 60px -30px rgba(0,0,0,0.2)',
                  background: '#ffffff',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 40px 80px -40px rgba(0,0,0,0.4)'
                  }
                }}
              >
                <Box
                  component="iframe"
                  title="ELS Learning Location"
                  src="https://maps.google.com/maps?q=18.167756638521258,74.58327539491177&z=16&ie=UTF8&iwloc=&output=embed"
                  sx={{ width: '100%', height: { xs: 300, md: 450 }, border: 0, display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Box>
              <Button
                component="a"
                href="https://www.google.com/maps?q=18.167756638521258,74.58327539491177"
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                sx={{ mt: 2, textTransform: 'none', color: '#B0125B', fontWeight: 700, px: 0, fontSize: '1rem', '&:hover': { background: 'transparent', color: '#0B1F3B' } }}
              >
                Open in Google Maps →
              </Button>
            </motion.div>
          </Grid>
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'stretch', md: 'flex-end' },
              position: 'relative'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ width: '100%', maxWidth: 380 }}
            >
              <Paper
                sx={{
                  '--card-x': { xs: '0', md: '20px' },
                  '--card-y': { xs: '0', md: '100px' },
                  transform: 'translate(var(--card-x), var(--card-y)) !important',
                  p: 4,
                  borderRadius: '24px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  boxShadow: '0 25px 50px -20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translate(var(--card-x), calc(var(--card-y) - 10px)) !important',
                    boxShadow: `0 35px 70px -25px ${alpha('#0B1F3B', 0.2)}`
                  }
                }}
              >
                <Stack spacing={3}>
                  <Box sx={{ 
                    width: 56, height: 56, borderRadius: '14px', 
                    bgcolor: alpha('#22C55E', 0.1), color: '#22C55E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <WhatsApp sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B1F3B', fontFamily: '"Sora", sans-serif' }}>
                    Chat with us on WhatsApp
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                    Tap the button below to start a conversation. Anyone can send a message to our team.
                  </Typography>
                  <Button
                    onClick={handleWhatsAppClick}
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: '#22C55E',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 800,
                      py: 2,
                      fontSize: '1.1rem',
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)',
                      '&:hover': { bgcolor: '#16A34A', boxShadow: '0 12px 24px rgba(34, 197, 94, 0.4)' }
                    }}
                  >
                    Message on WhatsApp
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      <Footer onNavigate={handleFooterLinkClick} />
    </Box>
  );
};

export default ContactPage;
