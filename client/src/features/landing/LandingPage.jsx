import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  alpha,
  Fade,
  Grow,
  Dialog,
  DialogContent,
  IconButton,
  useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AutoGraph,
  MenuBook,
  EmojiEvents,
  SupportAgent,
  PlayCircleOutline,
  CheckCircle,
  Security,
  Speed,
  Psychology,
  ArrowForward,
  Dashboard,
  Timeline,
  WhatsApp,
  Email,
  Close
} from '@mui/icons-material';
import bgHeader from '../../img/bg-header.jpg';
import adminDashboard from '../../img/admin-dashboard.png';
import teacherDashboard from '../../img/teacher-dashboard.png';
import studentDashboard from '../../img/student-dashboard.png';
import Footer from './Footer';
import SiteHeader from './SiteHeader';

const LandingPage = () => {
  const [contactAnchorEl, setContactAnchorEl] = useState(null);
  const [openDashboard, setOpenDashboard] = useState(null);
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (location.hash === '#features') {
      const target = document.getElementById('features');
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
  }, [location.hash]);

  const isContactMenuOpen = Boolean(contactAnchorEl);
  const handleOpenContactMenu = (event) => {
    setContactAnchorEl(event.currentTarget);
  };
  const handleCloseContactMenu = () => {
    setContactAnchorEl(null);
  };
  const handleFooterLinkClick = (target) => {
    if (target !== '/#features') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };

  const brandNavy = '#0B1F3B';
  const brandNavyDark = '#08162B';
  const brandNavyMid = '#17325C';
  const brandPink = '#B0125B';
  const brandPinkDark = '#C2185B';
  const brandPinkMid = '#A41457';
  const brandNavySoft = '#F4F5F9';
  const cardBaseBg = 'linear-gradient(180deg, #FFFFFF 0%, #F6F7FB 100%)';
  const cardHoverBg = 'linear-gradient(180deg, #E9ECF5 0%, #DDE2F0 100%)';
  const cardHoverShadow = '0 22px 44px -18px rgba(11,31,59,0.45)';
  const sectionBg = isDark ? '#0F172A' : brandNavySoft;
  const sectionCardBg = isDark ? 'linear-gradient(180deg, #0F172A 0%, #111827 100%)' : cardBaseBg;
  const sectionCardHoverBg = isDark ? 'linear-gradient(180deg, #111827 0%, #1F2937 100%)' : cardHoverBg;
  const sectionTextPrimary = isDark ? '#F8FAFC' : '#111827';
  const sectionTextSecondary = isDark ? '#CBD5E1' : '#6B7280';
  const heroTextColor = isDark ? '#F8FAFC' : brandNavy;
  const heroSubColor = isDark ? alpha('#F8FAFC', 0.85) : alpha(brandNavy, 0.9);
  const heroChipBg = isDark ? alpha('#FFFFFF', 0.2) : alpha(brandNavy, 0.12);
  const heroChipColor = isDark ? '#FFFFFF' : brandNavy;

  // Features data - properly structured
  const featuresData = {
    forStudents: [
      { icon: <Psychology />, title: 'Guided Learning Paths', description: 'Follow a clear path from grade to subject to topic with focused lessons.', color: brandNavy },
      { icon: <Speed />, title: 'Quizzes and Practice', description: 'Check understanding with quick quizzes and practice activities.', color: brandPink },
      { icon: <EmojiEvents />, title: 'Achievements and Goals', description: 'Track progress and celebrate milestones as you learn.', color: brandNavyMid }
    ],
    forTeachers: [
      { icon: <Dashboard />, title: 'Progress Dashboard', description: 'See class progress, strengths, and gaps at a glance.', color: brandPink },
      { icon: <AutoGraph />, title: 'Home Work and Feedback', description: 'Create home work, review submissions, and share feedback.', color: brandNavy },
      { icon: <MenuBook />, title: 'Content Management', description: 'Organize content by grade, subject, and topic for easy access.', color: brandPinkMid }
    ],
    forParents: [
      { icon: <Timeline />, title: 'Progress Updates', description: 'Follow learning activity and growth over time.', color: brandNavy },
      { icon: <Security />, title: 'Privacy and Safety', description: 'Clear, secure access with family-friendly controls.', color: brandPink },
      { icon: <SupportAgent />, title: 'Reports and Communication', description: 'View reports and stay connected with teachers.', color: brandNavyMid }
    ]
  };

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



  // Navigation items
  

  return (
    <Box sx={{ bgcolor: isDark ? '#0B1220' : '#ffffff', overflowX: 'hidden' }}>
      <SiteHeader />

      {/* Hero Section */}
      <Box sx={{ 
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 'calc(100vh - 88px)', md: 'calc(100vh - 100px)' },
        display: 'flex',
        alignItems: 'center',
        pt: { xs: 6, md: 10 },
        pb: { xs: 6, md: 10 }
      }}>
        <Box
          component={motion.div}
          animate={{ scale: [1.05, 1.15, 1.05], rotate: [0, 1, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgHeader})`,
            backgroundSize: 'cover',
            backgroundPosition: { xs: 'center top', md: 'center' },
            backgroundRepeat: 'no-repeat',
            filter: 'blur(1px)',
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
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            '& .hero-orb': {
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(60px)',
              opacity: 0.5,
            },
            '& .orb-1': {
              width: { xs: 250, md: 500 },
              height: { xs: 250, md: 500 },
              top: '-10%',
              left: '-10%',
              background: `radial-gradient(circle, ${alpha('#FFFFFF', 0.8)}, transparent 70%)`,
            },
            '& .orb-2': {
              width: { xs: 300, md: 600 },
              height: { xs: 300, md: 600 },
              bottom: '-15%',
              right: '-10%',
              background: `radial-gradient(circle, ${alpha(brandPink, 0.4)}, transparent 70%)`,
            },
            '& .orb-3': {
              width: { xs: 200, md: 400 },
              height: { xs: 200, md: 400 },
              top: '20%',
              right: '10%',
              background: `radial-gradient(circle, ${alpha(brandNavy, 0.4)}, transparent 70%)`,
            }
          }}
        >
          <motion.div 
            animate={{ 
              x: [0, 20, 0], 
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }} 
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="hero-orb orb-1" 
          />
          <motion.div 
            animate={{ 
              x: [0, -30, 0], 
              y: [0, 20, 0],
              scale: [1, 1.05, 1]
            }} 
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="hero-orb orb-2" 
          />
          <motion.div 
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 15, 0],
              opacity: [0.3, 0.5, 0.3]
            }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="hero-orb orb-3" 
          />
        </Box>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={9}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                        fontWeight: 900,
                        color: heroTextColor,
                        lineHeight: 1.1,
                        mb: 3,
                        textAlign: 'center',
                        fontFamily: '"Fraunces", serif',
                        letterSpacing: '-1.5px',
                        textShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      Transform Learning Into
                      <Box component="span" sx={{ 
                        display: 'block', 
                        backgroundImage: `linear-gradient(45deg, ${brandPink}, #FF6B6B)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        pb: 1
                      }}>
                        An Adventure
                      </Box>
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                        color: heroSubColor,
                        mb: 5,
                        lineHeight: 1.6,
                        textAlign: 'center',
                        maxWidth: 800,
                        mx: 'auto',
                        fontWeight: 500,
                        fontFamily: '"Sora", sans-serif'
                      }}
                    >
                      Personalized learning platform that adapts to each student's pace.
                      Built to make learning clearer, calmer, and more rewarding.
                    </Typography>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={3}
                      justifyContent="center"
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="contained"
                          size="large"
                          component={Link}
                          to="/register"
                          sx={{
                            bgcolor: brandPink,
                            color: '#ffffff',
                            px: 5,
                            py: 2,
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            boxShadow: `0 8px 24px ${alpha(brandPink, 0.4)}`,
                            '&:hover': {
                              bgcolor: brandPinkDark,
                              boxShadow: `0 12px 32px ${alpha(brandPink, 0.6)}`,
                            },
                            transition: 'all 0.3s'
                          }}
                          endIcon={<ArrowForward />}
                        >
                          Start Free Trial
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outlined"
                          size="large"
                          component={Link}
                          to="/about"
                          sx={{
                            borderColor: alpha(heroTextColor, 0.5),
                            color: heroTextColor,
                            backdropFilter: 'blur(10px)',
                            bgcolor: alpha('#ffffff', 0.1),
                            px: 5,
                            py: 2,
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            '&:hover': {
                              borderColor: heroTextColor,
                              bgcolor: alpha('#ffffff', 0.2),
                            }
                          }}
                          startIcon={<PlayCircleOutline />}
                        >
                          Learn More
                        </Button>
                      </motion.div>
                    </Stack>
                  </Box>
                </motion.div>
            </Grid>
          </Grid>

        </Container>
      </Box>

      {/* Features Section */}
      <Box
        id="features"
        sx={{
          position: 'relative',
          py: { xs: 7, md: 11 },
          background: sectionBg,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(11,31,59,0.18), transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -160,
            left: -140,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(176,18,91,0.16), transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="? Amazing Features"
              sx={{
                bgcolor: alpha(brandNavy, 0.12),
                color: brandNavy,
                mb: 2,
                fontWeight: 700
              }}
            />
            <Typography variant="h3" sx={{ fontSize: { xs: '1.9rem', md: '2.6rem' }, fontWeight: 800, mb: 2, color: sectionTextPrimary }}>
              Everything You Need to
              <Box component="span" sx={{ background: `linear-gradient(135deg, ${brandNavy} 0%, ${brandPink} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                {' '}Succeed
              </Box>
            </Typography>
            <Typography variant="body1" sx={{ color: sectionTextSecondary, maxWidth: 620, mx: 'auto' }}>
              Modern tools that keep learning clear, connected, and measurable.
            </Typography>
          </Box>

        {/* For Students Section */}
          <Box
            sx={{
              mb: 8,
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(11,31,59,0.14) 0%, rgba(11,31,59,0.04) 100%)',
              border: '1px solid rgba(11,31,59,0.22)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: sectionTextPrimary, textAlign: 'center' }}>
              For Students
            </Typography>
          <Grid
            container
            spacing={3}
            wrap="nowrap"
            sx={{ overflowX: 'auto', pb: 1 }}
          >
            {featuresData.forStudents.map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ minWidth: 280, display: 'flex' }} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      height: '100%',
                      '&:hover .feature-card': {
                        transform: 'translateY(-12px)',
                        boxShadow: `0 30px 60px -15px ${alpha(brandNavy, 0.3)}`,
                        borderColor: alpha(brandNavy, 0.4)
                      }
                    }}
                  >
                      <Card
                        className="feature-card"
                        sx={{
                          height: '100%',
                          borderRadius: '24px',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.8))'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(243, 244, 246, 0.8))',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 10px 40px -20px rgba(0,0,0,0.1)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: sectionTextPrimary, fontFamily: '"Sora", sans-serif' }}>{feature.title}</Typography>
                          <Box sx={{ 
                            width: 64, 
                            height: 64, 
                            borderRadius: '16px', 
                            background: `linear-gradient(135deg, ${alpha(feature.color, 0.15)}, ${alpha(feature.color, 0.05)})`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            mb: 2, 
                            mx: 'auto',
                            color: feature.color,
                            boxShadow: `inset 0 0 0 1px ${alpha(feature.color, 0.2)}`
                          }}>
                            {React.cloneElement(feature.icon, { sx: { fontSize: 32 } })}
                          </Box>
                          <Typography variant="body2" sx={{ color: sectionTextSecondary, lineHeight: 1.7, fontSize: '0.95rem' }}>{feature.description}</Typography>
                        </CardContent>
                      </Card>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* For Teachers Section */}
          <Box
            sx={{
              mb: 8,
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(176,18,91,0.16) 0%, rgba(176,18,91,0.05) 100%)',
              border: '1px solid rgba(176,18,91,0.22)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: sectionTextPrimary, textAlign: 'center' }}>
              For Teachers
            </Typography>
          <Grid
            container
            spacing={3}
            wrap="nowrap"
            sx={{ overflowX: 'auto', pb: 1 }}
          >
            {featuresData.forTeachers.map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ minWidth: 280, display: 'flex' }} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      height: '100%',
                      '&:hover .feature-card': {
                        transform: 'translateY(-12px)',
                        boxShadow: `0 30px 60px -15px ${alpha(brandPink, 0.3)}`,
                        borderColor: alpha(brandPink, 0.4)
                      }
                    }}
                  >
                    <Card
                      className="feature-card"
                      sx={{
                        height: '100%',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.8))'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(243, 244, 246, 0.8))',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 10px 40px -20px rgba(0,0,0,0.1)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        position: 'relative',
                        overflow: 'hidden'
                        }}
                      >
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: sectionTextPrimary, fontFamily: '"Sora", sans-serif' }}>{feature.title}</Typography>
                      <Box sx={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: '16px', 
                        background: `linear-gradient(135deg, ${alpha(feature.color, 0.15)}, ${alpha(feature.color, 0.05)})`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mb: 2, 
                        mx: 'auto',
                        color: feature.color,
                        boxShadow: `inset 0 0 0 1px ${alpha(feature.color, 0.2)}`
                      }}>
                        {React.cloneElement(feature.icon, { sx: { fontSize: 32 } })}
                      </Box>
                      <Typography variant="body2" sx={{ color: sectionTextSecondary, lineHeight: 1.7, fontSize: '0.95rem' }}>{feature.description}</Typography>
                    </CardContent>
                    </Card>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* For Parents Section */}
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(11,31,59,0.12) 0%, rgba(11,31,59,0.04) 100%)',
              border: '1px solid rgba(11,31,59,0.22)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: sectionTextPrimary, textAlign: 'center' }}>
              For Parents
            </Typography>
          <Grid
            container
            spacing={3}
            wrap="nowrap"
            sx={{ overflowX: 'auto', pb: 1 }}
          >
            {featuresData.forParents.map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ minWidth: 280, display: 'flex' }} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      '&:hover .feature-card': {
                        transform: 'translateY(-12px)',
                        boxShadow: `0 30px 60px -15px ${alpha(brandNavy, 0.3)}`,
                        borderColor: alpha(brandNavy, 0.4)
                      }
                    }}
                  >
                    <Card
                      className="feature-card"
                      sx={{
                        height: '100%',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.8))'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(243, 244, 246, 0.8))',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 10px 40px -20px rgba(0,0,0,0.1)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        position: 'relative',
                        overflow: 'hidden'
                        }}
                      >
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: sectionTextPrimary, fontFamily: '"Sora", sans-serif' }}>{feature.title}</Typography>
                      <Box sx={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: '16px', 
                        background: `linear-gradient(135deg, ${alpha(feature.color, 0.15)}, ${alpha(feature.color, 0.05)})`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mb: 2, 
                        mx: 'auto',
                        color: feature.color,
                        boxShadow: `inset 0 0 0 1px ${alpha(feature.color, 0.2)}`
                      }}>
                        {React.cloneElement(feature.icon, { sx: { fontSize: 32 } })}
                      </Box>
                      <Typography variant="body2" sx={{ color: sectionTextSecondary, lineHeight: 1.7, fontSize: '0.95rem' }}>{feature.description}</Typography>
                    </CardContent>
                    </Card>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Dashboards Preview */}
          <Box
            sx={{
              mt: 8,
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(11,31,59,0.14) 0%, rgba(176,18,91,0.06) 100%)',
              border: '1px solid rgba(11,31,59,0.2)'
            }}
          >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Dashboards That Drive Decisions
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 720, mx: 'auto' }}>
              Clear, role-based dashboards for students, teachers, and admins.
            </Typography>
          </Box>
          <Grid container spacing={4} wrap="nowrap" sx={{ overflowX: 'auto', pb: 4, px: 1 }}>
            {dashboardShots.map((shot, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ minWidth: { xs: 300, md: 360 }, display: 'flex' }} key={shot.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDashboardOpen(shot.src)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 40px -20px rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px) scale(1.02)',
                        boxShadow: `0 30px 60px -20px ${alpha(brandNavy, 0.4)}`,
                        '& .preview-overlay': { opacity: 1 }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                      <Box
                        component="img"
                        src={shot.src}
                        alt={shot.title}
                        sx={{
                          width: '100%',
                          height: 220,
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.5s ease'
                        }}
                      />
                      <Box 
                        className="preview-overlay"
                        sx={{ 
                          position: 'absolute', 
                          inset: 0, 
                          bgcolor: alpha(brandNavy, 0.4), 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <Button 
                          variant="contained" 
                          sx={{ 
                            bgcolor: '#ffffff', 
                            color: brandNavy,
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#f0f0f0' }
                          }}
                        >
                          View Full Preview
                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: sectionTextPrimary, fontFamily: '"Sora", sans-serif' }}>
                        {shot.title}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* System Flow - Improved Design with Line Format */}
          <Box
            sx={{
              mt: 8,
              p: { xs: 1.25, md: 1.75 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(11,31,59,0.12) 0%, rgba(176,18,91,0.08) 100%)',
              border: '1px solid rgba(11,31,59,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
          {/* Decorative elements */}
          <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(11,31,59,0.14), transparent)',
                pointerEvents: 'none'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(176,18,91,0.12), transparent)',
                pointerEvents: 'none'
              }}
            />

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Chip
              label="?? Platform Workflow"
              sx={{
                bgcolor: alpha(brandPink, 0.12),
                color: brandPink,
                mb: 1.5,
                fontWeight: 700
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              How It Works
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 720, mx: 'auto' }}>
              A seamless journey from start to success
            </Typography>
          </Box>

          {/* Timeline Flow - Modern Animated Design */}
          <Box sx={{ 
            position: 'relative',
            py: 6,
            px: { xs: 2, md: 4 },
          }}>
            <Grid container spacing={4} justifyContent="center">
              {[
                { step: 1, title: 'Registration', desc: 'Sign up as Student, Teacher, or Parent', color: brandNavy },
                { step: 2, title: 'System Setup', desc: 'Configure classes, subjects & topics', color: brandPink },
                { step: 3, title: 'Learning Journey', desc: 'Access lessons, quizzes & home work', color: brandNavyMid },
                { step: 4, title: 'Track Progress', desc: 'Analytics, reports & achievements', color: brandPinkDark }
              ].map((item, idx, arr) => (
                <Grid item xs={12} sm={6} md={3} key={item.step}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.2 }}
                  >
                    <Box sx={{ textAlign: 'center', position: 'relative' }}>
                      {/* Step Number Circle */}
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '24px',
                        background: `linear-gradient(135deg, ${item.color}, ${alpha(item.color, 0.8)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#ffffff',
                        fontSize: '2rem',
                        fontWeight: 900,
                        boxShadow: `0 12px 24px ${alpha(item.color, 0.3)}`,
                        position: 'relative',
                        zIndex: 2,
                        transform: 'rotate(-5deg)',
                        '&:hover': {
                          transform: 'rotate(0deg) scale(1.1)',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }
                      }}>
                        {item.step}
                      </Box>

                      {/* Connecting Line (Only for desktop) */}
                      {idx < arr.length - 1 && (
                        <Box sx={{ 
                          display: { xs: 'none', md: 'block' },
                          position: 'absolute',
                          top: 40,
                          left: 'calc(50% + 40px)',
                          right: 'calc(-50% + 40px)',
                          height: 2,
                          background: `linear-gradient(90deg, ${item.color}, ${arr[idx+1].color})`,
                          zIndex: 1,
                          opacity: 0.4
                        }} />
                      )}

                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: sectionTextPrimary, fontFamily: '"Sora", sans-serif' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: sectionTextSecondary, lineHeight: 1.6, maxWidth: 200, mx: 'auto' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Optional: Alternative vertical timeline for mobile */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 3 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', textAlign: 'center', display: 'block' }}>
              ? Scroll to see full workflow ?
            </Typography>
          </Box>

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
        </Container>
      </Box>




      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${brandNavy} 0%, ${brandPink} 100%)`,
          backgroundSize: '200% 200%',
          animation: 'ctaShift 14s ease infinite',
          py: { xs: 6, md: 8 },
          mb: { xs: 4, md: 6 },
          '@keyframes ctaShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none'
          }
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              Ready to Transform Learning?
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#FFFFFF', 0.9), mb: 4 }}>
              Bring your students, teachers, and families onto a platform built for growth
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/register"
                sx={{ bgcolor: brandPink, color: brandNavy, px: 4, py: 1.5, textTransform: 'none', fontWeight: 700, borderRadius: '50px', '&:hover': { bgcolor: brandPinkDark } }}
              >
                Free Demo
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleOpenContactMenu}
                sx={{ borderColor: 'white', color: 'white', px: 4, py: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: '50px' }}
              >
                Contact Sales
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Menu
        anchorEl={contactAnchorEl}
        open={isContactMenuOpen}
        onClose={handleCloseContactMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 220,
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.08)'
          }
        }}
      >
        <MenuItem
          component="a"
          href="https://wa.me/917387275947"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCloseContactMenu}
          sx={{ gap: 1.5 }}
        >
          <WhatsApp sx={{ fontSize: 18, color: '#22C55E' }} />
          WhatsApp
        </MenuItem>
      </Menu>

      <Footer onNavigate={handleFooterLinkClick} />
    </Box>
  );
};

export default LandingPage;
