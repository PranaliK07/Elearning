import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  EventAvailable,
  People,
  Refresh,
  ReportProblem,
  School,
  Source,
  WarningAmber,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    date: null,
    totals: { present: 0, absent: 0, totalMarked: 0 },
    classes: []
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, contentRes, reportsRes, attendanceRes] = await Promise.allSettled([
        api.get('/api/users'),
        api.get('/api/content'),
        api.get('/api/reports'),
        api.get('/api/attendance/summary'),
      ]);

      if (usersRes.status === 'fulfilled') {
        const usersData = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : (usersRes.value.data?.users || []);
        setUsers(usersData);
      } else {
        setUsers([]);
      }

      if (contentRes.status === 'fulfilled') {
        const payload = contentRes.value.data;
        let contentData = [];

        if (Array.isArray(payload)) contentData = payload;
        else if (payload?.content) contentData = payload.content;
        else if (payload?.data) contentData = payload.data;
        else if (payload?.items) contentData = payload.items;
        else if (payload?.lessons) contentData = payload.lessons;
        else if (payload?.courses) contentData = payload.courses;
        else if (payload?.materials) contentData = payload.materials;
        else if (payload && (payload.id || payload._id)) contentData = [payload];

        setContent(contentData);
      } else {
        setContent([]);
      }

      if (reportsRes.status === 'fulfilled') {
        const reportsData = Array.isArray(reportsRes.value.data)
          ? reportsRes.value.data
          : (reportsRes.value.data?.reports || []);
        setReports(reportsData);
      } else {
        setReports([]);
      }

      if (attendanceRes.status === 'fulfilled') {
        const payload = attendanceRes.value.data || {};
        setAttendanceSummary({
          date: payload.date || null,
          totals: payload.totals || { present: 0, absent: 0, totalMarked: 0 },
          classes: Array.isArray(payload.classes) ? payload.classes : []
        });
      } else {
        setAttendanceSummary({ date: null, totals: { present: 0, absent: 0, totalMarked: 0 }, classes: [] });
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      toast.error('Failed to fetch dashboard data');
      setUsers([]);
      setContent([]);
      setReports([]);
      setAttendanceSummary({ date: null, totals: { present: 0, absent: 0, totalMarked: 0 }, classes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => {
      const status = user.status || user.isActive || user.active;
      return status === 'active' || status === 'Active' || status === true;
    }).length,
    totalStudents: users.filter((user) => {
      const role = user.role || user.userRole;
      return role === 'student' || role === 'Student';
    }).length,
    totalTeachers: users.filter((user) => {
      const role = user.role || user.userRole;
      return role === 'teacher' || role === 'Teacher';
    }).length,
    totalContent: content.length,
    openReports: reports.filter((report) => {
      const status = report.status || report.reportStatus;
      return status !== 'resolved' && status !== 'Resolved';
    }).length,
    attendanceMarkedToday: attendanceSummary?.totals?.totalMarked || 0,
    attendancePresentToday: attendanceSummary?.totals?.present || 0,
    attendanceAbsentToday: attendanceSummary?.totals?.absent || 0,
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <People />, color: '#2563eb' },
    { label: 'Active Users', value: stats.activeUsers, icon: <CheckCircle />, color: '#16a34a' },
    { label: 'Students', value: stats.totalStudents, icon: <School />, color: '#f59e0b' },
    { label: 'Teachers', value: stats.totalTeachers, icon: <People />, color: '#ef4444' },
    { label: 'Content Items', value: stats.totalContent, icon: <Source />, color: '#7c3aed' },
    { label: 'Open Reports', value: stats.openReports, icon: <ReportProblem />, color: '#db2777' },
    { label: 'Attendance Marked (Today)', value: stats.attendanceMarkedToday, icon: <EventAvailable />, color: '#0ea5e9' },
    { label: 'Present (Today)', value: stats.attendancePresentToday, icon: <EventAvailable />, color: '#22c55e' },
  ];

  const inactiveUsers = Math.max(stats.totalUsers - stats.activeUsers, 0);
  const contentBreakdown = {
    videos: content.filter((item) => item.type === 'video' || item.contentType === 'video').length,
    quizzes: content.filter((item) => item.type === 'quiz' || item.contentType === 'quiz').length,
    assignments: content.filter((item) => item.type === 'assignment' || item.contentType === 'assignment').length,
    published: content.filter((item) => item.status === 'published').length,
  };
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    .slice(0, 5);
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 5);
  const studentPercentage = stats.totalUsers ? Math.round((stats.totalStudents / stats.totalUsers) * 100) : 0;
  const teacherPercentage = stats.totalUsers ? Math.round((stats.totalTeachers / stats.totalUsers) * 100) : 0;

  return (
    <Container maxWidth="lg">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              A clean overview of users, content, reports, and platform health.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.label}>
              <Card sx={{ borderRadius: 3, color: 'white', bgcolor: card.color, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {card.label}
                      </Typography>
                      <Typography variant="h4">{card.value}</Typography>
                    </Box>
                    <Box sx={{ fontSize: 40, opacity: 0.85 }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Platform Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        User Distribution
                      </Typography>
                      <Stack spacing={1.5}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Students</Typography>
                            <Typography variant="body2">{studentPercentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={studentPercentage} sx={{ height: 8, borderRadius: 999 }} />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Teachers</Typography>
                            <Typography variant="body2">{teacherPercentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={teacherPercentage} color="warning" sx={{ height: 8, borderRadius: 999 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Inactive accounts
                          </Typography>
                          <Typography variant="h5">{inactiveUsers}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Content Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Videos</Typography>
                          <Typography variant="h5">{contentBreakdown.videos}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Quizzes</Typography>
                          <Typography variant="h5">{contentBreakdown.quizzes}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Assignments</Typography>
                          <Typography variant="h5">{contentBreakdown.assignments}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Published</Typography>
                          <Typography variant="h5">{contentBreakdown.published}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Recent Reports
                      </Typography>
                      {recentReports.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                          No recent reports available.
                        </Typography>
                      ) : (
                        <Stack divider={<Divider flexItem />} spacing={1}>
                          {recentReports.map((report) => (
                            <Box key={report.id || report._id || `${report.title}-${report.createdAt}`}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {report.title || 'Untitled'}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {report.user || report.reportedBy || 'Anonymous'} • {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'No date'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip size="small" label={report.type || 'general'} />
                                  <Chip
                                    size="small"
                                    label={report.status || 'pending'}
                                    color={report.status === 'resolved' ? 'success' : report.status === 'in-progress' ? 'warning' : 'error'}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Attention Needed
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WarningAmber color="warning" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Inactive users
                      </Typography>
                      <Typography variant="h6">{inactiveUsers}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ReportProblem color="error" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Open reports
                      </Typography>
                      <Typography variant="h6">{stats.openReports}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Source color="secondary" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Unpublished content
                      </Typography>
                      <Typography variant="h6">{Math.max(stats.totalContent - contentBreakdown.published, 0)}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Newest Users
                </Typography>
                {recentUsers.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No users available.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1}>
                    {recentUsers.map((user) => (
                      <Box key={user.id || user._id || user.email}>
                        <Typography variant="subtitle2">{user.name || 'Unknown User'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user.email || 'No email'}
                        </Typography>
                        <Chip
                          size="small"
                          sx={{ mt: 1 }}
                          label={user.role || 'student'}
                          color={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'warning' : 'primary'}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default AdminDashboard;
