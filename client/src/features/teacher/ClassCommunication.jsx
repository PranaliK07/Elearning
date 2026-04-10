import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Campaign, Send } from '@mui/icons-material';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { validateRequiredText } from '../../utils/validation';

const ClassCommunication = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const canViewHistory = isAdmin || isTeacher || isStudent;
  const basePath = isAdmin ? '/api/admin' : '/api/teacher';

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [filters, setFilters] = useState({
    gradeId: '',
    teacherId: '',
    audience: '',
    search: ''
  });

  const [form, setForm] = useState({
    gradeId: '',
    senderId: '',
    audience: 'both',
    title: '',
    message: ''
  });

  const audienceLabel = useMemo(() => ({
    students: 'Students',
    parents: 'Parents',
    both: 'Students + Parents'
  }), []);

  const fetchReferenceData = async () => {
    if (isStudent) return;
    try {
      const [classesRes, teachersRes] = await Promise.all([
        axios.get(isAdmin ? '/api/grades' : `${basePath}/classes`),
        isAdmin ? axios.get('/api/users/teachers') : Promise.resolve({ data: [] })
      ]);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setTeachers(Array.isArray(teachersRes?.data) ? teachersRes.data : []);
    } catch (error) {
      toast.error('Failed to load communication module');
    }
  };

  useEffect(() => {
    fetchReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isStudent]);

  const fetchCommunications = async () => {
    if (!canViewHistory) return;
    try {
      setLoading(true);
      let url = `${basePath}/communications`;
      const params = {
        gradeId: filters.gradeId || undefined,
        teacherId: isAdmin ? (filters.teacherId || undefined) : undefined,
        audience: filters.audience || undefined,
        limit: 100
      };
      if (isStudent) {
        url = '/api/teacher/communications/feed';
      }
      const response = await axios.get(url, { params });
      setCommunications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to load communication history');
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, canViewHistory, isAdmin, isStudent, filters.gradeId, filters.teacherId, filters.audience]);

  const filteredCommunications = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return communications;
    return communications.filter((item) => {
      const title = String(item?.title || '').toLowerCase();
      const message = String(item?.message || '').toLowerCase();
      const className = String(item?.Grade?.name || '').toLowerCase();
      const senderName = String(item?.teacher?.name || item?.teacher?.email || '').toLowerCase();
      return (
        title.includes(query) ||
        message.includes(query) ||
        className.includes(query) ||
        senderName.includes(query)
      );
    });
  }, [communications, filters.search]);

  const handleSend = async () => {
    const nextErrors = {};
    const titleError = validateRequiredText(form.title, 'Title', 2);
    const messageError = validateRequiredText(form.message, 'Message', 5);
    if (titleError) nextErrors.title = titleError;
    if (messageError) nextErrors.message = messageError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    if (!isTeacher && !isAdmin) {
      toast.error('You are not allowed to send communications');
      return;
    }

    try {
      setSending(true);
      const payload = {
        gradeId: form.gradeId || null,
        audience: form.audience,
        title: form.title.trim(),
        message: form.message.trim()
      };

      if (isAdmin && form.senderId) {
        payload.senderId = form.senderId;
      }

      const response = await axios.post(`${basePath}/communications`, payload);
      toast.success(response?.data?.message || 'Message sent successfully');

      setForm((prev) => ({ ...prev, title: '', message: '' }));
      if (canViewHistory) {
        await fetchCommunications();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Class Communication
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Send updates to students, parents, or both by class.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {!isStudent && (
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Campaign color="primary" />
                  <Typography variant="h6">New Message</Typography>
                </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      label="Class"
                      value={form.gradeId}
                      onChange={(e) => setForm((prev) => ({ ...prev, gradeId: e.target.value }))}
                    >
                      <MenuItem value="">All Classes</MenuItem>
                      {classes.map((grade) => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {isAdmin && (
              <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Send As</InputLabel>
                    <Select
                      label="Send As"
                      value={form.senderId}
                      onChange={(e) => setForm((prev) => ({ ...prev, senderId: e.target.value }))}
                    >
                      <MenuItem value="">Admin</MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                )}

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Audience</InputLabel>
                    <Select
                      label="Audience"
                      value={form.audience}
                      onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                    >
                      <MenuItem value="students">Students</MenuItem>
                      <MenuItem value="parents">Parents</MenuItem>
                      <MenuItem value="both">Students + Parents</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={form.title}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                      setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    error={!!errors.title}
                    helperText={errors.title}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    label="Message"
                    value={form.message}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, message: e.target.value }));
                      setErrors((prev) => ({ ...prev, message: '' }));
                    }}
                    error={!!errors.message}
                    helperText={errors.message}
                  />
                </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleSend}
                      disabled={sending}
                      fullWidth
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={isStudent ? 12 : 7}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Communication History
            </Typography>

            {!canViewHistory ? (
              <Typography variant="body2" color="textSecondary">
                Communication history is available to admins only.
              </Typography>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Class</InputLabel>
                      <Select
                        label="Class"
                        value={filters.gradeId}
                        onChange={(e) => setFilters((prev) => ({ ...prev, gradeId: e.target.value }))}
                      >
                        <MenuItem value="">All Classes</MenuItem>
                        {classes.map((grade) => (
                          <MenuItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Teacher</InputLabel>
                      <Select
                        label="Teacher"
                        value={filters.teacherId}
                        onChange={(e) => setFilters((prev) => ({ ...prev, teacherId: e.target.value }))}
                      >
                        <MenuItem value="">All Teachers</MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Audience</InputLabel>
                      <Select
                        label="Audience"
                        value={filters.audience}
                        onChange={(e) => setFilters((prev) => ({ ...prev, audience: e.target.value }))}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="students">Students</MenuItem>
                        <MenuItem value="parents">Parents</MenuItem>
                        <MenuItem value="both">Students + Parents</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Search (title, message, class, sender)"
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Sender</TableCell>
                        <TableCell>Audience</TableCell>
                        <TableCell>Recipients</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : filteredCommunications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No communication sent yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCommunications.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{item.title}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {item.message?.slice(0, 80)}
                                {item.message?.length > 80 ? '...' : ''}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.Grade?.name || 'All Classes'}</TableCell>
                            <TableCell>{item.teacher?.name || item.teacher?.email || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                label={audienceLabel[item.audience] || item.audience}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{item.recipientCount || 0}</TableCell>
                            <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClassCommunication;
