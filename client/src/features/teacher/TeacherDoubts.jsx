import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  TextField,
  Divider,
  Chip,
  Stack,
  Button,
  LinearProgress
} from '@mui/material';
import {
  ChatBubbleOutline,
  CheckCircle,
  Send
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios.js';
import { toast } from 'react-hot-toast';
import { resolveAvatarSrc } from '../../utils/media';

const TeacherDoubts = () => {
  const { user } = useAuth();
  const [pendingDoubts, setPendingDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchPendingDoubts();
  }, []);

  const fetchPendingDoubts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/doubts/teacher');
      setPendingDoubts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch doubts error', err);
      toast.error('Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyDoubt = async (doubtId) => {
    if (!replyText.trim()) return;
    try {
      await axios.put(`/api/doubts/${doubtId}/respond`, { answer: replyText });
      setReplyingId(null);
      setReplyText('');
      fetchPendingDoubts();
      toast.success('Reply sent successfully!');
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const pendingCount = pendingDoubts.filter(d => d.status === 'pending').length;

  if (loading && pendingDoubts.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">Loading doubts portal...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
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

          {pendingDoubts.length > 0 ? (
            <Stack spacing={3}>
              {pendingDoubts.map((doubt) => (
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
                      <Avatar 
                        src={resolveAvatarSrc(doubt.student?.avatar)} 
                        sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: 2 }}
                      >
                        {doubt.student?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{doubt.student?.name}</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {new Date(doubt.createdAt).toLocaleDateString()} • {new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          ) : (
            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
              <CheckCircle sx={{ fontSize: 80, mb: 2, color: 'success.light' }} />
              <Typography variant="h6">Inbox is Clear!</Typography>
              <Typography>No students have pending doubts right now.</Typography>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default TeacherDoubts;
