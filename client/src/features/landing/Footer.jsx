import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import {
  Instagram,
  LinkedIn,
  Facebook,
  Email,
  WhatsApp,
  LocationOn,
  Home,
  Info,
  Star,
  Contacts
} from '@mui/icons-material';
import elsLogo from '../../img/els-logo.png';

const footerLinks = [
  { label: 'Home', to: '/', icon: <Home fontSize="small" /> },
  { label: 'Features', to: '/#features', icon: <Star fontSize="small" /> },
  { label: 'About Us', to: '/about', icon: <Info fontSize="small" /> },
  { label: 'Contact Us', to: '/contact', icon: <Contacts fontSize="small" /> }
];

const Footer = ({ onNavigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const footerBg = '#0B1220';
  const footerText = '#E2E8F0';
  const footerMuted = '#C7D2FE';
  const footerAccent = '#A5B4FC';
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: footerBg,
        color: footerText,
        pt: { xs: 6, md: 9 },
        pb: { xs: 3, md: 4 },
        position: { xs: 'sticky', md: 'relative' },
        bottom: { xs: 0, md: 'auto' },
        zIndex: { xs: 10, md: 'auto' },
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 10%, rgba(102,126,234,0.25), transparent 40%), radial-gradient(circle at 85% 80%, rgba(118,75,162,0.2), transparent 40%)',
          opacity: isDark ? 0.9 : 0.25,
          pointerEvents: 'none'
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              component="img"
              src={elsLogo}
              alt="ELS Learning"
              sx={{
                height: 96,
                width: 'auto',
                mb: 0,
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))'
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: footerText, mb: 2 }}>
              E-Learning
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: footerText }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {footerLinks.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.to}
                  onClick={() => onNavigate?.(item.to)}
                  sx={{ color: footerMuted, p: 0, justifyContent: 'flex-start', textTransform: 'none', minWidth: 0, '&:hover': { color: footerText } }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'left', pl: { md: 3 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: footerText }}>
              Get In Touch
            </Typography>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                component="a"
                href="mailto:divinetechnologies8@gmail.com"
                sx={{ textDecoration: 'none' }}
              >
                <Email sx={{ fontSize: 18, color: footerAccent }} />
                <Typography variant="body2" sx={{ color: footerMuted }}>
                  divinetechnologies8@gmail.com
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                component="a"
                href="https://wa.me/917387275947"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <WhatsApp sx={{ fontSize: 18, color: '#22C55E' }} />
                <Typography variant="body2" sx={{ color: footerMuted }}>
                  WhatsApp
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                component="a"
                href="https://www.google.com/maps?q=18.167756638521258,74.58327539491177"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <LocationOn sx={{ fontSize: 18, color: footerAccent }} />
                <Typography variant="body2" sx={{ color: footerMuted }}>
                  Pragati Nagar, Baramati
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: footerText }}>
              Social Links
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <IconButton
                component="a"
                href="https://www.instagram.com/divinetechnologys?igsh=MTZ1OTZhbDhhaXhhNA=="
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: footerAccent, bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { color: footerText, bgcolor: 'rgba(255,255,255,0.14)' } }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                component="a"
                href="https://www.linkedin.com/company/divine-technologies-baramati/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: footerAccent, bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { color: footerText, bgcolor: 'rgba(255,255,255,0.14)' } }}
              >
                <LinkedIn />
              </IconButton>
              <IconButton
                component="a"
                href="https://www.facebook.com/share/1EGAQW2sxD/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: footerAccent, bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { color: footerText, bgcolor: 'rgba(255,255,255,0.14)' } }}
              >
                <Facebook />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(2,6,23,0.1)' }} />
        <Typography variant="caption" sx={{ color: footerAccent, textAlign: 'center', display: 'block', width: '100%' }}>
          © {new Date().getFullYear()} ELS Learning. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
