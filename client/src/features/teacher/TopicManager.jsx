import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Edit,
  Delete,
  Add as AddIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  Book as TopicIcon,
  Description as DescIcon,
  ArrowBack,
  Search,
  School
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { validateRequiredText, validateSelectRequired } from '../../utils/validation';

const TopicManager = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({
    gradeId: '',
    subjectId: '',
    subjectName: '',
    subjectDescription: '',
    topicName: '',
    topicDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', item: null, values: {} });
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [searchSubject, setSearchSubject] = useState('');
  const [searchTopic, setSearchTopic] = useState('');

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (form.gradeId) {
      fetchSubjects(form.gradeId);
    } else {
      setSubjects([]);
    }
    setForm((prev) => ({ ...prev, subjectId: '', subjectName: '', subjectDescription: '', topicName: '', topicDescription: '' }));
    setTopics([]);
  }, [form.gradeId]);

  useEffect(() => {
    if (form.subjectId) {
      fetchTopics(form.subjectId);
    } else {
      setTopics([]);
    }
    setForm((prev) => ({ ...prev, topicName: '', topicDescription: '' }));
  }, [form.subjectId]);

  const selectedClass = useMemo(
    () => grades.find((g) => String(g.id) === String(form.gradeId)),
    [grades, form.gradeId]
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(form.subjectId)),
    [subjects, form.subjectId]
  );

  const fetchGrades = async () => {
    try {
      const res = await axios.get('/api/grades');
      const gradeList = Array.isArray(res.data) ? res.data : [];
      if (gradeList.length > 0) {
        setGrades(gradeList);
        return;
      }
      const fallback = await axios.get('/api/dashboard/teacher');
      const classes = Array.isArray(fallback.data?.classes) ? fallback.data.classes : [];
      setGrades(classes);
    } catch {
      toast.error('Unable to load classes');
    }
  };

  const fetchSubjects = async (gradeId) => {
    try {
      const res = await axios.get(`/api/subjects?gradeId=${gradeId}`);
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Unable to load subjects');
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const res = await axios.get(`/api/topics?subjectId=${subjectId}`);
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Unable to load topics');
    }
  };

  const handleCreateSubject = async () => {
    const nextErrors = {};
    const gradeError = validateSelectRequired(form.gradeId, 'Class');
    const subjectError = validateRequiredText(form.subjectName, 'Subject name', 2);
    if (gradeError) nextErrors.gradeId = gradeError;
    if (subjectError) nextErrors.subjectName = subjectError;
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) return toast.error('Please fix the highlighted fields');

    try {
      setLoading(true);
      await axios.post('/api/subjects', {
        name: form.subjectName.trim(),
        gradeId: Number(form.gradeId),
        description: form.subjectDescription || ''
      });
      toast.success('Subject added successfully');
      setForm((prev) => ({ ...prev, subjectName: '', subjectDescription: '' }));
      fetchSubjects(form.gradeId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    const nextErrors = {};
    const subjectError = validateSelectRequired(form.subjectId, 'Subject');
    const topicError = validateRequiredText(form.topicName, 'Topic name', 2);
    if (subjectError) nextErrors.subjectId = subjectError;
    if (topicError) nextErrors.topicName = topicError;
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) return toast.error('Please fix the highlighted fields');

    try {
      setLoading(true);
      await axios.post('/api/topics', {
        name: form.topicName.trim(),
        description: form.topicDescription,
        subjectId: Number(form.subjectId)
      });
      toast.success('Topic added successfully');
      setForm((prev) => ({ ...prev, topicName: '', topicDescription: '' }));
      fetchTopics(form.subjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add topic');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (type, item) => {
    setEditDialog({
      open: true,
      type,
      item,
      values: {
        name: item?.name || '',
        description: item?.description || ''
      }
    });
  };

  const closeEditDialog = () => setEditDialog({ open: false, type: '', item: null, values: {} });

  const handleEditSave = async () => {
    if (!editDialog.item) return;
    const nameError = validateRequiredText(editDialog.values.name, 'Name', 2);
    if (nameError) {
      setEditErrors({ name: nameError });
      return toast.error(nameError);
    }

    try {
      setLoading(true);
      if (editDialog.type === 'subject') {
        await axios.put(`/api/subjects/${editDialog.item.id}`, {
          name: editDialog.values.name,
          description: editDialog.values.description
        });
        fetchSubjects(form.gradeId);
      } else if (editDialog.type === 'topic') {
        await axios.put(`/api/topics/${editDialog.item.id}`, {
          name: editDialog.values.name,
          description: editDialog.values.description,
          subjectId: Number(form.subjectId)
        });
        fetchTopics(form.subjectId);
      }
      toast.success('Updated successfully');
      closeEditDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      setLoading(true);
      if (type === 'subject') {
        await axios.delete(`/api/subjects/${id}`);
        if (String(form.subjectId) === String(id)) {
          setForm((prev) => ({ ...prev, subjectId: '' }));
          setTopics([]);
        }
        fetchSubjects(form.gradeId);
      } else if (type === 'topic') {
        await axios.delete(`/api/topics/${id}`);
        fetchTopics(form.subjectId);
      }
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchSubject.toLowerCase()));
  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(searchTopic.toLowerCase()));

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ borderRadius: '12px', px: 3 }}
        >
          Go Back
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Step 1: Subject Management */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#e0f2fe', borderRadius: '10px', display: 'flex' }}>
                <SubjectIcon sx={{ color: '#0284c7' }} />
              </Box>
              <Typography variant="h5" fontWeight="700" sx={{ color: '#0f172a' }}>
                Add Subject
              </Typography>
            </Box>

            <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                Create New Subject
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Select Class"
                  value={form.gradeId}
                  onChange={(e) => setForm((prev) => ({ ...prev, gradeId: String(e.target.value) }))}
                  error={!!errors.gradeId}
                  helperText={errors.gradeId}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><School sx={{ color: '#94a3b8' }} /></InputAdornment>,
                  }}
                >
                  {grades.map((g) => (
                    <MenuItem key={g.id} value={String(g.id)}>
                      Class {g.level} - {g.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Subject Name"
                  placeholder="e.g. Advanced Mathematics"
                  value={form.subjectName}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjectName: e.target.value }))}
                  disabled={!form.gradeId}
                  error={!!errors.subjectName}
                  helperText={errors.subjectName}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Subject Description"
                  placeholder="Brief overview of the subject..."
                  value={form.subjectDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjectDescription: e.target.value }))}
                  disabled={!form.gradeId}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSubject}
                  disabled={loading || !form.gradeId}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Add Subject
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', border: '1px solid #e2e8f0' }}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="700">Subjects {selectedClass ? `for Class ${selectedClass.level}` : ''}</Typography>
                <TextField
                  size="small"
                  placeholder="Search..."
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ width: 160 }}
                />
              </Box>
              <List sx={{ p: 0, height: 400, overflow: 'auto' }}>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((s, index) => (
                    <React.Fragment key={s.id}>
                      <ListItem
                        onClick={() => setForm(prev => ({ ...prev, subjectId: String(s.id) }))}
                        sx={{
                          cursor: 'pointer',
                          transition: '0.2s',
                          bgcolor: String(form.subjectId) === String(s.id) ? '#eff6ff' : 'transparent',
                          '&:hover': { bgcolor: String(form.subjectId) === String(s.id) ? '#eff6ff' : '#f1f5f9' },
                          px: 3, py: 2
                        }}
                        secondaryAction={
                          <Box>
                            <IconButton onClick={(e) => { e.stopPropagation(); openEditDialog('subject', s); }} size="small" sx={{ color: '#64748b' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleDelete('subject', s.id); }} size="small" sx={{ color: '#ef4444' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={s.name}
                          secondary={s.description || 'No description provided'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                        />
                      </ListItem>
                      {index < filteredSubjects.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>
                    <SubjectIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography>No subjects found</Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Stack>
        </Grid>

        {/* Step 2: Topic Management */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: '10px', display: 'flex' }}>
                <TopicIcon sx={{ color: '#dc2626' }} />
              </Box>
              <Typography variant="h5" fontWeight="700" sx={{ color: '#0f172a' }}>
                Add Topic
              </Typography>
            </Box>

            <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                Add Topic to {selectedSubject ? selectedSubject.name : 'Selected Subject'}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Current Subject"
                  value={form.subjectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjectId: String(e.target.value) }))}
                  disabled={!form.gradeId}
                  error={!!errors.subjectId}
                  helperText={errors.subjectId}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SubjectIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                  }}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Topic Title"
                  placeholder="e.g. Introduction to Calculus"
                  value={form.topicName}
                  onChange={(e) => setForm((prev) => ({ ...prev, topicName: e.target.value }))}
                  disabled={!form.subjectId}
                  error={!!errors.topicName}
                  helperText={errors.topicName}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Topic Description"
                  placeholder="Brief overview of what will be covered..."
                  value={form.topicDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, topicDescription: e.target.value }))}
                  disabled={!form.subjectId}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateTopic}
                  disabled={loading || !form.subjectId}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)'
                  }}
                >
                  Add Topic
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', border: '1px solid #e2e8f0' }}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="700">Topics {selectedSubject ? `in ${selectedSubject.name}` : ''}</Typography>
                <TextField
                  size="small"
                  placeholder="Search..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ width: 160 }}
                />
              </Box>
              <List sx={{ p: 0, height: 400, overflow: 'auto' }}>
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((t, index) => (
                    <React.Fragment key={t.id}>
                      <ListItem
                        sx={{ px: 3, py: 2 }}
                        secondaryAction={
                          <Box>
                            <IconButton onClick={() => openEditDialog('topic', t)} size="small" sx={{ color: '#64748b' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => handleDelete('topic', t.id)} size="small" sx={{ color: '#ef4444' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={t.name}
                          secondary={t.description || 'No description provided'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                        />
                      </ListItem>
                      {index < filteredTopics.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>
                    <TopicIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography>No topics found</Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={closeEditDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit {editDialog.type === 'subject' ? 'Subject' : 'Topic'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField 
            label="Name" 
            fullWidth
            value={editDialog.values.name || ''} 
            onChange={(e) => setEditDialog((prev) => ({ ...prev, values: { ...prev.values, name: e.target.value } }))} 
            error={!!editErrors.name} 
            helperText={editErrors.name} 
          />
          <TextField 
            label="Description" 
            fullWidth
            multiline 
            rows={4} 
            value={editDialog.values.description || ''} 
            onChange={(e) => setEditDialog((prev) => ({ ...prev, values: { ...prev.values, description: e.target.value } }))} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeEditDialog} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditSave} 
            disabled={loading}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 700 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TopicManager;
