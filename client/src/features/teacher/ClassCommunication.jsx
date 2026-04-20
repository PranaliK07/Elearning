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
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Divider as MuiDivider
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant={isMobile ? "h4" : "h3"} fontWeight="900" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #1A237E 30%, #3F51B5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Class Communication 📢
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
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
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Campaign color="secondary" />
              Communication History
            </Typography>

            {!canViewHistory ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                Communication history is available to authorized users only.
              </Typography>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
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

                  {isAdmin && (
                    <Grid item xs={12} sm={6} md={4}>
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
                  )}

                  <Grid item xs={12} sm={isAdmin ? 12 : 6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Audience</InputLabel>
                      <Select
                        label="Audience"
                        value={filters.audience}
                        onChange={(e) => setFilters((prev) => ({ ...prev, audience: e.target.value }))}
                      >
                        <MenuItem value="">All Audiences</MenuItem>
                        <MenuItem value="students">Students</MenuItem>
                        <MenuItem value="parents">Parents</MenuItem>
                        <MenuItem value="both">Both</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Search messages..."
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                      placeholder="Title, message, class, or sender"
                    />
                  </Grid>
                </Grid>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    Loading communications...
                  </Box>
                ) : filteredCommunications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Typography variant="body1">No communications found</Typography>
                  </Box>
                ) : isMobile ? (
                  <Stack spacing={2}>
                    {filteredCommunications.map((item) => (
                      <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">{item.title}</Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {item.Grade?.name || 'All Classes'} • {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={audienceLabel[item.audience]}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                          {item.message}
                        </Typography>
                        <MuiDivider sx={{ mb: 1.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            By: {item.teacher?.name || 'Admin'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.recipientCount || 0} Recipients
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Title & Message</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Class</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sender</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Audience</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredCommunications.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography variant="subtitle2" fontWeight="bold">{item.title}</Typography>
                              <Typography variant="caption" color="textSecondary" sx={{
                                display: '-webkit-box',
                                WebkitLineGapLimit: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.message}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.Grade?.name || 'All Classes'}</TableCell>
                            <TableCell>{item.teacher?.name || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                label={audienceLabel[item.audience] || item.audience}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClassCommunication;
