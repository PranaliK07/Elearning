import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  CardMedia,
  Paper
} from '@mui/material';
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import api from '../../utils/axios';
import { resolveUploadSrc } from '../../utils/media';
import toast from 'react-hot-toast';

const StudyMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudyMaterials();
  }, []);

  const fetchStudyMaterials = async () => {
    try {
      setLoading(true);
      // Fetch only reading materials
      const response = await api.get('/api/content?type=reading');
      setMaterials(response.data.contents || []);
    } catch (error) {
      console.error('Fetch study materials error:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.Subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.Topic?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (url) => {
    if (!url) {
      toast.error('Material URL not found');
      return;
    }
    window.open(resolveUploadSrc(url), '_blank');
  };

  const handleDownload = async (url, filename) => {
    if (!url) {
      toast.error('File not found');
      return;
    }
    
    try {
      const fullUrl = resolveUploadSrc(url);
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename || 'study-material.pdf');
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
      
      // Fallback to simple link if fetch fails
      const link = document.createElement('a');
      link.href = resolveUploadSrc(url);
      link.setAttribute('download', filename || 'study-material.pdf');
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FileIcon fontSize="large" /> Study Material
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Access and download your reading materials and PDF lessons
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 280, bgcolor: 'background.paper', borderRadius: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredMaterials.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}>
          <Box sx={{ opacity: 0.5, mb: 2 }}>
            <FileIcon sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="h6">No study materials found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try searching for something else or check back later for new uploads.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMaterials.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                }
              }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={resolveUploadSrc(item.thumbnail) || 'https://via.placeholder.com/300x140?text=Reading+Material'}
                  alt={item.title}
                  sx={{ bgcolor: 'grey.100' }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip 
                      label={item.Subject?.name || 'General'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 600 }}
                    />
                    {item.Grade && (
                      <Chip 
                        label={`Class ${item.Grade.level}`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.2 }}>
                    {item.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2
                  }}>
                    {item.description || 'No description available for this study material.'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.Topic?.name || 'Resource'}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<ViewIcon />}
                    onClick={() => handleOpen(item.readingMaterial)}
                    sx={{ borderRadius: 2 }}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => handleDownload(item.readingMaterial, `${item.title}.pdf`)}
                    sx={{ minWidth: 'fit-content', p: 1, borderRadius: 2 }}
                    aria-label="Download"
                  >
                    <DownloadIcon />
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default StudyMaterial;
