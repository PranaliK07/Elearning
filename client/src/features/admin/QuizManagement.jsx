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
    Avatar,
    Stack,
    Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Delete,
    Edit,
    Search,
    Quiz as QuizIcon,
    School,
    PlayArrow,
    Refresh,
    FilterList
} from '@mui/icons-material';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const QuizManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            const subjectsRes = await api.get('/api/subjects');
            const subjectRows = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];

            // Flatten quizzes from all subjects and topics for a unified list
            const allQuizzes = await Promise.all(
                subjectRows.map(async (subject) => {
                    try {
                        const topicsRes = await api.get(`/api/subjects/${subject.id}/topics`);
                        const topics = Array.isArray(topicsRes.data) ? topicsRes.data : [];
                        return topics.flatMap(topic => {
                            const qs = Array.isArray(topic.Quizzes) ? topic.Quizzes : [];
                            return qs.map(q => ({
                                ...q,
                                topicName: topic.name,
                                subjectName: subject.name,
                                gradeLevel: subject.Grade?.level
                            }));
                        });
                    } catch (e) { return []; }
                })
            );

            setQuizzes(allQuizzes.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error('Fetch quizzes failed:', error);
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllQuizzes();
    }, [fetchAllQuizzes]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await api.delete(`/api/quiz/${id}`);
            toast.success('Quiz deleted successfully');
            fetchAllQuizzes();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter(q => 
            q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.topicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.subjectName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [quizzes, searchTerm]);

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Quiz Management</Typography>
                    <Typography variant="body1" color="textSecondary">Manage all interactive quizzes and student assessments</Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<Refresh />} 
                        onClick={fetchAllQuizzes}
                        sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<QuizIcon />}
                        onClick={() => navigate('/content/create')}
                        sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
                    >
                        New Quiz
                    </Button>
                </Stack>
            </Box>

            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search quizzes by title, topic, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
                />
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 3, overflow: 'hidden', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 600 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Quiz Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Topic / Subject</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Class</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Questions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={40} />
                                </TableCell>
                            </TableRow>
                        ) : filteredQuizzes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No quizzes found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQuizzes.map((quiz) => (
                                <TableRow key={quiz.id} hover>
                                    <TableCell sx={{ pl: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{quiz.title}</Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                            Created: {new Date(quiz.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{quiz.topicName}</Typography>
                                        <Chip 
                                            label={quiz.subjectName} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ mt: 0.5, fontSize: '0.7rem' }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={`Class ${quiz.gradeLevel || 'N/A'}`} 
                                            size="small"
                                            icon={<School sx={{ fontSize: '1rem !important' }} />}
                                            sx={{ bgcolor: '#0B1F3B', color: 'white' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="600">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip 
                                                    label={`${Array.isArray(quiz.questions) ? quiz.questions.length : 0} Questions`} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined" 
                                                />
                                            </Box>
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        <Tooltip title="Play Preview"><IconButton size="small" onClick={() => navigate(`/quiz/${quiz.id}/start`)}><PlayArrow color="primary" /></IconButton></Tooltip>
                                        <Tooltip title="Edit Quiz"><IconButton size="small"><Edit /></IconButton></Tooltip>
                                        <Tooltip title="Delete Quiz"><IconButton size="small" color="error" onClick={() => handleDelete(quiz.id)}><Delete /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default QuizManagement;
