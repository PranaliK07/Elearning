import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Alert,
  Skeleton,
  Grid
} from '@mui/material';
import {
  AccessTime,
  Quiz as QuizIcon,
  EmojiEvents,
  ArrowForward
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const QuizStart = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bestScore, setBestScore] = useState(null);
  const [attemptsCount, setAttemptsCount] = useState(0);

  useEffect(() => {
    const fetchQuizAndProgress = async () => {
      try {
        const [quizRes, resultsRes] = await Promise.all([
          axios.get(`/api/quiz/${quizId}`),
          axios.get(`/api/quiz/${quizId}/results`)
        ]);

        setQuiz(quizRes.data);
        
        const results = resultsRes.data || [];
        setAttemptsCount(results.length);
        
        if (results.length > 0) {
          const maxScore = Math.max(...results.map(r => r.quizScore || 0));
          setBestScore(maxScore);
        }
      } catch (error) {
        console.error('Error fetching quiz or progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndProgress();
  }, [quizId]);

  const handleStartQuiz = () => {
    navigate(`/quiz/${quizId}/run`);
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="text" height={60} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </Box>
      </Container>
    );
  }

  const attemptsReached = quiz && attemptsCount >= quiz.maxAttempts;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 2 }}>
        <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', boxShadow: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1.5 }}>
            <QuizIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold' }}>
              {quiz?.title}
            </Typography>
          </Box>
          
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2, px: 4, fontWeight: 'normal', opacity: 0.8 }}>
            {quiz?.description}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 3, border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Time Limit</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>{quiz?.timeLimit} min</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ p: 1.5, bgcolor: 'secondary.50', borderRadius: 3, border: '1px solid', borderColor: 'secondary.100' }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Total Items</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.dark' }}>{quiz?.questions?.length || 0}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ p: 1.5, bgcolor: 'warning.50', borderRadius: 3, border: '1px solid', borderColor: 'warning.100' }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Pass Score</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>{quiz?.passingScore}%</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Chip 
              size="small"
              label={`Attempt ${attemptsCount} of ${quiz?.maxAttempts}`} 
              color={attemptsReached ? "error" : "primary"} 
              sx={{ fontWeight: 'bold' }}
            />
            {bestScore !== null && (
              <Chip 
                size="small"
                label={`Best Score: ${bestScore}%`} 
                color="success" 
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>

          {attemptsReached && (
            <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2, py: 0 }}>
              Max attempts reached ({quiz.maxAttempts}).
            </Alert>
          )}

          <Box sx={{ textAlign: 'left', mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
            <Box component="ul" sx={{ m: 0, pl: 3, fontSize: '0.9rem', color: 'text.secondary', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              <li>Read questions carefully.</li>
              <li>Timer starts on click.</li>
              <li>Stable connection required.</li>
              <li>{quiz?.maxAttempts} total attempts.</li>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="medium"
            endIcon={<ArrowForward />}
            onClick={handleStartQuiz}
            disabled={attemptsReached}
            sx={{ px: 6, py: 1.2, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem' }}
          >
            {attemptsReached ? 'Limit Reached' : 'Start Assessment'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default QuizStart;
