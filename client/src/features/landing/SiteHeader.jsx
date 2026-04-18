import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  Email,
  LocationOn,
  WhatsApp,
  Menu as MenuIcon,
  Close,
  Home,
  Info,
  Contacts,
  Login,
  Dashboard
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import elsLogo from '../../img/els-logo.png';

const SiteHeader = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'About', path: '/about', icon: <Info /> },
    { label: 'Contact', path: '/contact', icon: <Contacts /> },
  ];
  return (
    <>
      {/* Top Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: { xs: 'auto', md: 36 },
          py: { xs: 0.5, md: 0 },
          bgcolor: '#0B1220',
          color: 'white',
          zIndex: (t) => t.zIndex.appBar + 1,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={{ xs: 1.5, md: 3 }}
            alignItems="center"
            justifyContent={isSmall ? "center" : "flex-start"}
            sx={{
              fontSize: '0.75rem',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              component="a"
              href="https://www.google.com/maps?q=18.167756638521258,74.58327539491177"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
            >
              <LocationOn sx={{ fontSize: 14, color: '#9CA3AF' }} />
              <Typography variant="caption" sx={{ color: '#E5E7EB', display: { xs: 'none', sm: 'block' } }}>
                Pragati Nagar
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              component="a"
              href="mailto:divinetechnologies8@gmail.com"
              sx={{ textDecoration: 'none', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
            >
              <Email sx={{ fontSize: 14, color: '#9CA3AF' }} />
              <Typography variant="caption" sx={{ color: '#E5E7EB' }}>
                divinetechnologies8@gmail.com
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              component="a"
              href="https://wa.me/917387275947"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
            >
              <WhatsApp sx={{ fontSize: 14, color: '#9CA3AF' }} />
              <Typography variant="caption" sx={{ color: '#E5E7EB' }}>
                WhatsApp
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          top: { xs: 28, md: 36 },
          bgcolor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid' : 'none',
          borderColor: 'rgba(0,0,0,0.05)',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
          zIndex: (t) => t.zIndex.appBar
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 70 } }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover img': { transform: 'scale(1.03)' }
              }}
            >
              <Box
                component="img"
                src={elsLogo}
                alt="ELS Learning"
                sx={{
                  height: { xs: 40, md: 60 },
                  width: 'auto',
                  transition: 'transform 0.25s ease'
                }}
              />
              <Typography
                sx={{
                  ml: 0.35,
                  fontWeight: 800,
                  color: '#0B1F3B',
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                E-Learning
              </Typography>
            </Box>

            {!isMobile ? (
              <Stack direction="row" spacing={1} alignItems="center">
                 {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    component={NavLink}
                    to={link.path}
                    end={link.path === '/'}
                    startIcon={React.cloneElement(link.icon, { sx: { fontSize: 18 } })}
                    sx={{
                      color: '#1F2937',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2,
                      '&:hover': { color: '#B0125B', bgcolor: 'rgba(176,18,91,0.04)' },
                      '&.active': {
                        color: '#B0125B',
                        fontWeight: 800
                      }
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
                {user ? (
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    startIcon={<Dashboard sx={{ fontSize: 18 }} />}
                    sx={{
                      ml: 1,
                      background: 'linear-gradient(135deg, #0B1F3B 0%, #B0125B 100%)',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: '50px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #08162B 0%, #C2185B 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 15px rgba(11,31,59,0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    startIcon={<Login sx={{ fontSize: 18 }} />}
                    sx={{
                      ml: 1,
                      background: 'linear-gradient(135deg, #0B1F3B 0%, #B0125B 100%)',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: '50px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #08162B 0%, #C2185B 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 15px rgba(11,31,59,0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Login
                  </Button>
                )}
              </Stack>
            ) : (
              <IconButton color="inherit" onClick={toggleDrawer(true)} sx={{ color: '#1F2937' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: { width: 280, p: 2 }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">Menu</Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <Close />
          </IconButton>
        </Box>
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton component={Link} to={link.path} onClick={toggleDrawer(false)} sx={{ borderRadius: 2, mb: 1 }}>
                <Box sx={{ mr: 2, color: 'primary.main' }}>{link.icon}</Box>
                <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding>
            {user ? (
              <ListItemButton
                component={Link}
                to="/dashboard"
                onClick={toggleDrawer(false)}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <Box sx={{ mr: 2 }}><Dashboard /></Box>
                <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            ) : (
              <ListItemButton
                component={Link}
                to="/login"
                onClick={toggleDrawer(false)}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <Box sx={{ mr: 2 }}><Login /></Box>
                <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            )}
          </ListItem>
        </List>
      </Drawer>

      <Box sx={{ height: { xs: 56, md: 70 } }} />
      <Box sx={{ height: { xs: scrolled ? 0 : 28, md: scrolled ? 0 : 36 } }} />
    </>
  );
};

export default SiteHeader;
