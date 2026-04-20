import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  EmojiEvents,
  Refresh,
  Home,
  Share
} from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Confetti from 'react-confetti';

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizInfo, setQuizInfo] = React.useState(null);
  const [attemptsCount, setAttemptsCount] = React.useState(0);
  const { result } = location.state || { result: { score: 0, total: 0, passed: false, answers: [], results: [] } };

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [qRes, rRes] = await Promise.all([
          axios.get(`/api/quiz/${quizId}`),
          axios.get(`/api/quiz/${quizId}/results`)
        ]);
        setQuizInfo(qRes.data);
        setAttemptsCount(rRes.data?.length || 0);
      } catch (error) {
        console.error('Error fetching quiz stats:', error);
      }
    };
    fetchStats();
  }, [quizId]);

  const safeTotal = result.total || 0;
  const percentage = safeTotal ? Math.round((result.score / safeTotal) * 100) : 0;
  const passed = result.passed !== undefined ? result.passed : percentage >= 70;
  const reviewedAnswers = Array.isArray(result.answers) && result.answers.length > 0
    ? result.answers
    : (Array.isArray(result.results)
      ? result.results.map((item) => ({
          correct: item.correct,
          selected: item.userAnswer
        }))
      : []);

  const hasRetryAvailable = quizInfo && attemptsCount < quizInfo.maxAttempts;

  const handleRetry = () => {
    navigate(`/quiz/${quizId}/run`);
  };

  const handleHome = () => {
    navigate('/dashboard');
  };

  const handleShare = () => {
    // Share functionality
  };

  return (
    <>
      {passed && <Confetti recycle={false} numberOfPieces={200} />}
      
      <Container maxWidth="md">
        <Box sx={{ py: 2 }}>
          <Paper 
            elevation={4}
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(0,0,0,0.08)'
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box>
                {passed ? (
                  <EmojiEvents sx={{ fontSize: { xs: 48, sm: 60 }, color: 'warning.main' }} />
                ) : (
                  <Cancel sx={{ fontSize: { xs: 48, sm: 60 }, color: 'error.main' }} />
                )}
              </Box>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
                  {passed ? 'Congratulations! 🎉' : 'Keep Pushing! 📚'}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {passed ? 'You successfully passed the quiz!' : 'Try again to master this topic!'}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Score Card */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: passed ? 'success.main' : 'error.main',
                    color: 'white',
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)'
                  }}
                >
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '2rem', sm: '3rem' } }}>{percentage}%</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Final Score</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{result.score} / {result.total}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Correct Answers</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Achievements */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#fbfbfb', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px dashed #ddd' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>REWARDS EARNED</Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip icon={<EmojiEvents sx={{ fontSize: 18 }} />} label="Quiz Master" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip icon={<CheckCircle sx={{ fontSize: 18 }} />} label="Sharp Mind" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Answer Review - Extra Wide Table View */}
            <Box sx={{ textAlign: 'left', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary', ml: 1 }}>
                QUESTION REVIEW
              </Typography>
              <Box sx={{ 
                maxHeight: 160, 
                overflowY: 'auto', 
                pr: 1,
                '&::-webkit-scrollbar': { width: '5px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#eee', borderRadius: '10px' }
              }}>
                <Grid container spacing={1}>
                  {reviewedAnswers.map((answer, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <ListItem sx={{ py: 1, px: 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #eee' }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {answer.correct ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Question ${index + 1}: ${answer.selected || 'None'}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600, sx: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
                        />
                      </ListItem>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {!passed && hasRetryAvailable && (
                <Button variant="contained" onClick={handleRetry} size="medium" startIcon={<Refresh />} sx={{ px: 4, borderRadius: 2, flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
                  Retry Quiz
                </Button>
              )}
              <Button variant={passed ? 'contained' : 'outlined'} onClick={handleHome} size="medium" startIcon={<Home />} sx={{ px: 4, borderRadius: 2, bgcolor: passed ? '#0B1F3B' : 'transparent', flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
                Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default QuizResult;
