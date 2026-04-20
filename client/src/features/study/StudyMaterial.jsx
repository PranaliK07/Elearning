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
    CardActions,
    MenuItem
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
import { useProgress } from '../../context/ProgressContext';

const StudyMaterial = () => {
    const { user } = useAuth();
    const { updateProgress } = useProgress();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
    const [expandedSubject, setExpandedSubject] = useState(null);

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

    const trackNoteAccess = async (contentId) => {
        try {
            await updateProgress(contentId, {
                notesDownloaded: true,
                completed: true
            });
        } catch (error) {
            console.error('Track note access error:', error);
        }
    };

    const handleOpen = (url, contentId) => {
        if (!url) return toast.error('File not found');
        trackNoteAccess(contentId);
        window.open(resolveUploadSrc(url), '_blank');
    };

    const handleDownload = async (url, filename, contentId) => {
        if (!url) return toast.error('File not found');
        trackNoteAccess(contentId);
        
        try {
            const fullUrl = resolveUploadSrc(url);
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'study_notes.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.success('Download started!');
        } catch (error) {
            console.error('Download error:', error);
            // Fallback: Try opening in a new tab if blob download fails
            window.open(resolveUploadSrc(url), '_blank');
            toast.success('Opening in new tab...');
        }
    };

    // Group materials by Subject and then by Topic
    const groupedMaterials = useMemo(() => {
        const filtered = materials.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 item.Subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSubject = selectedSubjectFilter === 'all' || item.Subject?.id?.toString() === selectedSubjectFilter;
            return matchesSearch && matchesSubject;
        });

        const subjectGroups = {};
        filtered.forEach(item => {
            const subjectName = item.Subject?.name || 'General Resources';
            const subjectId = item.Subject?.id || 'general';
            
            if (!subjectGroups[subjectId]) {
                subjectGroups[subjectId] = {
                    name: subjectName,
                    notes: []
                };
            }
            subjectGroups[subjectId].notes.push(item);
        });

        return subjectGroups;
    }, [materials, searchQuery, selectedSubjectFilter]);

    const subjectsList = useMemo(() => {
        const uniqueSubjects = {};
        materials.forEach(m => {
            if (m.Subject) uniqueSubjects[m.Subject.id] = m.Subject.name;
        });
        return Object.entries(uniqueSubjects).map(([id, name]) => ({ id, name }));
    }, [materials]);

    return (
        <Box sx={{ py: 4, px: 1 }}>
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

            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 1, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <TextField
                            fullWidth
                            placeholder="Find specific notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ ml: 1 }}>
                                        <SearchIcon color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        select
                        fullWidth
                        label="Filter by Subject"
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 3 }}
                    >
                        <MenuItem value="all">All Subjects</MenuItem>
                        {subjectsList.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : Object.keys(groupedMaterials).length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <FileIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">No notes available for the selected filters</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {Object.entries(groupedMaterials).map(([subjectId, group]) => (
                        <Accordion 
                            key={subjectId} 
                            expanded={expandedSubject === subjectId}
                            onChange={() => setExpandedSubject(expandedSubject === subjectId ? null : subjectId)}
                            sx={{ 
                                borderRadius: '16px !important', 
                                overflow: 'hidden', 
                                boxShadow: expandedSubject === subjectId ? 4 : 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: '0.3s'
                            }}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMore color="primary" />} 
                                sx={{ 
                                    background: expandedSubject === subjectId ? 'linear-gradient(135deg, rgba(176, 18, 91, 0.08) 0%, rgba(26, 35, 126, 0.08) 100%)' : 'white',
                                    px: 3, 
                                    py: 1,
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Avatar sx={{ bgcolor: '#1a237e', boxShadow: '0 4px 10px rgba(26, 35, 126, 0.2)' }}>
                                        {user?.role === 'student' ? <MenuBook /> : <School />}
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: expandedSubject === subjectId ? 'primary.dark' : 'text.primary' }}>
                                            {group.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Click to view {group.notes.length} Study Materials
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: '#fcfcfc', p: { xs: 2, sm: 4 } }}>
                                <Grid container spacing={3}>
                                    {group.notes.map((item) => (
                                        <Grid item xs={12} md={6} lg={4} key={item.id}>
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
                                                        onClick={() => handleOpen(item.readingMaterial, item.id)}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        View PDF
                                                    </Button>
                                                    <Tooltip title="Download">
                                                        <IconButton 
                                                            variant="outlined" 
                                                            onClick={() => handleDownload(item.readingMaterial, `${item.title}.pdf`, item.id)}
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
        </Box>
    );
};

export default StudyMaterial;
