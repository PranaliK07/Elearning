import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { resolveAvatarSrc } from '../../utils/media';

const formatWhen = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return '';
  }
};

const FeedbackPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isStaff = role === 'teacher' || role === 'admin';

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackItems, setFeedbackItems] = useState([]);

  const averageRating = useMemo(() => {
    const values = feedbackItems.map((f) => Number(f.rating)).filter((n) => Number.isFinite(n) && n > 0);
    if (!values.length) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }, [feedbackItems]);

  const loadStudentFeedback = async (studentId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/feedback/student/${studentId}`);
      setFeedbackItems(Array.isArray(data?.feedback) ? data.feedback : []);
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error('Feedback module is disabled in Business Settings.');
      } else {
        toast.error('Failed to load feedback');
      }
      setFeedbackItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyFeedback = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/feedback/my');
      setFeedbackItems(Array.isArray(data?.feedback) ? data.feedback : []);
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error('Feedback module is disabled in Business Settings.');
      } else {
        toast.error('Failed to load feedback');
      }
      setFeedbackItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (isStaff) return;
    loadMyFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isStaff]);

  useEffect(() => {
    if (!user?.id) return;
    if (!isStaff) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/users/students');
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user?.id, isStaff]);

  useEffect(() => {
    if (!isStaff) return;
    if (!selectedStudent?.id) {
      setFeedbackItems([]);
      return;
    }
    loadStudentFeedback(selectedStudent.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.id, isStaff]);

  const submitFeedback = async () => {
    if (!selectedStudent?.id) return toast.error('Select a student first');
    if (!rating) return toast.error('Please select a rating (1-5)');

    setLoading(true);
    try {
      await api.post('/api/feedback', {
        studentId: selectedStudent.id,
        rating,
        comment
      });
      toast.success('Feedback saved');
      setComment('');
      await loadStudentFeedback(selectedStudent.id);
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error('Feedback module is disabled in Business Settings.');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to save feedback');
      }
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2, 
          mb: 3 
        }}>
          <Box>
            <Typography variant={isMobile ? "h4" : "h3"} fontWeight="900" sx={{ 
              background: 'linear-gradient(45deg, #FFB300 30%, #F57C00 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Feedback & Ratings ⭐
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {isStaff ? 'Evaluate and provide constructive feedback to students.' : 'Review your performance insights and teacher comments.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Paper variant="outlined" sx={{ px: 2, py: 0.75, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.50' }}>
              <Typography variant="caption" fontWeight="bold">AVG</Typography>
              <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                {averageRating || 0.0}
              </Typography>
            </Paper>
            <Chip label={`${feedbackItems.length} Entries`} variant="outlined" sx={{ borderRadius: 2, fontWeight: 'bold' }} />
          </Stack>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {isStaff && (
          <Box sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <Autocomplete
                options={students}
                value={selectedStudent}
                onChange={(_, value) => setSelectedStudent(value)}
                loading={loading}
                getOptionLabel={(option) => `${option?.name || ''}${option?.email ? ` (${option.email})` : ''}`}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={resolveAvatarSrc(option.avatar)} sx={{ width: 28, height: 28 }}>
                      {option?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Avatar>
                    <Typography variant="body2">{option?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{option?.email}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Select student" placeholder="Search by name/email" />
                )}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Rating</Typography>
                  <Rating
                    value={rating}
                    onChange={(_, value) => setRating(value || 0)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  multiline
                  minRows={2}
                />
                <Button variant="contained" onClick={submitFeedback} disabled={loading}>
                  Save
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, mt: isStaff ? 4 : 0 }}>
          {isStaff ? (selectedStudent ? `Recent Feedback for ${selectedStudent.name}` : 'Select a student to view history') : 'My Feedback History'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            Loading feedback records...
          </Box>
        ) : feedbackItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed #ccc', borderRadius: 3, bgcolor: 'action.hover' }}>
             <Typography variant="body1" color="textSecondary">
               No feedback entries found yet.
             </Typography>
          </Box>
        ) : isMobile ? (
          <Stack spacing={2}>
            {feedbackItems.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={resolveAvatarSrc(item?.author?.avatar)} sx={{ width: 32, height: 32 }}>
                      {item?.author?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{item?.author?.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{item?.author?.role}</Typography>
                    </Box>
                  </Stack>
                  <Rating value={Number(item.rating)} size="small" readOnly />
                </Box>
                <Typography variant="body2" color="textPrimary" sx={{ fontStyle: item.comment ? 'normal' : 'italic', mb: 2 }}>
                  {item.comment || 'No comment provided.'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatWhen(item.createdAt)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Comment</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbackItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={resolveAvatarSrc(item?.author?.avatar)} sx={{ width: 32, height: 32 }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">{item?.author?.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="textSecondary">{item?.author?.role || ''}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Rating value={Number(item.rating) || 0} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {item.comment || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {formatWhen(item.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default FeedbackPage;

