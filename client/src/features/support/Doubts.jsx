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
  alpha,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Send,
  HelpOutline,
  CheckCircle,
  Pending,
  Person,
  ChatBubbleOutline,
  School,
  ExpandMore as ExpandMoreIcon,
  ArrowBack
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
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

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

  const handleReplyDoubt = async (doubtId) => {
    if (!replyText.trim()) return;
    try {
      await api.put(`/api/doubts/${doubtId}/respond`, { answer: replyText });
      setReplyingId(null);
      setReplyText('');
      fetchDoubts();
    } catch (err) {
      console.error('Failed to send reply', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/api/users/teachers');
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

  const getStatusChip = (status) => {
    return status === 'resolved' ? (
      <Chip icon={<CheckCircle sx={{ fontSize: 16 }} />} label="RESOLVED" color="success" size="small" sx={{ fontWeight: 'bold' }} />
    ) : (
      <Chip icon={<Pending sx={{ fontSize: 16 }} />} label="PENDING" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
    );
  };

  const pendingCount = doubts.filter(d => d.status === 'pending').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Teacher Specific View
  if (isTeacher || user?.role === 'admin') {
    const groupedDoubts = {};
    doubts.forEach(doubt => {
      const className = doubt.student?.Grade?.name 
                     || (doubt.student?.grade ? `Class ${doubt.student.grade}` : 'Class Unassigned');
      const studentName = doubt.student?.name || 'Unknown Student';
      
      if (!groupedDoubts[className]) {
        groupedDoubts[className] = {};
      }
      if (!groupedDoubts[className][studentName]) {
        groupedDoubts[className][studentName] = [];
      }
      groupedDoubts[className][studentName].push(doubt);
    });

    return (
      <Box sx={{ py: 2, px: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ChatBubbleOutline color="primary" sx={{ fontSize: '2.5rem' }} /> Student Doubts Portal
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Manage and respond to student questions directly from here.
                </Typography>
              </Box>
              <Chip 
                label={`${pendingCount} Pending Resolution`} 
                color={pendingCount > 0 ? "error" : "success"}
                variant="filled"
                sx={{ fontWeight: '800', px: 2, py: 2.5, borderRadius: 3, fontSize: '1rem' }}
              />
            </Box>
            
            <Divider sx={{ mb: 4 }} />

            {doubts.length > 0 ? (
              <Box>
                {selectedClass && groupedDoubts[selectedClass] ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => setSelectedClass(null)}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        Back to Classes
                      </Button>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedClass}
                      </Typography>
                    </Box>
                    
                    {Object.keys(groupedDoubts[selectedClass]).map(studentName => (
                      <Accordion key={studentName} sx={{ mb: 2, boxShadow: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {groupedDoubts[selectedClass][studentName][0]?.student?.avatar ? (
                                <img src={groupedDoubts[selectedClass][studentName][0]?.student?.avatar} alt={studentName} style={{ width: '100%', borderRadius: '50%' }} />
                              ) : (
                                <Person fontSize="small" />
                              )}
                            </Avatar>
                            <Typography fontWeight="bold" variant="subtitle1">{studentName}</Typography>
                            <Chip 
                              size="small" 
                              label={`${groupedDoubts[selectedClass][studentName].length} Doubts`} 
                              color="secondary" 
                              sx={{ ml: 2, height: 24, fontWeight: 'bold' }} 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                          <Stack spacing={3}>
                            {groupedDoubts[selectedClass][studentName].map((doubt) => (
                              <Box key={doubt.id} sx={{ 
                                p: 3, 
                                borderRadius: 4, 
                                border: '1px solid',
                                borderColor: doubt.status === 'pending' ? 'rgba(255,87,34,0.15)' : 'rgba(76,175,80,0.15)',
                                bgcolor: doubt.status === 'pending' ? 'rgba(255,87,34,0.02)' : 'rgba(76,175,80,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                {/* Status Strip */}
                                <Box sx={{ 
                                  position: 'absolute', 
                                  left: 0, 
                                  top: 0, 
                                  bottom: 0, 
                                  width: 6, 
                                  bgcolor: doubt.status === 'pending' ? '#ff5722' : '#4caf50' 
                                }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                      <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          Submitted on: {new Date(doubt.createdAt).toLocaleDateString()} • {new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Chip 
                                    label={doubt.status.toUpperCase()} 
                                    size="small" 
                                    color={doubt.status === 'pending' ? 'warning' : 'success'}
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>

                                <Typography variant="body1" sx={{ mb: 3, fontWeight: 500, bgcolor: 'rgba(255,255,255,0.5)', p: 2, borderRadius: 2 }}>
                                  "{doubt.question}"
                                </Typography>

                                {doubt.answer ? (
                                  <Box sx={{ bgcolor: 'rgba(76,175,80,0.05)', p: 2, borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', mb: 0.5, display: 'block' }}>
                                      RESOLVED BY YOU:
                                    </Typography>
                                    <Typography variant="body2">{doubt.answer}</Typography>
                                  </Box>
                                ) : (
                                  <Box>
                                    {replyingId === doubt.id ? (
                                      <Box>
                                        <TextField
                                          fullWidth
                                          multiline
                                          rows={3}
                                          placeholder="Type your expert answer here..."
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          sx={{ mb: 2, bgcolor: 'white' }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <Button 
                                            variant="contained" 
                                            startIcon={<Send />} 
                                            onClick={() => handleReplyDoubt(doubt.id)}
                                            disabled={!replyText.trim()}
                                            sx={{ borderRadius: 2 }}
                                          >
                                            Submit Answer
                                          </Button>
                                          <Button 
                                            variant="text" 
                                            onClick={() => setReplyingId(null)}
                                            color="inherit"
                                          >
                                            Cancel
                                          </Button>
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Button 
                                        variant="outlined" 
                                        startIcon={<ChatBubbleOutline />}
                                        onClick={() => { setReplyingId(doubt.id); setReplyText(''); }}
                                        sx={{ borderRadius: 2 }}
                                      >
                                        Provide Answer
                                      </Button>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </motion.div>
                ) : (
                  <Grid container spacing={3}>
                    {Object.keys(groupedDoubts).map(className => {
                      const studentNames = Object.keys(groupedDoubts[className]);
                      let doubtCount = 0;
                      let classPending = 0;
                      studentNames.forEach(s => {
                        groupedDoubts[className][s].forEach(d => {
                          doubtCount++;
                          if (d.status === 'pending') classPending++;
                        });
                      });

                      return (
                        <Grid item xs={12} sm={6} md={4} key={className}>
                          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                            <Card 
                              onClick={() => setSelectedClass(className)}
                              sx={{ 
                                cursor: 'pointer', 
                                borderRadius: 4, 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                height: '100%',
                                borderTop: classPending > 0 ? '4px solid #ff9800' : '4px solid #4caf50'
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                    <School />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                      {className}
                                    </Typography>
                                    {classPending > 0 && (
                                      <Typography variant="caption" color="warning.main" fontWeight="bold">
                                        {classPending} Pending Resolution
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight="bold" color="textPrimary">
                                      {studentNames.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Students</Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight="bold" color="textPrimary">
                                      {doubtCount}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Total Doubts</Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
                <CheckCircle sx={{ fontSize: 80, mb: 2, color: 'success.light' }} />
                <Typography variant="h6">Inbox is Clear!</Typography>
                <Typography>No students have pending doubts right now.</Typography>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // Student View
  return (
    <Box sx={{ py: 4, px: 1 }}>
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
            Message teachers directly within the app.
          </Typography>
        </Box>

        <Grid container spacing={4}>
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

          <Grid item xs={12} md={8}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatBubbleOutline color="primary" />
              Your Conversations
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
                            <Avatar src={doubt.teacher?.avatar} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="800">
                                {doubt.teacher?.name}
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

                        {doubt.answer && (
                          <Box sx={{ bgcolor: alpha('#4caf50', 0.06), p: 2, borderRadius: 2 }}>
                            <Typography variant="body2"><strong>Teacher Response:</strong> {doubt.answer}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default Doubts;
