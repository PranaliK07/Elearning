import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  AccessTime,
  ArrowBack,
  ArrowForward,
  Flag
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useTimer } from '../../hooks/useTimer';

const QuizRunner = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [initialTimeLimit, setInitialTimeLimit] = useState(0);
  const [flagged, setFlagged] = useState([]);

  const { timeLeft: timerValue } = useTimer(initialTimeLimit, () => handleTimeUp());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`/api/quiz/${quizId}/questions`);
        setQuiz(response.data);
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz) {
      setInitialTimeLimit(quiz.timeLimit * 60);
      setAnswers(new Array(quiz.questions.length).fill(null));
      setFlagged(new Array(quiz.questions.length).fill(false));
    }
  }, [quiz]);

  const handleTimeUp = () => {
    submitQuiz();
  };

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const handleFlag = () => {
    const newFlagged = [...flagged];
    newFlagged[currentQuestion] = !newFlagged[currentQuestion];
    setFlagged(newFlagged);
  };

  const submitQuiz = async () => {
    try {
      const response = await axios.post(`/api/quiz/${quizId}/submit`, {
        answers
      });
      
      navigate(`/quiz/${quizId}/result`, { state: { result: response.data } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !quiz) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center" sx={{ mt: 4 }}>
          This quiz has no questions. Please contact your teacher.
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button onClick={() => navigate(-1)} variant="outlined">Go Back</Button>
        </Box>
      </Container>
    );
  }

  const questionsList = Array.isArray(quiz.questions) ? quiz.questions : [];
  const progress = questionsList.length > 0 ? ((currentQuestion + 1) / questionsList.length) * 100 : 0;
  const question = questionsList[currentQuestion];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 4, boxShadow: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {quiz.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Question {currentQuestion + 1} / {quiz.questions.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton size="small" onClick={handleFlag} color={flagged[currentQuestion] ? 'warning' : 'default'}>
                <Flag fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: timerValue < 60 ? 'error.light' : 'action.hover', px: 1.5, py: 0.5, borderRadius: 2 }}>
                <AccessTime fontSize="small" color={timerValue < 60 ? 'error' : 'action'} />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: timerValue < 60 ? 'error.main' : 'text.primary',
                    minWidth: '50px'
                  }}
                >
                  {formatTime(timerValue)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Progress Bar */}
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 6, borderRadius: 3, mb: 2 }}
          />

          {/* Question */}
          <div key={currentQuestion}>
              <Paper sx={{ p: 2.5, bgcolor: 'background.default', borderRadius: 3, mb: 2, border: '1px solid #eee' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {question.question}
                </Typography>

                {question.image && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <img 
                      src={question.image} 
                      alt="Question" 
                      style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
                    />
                  </Box>
                )}

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup value={selectedAnswer} onChange={handleAnswerChange}>
                    {question.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio size="small" />}
                        label={option}
                        sx={{
                          p: 0.5,
                          px: 1.5,
                          mb: 1,
                          mr: 0,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          width: '100%',
                          '& .MuiFormControlLabel-label': { fontSize: '0.9rem' },
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Paper>
            </div>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => {/* Show question palette */}}
              >
                Q {currentQuestion + 1}
              </Button>
              
              {currentQuestion === quiz.questions.length - 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={submitQuiz}
                  sx={{ px: 3 }}
                >
                  Submit
                </Button>
              ) : (
                <Button
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                  variant="contained"
                  size="small"
                  sx={{ px: 3 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default QuizRunner;
