import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Psychology as PsychologyIcon, 
  PlayArrow, 
  AccessTime, 
  School 
} from '@mui/icons-material';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const PlayHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableQuizzes = useCallback(async () => {
    try {
      setLoading(true);

      const [contentRes, quizRes] = await Promise.all([
        api.get('/api/content'),
        api.get('/api/quiz/available')
      ]);
      
      const quizList = Array.isArray(quizRes.data) ? quizRes.data : (quizRes.data.quizzes || []);
      setQuizzes(quizList);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAvailableQuizzes();
    
    // Scroll to quizzes if hash is present
    if (location.hash === '#quizzes') {
        const element = document.getElementById('quizzes-section');
        if (element) {
            setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 500);
        }
    }
  }, [fetchAvailableQuizzes, location.hash]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Play & Practice
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Reinforce your knowledge through interactive assessments and quizzes.
        </Typography>
      </Box>

      {/* Quizzes Section */}
      <Box id="quizzes-section">
        {loading ? (
            <Box sx={{ textAlign: 'center' }} py={8}><CircularProgress /></Box>
        ) : quizzes.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)', border: '2px dashed rgba(0,0,0,0.1)' }}>
                <Typography variant="h6" color="textSecondary">No new quizzes available starting soon!</Typography>
                <Typography variant="body2" color="textSecondary">Ask your teacher to upload a quiz to see it here.</Typography>
            </Paper>
        ) : (
            Object.entries(
                quizzes.reduce((acc, quiz) => {
                    const subjectName = quiz.Topic?.Subject?.name || 'General';
                    if (!acc[subjectName]) acc[subjectName] = [];
                    acc[subjectName].push(quiz);
                    return acc;
                }, {})
            ).map(([subject, subjectQuizzes]) => (
                <Box key={subject} sx={{ mb: 6 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <PsychologyIcon sx={{ color: '#B0125B' }} /> {subject} Quizzes
                    </Typography>
                    
                    <Grid container spacing={4}>
                        {subjectQuizzes.map((quiz) => (
                            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                                <Card sx={{ 
                                    borderRadius: 4, 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }
                                }}>
                                    <Box sx={{ 
                                        height: 140, 
                                        background: 'linear-gradient(135deg, rgba(176, 18, 91, 0.8) 0%, rgba(11, 31, 59, 0.8) 100%)',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            position: 'absolute',
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.15)',
                                            filter: 'blur(20px)'
                                        }} />
                                        <PsychologyIcon sx={{ fontSize: 60, color: 'white', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                                    </Box>
                                    
                                    <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                            <Chip 
                                                label={quiz.Topic?.name || 'General'} 
                                                size="small" 
                                                sx={{ bgcolor: 'rgba(176, 18, 91, 0.1)', fontWeight: 600, color: '#B0125B' }} 
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                    {quiz.timeLimit || 15}m
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Typography variant="h6" fontWeight="800" gutterBottom sx={{ lineHeight: 1.2 }}>
                                            {quiz.title}
                                        </Typography>
                                        
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontWeight: 500 }}>
                                            Level Up your {subject} Skills
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto', p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                                <Typography variant="caption" display="block" color="textSecondary">Questions</Typography>
                                                <Typography variant="subtitle2" fontWeight="800">{quiz.questionCount || 0}</Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem />
                                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                                <Typography variant="caption" display="block" color="textSecondary">Attempts</Typography>
                                                <Typography variant="subtitle2" fontWeight="800">{quiz.maxAttempts || 2}</Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>

                                    <Box sx={{ px: 2.5, pb: 2.5 }}>
                                        <Button 
                                            variant="contained" 
                                            fullWidth 
                                            onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                                            sx={{ 
                                                borderRadius: 2.5, 
                                                py: 1.2, 
                                                fontWeight: 'bold',
                                                textTransform: 'none',
                                                fontSize: '0.95rem',
                                                bgcolor: '#1a237e',
                                                '&:hover': { bgcolor: '#121858' },
                                                boxShadow: '0 4px 14px 0 rgba(26, 35, 126, 0.3)'
                                            }}
                                        >
                                            Start Assessment
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))
        )}
      </Box>
    </Container>
  );
};

export default PlayHub;
