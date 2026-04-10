import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Avatar,
  alpha,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlayCircle,
  TrendingUp,
  Schedule,
  Refresh,
  School,
  AutoGraph,
  EmojiEvents,
  CheckCircle,
  PlayArrow,
  AssignmentTurnedIn,
  Search,
  ArrowForward,
  InfoOutlined,
  Calculate,
  MenuBook,
  Science,
  Language,
  Public,
  EmojiObjects
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import axios from '../../utils/axios';
import { resolveMediaUrl } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, percent }) => (
  <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'scale(1.5)' }}>
      <Icon sx={{ fontSize: 100, color }} />
    </Box>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color }}>
          <Icon fontSize="small" />
        </Avatar>
        <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      {percent !== undefined && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="textSecondary">Progress</Typography>
            <Typography variant="caption" fontWeight="bold">{percent}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percent} 
            sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color } }} 
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

const VideoCard = ({ video, onWatch }) => {
  const theme = useTheme();
  return (
    <Card sx={{ 
      borderRadius: 4, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows[4] }
    }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="160"
          image={
            resolveMediaUrl(video.thumbnail) ||
            `https://api.dicebear.com/7.x/shapes/svg?seed=${video.id}`
          }
          alt={video.title}
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            bgcolor: 'rgba(0,0,0,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 }
          }}
          onClick={() => onWatch(video.id)}
        >
          <PlayCircle sx={{ fontSize: 64, color: 'white' }} />
        </Box>
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Chip 
            label={video.Subject?.name || 'General'} 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }} 
          />
        </Box>
      </Box>
      <CardContent sx={{ flex: 1, p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap gutterBottom>
          {video.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ height: 40, overflow: 'hidden', mb: 2 }}>
          {video.description || 'New video from your teachers'}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 14 }} /> {video.duration ? `${video.duration} min` : 'Video'}
          </Typography>
          <Button
            size="small"
            variant="contained"
            sx={{ borderRadius: 5, px: 2 }}
            onClick={() => onWatch(video.id)}
          >
            Watch
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const SubjectCard = ({ subject, color, icon: Icon, onClick }) => (
  <Card 
    onClick={onClick}
    sx={{ 
      borderRadius: 4, 
      cursor: 'pointer',
      textAlign: 'center',
      p: 2,
      transition: 'all 0.2s',
      bgcolor: alpha(color, 0.05),
      border: '1px solid',
      borderColor: alpha(color, 0.1),
      '&:hover': { transform: 'scale(1.05)', bgcolor: alpha(color, 0.1), borderColor: color }
    }}
  >
    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1.5, bgcolor: color }}>
      <Icon sx={{ fontSize: 32 }} />
    </Avatar>
    <Typography variant="subtitle1" fontWeight="bold">{subject.name}</Typography>
    <Typography variant="caption" color="textSecondary">Tap to explore</Typography>
  </Card>
);

