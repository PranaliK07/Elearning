import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Email,
  School,
  EmojiEvents,
  AccessTime,
  Star,
  TrendingUp,
  CalendarToday,
  People,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { resolveAvatarSrc } from '../../utils/media';
import axios from '../../utils/axios';

const ProfileView = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { watchTimeStats } = useProgress();

  const [quickStats, setQuickStats] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);
  const [dailyStars, setDailyStars] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchQuickStats = async () => {
      try {
        setLoadingStats(true);
        const response = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuickStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchTeacherStats = async () => {
      if (user?.role !== 'teacher') return;
      try {
        const response = await axios.get('/api/dashboard/teacher', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeacherStats(response.data?.stats || null);
      } catch (error) {
        console.error('Error fetching teacher dashboard:', error);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        setLoadingRecent(true);
        const response = await axios.get('/api/dashboard/recent-activity', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentActivity(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setRecentActivity([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    const fetchDailyStars = async () => {
      if (user?.role !== 'student') return;
      try {
        const response = await axios.get('/api/achievements/daily-goal', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setDailyStars(response.data.starsEarned || 0);
        }
      } catch (error) {
        console.error('Error fetching daily stars:', error);
      }
    };

    fetchQuickStats();
    fetchTeacherStats();
    fetchRecentActivity();
    fetchDailyStars();
  }, [token, user?.role]);

  const stats = useMemo(() => {
    if (user?.role === 'teacher') {
      return [
        { label: 'Students Managed', value: teacherStats?.totalStudents ?? '-', icon: <People /> },
        { label: 'Assignments Created', value: teacherStats?.assignments ?? '-', icon: <AssignmentIcon /> },
        { label: 'Active Classes', value: teacherStats?.activeClasses ?? '-', icon: <School /> },
        { label: 'Streak', value: quickStats?.streak ?? user?.streak ?? 0, icon: <CalendarToday /> }
      ];
    }

    const resolvedWatchTimeMinutes = quickStats?.watchTime ?? watchTimeStats?.totalWatchTime ?? user?.totalWatchTime ?? 0;
    const watchTimeHours = Math.round(Number(resolvedWatchTimeMinutes || 0) / 60);

    return [
      { label: 'Total Watch Time', value: `${watchTimeHours}h`, icon: <AccessTime /> },
      { label: 'Daily Stars', value: dailyStars, icon: <Star sx={{ color: '#FFD93D' }} />, hollow: true },
      { label: 'Achievements', value: quickStats?.achievements ?? (user?.Achievements?.length ?? user?.achievements?.length ?? 0), icon: <EmojiEvents /> },
      { label: 'Completed Lessons', value: quickStats?.completedLessons ?? 0, icon: <TrendingUp /> }
    ];
  }, [quickStats, teacherStats, user, watchTimeStats]);

  const achievements = user?.Achievements || user?.achievements || [];

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography color="textSecondary">Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Header */}
        <Paper sx={{ p: 4, borderRadius: 4, mb: 3 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    mx: 'auto',
                    border: '4px solid',
                    borderColor: 'primary.main',
                    fontSize: '3rem'
                  }}
                  src={resolveAvatarSrc(user?.avatar)}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Avatar>
              </motion.div>
              
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate('/profile/edit')}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </Grid>

            <Grid item xs={12} md={9}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h3" gutterBottom>
                    {user?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Email />}
                      label={user?.email}
                      variant="outlined"
                    />
                    <Chip
                      icon={<School />}
                      label={`Class ${user?.grade || 'Not Set'}`}
                      color="primary"
                    />
                    <Chip
                      icon={<EmojiEvents />}
                      label={user?.role}
                      color="secondary"
                    />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body1" color="textSecondary" paragraph>
                {user?.role === 'teacher' ? 'Professional Educator at Kids Learn Platform' : 'Student at Kids Learn Platform'} • Learning since 2024
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box>
                  <Typography variant="h5" color="primary">
                    {user?.grade || '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current Class
                  </Typography>
                </Box>
                {user?.role === 'student' ? (
                  <Box>
                    <Typography variant="h5" color="primary">
                      {'⭐'.repeat(dailyStars) || '⭐'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Daily Stars
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h5" color="primary">
                      {user?.points || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Points
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="h5" color="primary">
                    {Math.round((watchTimeStats?.totalWatchTime || 0) / 60)}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Watch Time
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {(loadingStats || loadingRecent) && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                  <Avatar sx={{ bgcolor: stat.hollow ? 'transparent' : 'primary.light', mx: 'auto', mb: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h4" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>


      </motion.div>
    </Container>
  );
};

export default ProfileView;
