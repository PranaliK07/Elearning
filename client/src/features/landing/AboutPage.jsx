import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  Fade,
  Grow,
  Dialog,
  DialogContent,
  IconButton,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Close,
  Psychology,
  Speed,
  Security,
  AutoGraph,
  Dashboard
} from '@mui/icons-material';
import Footer from './Footer';
import SiteHeader from './SiteHeader';
import adminDashboard from '../../img/admin-dashboard.png';
import teacherDashboard from '../../img/teacher-dashboard.png';
import studentDashboard from '../../img/student-dashboard.png';
import aboutBg from '../../img/about-img.jpg';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const values = [
    {
      title: 'Student First',
      description: 'We design for clarity, confidence, and measurable learning outcomes.',
      icon: <Psychology />
    },
    {
      title: 'Teacher Empowered',
      description: 'We reduce admin work and give educators actionable insights.',
      icon: <Speed />
    },
    {
      title: 'Trust and Safety',
      description: 'We prioritize privacy, accessibility, and safe learning spaces.',
      icon: <Security />
    }
  ];

  const [openDashboard, setOpenDashboard] = React.useState(null);

  const handleFooterLinkClick = (target) => {
    if (target !== '/#features') {
    }
  };
  const roleModules = [
    { icon: <Psychology />, title: 'Student', items: ['Lessons & Topics', 'Quizzes & Practice', 'Progress Tracker'], color: brandNavy, bg: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' },
    { icon: <AutoGraph />, title: 'Teacher', items: ['Assignments & Feedback', 'Class Insights', 'Content Management'], color: brandPink, bg: 'linear-gradient(135deg, #ffffff 0%, #fff0f7 100%)' },
    { icon: <Dashboard />, title: 'Admin', items: ['User & Role Management', 'Reports & Analytics', 'System Settings'], color: brandNavyMid, bg: 'linear-gradient(135deg, #ffffff 0%, #f7f0ff 100%)' }
  ];

  const dashboardShots = [
    { src: studentDashboard, title: 'Student Dashboard' },
    { src: teacherDashboard, title: 'Teacher Dashboard' },
    { src: adminDashboard, title: 'Admin Dashboard' }
  ];

  const handleDashboardOpen = (src) => {
    setOpenDashboard(src);
  };

  const handleDashboardClose = () => {
    setOpenDashboard(null);
  };
  

  const brandNavy = '#0B1F3B';
  const brandNavyDark = '#08162B';
  const brandNavyMid = '#17325C';
  const brandPink = '#B0125B';
  const brandPinkDark = '#C2185B';
  const brandSoft = '#F4F5F9';

  return (
    <Box sx={{ bgcolor: '#ffffff', overflowX: 'hidden', fontFamily: '"Poppins", "Segoe UI", "Inter", system-ui, sans-serif' }}>
      <SiteHeader />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 12 },
          pb: { xs: 3, md: 5 },
          minHeight: { xs: '50vh', md: '60vh' },
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${aboutBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)',
            transform: 'scale(1.03)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11,31,59,0.32)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 15% 20%, ${alpha(brandNavy, 0.4)}, transparent 40%), radial-gradient(circle at 85% 75%, ${alpha(brandPink, 0.3)}, transparent 45%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid size={{ xs: 12, md: 10 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 900,
                      color: brandNavy,
                      fontSize: { xs: '3.5rem', sm: '4.5rem', md: '6rem' },
                      textAlign: 'center',
                      fontFamily: '"Fraunces", serif',
                      letterSpacing: '-2px',
                      lineHeight: 1,
                      mb: 2,
                      textShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                  >
                    About Us
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: alpha(brandNavy, 0.8),
                      fontWeight: 600,
                      maxWidth: 800,
                      textAlign: 'center',
                      mx: 'auto',
                      mt: 3,
                      fontFamily: '"Sora", sans-serif',
                      lineHeight: 1.6
                    }}
                  >
                    Empower your future with digital education
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Story */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${brandSoft} 0%, #FFFFFF 100%)`,
          pt: { xs: 6, md: 10 },
          pb: { xs: 3, md: 4 }
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, color: brandNavy, fontFamily: '"Fraunces", serif' }}>
                    Our Story
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#4B5563', mb: 3, fontSize: '1.2rem', lineHeight: 1.8 }}>
                    ELS started with a simple idea: give every student a clear, personalized learning
                    journey. Today, we partner with schools and families to deliver a platform that feels
                    modern, intuitive, and results-driven.
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#4B5563', fontSize: '1.2rem', lineHeight: 1.8 }}>
                    We focus on the essentials: lessons that stick, tools teachers love, and insights that
                    help parents stay informed.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Dashboards */}
      <Box sx={{ bgcolor: '#FFFFFF', pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: brandNavy }}>
              Dashboards Built for Clarity
            </Typography>
            <Typography variant="body1" sx={{ color: '#4B5563', maxWidth: 680, mx: 'auto' }}>
              Every role gets a focused view of progress and next steps.
            </Typography>
          </Box>
          <Grid container spacing={4} wrap="nowrap" sx={{ overflowX: 'auto', pb: 4, px: 1 }}>
            {dashboardShots.map((shot, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }} sx={{ minWidth: { xs: 300, md: 360 } }} key={shot.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDashboardOpen(shot.src)}
                    sx={{
                      height: '100%',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      border: '1px solid rgba(11,31,59,0.1)',
                      boxShadow: '0 20px 40px -20px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: `0 30px 60px -20px ${alpha(brandNavy, 0.3)}`,
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={shot.src}
                      alt={shot.title}
                      sx={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: brandNavy, fontFamily: '"Sora", sans-serif' }}>
                        {shot.title}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog
        open={Boolean(openDashboard)}
        onClose={handleDashboardClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleDashboardClose}
            aria-label="Close dashboard preview"
            sx={{
              position: 'absolute',
              top: -12,
              right: -12,
              bgcolor: '#111827',
              color: '#fff',
              '&:hover': { bgcolor: '#1F2937' }
            }}
          >
            <Close />
          </IconButton>
          {openDashboard && (
            <Box
              component="img"
              src={openDashboard}
              alt="Dashboard preview"
              sx={{
                width: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 2,
                background: '#0B1220'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Role Modules */}
      <Box sx={{ bgcolor: brandSoft, py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: brandNavy }}>
              Modules For Every Role
            </Typography>
            <Typography variant="body1" sx={{ color: '#4B5563', maxWidth: 700, mx: 'auto' }}>
              Purpose-built tools for students, teachers, and admins to keep learning clear and connected.
            </Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            {roleModules.map((role, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={role.title} sx={{ display: 'flex' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Card
                    sx={{
                      flexGrow: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '24px',
                      border: `1px solid ${alpha(role.color, 0.1)}`,
                      boxShadow: '0 15px 35px -15px rgba(0,0,0,0.1)',
                      background: role.bg,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: `0 25px 50px -20px ${alpha(role.color, 0.2)}`,
                        borderColor: alpha(role.color, 0.3)
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: role.color, fontFamily: '"Sora", sans-serif' }}>
                        {role.title}
                      </Typography>
                      <Box sx={{ 
                        width: 50, height: 50, borderRadius: '12px', mb: 3, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: alpha(role.color, 0.1), color: role.color
                      }}>
                        {React.cloneElement(role.icon, { sx: { fontSize: 28 } })}
                      </Box>
                      <Stack spacing={2} sx={{ alignItems: 'center' }}>
                        {role.items.map((item) => (
                          <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                            <CheckCircle sx={{ color: role.color, fontSize: 18, opacity: 0.7 }} />
                            <Typography variant="body1" sx={{ color: '#4B5563', fontWeight: 500, fontSize: '0.95rem' }}>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#FFFFFF', height: { xs: 24, md: 32 } }} />

      {/* Values */}
      <Box sx={{ bgcolor: brandSoft, pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: brandNavy }}>
              Our Values
            </Typography>
            <Typography variant="body1" sx={{ color: '#4B5563', maxWidth: 600, mx: 'auto' }}>
              The principles that guide everything we build.
            </Typography>
          </Box>
          <Grid container spacing={4} wrap="nowrap" sx={{ overflowX: 'auto', pb: 4, px: 1 }}>
            {values.map((value, idx) => (
              <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 320, display: 'flex' }} key={value.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Card
                    sx={{
                      flexGrow: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '24px',
                      border: '1px solid rgba(11,31,59,0.1)',
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px -20px ${alpha(brandNavy, 0.2)}`,
                        background: '#ffffff'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: brandNavy, fontFamily: '"Sora", sans-serif' }}>
                        {value.title}
                      </Typography>
                      <Box sx={{ 
                        width: 50, height: 50, borderRadius: '12px', mb: 2.5, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: alpha(brandNavy, 0.05), color: brandNavy
                      }}>
                        {React.cloneElement(value.icon, { sx: { fontSize: 26 } })}
                      </Box>
                      <Typography variant="body1" sx={{ color: '#4B5563', lineHeight: 1.6 }}>
                        {value.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Footer onNavigate={handleFooterLinkClick} />
    </Box>
  );
};

export default AboutPage;
