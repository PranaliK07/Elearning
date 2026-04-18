import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Star,
  StarBorder,
  WorkspacePremium,
  Download,
  CardMembership,
  Lock
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Confetti from 'react-confetti';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [dailyGoal, setDailyGoal] = useState({ goals: [], starsEarned: 0 });
  const [loading, setLoading] = useState(true);

  // Mock Certificates - Represents monthly progress rewards
  const certificates = [
    { id: 1, month: 'April 2024', title: 'Stellar Student Award', stars: 45, totalStars: 50, earned: true },
    { id: 2, month: 'May 2024', title: 'Creative Explorer Award', stars: 12, totalStars: 60, earned: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/achievements/daily-goal');
      if (res.data.success) {
        setDailyGoal(res.data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certTitle) => {
    // Generate a simple text-based "certificate" as a blob to simulate real download
    const content = `
      CERTIFICATE OF ACHIEVEMENT
      --------------------------
      This certifies that 
      
      [ STUDENT NAME ]
      
      has successfully earned the 
      ${certTitle.toUpperCase()}
      
      for their outstanding dedication and 
      daily star achievements in the 
      E-Learning Platform.
      
      Keep up the great work!
      --------------------------
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const renderStars = (count, total = 5, size = 30) => {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {[...Array(total)].map((_, i) => (
          i < count ? 
          <Star key={i} sx={{ color: '#FFD93D', fontSize: size, filter: 'drop-shadow(0 0 5px #FFD93D)' }} /> : 
          <StarBorder key={i} sx={{ color: 'rgba(255,255,255,0.2)', fontSize: size }} />
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Continuous Gentle Falling Stars Effect */}
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' }}>
          <Confetti 
            recycle={dailyGoal.starsEarned < 5} 
            numberOfPieces={dailyGoal.starsEarned === 5 ? 400 : 30} 
            gravity={dailyGoal.starsEarned === 5 ? 0.15 : 0.05}
            colors={['#FFD93D', '#FFC107', '#FFA000']}
            drawShape={(ctx) => {
              const numPoints = 5;
              const outerRadius = 8;
              const innerRadius = 4;
              ctx.beginPath();
              for (let i = 0; i < numPoints * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / numPoints) * i;
                const x = Math.sin(angle) * radius;
                const y = Math.cos(angle) * radius;
                ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.fill();
            }}
          />
        </Box>

        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{
              background: 'linear-gradient(45deg, #FFD93D 30%, #FF8400 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {user?.name?.split(' ')[0] || 'Student'} you get {dailyGoal.starsEarned > 0 ? '⭐'.repeat(dailyGoal.starsEarned) : '⭐'} today .
          </Typography>
          <Typography variant="h6" color="textSecondary" fontWeight="600">
            {dailyGoal.starsEarned === 5 
              ? 'Great job! 🌟 You have completed all missions for today.' 
              : 'Earn 5 stars every day to win your monthly certificate!'}
          </Typography>
        </Box>

        {/* 1. STARS SECTION - Daily Missions */}
        <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Star sx={{ mr: 1, color: '#FFD93D' }} /> Daily Mission Control
        </Typography>

        <Paper sx={{ 
          p: 4, 
          mb: 8, 
          borderRadius: 6, 
          background: 'linear-gradient(135deg, #B0125B 0%, #0B1F3B 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 40px rgba(11, 31, 59, 0.4)'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h5" fontWeight="800">Your Progress Today</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Collect all 5 stars to unlock the best certificates!</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)', p: 1.5, borderRadius: 4, minWidth: 200 }}>
                {renderStars(dailyGoal.starsEarned, 5, 32)}
                <Typography variant="caption" sx={{ fontWeight: 900, mt: 0.5, display: 'block', color: '#FFD93D' }}>
                  {dailyGoal.starsEarned === 5 ? 'MAX STAR POWER! 🚀' : `${dailyGoal.starsEarned}/5 STARS EARNED`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'nowrap', 
              overflowX: 'auto', 
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 }
            }}>
              {(dailyGoal.goals || []).map((goal) => (
                <Box key={goal.id} sx={{ flex: '1 1 0', minWidth: { xs: 120, md: 'auto' } }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 4, 
                    bgcolor: goal.completed ? 'rgba(255, 217, 61, 0.15)' : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${goal.completed ? '#FFD93D' : 'rgba(255,255,255,0.15)'}`,
                    textAlign: 'center',
                    height: '100%'
                  }}>
                    <motion.div animate={goal.completed ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 2.5 }}>
                      {goal.completed ? (
                        <Star sx={{ fontSize: 40, color: '#FFD93D', mb: 1, filter: 'drop-shadow(0 0 10px #FFD93D)' }} />
                      ) : (
                        <StarBorder sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                      )}
                    </motion.div>
                    <Typography variant="subtitle2" fontWeight="800">{goal.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 700, fontSize: '0.6rem', display: 'block' }}>
                        {goal.completed ? 'DONE ✨' : 'PENDING'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
        </Paper>

        {/* 2. CERTIFICATE SECTION - Monthly Progress */}
        <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <WorkspacePremium sx={{ mr: 1, color: '#FF6B6B' }} /> Your Certificates
        </Typography>

        <Grid container spacing={4}>
          {certificates.map((cert) => (
            <Grid item xs={12} md={6} key={cert.id}>
              <Card sx={{ 
                borderRadius: 5, 
                border: cert.earned ? '2px solid #FFD93D' : '1px solid rgba(0,0,0,0.05)',
                boxShadow: cert.earned ? '0 10px 30px rgba(255, 217, 61, 0.2)' : 'none',
                opacity: cert.earned ? 1 : 0.8,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                    p: 3, 
                    background: cert.earned ? 'linear-gradient(45deg, #FFF9C4 0%, #FFFDE7 100%)' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                }}>
                    <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: cert.earned ? '#FFD93D' : '#e0e0e0',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <CardMembership sx={{ fontSize: 40, color: cert.earned ? 'white' : 'grey.600' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" fontWeight="800" color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            {cert.month}
                        </Typography>
                        <Typography variant="h6" fontWeight="900" sx={{ mb: 0.5 }}>{cert.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {cert.earned ? 'Earned! Download your prize.' : `Need ${cert.totalStars - cert.stars} more stars to unlock!`}
                        </Typography>
                    </Box>
                </Box>
                <CardContent sx={{ bgcolor: 'white' }}>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" fontWeight="800">Stars Progress</Typography>
                            <Typography variant="caption" fontWeight="800">{cert.stars}/{cert.totalStars}</Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={(cert.stars / cert.totalStars) * 100} 
                            sx={{ 
                                height: 10, 
                                borderRadius: 5,
                                bgcolor: '#f0f0f0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: cert.earned ? '#FFD93D' : '#4ECDC4'
                                }
                            }}
                        />
                    </Box>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        disabled={!cert.earned}
                        startIcon={cert.earned ? <Download /> : <Lock />}
                        onClick={() => handleDownload(cert.title)}
                        sx={{ 
                            borderRadius: 3, 
                            fontWeight: 800,
                            py: 1,
                            background: cert.earned ? 'linear-gradient(45deg, #FFD93D 0%, #FF8400 100%)' : '#e0e0e0',
                            boxShadow: cert.earned ? '0 4px 15px rgba(255, 132, 0, 0.3)' : 'none',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #FFCA28 0%, #F57C00 100%)'
                            }
                        }}
                    >
                        {cert.earned ? 'Download Certificate' : 'Locked'}
                    </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, p: 4, textAlign: 'center', bgcolor: '#f0f7ff', borderRadius: 6, border: '2px dashed #4ECDC4' }}>
            <Typography variant="body1" fontWeight="700" color="primary">
                🎓 Keep studying every day! Top students get a physical certificate mailed home!
            </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default AchievementsPage;
