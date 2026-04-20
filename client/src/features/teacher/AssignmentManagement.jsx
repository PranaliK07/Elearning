import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Assignment, Delete, Edit, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import {
  validateFutureOrTodayDate,
  validateRequiredText,
  validateSelectRequired
} from '../../utils/validation';

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  subjectId: '',
  gradeId: '',
  attachmentUrl: ''
};

const AssignmentManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  async function fetchAssignments() {
    try {
      const response = await axios.get('/api/assignments');
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error('Failed to fetch assignments');
    }
  }

  async function fetchMetadata() {
    try {
      const [subjectsRes, gradesRes] = await Promise.all([axios.get('/api/subjects'), axios.get('/api/grades')]);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setGrades(Array.isArray(gradesRes.data) ? gradesRes.data : []);
    } catch {
      toast.error('Failed to fetch metadata');
    }
  }

  useEffect(() => {
    fetchAssignments();
    fetchMetadata();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const closeDialog = (force = false) => {
    if (saving && !force) return;
    setOpen(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  const openEdit = (assignment) => {
    setEditing(assignment);
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : '',
      subjectId: assignment.subjectId || '',
      gradeId: assignment.gradeId || '',
      attachmentUrl: assignment.attachmentUrl || ''
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    const titleError = validateRequiredText(formData.title, 'Assignment title', 2);
    const descriptionError = validateRequiredText(formData.description, 'Description', 5);
    const subjectError = validateSelectRequired(formData.subjectId, 'Subject');
    const gradeError = validateSelectRequired(formData.gradeId, 'Grade');
    const dueDateError = validateFutureOrTodayDate(formData.dueDate, 'Due date');
    if (titleError) nextErrors.title = titleError;
    if (descriptionError) nextErrors.description = descriptionError;
    if (subjectError) nextErrors.subjectId = subjectError;
    if (gradeError) nextErrors.gradeId = gradeError;
    if (dueDateError) nextErrors.dueDate = dueDateError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    const title = formData.title.trim();

    try {
      setSaving(true);
      const payload = {
        ...formData,
        title,
        subjectId: formData.subjectId ? Number(formData.subjectId) : null,
        gradeId: formData.gradeId ? Number(formData.gradeId) : null
      };

      if (editing) {
        await axios.put(`/api/assignments/${editing.id}`, payload);
        toast.success('Assignment updated successfully');
      } else {
        await axios.post('/api/assignments', payload);
        toast.success('Assignment created successfully');
      }

      closeDialog(true);
      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAttachment = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      toast.error('Upload PDF, DOC, PPT, XLS, or image files');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB');
      return;
    }

    const form = new FormData();
    form.append('attachment', file);

    try {
      setUploadingFile(true);
      const { data } = await axios.post('/api/upload/assignment', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData((prev) => ({ ...prev, attachmentUrl: data.fileUrl }));
      toast.success('Attachment uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(`Delete assignment "${assignment.title}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/assignments/${assignment.id}`);
      toast.success('Assignment deleted successfully');
      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Assignments</Typography>
          <Typography variant="body1" color="textSecondary">Create and manage assignments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Assignment</Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isMobile ? (
          // ── Mobile Card Layout ──────────────────────────────────────
          <Box sx={{ p: 2 }}>
            {assignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Assignment sx={{ fontSize: 64, color: 'divider', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">No assignments found</Typography>
                <Button variant="text" onClick={openCreate} sx={{ mt: 1 }}>Create your first assignment</Button>
              </Box>
            ) : (
              assignments.map((assignment) => {
                const submissionCount = assignment.Submissions?.length || 0;
                const isCompleted = submissionCount > 0;
                return (
                  <Paper
                    key={assignment.id}
                    variant="outlined"
                    sx={{ p: 2, mb: 2, borderRadius: 2 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight="bold" noWrap>{assignment.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {assignment.Subject?.name || '—'} • {assignment.Grade?.name || '—'}
                        </Typography>
                      </Box>
                      <Chip
                        label={isCompleted ? 'Completed' : 'Pending'}
                        size="small"
                        color={isCompleted ? 'success' : 'warning'}
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }} flexWrap="wrap">
                      <Typography variant="caption" color="textSecondary">
                        Due: <strong>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Submissions: <strong>{submissionCount}</strong>
                      </Typography>
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {assignment.attachmentUrl && (
                          <Button size="small" variant="text" onClick={() => window.open(assignment.attachmentUrl, '_blank')}>
                            Attachment
                          </Button>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Submissions">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/assignments/${assignment.id}/submissions`)}><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => openEdit(assignment)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(assignment)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        ) : (
          // ── Desktop Table Layout ────────────────────────────────────
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Title</TableCell>
                  <TableCell sx={{ color: 'white' }}>Subject</TableCell>
                  <TableCell sx={{ color: 'white' }}>Grade</TableCell>
                  <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Attachment</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white' }}>Submissions</TableCell>
                  <TableCell align="right" sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell><Typography fontWeight="medium">{assignment.title}</Typography></TableCell>
                      <TableCell>{assignment.Subject?.name || '-'}</TableCell>
                      <TableCell>{assignment.Grade?.name || '-'}</TableCell>
                      <TableCell>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {assignment.attachmentUrl ? (
                          <Button size="small" variant="text" onClick={() => window.open(assignment.attachmentUrl, '_blank')}>
                            View
                          </Button>
                        ) : (
                          <Typography variant="body2" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(assignment.Submissions?.length || 0) > 0 ? 'Completed' : 'Pending'}
                          size="small"
                          color={(assignment.Submissions?.length || 0) > 0 ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.Submissions?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Submissions">
                          <IconButton color="primary" onClick={() => navigate(`/assignments/${assignment.id}/submissions`)}><Visibility /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton color="info" onClick={() => openEdit(assignment)}><Edit /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(assignment)}><Delete /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Assignment sx={{ fontSize: 64, color: 'divider', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary">No assignments found</Typography>
                      <Button variant="text" onClick={openCreate} sx={{ mt: 1 }}>Create your first assignment</Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Assignment Title" fullWidth value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors((prev) => ({ ...prev, title: '' })); }} error={!!errors.title} helperText={errors.title} />
            <TextField label="Description" fullWidth multiline rows={4} value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((prev) => ({ ...prev, description: '' })); }} error={!!errors.description} helperText={errors.description} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Subject" fullWidth value={formData.subjectId} onChange={(e) => { setFormData({ ...formData, subjectId: e.target.value }); setErrors((prev) => ({ ...prev, subjectId: '' })); }} error={!!errors.subjectId} helperText={errors.subjectId}>
                  {subjects.map((sub) => <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Grade" fullWidth value={formData.gradeId} onChange={(e) => { setFormData({ ...formData, gradeId: e.target.value }); setErrors((prev) => ({ ...prev, gradeId: '' })); }} error={!!errors.gradeId} helperText={errors.gradeId}>
                  {grades.map((grade) => <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={(e) => { setFormData({ ...formData, dueDate: e.target.value }); setErrors((prev) => ({ ...prev, dueDate: '' })); }} error={!!errors.dueDate} helperText={errors.dueDate} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                disabled={uploadingFile}
              >
                {uploadingFile ? 'Uploading...' : 'Attach PDF/Doc'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => handleUploadAttachment(e.target.files?.[0])}
                />
              </Button>
              {formData.attachmentUrl && (
                <>
                  <Button variant="text" onClick={() => window.open(formData.attachmentUrl, '_blank')}>View current</Button>
                  <Button color="warning" variant="text" onClick={() => setFormData((prev) => ({ ...prev, attachmentUrl: '' }))}>Remove</Button>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssignmentManagement;
