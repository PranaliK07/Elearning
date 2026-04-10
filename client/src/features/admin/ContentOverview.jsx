import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Add, Edit, Delete, Source as ContentOverviewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const ContentOverview = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const contentRes = await api.get('/api/content');

      let contentData = [];

      if (Array.isArray(contentRes.data)) {
        contentData = contentRes.data;
      } else if (contentRes.data?.contents) {
        contentData = contentRes.data.contents;
      } else if (contentRes.data?.content) {
        contentData = contentRes.data.content;
      } else if (contentRes.data?.data) {
        contentData = contentRes.data.data;
      } else if (contentRes.data?.items) {
        contentData = contentRes.data.items;
      } else if (contentRes.data?.lessons) {
        contentData = contentRes.data.lessons;
      } else if (contentRes.data?.courses) {
        contentData = contentRes.data.courses;
      } else if (contentRes.data?.materials) {
        contentData = contentRes.data.materials;
      } else if (typeof contentRes.data === 'object' && contentRes.data !== null) {
        if (contentRes.data.id || contentRes.data._id) {
          contentData = [contentRes.data];
        }
      }

      setContent(contentData);
    } catch (contentErr) {
      if (contentErr?.response?.status !== 404) {
        toast.error('Failed to fetch content data');
      }
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    try {
      await api.delete(`/api/content/${contentToDelete}`);
      setContent((prev) => prev.filter((c) => c.id !== contentToDelete && c._id !== contentToDelete));
      toast.success('Content deleted successfully');
    } catch (err) {
      toast.error('Failed to delete content');
    } finally {
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    }
  };

  const openDeleteDialog = (id) => {
    setContentToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <ContentOverviewIcon color="primary" />
            <Typography variant="h6">Content Management</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/content/create')}
          >
            Add Content
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Views/Attempts</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          No content available
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => navigate('/content/create')}
                          sx={{ mt: 1 }}
                        >
                          Create your first content
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((item) => (
                    <TableRow key={item.id || item._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {item.title || item.name || 'Untitled'}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {item.description.substring(0, 60)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.type || item.contentType || 'unknown'}
                          size="small"
                          color={
                            item.type === 'video'
                              ? 'primary'
                              : item.type === 'quiz'
                                ? 'warning'
                                : item.type === 'assignment'
                                  ? 'success'
                                  : item.type === 'reading'
                                    ? 'info'
                                    : 'secondary'
                          }
                        />
                      </TableCell>
                      <TableCell>{item.Grade ? `Class ${item.Grade.level}` : (item.grade || item.gradeLevel || 'N/A')}</TableCell>
                      <TableCell>{item.Subject?.name || item.subject || 'N/A'}</TableCell>
                      <TableCell>{item.views || item.attempts || item.downloads || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isPublished ? 'published' : (item.status || 'draft')}
                          size="small"
                          color={
                            (item.isPublished || item.status === 'published')
                              ? 'success'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/content/edit/${item.id || item._id}`)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(item.id || item._id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {content.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Content Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{content.filter((c) => c.type === 'video' || c.contentType === 'video').length}</Typography>
                    <Typography variant="caption">Videos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{content.filter((c) => c.type === 'quiz' || c.contentType === 'quiz').length}</Typography>
                    <Typography variant="caption">Quizzes</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{content.filter((c) => c.type === 'assignment' || c.contentType === 'assignment').length}</Typography>
                    <Typography variant="caption">Assignments</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{content.filter((c) => c.type === 'reading' || c.contentType === 'reading').length}</Typography>
                    <Typography variant="caption">Study Materials</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{content.filter((c) => c.status === 'published').length}</Typography>
                    <Typography variant="caption">Published</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {"Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this content? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteContent} 
            variant="contained" 
            color="error" 
            autoFocus
            startIcon={<Delete />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContentOverview;
