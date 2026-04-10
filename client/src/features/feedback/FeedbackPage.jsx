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
  Chip
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

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4">Feedback & Ratings</Typography>
            <Typography variant="body2" color="textSecondary">
              {isStaff ? 'Give rating and comments to students.' : 'View your personal ratings and comments.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Avg: ${averageRating || 0}`} color="primary" variant="outlined" />
            <Chip label={`${feedbackItems.length} entries`} variant="outlined" />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

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

        <Typography variant="h6" sx={{ mb: 1 }}>
          {isStaff ? (selectedStudent ? `Feedback for ${selectedStudent.name}` : 'Select a student to view feedback') : 'My Feedback'}
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbackItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="textSecondary">
                      {loading ? 'Loading...' : 'No feedback yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                feedbackItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={resolveAvatarSrc(item?.author?.avatar)} sx={{ width: 28, height: 28 }}>
                          {item?.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{item?.author?.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="textSecondary">{item?.author?.role || ''}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Rating value={Number(item.rating) || 0} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 520 }}>
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
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Paper>
    </Container>
  );
};

export default FeedbackPage;

