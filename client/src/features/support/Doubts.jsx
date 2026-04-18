import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha
} from '@mui/material';
import {
  Send,
  HelpOutline,
  CheckCircle,
  Pending,
  Person,
  ChatBubbleOutline
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';

const Doubts = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const [doubts, setDoubts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Student state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [question, setQuestion] = useState('');
  
  // Teacher state
  const [responseOpen, setResponseOpen] = useState(false);
  const [currentDoubt, setCurrentDoubt] = useState(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    fetchDoubts();
    if (!isTeacher) {
      fetchTeachers();
    }
  }, [isTeacher]);

  const fetchDoubts = async () => {
    try {
      const endpoint = isStudent ? '/api/doubts/student' : '/api/doubts/teacher';
      const res = await api.get(endpoint);
      setDoubts(res.data);
    } catch (err) {
      console.error('Fetch doubts error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/api/doubts/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Fetch teachers error', err);
    }
  };

  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !question.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/api/doubts', {
        teacherId: selectedTeacher,
        question
      });
      setQuestion('');
      setSelectedTeacher('');
      fetchDoubts();
    } catch (err) {
      console.error('Submit doubt error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResponse = (doubt) => {
    setCurrentDoubt(doubt);
    setAnswer(doubt.answer || '');
    setResponseOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!answer.trim()) return;

    try {
      await api.put(`/api/doubts/${currentDoubt.id}/respond`, { answer });
      setResponseOpen(false);
      fetchDoubts();
    } catch (err) {
      console.error('Submit response error', err);
    }
  };

  const getStatusChip = (status) => {
    const isResolved = status === 'resolved';
    return (
      <Chip
        icon={isResolved ? <CheckCircle /> : <Pending />}
        label={isResolved ? 'Resolved' : 'Pending'}
        size="small"
        color={isResolved ? 'success' : 'warning'}
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="900" sx={{ 
            background: 'linear-gradient(45deg, #1a237e 30%, #311b92 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Internal Doubt Portal 🙋‍♂️
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {isStudent 
              ? 'Message teachers directly within the app.' 
              : 'Reply to student doubts and help them learn!'}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {isStudent && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" fontWeight="800" gutterBottom>
                New Doubt
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box component="form" onSubmit={handleSubmitDoubt}>
                <TextField
                  select
                  fullWidth
                  label="Select Registered Teacher"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                  helperText={teachers.length === 0 ? "No teachers available yet" : "Choose a teacher to answer your doubt"}
                >
                  {teachers.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>No teachers found</em>
                    </MenuItem>
                  ) : (
                    teachers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            src={t.avatar} 
                            sx={{ width: 32, height: 32, border: '1px solid #eee' }}
                          >
                            <Person sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="700">{t.name}</Typography>
                            <Typography variant="caption" color="textSecondary">Expert Teacher</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="What is your doubt?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
                >
                  Post Doubt
                </Button>
              </Box>
            </Paper>
          </Grid>
          )}

          <Grid item xs={12} md={isStudent ? 8 : 12}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatBubbleOutline color="primary" />
              {isStudent ? 'Your Conversations' : 'Inbox: Student Doubts'}
            </Typography>

            <AnimatePresence>
              {doubts.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <HelpOutline sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">No conversations yet.</Typography>
                </Paper>
              ) : (
                doubts.map((doubt, i) => (
                  <motion.div key={doubt.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card sx={{ 
                      mb: 2, 
                      borderRadius: 4, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      borderRight: doubt.status === 'pending' ? '5px solid orange' : '5px solid green'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={isStudent ? doubt.teacher?.avatar : doubt.student?.avatar} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="800">
                                {isStudent ? doubt.teacher?.name : doubt.student?.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(doubt.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          {getStatusChip(doubt.status)}
                        </Box>

                        <Box sx={{ bgcolor: alpha('#1a237e', 0.04), p: 2, borderRadius: 2, mb: 2 }}>
                          <Typography variant="body2"><strong>Message:</strong> {doubt.question}</Typography>
                        </Box>

                        {doubt.answer ? (
                          <Box sx={{ bgcolor: alpha('#4caf50', 0.06), p: 2, borderRadius: 2 }}>
                            <Typography variant="body2"><strong>Teacher Response:</strong> {doubt.answer}</Typography>
                          </Box>
                        ) : !isStudent ? (
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={() => handleOpenResponse(doubt)}
                            sx={{ borderRadius: 2 }}
                          >
                            Reply to Message
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </motion.div>

      <Dialog open={responseOpen} onClose={() => setResponseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Send Reply</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Student asked:</Typography>
          <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 3 }}>
            {currentDoubt?.question}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Type your response"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResponseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitResponse} disabled={!answer.trim()}>
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Doubts;
