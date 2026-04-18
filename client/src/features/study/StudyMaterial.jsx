import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    CircularProgress,
    IconButton,
    Chip,
    InputAdornment,
    Tooltip,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Stack,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Description as FileIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    ExpandMore,
    School,
    Refresh,
    MenuBook
} from '@mui/icons-material';
import api from '../../utils/axios';
import { resolveUploadSrc } from '../../utils/media';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const StudyMaterial = () => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedClass, setExpandedClass] = useState(null);

    const fetchStudyMaterials = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch only reading materials (notes)
            const response = await api.get('/api/content?type=reading');
            const data = Array.isArray(response.data.contents) ? response.data.contents : [];
            setMaterials(data);
        } catch (error) {
            console.error('Fetch notes error:', error);
            toast.error('Failed to load notes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudyMaterials();
    }, [fetchStudyMaterials]);

    const handleOpen = (url) => {
        if (!url) return toast.error('File not found');
        window.open(resolveUploadSrc(url), '_blank');
    };

    const handleDownload = (url, filename) => {
        if (!url) return toast.error('File not found');
        const link = document.createElement('a');
        link.href = resolveUploadSrc(url);
        link.setAttribute('download', filename || 'notes.pdf');
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Group materials
    const groupedMaterials = useMemo(() => {
        const filtered = materials.filter(item =>
            item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.Subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {};
        filtered.forEach(item => {
            const groupKey = user?.role === 'student' 
                ? (item.Subject?.name || 'General Resources')
                : (item.Grade?.name || `Class ${item.Grade?.level}` || 'General Resources');
                
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
        });
        return groups;
    }, [materials, searchQuery, user?.role]);

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#0B1F3B', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FileIcon fontSize="large" /> Notes
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Browse and download study materials {user?.role === 'student' ? 'subject-wise' : 'class-wise'}
                    </Typography>
                </Box>
                <Button startIcon={<Refresh />} onClick={fetchStudyMaterials}>Refresh</Button>
            </Box>

            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <TextField
                    fullWidth
                    placeholder="Search by note title or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : Object.keys(groupedMaterials).length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <FileIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">No notes found</Typography>
                </Paper>
            ) : (
                <Stack spacing={3}>
                    {Object.entries(groupedMaterials).sort().map(([groupName, content]) => (
                        <Accordion 
                            key={groupName} 
                            defaultExpanded={Object.keys(groupedMaterials).length === 1}
                            sx={{ borderRadius: '16px !important', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'rgba(11,31,59,0.02)', px: 3, py: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#B0125B' }}>
                                        {user?.role === 'student' ? <MenuBook /> : <School />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">{groupName}</Typography>
                                        <Typography variant="caption" color="textSecondary">{content.length} PDF Materials Available</Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: '#fafafa', p: 3 }}>
                                <Grid container spacing={3}>
                                    {content.map((item) => (
                                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.id}>
                                            <Card sx={{ 
                                                height: '100%', 
                                                borderRadius: 3,
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'translateY(-5px)' }
                                            }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Chip label={item.Subject?.name || 'General'} size="small" color="primary" variant="outlined" />
                                                        <FileIcon color="action" />
                                                    </Box>
                                                    <Typography variant="h6" fontWeight="bold" gutterBottom>{item.title}</Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ 
                                                        display: '-webkit-box', 
                                                        WebkitLineClamp: 2, 
                                                        WebkitBoxOrient: 'vertical', 
                                                        overflow: 'hidden',
                                                        minHeight: 40 
                                                    }}>
                                                        {item.description || 'Quick access to study materials and notes.'}
                                                    </Typography>
                                                </CardContent>
                                                <CardActions sx={{ p: 2, pt: 0 }}>
                                                    <Button 
                                                        fullWidth 
                                                        variant="contained" 
                                                        startIcon={<ViewIcon />}
                                                        onClick={() => handleOpen(item.readingMaterial)}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        View PDF
                                                    </Button>
                                                    <Tooltip title="Download">
                                                        <IconButton 
                                                            variant="outlined" 
                                                            onClick={() => handleDownload(item.readingMaterial, `${item.title}.pdf`)}
                                                            sx={{ borderRadius: 2, border: '1px solid #ddd' }}
                                                        >
                                                            <DownloadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            )}
        </Container>
    );
};

export default StudyMaterial;
