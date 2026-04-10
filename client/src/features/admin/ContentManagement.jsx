import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    MenuItem,
    CircularProgress,
    IconButton,
    Card,
    CardMedia,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    CloudUpload,
    Movie,
    Description,
    Quiz,
    ArrowBack,
    Delete,
    CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import {
    validateImageFile,
    validateRequiredText,
    validateSelectRequired,
    validateVideoFile
} from '../../utils/validation';

const ContentManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        type: 'video',
        description: '',
        gradeId: '',
        subjectId: '',
        topicId: '',
        isPremium: false,
        isPublished: true,
        order: 0
    });

    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [readingFile, setReadingFile] = useState(null);
    const [readingPreview, setReadingPreview] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [topicDialogOpen, setTopicDialogOpen] = useState(false);
    const [newTopic, setNewTopic] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [topicErrors, setTopicErrors] = useState({});

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        if (formData.gradeId) fetchSubjects(formData.gradeId);
    }, [formData.gradeId]);

    useEffect(() => {
        if (formData.subjectId) fetchTopics(formData.subjectId);
    }, [formData.subjectId]);

    const fetchGrades = async () => {
        try {
            const res = await axios.get('/api/grades');
            setGrades(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubjects = async (gradeId) => {
        try {
            setSubjectsLoading(true);
            const res = await axios.get(`/api/subjects?gradeId=${gradeId}`);
            setSubjects(res.data);
            // reset dependent selects
            setFormData((prev) => ({ ...prev, subjectId: '', topicId: '' }));
            setTopics([]);
        } catch (err) {
            console.error(err);
            toast.error('Unable to load subjects for this class');
        } finally {
            setSubjectsLoading(false);
        }
    };

    const fetchTopics = async (subjectId) => {
        try {
            setTopicsLoading(true);
            const res = await axios.get(`/api/topics?subjectId=${subjectId}`);
            setTopics(res.data);
            // reset topic selection so user picks from fresh list
            setFormData((prev) => ({ ...prev, topicId: '' }));
        } catch (err) {
            console.error(err);
            toast.error('Unable to load topics for this subject');
        } finally {
            setTopicsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (e.target.name === 'video') {
            const fileError = file ? validateVideoFile(file) : '';
            if (fileError) {
                setErrors((prev) => ({ ...prev, video: fileError }));
                return;
            }
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, video: '' }));
        } else if (e.target.name === 'reading') {
            const fileError = file ? (file.type !== 'application/pdf' ? 'Only PDF files are allowed' : '') : '';
            if (fileError) {
                setErrors((prev) => ({ ...prev, reading: fileError }));
                return;
            }
            setReadingFile(file);
            setReadingPreview(file.name);
            setErrors((prev) => ({ ...prev, reading: '' }));
        } else {
            const fileError = validateImageFile(file, 'Thumbnail');
            if (fileError) {
                setErrors((prev) => ({ ...prev, thumbnail: fileError }));
                return;
            }
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, thumbnail: '' }));
        }
    };

    const handleCreateTopic = async () => {
        if (!formData.subjectId) {
            return toast.error('Select a subject first');
        }
        if (!newTopic.name.trim()) {
            const nameError = validateRequiredText(newTopic.name, 'Topic name', 2);
            setTopicErrors({ name: nameError });
            return toast.error(nameError);
        }
        try {
            const payload = {
                name: newTopic.name.trim(),
                description: newTopic.description,
                subjectId: parseInt(formData.subjectId, 10)
            };
            const res = await axios.post('/api/topics', payload);
            toast.success('Topic created');
            // refresh topics and select the new one
            await fetchTopics(formData.subjectId);
            setFormData((prev) => ({ ...prev, topicId: res.data.topic?.id || '' }));
            setTopicDialogOpen(false);
            setNewTopic({ name: '', description: '' });
            setTopicErrors({});
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create topic');
        }
    };

    const parseQuizDescription = (text = '') => {
        const lines = String(text)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        let current = null;
        const questions = [];
        let timeLimit = null;
        let passingScore = null;
        let maxAttempts = null;

        const flushCurrent = () => {
            if (!current) return;
            if (current.question && current.options.length >= 2 && current.correctAnswer) {
                questions.push(current);
            }
            current = null;
        };

        const parseMetaLine = (label, line) => {
            if (!line.toLowerCase().startsWith(label)) return null;
            const rawValue = line.split(':').slice(1).join(':').trim();
            const numeric = Number(rawValue);
            return Number.isFinite(numeric) ? numeric : null;
        };

        for (const line of lines) {
            const parsedTimeLimit = parseMetaLine('time limit', line);
            if (parsedTimeLimit !== null) {
                timeLimit = parsedTimeLimit;
                continue;
            }

            const parsedPassingScore = parseMetaLine('passing score', line);
            if (parsedPassingScore !== null) {
                passingScore = parsedPassingScore;
                continue;
            }

            const parsedMaxAttempts = parseMetaLine('max attempts', line);
            if (parsedMaxAttempts !== null) {
                maxAttempts = parsedMaxAttempts;
                continue;
            }

            if (/^q[:.)-]/i.test(line)) {
                flushCurrent();
                current = {
                    question: line.replace(/^q[:.)-]\s*/i, '').trim(),
                    options: [],
                    correctAnswer: ''
                };
                continue;
            }

            if (/^[a-z][).:-]\s+/i.test(line) && current) {
                current.options.push(line.replace(/^[a-z][).:-]\s+/i, '').trim());
                continue;
            }

            if (/^answer[:.)-]/i.test(line) && current) {
                const answerToken = line.replace(/^answer[:.)-]\s*/i, '').trim();
                if (/^[a-z]$/i.test(answerToken)) {
                    const optionIndex = answerToken.toUpperCase().charCodeAt(0) - 65;
                    current.correctAnswer = current.options[optionIndex] || '';
                } else {
                    current.correctAnswer = answerToken;
                }
            }
        }

        flushCurrent();

        return { questions, timeLimit, passingScore, maxAttempts };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {};
        const titleError = validateRequiredText(formData.title, 'Title', 2);
        const typeError = validateSelectRequired(formData.type, 'Content type');
        const gradeError = validateSelectRequired(formData.gradeId, 'Class');
        const subjectError = validateSelectRequired(formData.subjectId, 'Subject');
        const topicError = validateSelectRequired(formData.topicId, 'Topic');
        if (titleError) nextErrors.title = titleError;
        if (typeError) nextErrors.type = typeError;
        if (gradeError) nextErrors.gradeId = gradeError;
        if (subjectError) nextErrors.subjectId = subjectError;
        if (topicError) nextErrors.topicId = topicError;
        if (formData.type === 'video') {
            const videoError = validateVideoFile(videoFile);
            if (videoError) nextErrors.video = videoError;
        }
        if (formData.type === 'reading') {
            if (!readingFile) nextErrors.reading = 'Reading material file is required';
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            toast.error('Please fix the highlighted fields');
            return;
        }

        try {
            setLoading(true);

            if (formData.type === 'quiz') {
                if (!formData.topicId) {
                    throw new Error('Please select a topic for quiz');
                }

                const parsedQuiz = parseQuizDescription(formData.description);
                if (!parsedQuiz.questions.length) {
                    throw new Error('Enter quiz in format: Q:, options A)/B)/..., and Answer:');
                }

                await axios.post('/api/quiz', {
                    title: formData.title,
                    description: formData.description,
                    topicId: parseInt(formData.topicId, 10),
                    questions: parsedQuiz.questions,
                    timeLimit: parsedQuiz.timeLimit || 10,
                    passingScore: parsedQuiz.passingScore || 70,
                    maxAttempts: parsedQuiz.maxAttempts || 3,
                    isPublished: true
                });

                toast.success('Quiz created successfully!');
                navigate('/admin/content');
                return;
            }

            const uploadData = new FormData();
            if (videoFile) uploadData.append('video', videoFile);
            if (readingFile) uploadData.append('reading', readingFile);
            if (thumbnailFile) uploadData.append('thumbnail', thumbnailFile);

            // 1. Upload files
            let videoUrl = '';
            let thumbnailUrl = '';

            if (videoFile || thumbnailFile || readingFile) {
                const uploadRes = await axios.post('/api/upload/content', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                });
                videoUrl = uploadRes.data.videoUrl;
                thumbnailUrl = uploadRes.data.thumbnailUrl;
                const readingUrl = uploadRes.data.readingUrl;
                if (readingUrl) {
                    formData.readingMaterial = readingUrl;
                }
            }

            // 2. Create content
            await axios.post('/api/content', {
                ...formData,
                gradeId: formData.gradeId ? parseInt(formData.gradeId, 10) : undefined,
                subjectId: formData.subjectId ? parseInt(formData.subjectId, 10) : undefined,
                topicId: formData.topicId ? parseInt(formData.topicId, 10) : undefined,
                videoUrl: videoUrl,
                videoFile: videoUrl,
                thumbnail: thumbnailUrl
            });

            toast.success('Content uploaded successfully! 🎉');
            navigate('/admin/content');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || 'Upload failed');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">Upload New Content</Typography>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                error={!!errors.title}
                                helperText={errors.title}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Content Type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                error={!!errors.type}
                                helperText={errors.type}
                                required
                            >
                                <MenuItem value="video">Video Lesson</MenuItem>
                                <MenuItem value="reading">Reading Material</MenuItem>
                                <MenuItem value="quiz">Quiz</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Class"
                                name="gradeId"
                                value={formData.gradeId}
                                onChange={handleChange}
                                error={!!errors.gradeId}
                                helperText={errors.gradeId}
                                required
                            >
                                {grades.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>Class {g.level} - {g.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                            label="Subject"
                            name="subjectId"
                            value={formData.subjectId}
                            onChange={handleChange}
                            disabled={!formData.gradeId || subjectsLoading}
                            error={!!errors.subjectId}
                            helperText={errors.subjectId}
                            required
                        >
                            {subjects.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Topic"
                                name="topicId"
                                value={formData.topicId}
                                onChange={handleChange}
                                disabled={!formData.subjectId || topicsLoading}
                                error={!!errors.topicId}
                                helperText={errors.topicId}
                                required
                            >
                                {topics.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                ))}
                            </TextField>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    size="small"
                                    variant="text"
                                    disabled={!formData.subjectId}
                                    onClick={() => setTopicDialogOpen(true)}
                                >
                                    + Add Topic
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Video Upload Section */}
                        {formData.type === 'video' && (
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Video File</Typography>
                                <Box
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: 'background.default',
                                        position: 'relative'
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept="video/*"
                                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                                        name="video"
                                        onChange={handleFileChange}
                                    />
                                    {videoPreview ? (
                                        <Box>
                                            <Movie sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                            <Typography>{videoFile.name}</Typography>
                                            <Button size="small" color="error" onClick={() => {
                                                setVideoPreview(null);
                                                setVideoFile(null);
                                            }}>Remove</Button>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography>Click or drag video file to upload</Typography>
                                            <Typography variant="caption" color="textSecondary">Max size: 100MB</Typography>
                                        </Box>
                                    )}
                                    {errors.video && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            {errors.video}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        )}

                        {/* Reading Upload Section */}
                        {formData.type === 'reading' && (
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Reading Material (PDF)</Typography>
                                <Box
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: 'background.default',
                                        position: 'relative'
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                                        name="reading"
                                        onChange={handleFileChange}
                                    />
                                    {readingPreview ? (
                                        <Box>
                                            <Description sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                            <Typography>{readingFile.name}</Typography>
                                            <Button size="small" color="error" onClick={() => {
                                                setReadingPreview(null);
                                                setReadingFile(null);
                                            }}>Remove</Button>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                            <Typography>Click or drag PDF file to upload</Typography>
                                            <Typography variant="caption" color="textSecondary">Max size: 50MB</Typography>
                                        </Box>
                                    )}
                                    {errors.reading && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            {errors.reading}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        )}

                        {/* Thumbnail Upload */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Thumbnail Image</Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    {thumbnailPreview ? (
                                        <Card sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="120"
                                                image={thumbnailPreview}
                                            />
                                            <IconButton
                                                size="small"
                                                sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                                onClick={() => {
                                                    setThumbnailPreview(null);
                                                    setThumbnailFile(null);
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Card>
                                    ) : (
                                        <Box
                                            sx={{
                                                height: 120,
                                                border: '2px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <CloudUpload sx={{ color: 'text.secondary' }} />
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<CloudUpload />}
                                    >
                                        Select Thumbnail
                                        <input type="file" hidden accept="image/*" name="thumbnail" onChange={handleFileChange} />
                                    </Button>
                                </Grid>
                                {errors.thumbnail && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="error">{errors.thumbnail}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>

                        {loading && (
                            <Grid item xs={12}>
                                <Box sx={{ width: '100%', mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>Uploading: {uploadProgress}%</Typography>
                                    <LinearProgress variant="determinate" value={uploadProgress} />
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                size="large"
                                variant="contained"
                                type="submit"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                            >
                                {loading ? 'Processing...' : 'Create Content'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Add Topic Dialog */}
            <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add Topic</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Topic Name"
                        value={newTopic.name}
                        onChange={(e) => {
                            setNewTopic({ ...newTopic, name: e.target.value });
                            setTopicErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        autoFocus
                        error={!!topicErrors.name}
                        helperText={topicErrors.name}
                    />
                    <TextField
                        label="Description"
                        value={newTopic.description}
                        onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateTopic}>Save Topic</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ContentManagement;
