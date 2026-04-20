import React, { useEffect, useState, useCallback } from 'react';
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
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add, Edit, Delete, Source as ContentOverviewIcon, Refresh, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const UploadedContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      // Fetching both general content and quizzes to provide a complete overview
      const [contentRes, quizRes] = await Promise.all([
        axios.get('/api/content'),
        axios.get('/api/quiz')
      ]);

      const contentData = Array.isArray(contentRes.data.contents) 
        ? contentRes.data.contents 
        : (Array.isArray(contentRes.data) ? contentRes.data : []);
        
      const quizData = (Array.isArray(quizRes.data.quizzes) 
        ? quizRes.data.quizzes 
        : (Array.isArray(quizRes.data) ? quizRes.data : [])).map(q => ({
        ...q,
        type: 'quiz'
      }));

      setContent([...contentData, ...quizData]);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch uploaded content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    try {
      await axios.delete(`/api/content/${contentToDelete}`);
      setContent((prev) => prev.filter((c) => c.id !== contentToDelete));
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ContentOverviewIcon color="primary" fontSize="large" /> 
            Uploaded Content Hub
          </Typography>
          {!isMobile && <Typography variant="body1" color="textSecondary">Manage all your lessons, notes, and interactive quizzes in one place.</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchContent} disabled={loading}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/content-hub')}>New Lesson</Button>
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 1, sm: 3 }, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title & Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Target</TableCell>}
                  {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="textSecondary">No content found. Start by uploading a lesson!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">{item.title}</Typography>
                        {!isMobile && item.description && (
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.type?.toUpperCase()}
                          size="small"
                          color={item.type === 'video' ? 'primary' : item.type === 'quiz' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2">{item.Grade ? `Class ${item.Grade.level}` : 'N/A'}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.Subject?.name || 'No Subject'}</Typography>
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          <Chip
                            label={item.isPublished ? 'Live' : 'Draft'}
                            size="small"
                            color={item.isPublished ? 'success' : 'default'}
                          />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Tooltip title="View"><IconButton size="small"><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/content/edit/${item.id}`)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDeleteDialog(item.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {content.length > 0 && !loading && (
          <Box sx={{ mt: 5 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>Hub Analytics</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Videos', count: content.filter(c => c.type === 'video').length, color: theme.palette.primary.main },
                { label: 'Quizzes', count: content.filter(c => c.type === 'quiz').length, color: theme.palette.warning.main },
                { label: 'Study Materials', count: content.filter(c => c.type === 'reading').length, color: theme.palette.info.main },
                { label: 'Published Content', count: content.filter(c => c.isPublished).length, color: theme.palette.success.main }
              ].map((stat, idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Card variant="outlined" sx={{ borderRadius: 3, borderTop: `4px solid ${stat.color}` }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" fontWeight="900" sx={{ color: stat.color }}>{stat.count}</Typography>
                      <Typography variant="caption" fontWeight="bold" color="textSecondary">{stat.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold">Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this content? This action will remove it permanently for all students.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteContent} variant="contained" color="error" startIcon={<Delete />}>Permanently Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UploadedContent;
