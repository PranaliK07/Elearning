import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
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
  Card,
  CardMedia,
  LinearProgress
} from '@mui/material';
import { Edit, Delete, CloudUpload, Movie, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { validateRequiredText, validateSelectRequired } from '../../utils/validation';

const TopicManager = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({
    gradeId: '',
    subjectId: '',
    topicId: '',
    subjectName: '',
    topicName: '',
    topicDescription: ''
  });
  const [videoForm, setVideoForm] = useState({ title: '', description: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', item: null, values: {} });
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (form.gradeId) fetchSubjects(form.gradeId);
    else setSubjects([]);
    setForm((prev) => ({ ...prev, subjectId: '', topicId: '', subjectName: '', topicName: '', topicDescription: '' }));
    setTopics([]);
    setVideos([]);
  }, [form.gradeId]);

  useEffect(() => {
    if (form.subjectId) fetchTopics(form.subjectId);
    else setTopics([]);
    setForm((prev) => ({ ...prev, topicId: '', topicName: '', topicDescription: '' }));
    setVideos([]);
  }, [form.subjectId]);

  useEffect(() => {
    if (form.topicId) fetchVideos(form.topicId);
    else setVideos([]);
  }, [form.topicId]);

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

  const fetchVideos = async (topicId) => {
    try {
      const res = await axios.get(`/api/topics/${topicId}/contents`);
      const all = Array.isArray(res.data) ? res.data : [];
      setVideos(all.filter((c) => c.type === 'video'));
    } catch {
      toast.error('Unable to load videos');
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
      await axios.post('/api/subjects', { name: form.subjectName.trim(), gradeId: Number(form.gradeId), description: '' });
      toast.success('Subject added');
      setForm((prev) => ({ ...prev, subjectName: '' }));
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
      await axios.post('/api/topics', { name: form.topicName.trim(), description: form.topicDescription, subjectId: Number(form.subjectId) });
      toast.success('Topic added');
      setForm((prev) => ({ ...prev, topicName: '', topicDescription: '' }));
      fetchTopics(form.subjectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add topic');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleUploadVideo = async () => {
    if (!form.gradeId || !form.subjectId || !form.topicId) {
      return toast.error('Select class, subject, and topic');
    }
    if (!videoForm.title.trim()) {
      return toast.error('Enter a video title');
    }
    if (!videoFile) {
      return toast.error('Select a video file');
    }
    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('video', videoFile);
      if (thumbnailFile) uploadData.append('thumbnail', thumbnailFile);

      const uploadRes = await axios.post('/api/upload/content', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      const videoUrl = uploadRes.data.videoUrl || '';
      const thumbnailUrl = uploadRes.data.thumbnailUrl || '';

      await axios.post('/api/content', {
        title: videoForm.title.trim(),
        type: 'video',
        description: videoForm.description,
        gradeId: Number(form.gradeId),
        subjectId: Number(form.subjectId),
        topicId: Number(form.topicId),
        videoUrl: videoUrl,
        videoFile: videoUrl,
        thumbnail: thumbnailUrl
      });

      toast.success('Video uploaded');
      setVideoForm({ title: '', description: '' });
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview(null);
      setThumbnailPreview(null);
      setUploadProgress(0);
      fetchVideos(form.topicId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (type, item) => {
    setEditDialog({ open: true, type, item, values: { name: item?.name || item?.title || '', description: item?.description || '' } });
  };

  const closeEditDialog = () => setEditDialog({ open: false, type: '', item: null, values: {} });

  const handleEditSave = async () => {
    if (!editDialog.item) return;
    const nameError = validateRequiredText(editDialog.values.name, editDialog.type === 'video' ? 'Video title' : 'Name', 2);
    if (nameError) {
      setEditErrors({ name: nameError });
      return toast.error(nameError);
    }
    try {
      setLoading(true);
      if (editDialog.type === 'subject') {
        await axios.put(`/api/subjects/${editDialog.item.id}`, { name: editDialog.values.name, description: editDialog.values.description });
        fetchSubjects(form.gradeId);
      } else if (editDialog.type === 'topic') {
        await axios.put(`/api/topics/${editDialog.item.id}`, { name: editDialog.values.name, description: editDialog.values.description, subjectId: Number(form.subjectId) });
        fetchTopics(form.subjectId);
      } else if (editDialog.type === 'video') {
        await axios.put(`/api/content/${editDialog.item.id}`, {
          title: editDialog.values.name,
          description: editDialog.values.description,
          topicId: Number(form.topicId),
          subjectId: Number(form.subjectId),
          gradeId: Number(form.gradeId)
        });
        fetchVideos(form.topicId);
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
    try {
      setLoading(true);
      if (type === 'subject') {
        await axios.delete(`/api/subjects/${id}`);
        setForm((prev) => ({ ...prev, subjectId: '', topicId: '' }));
        setTopics([]);
        setVideos([]);
        fetchSubjects(form.gradeId);
      } else if (type === 'topic') {
        await axios.delete(`/api/topics/${id}`);
        setForm((prev) => ({ ...prev, topicId: '' }));
        setVideos([]);
        fetchTopics(form.subjectId);
      } else if (type === 'video') {
        await axios.delete(`/api/content/${id}`);
        fetchVideos(form.topicId);
      }
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight="bold">Manage Subjects, Topics & Videos</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Class"
              value={form.gradeId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, gradeId: String(e.target.value) }));
                setErrors((prev) => ({ ...prev, gradeId: '' }));
              }}
              error={!!errors.gradeId}
              helperText={errors.gradeId}
            >
              {grades.map((g) => (
                <MenuItem key={g.id} value={String(g.id)}>
                  Class {g.level} - {g.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TextField fullWidth label="New Subject" value={form.subjectName} onChange={(e) => { setForm((prev) => ({ ...prev, subjectName: e.target.value })); setErrors((prev) => ({ ...prev, subjectName: '' })); }} disabled={!form.gradeId} error={!!errors.subjectName} helperText={errors.subjectName} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth sx={{ height: '56px' }} onClick={handleCreateSubject} disabled={loading || !form.gradeId}>Add Subject</Button>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Subject"
              value={form.subjectId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, subjectId: String(e.target.value) }));
                setErrors((prev) => ({ ...prev, subjectId: '' }));
              }}
              disabled={!form.gradeId}
              error={!!errors.subjectId}
              helperText={errors.subjectId}
            >
              {subjects.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="New Topic" value={form.topicName} onChange={(e) => { setForm((prev) => ({ ...prev, topicName: e.target.value })); setErrors((prev) => ({ ...prev, topicName: '' })); }} disabled={!form.subjectId} error={!!errors.topicName} helperText={errors.topicName} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth sx={{ height: '56px' }} onClick={handleCreateTopic} disabled={loading || !form.subjectId}>Add Topic</Button>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Topic Description" value={form.topicDescription} onChange={(e) => setForm((prev) => ({ ...prev, topicDescription: e.target.value }))} disabled={!form.subjectId} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Topic (for videos list)"
              value={form.topicId}
              onChange={(e) => setForm((prev) => ({ ...prev, topicId: String(e.target.value) }))}
              disabled={!form.subjectId}
            >
              {topics.map((t) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Upload Video</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Video Title"
              value={videoForm.title}
              onChange={(e) => setVideoForm((prev) => ({ ...prev, title: e.target.value }))}
              disabled={!form.topicId}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Description"
              value={videoForm.description}
              onChange={(e) => setVideoForm((prev) => ({ ...prev, description: e.target.value }))}
              disabled={!form.topicId}
            />
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.default',
                position: 'relative'
              }}
            >
              <input
                type="file"
                accept="video/*"
                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                onChange={handleVideoFileChange}
                disabled={!form.topicId}
              />
              {videoPreview ? (
                <Box>
                  <Movie sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography>{videoFile?.name}</Typography>
                  <Button size="small" color="error" onClick={() => { setVideoPreview(null); setVideoFile(null); }}>
                    Remove
                  </Button>
                </Box>
              ) : (
                <Box>
                  <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography>Click or drag video file to upload</Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Thumbnail (optional)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {thumbnailPreview ? (
                <Card sx={{ width: 140, position: 'relative' }}>
                  <CardMedia component="img" height="90" image={thumbnailPreview} />
                  <Button size="small" color="error" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }}>
                    Remove
                  </Button>
                </Card>
              ) : (
                <Box
                  sx={{
                    width: 140,
                    height: 90,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CloudUpload sx={{ color: 'text.secondary' }} />
                </Box>
              )}
              <Button variant="outlined" component="label" disabled={!form.topicId}>
                Select Image
                <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
              </Button>
            </Box>
          </Grid>

          {uploading && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" gutterBottom>Uploading: {uploadProgress}%</Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CheckCircle />}
              onClick={handleUploadVideo}
              disabled={uploading || !form.topicId}
              sx={{ height: 52 }}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Subjects</Typography>
            <List dense>
              {subjects.map((s) => (
                <React.Fragment key={s.id}>
                  <ListItem
                    secondaryAction={<>
                      <Tooltip title="Edit"><IconButton edge="end" onClick={() => openEditDialog('subject', s)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton edge="end" color="error" onClick={() => handleDelete('subject', s.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </>}
                  >
                    <ListItemText primary={s.name} secondary={`Class ${s.GradeId || form.gradeId}`} />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Topics {selectedSubject ? `in ${selectedSubject.name}` : ''}</Typography>
            <List dense>
              {topics.map((t) => (
                <React.Fragment key={t.id}>
                  <ListItem
                    secondaryAction={<>
                      <Tooltip title="Edit"><IconButton edge="end" onClick={() => openEditDialog('topic', t)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton edge="end" color="error" onClick={() => handleDelete('topic', t.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </>}
                  >
                    <ListItemText primary={t.name} secondary={t.description || 'No description'} />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Videos in Topic</Typography>
            <List dense>
              {videos.map((v) => (
                <React.Fragment key={v.id}>
                  <ListItem
                    secondaryAction={<>
                      <Tooltip title="Edit"><IconButton edge="end" onClick={() => openEditDialog('video', v)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton edge="end" color="error" onClick={() => handleDelete('video', v.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </>}
                  >
                    <ListItemText
                      primary={v.title}
                      secondary={<Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}><Chip size="small" label={selectedSubject?.name || 'Subject'} /><Chip size="small" label={topics.find((t) => Number(t.id) === Number(form.topicId))?.name || 'Topic'} /></Box>}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={editDialog.open} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit {editDialog.type}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label={editDialog.type === 'video' ? 'Video Title' : 'Name'} value={editDialog.values.name || ''} onChange={(e) => { setEditDialog((prev) => ({ ...prev, values: { ...prev.values, name: e.target.value } })); setEditErrors((prev) => ({ ...prev, name: '' })); }} error={!!editErrors.name} helperText={editErrors.name} />
          <TextField label="Description" multiline rows={3} value={editDialog.values.description || ''} onChange={(e) => setEditDialog((prev) => ({ ...prev, values: { ...prev.values, description: e.target.value } }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TopicManager;
