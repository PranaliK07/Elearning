import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  PlayCircle, 
  Psychology as PsychologyIcon, 
  Assignment, 
  ArrowBack,
  AccessTime
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const TopicContent = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchTopicData();
  }, [topicId]);

  const normalizeMediaUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/')) return src;
    return `/${src}`;
  };

  const fallbackThumb =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#1e3c72"/>
            <stop offset="1" stop-color="#2a5298"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <circle cx="300" cy="170" r="54" fill="rgba(255,255,255,0.15)"/>
        <polygon points="292,150 292,190 324,170" fill="#ffffff"/>
        <text x="300" y="275" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Arial, sans-serif">
          Video
        </text>
      </svg>`
    );

  const fetchTopicData = async () => {
    try {
      setLoading(true);
      const [topicRes, contentRes, quizRes, assignmentRes] = await Promise.all([
        axios.get(`/api/topics/${topicId}`),
        axios.get(`/api/topics/${topicId}/contents`),
        axios.get(`/api/topics/${topicId}/quizzes`),
        axios.get('/api/assignments')
      ]);

      const nextTopic = topicRes.data || null;
      const nextContents = Array.isArray(contentRes.data) ? contentRes.data : [];
      const nextQuizzes = Array.isArray(quizRes.data) ? quizRes.data : [];
      const allAssignments = Array.isArray(assignmentRes.data) ? assignmentRes.data : [];

      // Filter assignments by topic (assignments have Lesson which has TopicId)
      const nextAssignments = allAssignments.filter(assignment => 
        assignment.Lesson && assignment.Lesson.TopicId === parseInt(topicId)
      );

      setTopic(nextTopic);
      setContents(nextContents);
      setQuizzes(nextQuizzes);
      setAssignments(nextAssignments);

      if (user?.role === 'student' && user?.grade && nextTopic?.Subject?.GradeId && Number(nextTopic.Subject.GradeId) !== Number(user.grade)) {
        navigate(`/study/grade/${user.grade}`, { replace: true });
      }
    } catch (error) {
      console.error('Error fetching topic content:', error);
      setTopic(null);
      setContents([]);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const videos = contents.filter((item) => item.type === 'video');
  const homework = assignments;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Back to Topics
          </Button>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold', color: 'primary.main' }}>
              {topic?.name || 'Topic'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {topic?.Subject?.name || 'Subject'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tab} 
            onChange={(e, newVal) => setTab(newVal)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { fontWeight: 'bold', fontSize: '1rem' }
            }}
          >
            <Tab icon={<PlayCircle fontSize="small" />} iconPosition="start" label={`Videos (${videos.length})`} />
            <Tab icon={<PsychologyIcon fontSize="small" />} iconPosition="start" label={`Quiz (${quizzes.length})`} />
            <Tab icon={<Assignment fontSize="small" />} iconPosition="start" label={`Homework (${homework.length})`} />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Grid container spacing={3}>
            {videos.length === 0 && (
              <Grid size={12}>
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Typography color="textSecondary">No videos for this topic yet.</Typography>
                </Box>
              </Grid>
            )}
            {videos.map((video) => {
              const videoSrc = normalizeMediaUrl(
                video.videoUrl || video.videoFile || video.video?.url || video.contentUrl || video.url
              );
              const thumbSrc = normalizeMediaUrl(video.thumbnail || video.thumb || '');
              return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.id}>
                <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {thumbSrc ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={thumbSrc}
                      alt={video.title}
                    />
                  ) : videoSrc ? (
                    <Box sx={{ height: 160, bgcolor: 'black' }}>
                      <video
                        src={videoSrc}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : (
                    <CardMedia
                      component="img"
                      height="160"
                      image={fallbackThumb}
                      alt={video.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {video.title}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {topic?.name || 'Topic'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button fullWidth variant="contained" startIcon={<PlayCircle />} onClick={() => navigate(`/play/video/${video.id}`)}>
                      Play Video
                    </Button>
                  </Box>
                </Card>
              </Grid>
            )})}
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            {quizzes.length === 0 && (
              <Grid size={12}>
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Typography color="textSecondary">No quizzes for this topic yet.</Typography>
                </Box>
              </Grid>
            )}
            {quizzes.map((quiz) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={quiz.id}>
                <Card sx={{ 
                  borderRadius: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 24px rgba(124, 77, 255, 0.2)'
                  }
                }}>
                  <Box sx={{ 
                    height: 120, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.14)',
                      filter: 'blur(20px)'
                    }} />
                    <PsychologyIcon sx={{ fontSize: 60, color: 'white', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        size="small" 
                        label={quiz.timeLimit ? `${quiz.timeLimit}m` : '10m'} 
                        icon={<AccessTime style={{ fontSize: 13 }} />}
                        sx={{ fontWeight: 'bold', bgcolor: 'rgba(108, 92, 231, 0.1)', color: '#6C5CE7' }}
                      />
                      <Chip 
                        size="small" 
                        label={`${quiz.questionCount || quiz.questions?.length || 0} Qs`} 
                        sx={{ fontWeight: 'bold', bgcolor: 'rgba(245, 0, 87, 0.1)', color: '#f50057' }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mt: 1, lineHeight: 1.2 }}>
                      {quiz.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                      Check your {topic?.name || 'Topic'} skills!
                    </Typography>
                  </CardContent>
                  <Box sx={{ px: 2.5, pb: 2.5 }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                      sx={{ 
                        borderRadius: 2.5, 
                        fontWeight: 'bold', 
                        py: 1.2,
                        textTransform: 'none',
                        bgcolor: '#1a237e',
                        '&:hover': { bgcolor: '#121858' },
                        boxShadow: '0 4px 14px 0 rgba(26, 35, 126, 0.35)'
                      }}
                    >
                      Start Assessment
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 2 && (
          <Grid container spacing={3}>
            {homework.length === 0 && (
              <Grid size={12}>
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Typography color="textSecondary">No homework for this topic yet.</Typography>
                </Box>
              </Grid>
            )}
            {homework.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 140, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Assignment sx={{ fontSize: 56, color: 'white' }} />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Typography>
                    {item.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button fullWidth variant="contained" color="success" onClick={() => navigate(`/assignments/view/${item.id}`)}>
                      View Assignment
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>
    </Box>
  );
};

export default TopicContent;
