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
  const [selectedSubject, setSelectedSubject] = useState(null);

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
  }, []);

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

  // Group Quizzes by Subject
  const quizzesBySubject = quizzes.reduce((acc, quiz) => {
    const subjectName = quiz.Topic?.Subject?.name || 'General';
    if (!acc[subjectName]) acc[subjectName] = {
      name: subjectName,
      quizzes: [],
      icon: <PsychologyIcon />
    };
    acc[subjectName].quizzes.push(quiz);
    return acc;
  }, {});

  const subjectList = Object.values(quizzesBySubject);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
          Play & Practice
        </Typography>
        <Typography variant="h6" color="textSecondary">
          {selectedSubject 
            ? `Exploring ${selectedSubject} Assessments` 
            : 'Select a subject to begin your interactive learning journey.'}
        </Typography>
      </Box>

      {/* Quizzes Section */}
      <Box id="quizzes-section">
        {loading ? (
            <Box sx={{ textAlign: 'center' }} py={8}><CircularProgress /></Box>
        ) : quizzes.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'action.hover', border: (theme) => `2px dashed ${theme.palette.divider}` }}>
                <Typography variant="h6" color="textSecondary">No new quizzes available starting soon!</Typography>
                <Typography variant="body2" color="textSecondary">Ask your teacher to upload a quiz to see it here.</Typography>
            </Paper>
        ) : !selectedSubject ? (
          /* Subject Selection View */
          <Grid container spacing={3} justifyContent="center">
            {subjectList.map((subject) => (
              <Grid item xs={12} sm={6} md={4} key={subject.name}>
                <Card 
                  onClick={() => setSelectedSubject(subject.name)}
                  sx={{ 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    '&:hover': { 
                      transform: 'scale(1.03)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      bgcolor: 'action.hover',
                      borderColor: '#1a237e'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto', 
                      mb: 2, 
                      background: 'linear-gradient(135deg, #B0125B 0%, #1a237e 100%)', // Dark Pink to Navy Blue Gradient
                      boxShadow: '0 8px 24px rgba(26, 35, 126, 0.25)',
                      border: '3px solid white'
                    }}>
                      <PsychologyIcon sx={{ fontSize: 45, color: '#fff' }} /> {/* White Icon */}
                    </Avatar>
                    <Typography variant="h5" fontWeight="800" sx={{ mb: 1, color: 'text.primary' }}>{subject.name}</Typography>
                    <Chip 
                      label={`${subject.quizzes.length} Quizzes Available`} 
                      size="small" 
                      sx={{ fontWeight: 600, bgcolor: 'rgba(176, 18, 91, 0.1)', color: '#B0125B' }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Quizzes Detail View */
          <Box>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                startIcon={<PlayArrow sx={{ transform: 'rotate(180deg)' }} />} 
                onClick={() => setSelectedSubject(null)}
                variant="outlined"
                sx={{ borderRadius: 3, fontWeight: 'bold', color: 'primary.main', borderColor: 'primary.main' }}
              >
                Back to Subjects
              </Button>
              <Typography variant="h4" fontWeight="900" sx={{ color: '#B0125B', textTransform: 'uppercase' }}>
                {selectedSubject} Quizzes
              </Typography>
            </Box>

            <Grid container spacing={4} justifyContent="center">
                {quizzesBySubject[selectedSubject].quizzes.map((quiz) => (
                    <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                        <Card sx={{ 
                            borderRadius: 4, 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }
                        }}>
                            <Box sx={{ 
                                height: 140, 
                                background: 'linear-gradient(135deg, #B0125B 0%, #1a237e 100%)', // Dark Pink to Navy Blue
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
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
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
                                        bgcolor: '#1a237e',
                                        '&:hover': { bgcolor: '#121858' },
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
        )}
      </Box>
    </Container>
  );
};

export default PlayHub;
