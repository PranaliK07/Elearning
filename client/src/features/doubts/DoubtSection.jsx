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
  IconButton,
  alpha,
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

const DoubtSection = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
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
    if (isStudent) {
      fetchTeachers();
    }
  }, [isStudent]);

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
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: { xs: '2rem', sm: '3rem' }
          }}>
            Ask a Doubt 🙋‍♂️
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {isStudent 
              ? 'Stuck somewhere? Ask your teachers directly!' 
              : 'Help your students clear their doubts and keep learning!'}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Action Column */}
          <Grid item xs={12} md={isStudent ? 4 : 0} sx={{ display: isStudent ? 'block' : 'none' }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, position: { md: 'sticky' }, top: 20 }}>
              <Typography variant="h6" fontWeight="800" gutterBottom>
                Send New Doubt
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box component="form" onSubmit={handleSubmitDoubt}>
                <TextField
                  select
                  fullWidth
                  label="Select Teacher"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                >
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={t.avatar} sx={{ width: 24, height: 24 }} />
                        {t.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Type your doubt here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  sx={{ mb: 3 }}
                  required
                  placeholder="Explain your problem clearly..."
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{ 
                    borderRadius: 3, 
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 14px rgba(33, 150, 243, 0.3)'
                  }}
                >
                  Send Message
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* List Column */}
          <Grid item xs={12} md={isStudent ? 8 : 12}>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              <ChatBubbleOutline color="primary" />
              {isStudent ? 'Your Previous Doubts' : 'Received Doubts'}
            </Typography>

            <AnimatePresence>
              {doubts.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <HelpOutline sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">No doubts found.</Typography>
                </Paper>
              ) : isStudent ? (
                doubts.map((doubt, i) => (
                  <motion.div
                    key={doubt.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <DoubtCard doubt={doubt} isStudent={isStudent} handleOpenResponse={handleOpenResponse} getStatusChip={getStatusChip} />
                  </motion.div>
                ))
              ) : (
                <TeacherDoubtsView 
                  doubts={doubts} 
                  handleOpenResponse={handleOpenResponse} 
                  getStatusChip={getStatusChip} 
                />
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </motion.div>

      {/* Response Dialog (Teacher Only) */}
      <Dialog 
        open={responseOpen} 
        onClose={() => setResponseOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Resolve Doubt</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
            Student Question:
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="body2">{currentDoubt?.question}</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Your Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Provide a clear and helpful explanation..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setResponseOpen(false)} sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitResponse}
            disabled={!answer.trim()}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 4 }}
          >
            Send Response
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const DoubtCard = ({ doubt, isStudent, handleOpenResponse, getStatusChip }) => (
  <Card sx={{ 
    mb: 2, 
    borderRadius: 4, 
    borderLeft: `6px solid ${doubt.status === 'resolved' ? '#4caf50' : '#ff9800'}`,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={isStudent ? doubt.teacher?.avatar : doubt.student?.avatar}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="800">
              {isStudent ? `Teacher: ${doubt.teacher?.name}` : `${doubt.student?.name}`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Sent on {new Date(doubt.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        {getStatusChip(doubt.status)}
      </Box>

      <Box sx={{ bgcolor: alpha('#2196F3', 0.03), p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="body1" fontWeight="500">
          <strong>Q:</strong> {doubt.question}
        </Typography>
      </Box>

      {doubt.answer ? (
        <Box sx={{ bgcolor: alpha('#4caf50', 0.05), p: 2, borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.1)' }}>
          <Typography variant="body1">
            <strong>A:</strong> {doubt.answer}
          </Typography>
        </Box>
      ) : !isStudent ? (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleOpenResponse(doubt)}
          startIcon={<Send />}
          sx={{ mt: 1, borderRadius: 2 }}
        >
          Respond to Student
        </Button>
      ) : (
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          Waiting for teacher to respond...
        </Typography>
      )}
    </CardContent>
  </Card>
);

const TeacherDoubtsView = ({ doubts, handleOpenResponse, getStatusChip }) => {
  const [selectedClass, setSelectedClass] = React.useState(null);

  // Group by Class -> Student
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

  if (selectedClass && groupedDoubts[selectedClass]) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => setSelectedClass(null)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Back to Classes
          </Button>
          <Typography variant="h6" fontWeight="bold">
            {selectedClass}
          </Typography>
        </Box>
        
        {Object.keys(groupedDoubts[selectedClass]).map(studentName => (
          <Accordion key={studentName} sx={{ mb: 2, boxShadow: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}><Person fontSize="small" /></Avatar>
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
              {groupedDoubts[selectedClass][studentName].map(doubt => (
                <DoubtCard 
                  key={doubt.id} 
                  doubt={doubt} 
                  isStudent={false} 
                  handleOpenResponse={handleOpenResponse} 
                  getStatusChip={getStatusChip} 
                />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </motion.div>
    );
  }

  return (
    <Grid container spacing={3}>
      {Object.keys(groupedDoubts).map(className => {
        const studentNames = Object.keys(groupedDoubts[className]);
        let doubtCount = 0;
        let pendingCount = 0;
        studentNames.forEach(s => {
          groupedDoubts[className][s].forEach(d => {
            doubtCount++;
            if (d.status === 'pending') pendingCount++;
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
                  borderTop: pendingCount > 0 ? '4px solid #ff9800' : '4px solid #4caf50'
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
                      {pendingCount > 0 && (
                        <Typography variant="caption" color="warning.main" fontWeight="bold">
                          {pendingCount} Pending Resolution
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
  );
};

export default DoubtSection;
