import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Timeline,
  AccessTime,
  EmojiEvents,
  TrendingUp,
  Star,
  PlayCircle,
  ChevronRight
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useProgress } from '../../context/ProgressContext';
import { formatDate, formatTime } from '../../utils/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const WatchTimeStats = ({ weekly = false }) => {
  const { watchTimeStats, loading, refreshStats } = useProgress();
  const [chartData, setChartData] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (watchTimeStats) {
      prepareChartData();
    }
  }, [watchTimeStats]);

  const prepareChartData = () => {
    if (!watchTimeStats?.dailyWatchTime) return;

    const dates = watchTimeStats.dailyWatchTime.map(d => formatDate(d.date, isMobile ? 'EEE' : 'EEE, MMM d'));
    const minutes = watchTimeStats.dailyWatchTime.map(d => d.minutes);

    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Watch Time (minutes)',
          data: minutes,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: isMobile ? 3 : 4,
          pointHoverRadius: isMobile ? 5 : 6
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} minutes`
        },
        bodyFont: {
          size: isMobile ? 11 : 12
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !isMobile,
          text: 'Minutes'
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 12
          },
          stepSize: isMobile ? undefined : 30,
          maxTicksLimit: isMobile ? 5 : 8
        }
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 9 : 11
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0
        }
      }
    }
  };

  const subjectProgressData = {
    labels: ['Math', 'English', 'Science', 'Hindi', 'EVS'],
    datasets: [
      {
        data: [65, 45, 80, 30, 55],
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7'
        ],
        borderWidth: 0,
        borderRadius: isMobile ? 4 : 8
      }
    ]
  };

  const recentActivities = [
    { title: "Introduction to Numbers - Part 1", time: "1 hour ago", subject: "Mathematics" },
    { title: "Basic Addition Concepts", time: "2 hours ago", subject: "Mathematics" },
    { title: "English Grammar - Nouns", time: "3 hours ago", subject: "English" },
    { title: "Science - Plants Life Cycle", time: "5 hours ago", subject: "Science" },
    { title: "Hindi Varnamala", time: "1 day ago", subject: "Hindi" }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: isMobile ? '80%' : '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            gutterBottom
            sx={{
              fontFamily: '"Comic Neue", cursive',
              fontWeight: 'bold',
              color: 'primary.main',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Your Learning Progress 📊
          </Typography>
          {isMobile && (
            <Typography variant="body2" color="textSecondary">
              Track your daily learning journey
            </Typography>
          )}
        </Box>

        <Grid container spacing={isMobile ? 1.5 : 3} alignItems="stretch">
          {/* Stats Cards */}
          {[
            { icon: AccessTime, value: formatTime(watchTimeStats?.totalWatchTime || 0), label: 'Total Watch Time', color: 'primary.main' },
            { icon: EmojiEvents, value: '15', label: 'Achievements', color: 'success.main' },
            { icon: TrendingUp, value: '75%', label: 'Avg Score', color: 'warning.main' },
            { icon: Star, value: '250', label: 'Points', color: 'info.main' }
          ].map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <motion.div whileHover={{ scale: isMobile ? 1.02 : 1.05 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  sx={{ 
                    borderRadius: { xs: 2, sm: 3, md: 4 }, 
                    textAlign: 'center', 
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: isMobile ? 'none' : 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[4]
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: stat.color, 
                      width: { xs: 40, sm: 48, md: 56 }, 
                      height: { xs: 40, sm: 48, md: 56 }, 
                      mx: 'auto', 
                      mb: { xs: 1, sm: 1.5, md: 2 } 
                    }}
                  >
                    <stat.icon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                  </Avatar>
                  <Typography 
                    variant={isMobile ? "h6" : "h4"} 
                    sx={{ 
                      color: stat.color, 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                      mb: 0.5
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {/* Watch Time Chart */}
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: { xs: 1.5, sm: 2, md: 3 }, 
                borderRadius: { xs: 2, sm: 3, md: 4 },
                height: { xs: 'auto', md: 280 }
              }}
            >
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.25rem' },
                  fontWeight: 'medium'
                }}
              >
                Weekly Watch Time
              </Typography>
              <Box sx={{ 
                height: { xs: 200, sm: 240, md: 200 },
                position: 'relative',
                mt: { xs: 1, sm: 2 }
              }}>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </Box>
            </Paper>
          </Grid>

          {/* Subject Progress */}
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: { xs: 1.5, sm: 2, md: 3 }, 
                borderRadius: { xs: 2, sm: 3, md: 4 },
                height: { xs: 'auto', md: 280 },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.25rem' },
                  fontWeight: 'medium'
                }}
              >
                Subject Progress
              </Typography>
              <Box sx={{ 
                height: { xs: 150, sm: 180, md: 130 },
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                my: { xs: 1, sm: 2 }
              }}>
                <Doughnut 
                  data={subjectProgressData} 
                  options={{ 
                    cutout: isMobile ? '65%' : '70%',
                    plugins: {
                      tooltip: {
                        bodyFont: { size: isMobile ? 11 : 12 }
                      }
                    }
                  }} 
                />
              </Box>
              <Box sx={{ 
                mt: { xs: 1, sm: 1.5 },
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: { xs: 0.5, sm: 1 },
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                alignContent: 'start'
              }}>
                {subjectProgressData.labels.map((label, index) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: { xs: 8, sm: 10, md: 12 },
                        height: { xs: 8, sm: 10, md: 12 },
                        borderRadius: 2,
                        bgcolor: subjectProgressData.datasets[0].backgroundColor[index],
                        mr: { xs: 0.5, sm: 1 },
                        flexShrink: 0
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1, 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold" 
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                        ml: 0.5,
                        flexShrink: 0
                      }}
                    >
                      {subjectProgressData.datasets[0].data[index]}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3, md: 4 } }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                sx={{ 
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.25rem' },
                  fontWeight: 'medium',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Recent Activity
              </Typography>
              <List sx={{ pt: 0 }}>
                {recentActivities.map((activity, item) => (
                  <React.Fragment key={item}>
                    <ListItem 
                      sx={{ 
                        px: { xs: 0, sm: 1 },
                        py: { xs: 1, sm: 1.5 },
                        flexWrap: isMobile ? 'wrap' : 'nowrap'
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: { xs: 40, sm: 56 } }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                          <PlayCircle sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {activity.time} • {activity.subject}
                          </Typography>
                        }
                        sx={{ flex: 1 }}
                      />
                      <Chip
                        label="Completed"
                        size="small"
                        color="success"
                        sx={{ 
                          borderRadius: 2,
                          height: { xs: 24, sm: 32 },
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          ml: { xs: 0, sm: 1 },
                          mt: { xs: 1, sm: 0 },
                          flexShrink: 0
                        }}
                      />
                    </ListItem>
                    {item < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default WatchTimeStats;
