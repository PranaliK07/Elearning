import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    InputAdornment,
    Tooltip,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Delete,
    Edit,
    Search,
    Movie,
    Quiz as QuizIcon,
    Description,
    ExpandMore,
    School,
    Visibility,
    Refresh
} from '@mui/icons-material';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UploadedContent = () => {
    const navigate = useNavigate();
    const [fetching, setFetching] = useState(false);
    const [allContent, setAllContent] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedClass, setExpandedClass] = useState(null);

    const fetchAllContent = useCallback(async () => {
        try {
            setFetching(true);
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

            setAllContent([...contentData, ...quizData]);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load content');
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchAllContent();
    }, [fetchAllContent]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this lesson permanently?')) return;
        try {
            await axios.delete(`/api/content/${id}`);
            toast.success('Lesson deleted');
            fetchAllContent();
        } catch (err) { toast.error('Delete failed'); }
    };

    // Group content by Class (Grade)
    const groupedContent = useMemo(() => {
        const filtered = allContent.filter(item => 
            item.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups = {};
        filtered.forEach(item => {
            const classKey = item.Grade?.name || `Class ${item.Grade?.level}` || 'Unassigned';
            if (!groups[classKey]) groups[classKey] = [];
            groups[classKey].push(item);
        });
        return groups;
    }, [allContent, searchTerm]);

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Uploaded Content</Typography>
                    <Typography variant="body1" color="textSecondary">Class-wise view of all your lessons and materials</Typography>
                </Box>
                <Button variant="contained" startIcon={<Refresh />} onClick={fetchAllContent}>Refresh Data</Button>
            </Box>

            <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by lesson title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {fetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : Object.keys(groupedContent).length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h6" color="textSecondary">No uploaded content found</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {Object.entries(groupedContent).map(([className, content]) => (
                        <Accordion 
                            key={className} 
                            expanded={expandedClass === className}
                            onChange={() => setExpandedClass(expandedClass === className ? null : className)}
                            sx={{ borderRadius: '16px !important', overflow: 'hidden', boxShadow: 2 }}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'rgba(11,31,59,0.02)', px: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#0B1F3B' }}><School /></Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">{className}</Typography>
                                        <Typography variant="caption" color="textSecondary">{content.length} Lessons Uploaded</Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Lesson Title</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Subject / Topic</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {content.map((item) => (
                                                <TableRow key={item.id} hover>
                                                    <TableCell sx={{ pl: 3 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">{item.title}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            size="small"
                                                            icon={item.type === 'video' ? <Movie /> : item.type === 'quiz' ? <QuizIcon /> : <Description />}
                                                            label={item.type?.toUpperCase()}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{item.Subject?.name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{item.topicName || 'General'}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ pr: 3 }}>
                                                        <Tooltip title="View Content"><IconButton size="small"><Visibility /></IconButton></Tooltip>
                                                        <Tooltip title="Edit"><IconButton size="small"><Edit /></IconButton></Tooltip>
                                                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            )}
        </Container>
    );
};

export default UploadedContent;
