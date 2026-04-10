import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack, Grade, Visibility } from '@mui/icons-material';
import axios from '../../utils/axios.js';
import { toast } from 'react-hot-toast';
import { resolveAvatarSrc } from '../../utils/media';

const SubmissionsList = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });

  async function fetchSubmissions() {
    try {
      const [submissionsRes, assignmentRes] = await Promise.all([
        axios.get(`/api/assignments/${assignmentId}/submissions`),
        axios.get(`/api/assignments/${assignmentId}`)
      ]);
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      setAssignment(assignmentRes.data || null);
    } catch {
      toast.error('Failed to fetch submissions');
    }
  }

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const handleGrade = async () => {
    try {
      await axios.put(`/api/assignments/submissions/${selectedSubmission.id}/grade`, gradeData);
      toast.success('Graded successfully');
      setOpen(false);
      fetchSubmissions();
    } catch {
      toast.error('Failed to save grade');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Submissions: {assignment?.title || 'Loading...'}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Review and grade student submissions
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'secondary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Student</TableCell>
                <TableCell sx={{ color: 'white' }}>Submitted Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Attachment</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Grade</TableCell>
                <TableCell align="right" sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }} src={resolveAvatarSrc(sub.student?.avatar)}>{sub.student?.name?.charAt(0)}</Avatar>
                      <Box>
                        <Typography fontWeight="medium">{sub.student?.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{sub.student?.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {sub.fileUrl ? (
                    <Button size="small" variant="text" onClick={() => window.open(sub.fileUrl, '_blank')}>
                      Open
                    </Button>
                  ) : (
                    <Typography variant="body2" color="textSecondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={sub.status} 
                    size="small" 
                    color={sub.status === 'graded' ? 'success' : 'warning'} 
                  />
                  </TableCell>
                  <TableCell>{sub.grade ? `${sub.grade}/100` : 'Not graded'}</TableCell>
                  <TableCell align="right">
                    <Button
                      startIcon={<Grade />}
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setGradeData({ grade: sub.grade || '', feedback: sub.feedback || '' });
                        setOpen(true);
                      }}
                    >
                      Grade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="textSecondary">No submissions yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission - {selectedSubmission?.student?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedSubmission?.content && (
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Student Content:</Typography>
                <Typography variant="body2">{selectedSubmission.content}</Typography>
              </Box>
            )}
            {selectedSubmission?.fileUrl && (
              <Button variant="outlined" onClick={() => window.open(selectedSubmission.fileUrl, '_blank')}>
                View uploaded file
              </Button>
            )}
            <TextField
              label="Grade (out of 100)"
              type="number"
              fullWidth
              value={gradeData.grade}
              onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
            />
            <TextField
              label="Feedback"
              multiline
              rows={4}
              fullWidth
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGrade}>Submit Grade</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubmissionsList;
