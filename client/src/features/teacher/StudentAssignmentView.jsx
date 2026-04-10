import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack, Assignment, CloudUpload, TaskAlt, InsertDriveFile } from '@mui/icons-material';
import axios from '../../utils/axios.js';
import { toast } from 'react-hot-toast';
import { validateRequiredText } from '../../utils/validation';

const StudentAssignmentView = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  async function fetchAssignmentDetails() {
    try {
      setLoading(true);
      const [assignmentRes, submissionRes] = await Promise.all([
        axios.get(`/api/assignments/${assignmentId}`),
        axios.get(`/api/assignments/${assignmentId}/my-submission`)
      ]);

      setAssignment(assignmentRes.data || null);
      setSubmission(submissionRes.data || null);
      setContent(submissionRes.data?.content || '');
      setFileUrl(submissionRes.data?.fileUrl || '');
    } catch {
      toast.error('Failed to load assignment');
      setAssignment(null);
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const handleSubmit = async () => {
    const hasText = content && content.trim().length >= 1;
    if (!hasText && !fileUrl) {
      const err = 'Add some text or upload a file before submitting';
      setContentError(err);
      toast.error(err);
      return;
    }
    const error = hasText ? validateRequiredText(content, 'Submission', 10) : '';
    setContentError(error);
    if (error) return;
    try {
      await axios.post(`/api/assignments/${assignmentId}/submissions`, { content: content.trim(), fileUrl });
      toast.success('Assignment submitted successfully!');
      fetchAssignmentDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  const handleFileUpload = async (file) => {
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
      setUploading(true);
      const { data } = await axios.post('/api/upload/assignment', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileUrl(data.fileUrl);
      toast.success('File uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Box p={4} textAlign="center"><Typography>Loading assignment...</Typography></Box>;
  if (!assignment) return <Box p={4} textAlign="center"><Typography>Assignment not found</Typography></Box>;

  const isGraded = submission?.status === 'graded';
  const alreadySubmitted = !!submission;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Typography variant="h4" fontWeight="bold">Assignment Details</Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 4, mb: 4, borderTop: '8px solid #0B1F3B' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>{assignment.title}</Typography>
                <Chip label={assignment.Subject?.name || 'Subject'} size="small" sx={{ mr: 1, bgcolor: 'primary.light', color: 'white' }} />
                <Chip label={`Due: ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}`} variant="outlined" size="small" />
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}><Assignment fontSize="large" /></Avatar>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Instructions</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {assignment.description || 'No instructions provided.'}
            </Typography>
            {assignment.attachmentUrl && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsertDriveFile color="primary" />
                <Button variant="text" onClick={() => window.open(assignment.attachmentUrl, '_blank')}>
                  View attached file
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {isGraded ? (
        <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'success.50', border: '2px solid #4caf50' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TaskAlt color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" color="success.main" fontWeight="bold">Graded!</Typography>
              <Typography variant="body1">Your submission has been reviewed.</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Grade</Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">{submission.grade}/100</Typography>

            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Teacher's Feedback</Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic', bgcolor: 'white', p: 2, borderRadius: 2, mt: 1 }}>
              "{submission.feedback || 'Great work!'}"
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h6" gutterBottom>{alreadySubmitted ? 'Submitted Content' : 'Your Submission'}</Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder="Type your answer here or paste a link to your document..."
            variant="outlined"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setContentError('');
            }}
            sx={{ mb: 3 }}
            disabled={alreadySubmitted}
            error={!!contentError}
            helperText={contentError}
          />
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button
              startIcon={<CloudUpload />}
              variant="outlined"
              component="label"
              disabled={alreadySubmitted || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload PDF/Doc'}
              <input type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
            </Button>
            {fileUrl && (
              <>
                <Button variant="text" onClick={() => window.open(fileUrl, '_blank')}>View uploaded</Button>
                {!alreadySubmitted && (
                  <Button color="warning" variant="text" onClick={() => setFileUrl('')}>Remove</Button>
                )}
              </>
            )}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button variant="contained" size="large" disabled={( !content.trim() && !fileUrl) || alreadySubmitted} onClick={handleSubmit} sx={{ px: 4, borderRadius: 5 }}>
              {alreadySubmitted ? 'Submitted' : 'Submit Assignment'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default StudentAssignmentView;