const StudentHome = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { getGradeProgress, watchTimeStats } = useProgress();

  const formatWatchTime = (seconds) => {
    const totalSeconds = Number(seconds) || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const [subjects, setSubjects] = useState([]);
  const [classVideos, setClassVideos] = useState([]);
  const [continueVideo, setContinueVideo] = useState(null);
  const [homeworkSummary, setHomeworkSummary] = useState({ total: 0, pending: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, videosRes, homeworkRes, progressRes] = await Promise.all([
        axios.get(`/api/subjects?gradeId=${user?.grade || ''}`),
        axios.get(`/api/content/class/${user?.grade || ''}/videos`),
        axios.get('/api/assignments'),
        axios.get('/api/progress')
      ]);

      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setClassVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
      
      // Homework Stats
      const hwList = Array.isArray(homeworkRes.data) ? homeworkRes.data : [];
      const pending = hwList.filter(a => !a.Submissions?.[0]).length;
      const percent = hwList.length > 0 ? Math.round(((hwList.length - pending) / hwList.length) * 100) : 0;
      setHomeworkSummary({ total: hwList.length, pending, percent });

      // Continue Learning
      const latestProgress = progressRes.data?.filter(p => !p.completed && p.percentCompleted > 0)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      
      if (latestProgress?.Content) {
        setContinueVideo({
          ...latestProgress.Content,
          percent: latestProgress.percentCompleted
        });
      }

    } catch (err) {
      console.error('Dashboard data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const handleSubjectChange = async (event) => {
    const sjId = event.target.value;
    setSelectedSubjectId(sjId);
    if (!sjId) {
      setTopics([]);
      return;
    }
    try {
      setLoadingTopics(true);
      const res = await axios.get(`/api/topics?subjectId=${sjId}`);
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  const getSubjectIcon = (name) => {
    const key = (name || '').toLowerCase();
    if (key.includes('math')) return Calculate;
    if (key.includes('english')) return MenuBook;
    if (key.includes('science')) return Science;
    if (key.includes('hindi')) return Language;
    if (key.includes('evs') || key.includes('env')) return Public;
    return EmojiObjects;
  };

  const getSubjectColor = (index) => {
    const colors = ['#FF8B94', '#9AE3D7', '#89CFF0', '#B8E994', '#FFE08A', '#9BB5FF'];
    return colors[index % colors.length];
  };

  if (loading && !subjects.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography color="textSecondary">Setting up your classroom...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
      {/* Search Header */}
      <Paper sx={{ 
        p: { xs: 3, md: 4 }, 
        borderRadius: 6, 
        bgcolor: 'primary.main', 
        color: 'white',
        boxShadow: '0 8px 32px rgba(63, 81, 181, 0.3)',
        mb: 5,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}>
          <School sx={{ fontSize: 200 }} />
        </Box>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              Hi, {user?.name?.split(' ')[0]}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              What would you like to learn today?
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 250, bgcolor: 'white', borderRadius: 2 }}>
                <InputLabel id="subject-search-label">Search for a Subject</InputLabel>
                <Select
                  labelId="subject-search-label"
                  value={selectedSubjectId}
                  label="Search for a Subject"
                  onChange={handleSubjectChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {subjects.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  bgcolor: 'warning.main', 
                  color: 'white', 
                  px: 4, 
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'warning.dark' } 
                }}
                onClick={() => navigate('/study')}
              >
                Browse All
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Topics on selection */}
      {selectedSubjectId && (
        <Fade in={!!selectedSubjectId}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
              <PlayCircle color="primary" /> Topics in {subjects.find(s => s.id === selectedSubjectId)?.name}
            </Typography>
            {loadingTopics ? (
              <LinearProgress sx={{ borderRadius: 5, mt: 2 }} />
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {topics.length > 0 ? topics.map(topic => (
                  <Grid item xs={6} sm={4} md={3} key={topic.id}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        borderWidth: 2, 
                        textAlign: 'left', 
                        justifyContent: 'flex-start',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        height: '100%',
                        '&:hover': { borderWidth: 2 }
                      }}
                      onClick={() => navigate(`/study/topic/${topic.id}`)}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>{topic.title}</Typography>
                      <Typography variant="caption" color="textSecondary">{topic.Contents?.length || 0} Lessons</Typography>
                    </Button>
                  </Grid>
                )) : (
                  <Typography sx={{ p: 4, color: 'textSecondary' }}>No topics found for this subject.</Typography>
                )}
              </Grid>
            )}
          </Box>
        </Fade>
      )}

      <Grid container spacing={4}>
        {/* Left Section: Continue & Recent */}
        <Grid item xs={12} md={8}>
          {/* Continue Learning */}
          {continueVideo && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
                <Refresh color="secondary" /> Continue Learning
              </Typography>
              <Card sx={{ 
                p: 0, 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                border: '1px solid',
                borderColor: alpha(theme.palette.secondary.main, 0.1),
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                overflow: 'hidden'
              }}>
                <CardMedia
                  component="img"
                  sx={{ width: { xs: '100%', sm: 260 }, height: 180 }}
                  image={resolveMediaUrl(continueVideo.thumbnail) || 'https://via.placeholder.com/260x180'}
                />
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Typography variant="overline" color="secondary" fontWeight="bold">RESUME</Typography>
                  <Typography variant="h6" fontWeight="bold">{continueVideo.title}</Typography>
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption">Completion</Typography>
                      <Typography variant="caption" fontWeight="bold">{continueVideo.percent}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={continueVideo.percent} 
                      color="secondary"
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<PlayArrow />} 
                    sx={{ mt: 1, borderRadius: 5, px: 4 }}
                    onClick={() => navigate(`/play/video/${continueVideo.id}`)}
                  >
                    Resume Now
                  </Button>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Recent Videos */}
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <TrendingUp color="primary" /> Recent Videos
              </Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/play')}>View All</Button>
            </Box>
            <Grid container spacing={2}>
              {classVideos.slice(0, 4).map(video => (
                <Grid item xs={12} sm={6} key={video.id}>
                  <VideoCard video={video} onWatch={(id) => navigate(`/play/video/${id}`)} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        {/* Right Section: Progress Summary & Subjects */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
              <AutoGraph color="success" /> My Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <StatCard 
                  title="Overall Learning" 
                  value={`${getGradeProgress(user?.grade)}%`} 
                  icon={AutoGraph} 
                  color="#4ECDC4" 
                  percent={getGradeProgress(user?.grade)}
                />
              </Grid>
              <Grid item xs={12}>
                <StatCard 
                  title="Homework Status" 
                  value={`${homeworkSummary.pending} Pending`} 
                  icon={AssignmentTurnedIn} 
                  color="#FFD93D" 
                  percent={homeworkSummary.percent}
                />
              </Grid>
              <Grid item xs={12}>
                <StatCard 
                  title="Watch Time" 
                  value={formatWatchTime(watchTimeStats?.totalWatchTime || 0)} 
                  icon={Schedule} 
                  color="#6C5CE7" 
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
              <MenuBook color="info" /> Subjects
            </Typography>
            <Grid container spacing={2}>
              {subjects.slice(0, 4).map((subject, index) => (
                <Grid item xs={6} key={subject.id}>
                  <SubjectCard 
                    subject={subject} 
                    color={getSubjectColor(index)} 
                    icon={getSubjectIcon(subject.name)} 
                    onClick={() => navigate(`/study/grade/${user.grade}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentHome;
