import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton
} from '@mui/material';
import {
  AccessTime,
  EmojiEvents,
  TrendingUp,
  School,
  Download,
  Share,
  ExpandMore,
  ExpandLess,
  CalendarToday,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import TimeSpentChart from '../../components/charts/TimeSpentChart';
import ProgressChart from '../../components/charts/ProgressChart';

const WeeklyReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [expandedHighlights, setExpandedHighlights] = React.useState(!isMobile);
  const [expandedAchievements, setExpandedAchievements] = React.useState(!isMobile);

  const weekData = {
    totalWatchTime: 245,
    avgWatchTime: 35,
    completedLessons: 12,
    quizzesTaken: 5,
    avgScore: 82,
    pointsEarned: 150,
    topSubject: 'Mathematics',
    dailyData: [30, 45, 25, 60, 35, 50, 0]
  };

  const achievements = [
    { name: 'Quick Learner', date: 'Jan 15, 2024', points: 20, icon: '⚡' },
    { name: 'Math Wizard', date: 'Jan 14, 2024', points: 30, icon: '🧙' },
    { name: 'Consistent Student', date: 'Jan 13, 2024', points: 25, icon: '📚' },
  ];

  const subjectData = {
    labels: ['Math', 'Science', 'English', 'Hindi', 'EVS'],
    datasets: [
      {
        label: 'Hours Spent',
        data: [5, 3, 4, 2, 3],
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7'
        ],
        borderWidth: 0
      }
    ]
  };

  const handleDownload = () => {
    // Implement PDF download
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const statsCards = [
    { icon: AccessTime, value: `${weekData.totalWatchTime}`, unit: 'min', label: 'Total Time', color: 'primary.main' },
    { icon: School, value: weekData.completedLessons, unit: '', label: 'Lessons', color: 'success.main' },
    { icon: TrendingUp, value: `${weekData.avgScore}%`, unit: '', label: 'Avg Score', color: 'warning.main' },
    { icon: EmojiEvents, value: weekData.pointsEarned, unit: '', label: 'Points', color: 'info.main' }
  ];

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom 
            sx={{ 
              fontFamily: '"Comic Neue", cursive',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 'bold'
            }}
          >
            Weekly Progress Report 📊
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<CalendarToday sx={{ fontSize: 16 }} />} 
              label="Jan 8 - Jan 14, 2024" 
              size="small"
              variant="outlined"
              sx={{ mb: { xs: 1, sm: 0 } }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Week 2 of 2024
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards - Horizontal Scroll on Mobile */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: isMobile ? 'auto' : 'visible',
          pb: isMobile ? 2 : 0,
          mb: { xs: 2, sm: 4 },
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            height: '4px'
          }
        }}>
          {statsCards.map((stat, index) => (
            <Card 
              key={index}
              sx={{ 
                flex: isMobile ? '0 0 auto' : 1,
                minWidth: isMobile ? 'calc(50% - 16px)' : 'auto',
                textAlign: 'center', 
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 2, sm: 3 }
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: stat.color, 
                  width: { xs: 40, sm: 48 }, 
                  height: { xs: 40, sm: 48 }, 
                  mx: 'auto', 
                  mb: 1 
                }}
              >
                <stat.icon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </Avatar>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                sx={{ 
                  color: stat.color,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}
              >
                {stat.value}
                {stat.unit && <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>{stat.unit}</Typography>}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {stat.label}
              </Typography>
            </Card>
          ))}
        </Box>

        {/* Charts Section */}
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: { xs: 2, sm: 4 } }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                Daily Watch Time
              </Typography>
              <Box sx={{ height: { xs: 200, sm: 250, md: 300 } }}>
                <TimeSpentChart data={weekData.dailyData} height={isMobile ? 200 : 300} />
              </Box>
              {isMobile && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  Mon - Sun
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                Time per Subject
              </Typography>
              <Box sx={{ height: { xs: 180, sm: 200, md: 220 } }}>
                <ProgressChart type="doughnut" data={subjectData} height={isMobile ? 180 : 220} />
              </Box>
              <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {subjectData.labels.map((label, index) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: { xs: 8, sm: 10 },
                        height: { xs: 8, sm: 10 },
                        borderRadius: 2,
                        bgcolor: subjectData.datasets[0].backgroundColor[index],
                        mr: 1,
                        flexShrink: 0
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, ml: 0.5 }}>
                      {subjectData.datasets[0].data[index]} hrs
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Achievements and Highlights - Collapsible on Mobile */}
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3, md: 4 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && setExpandedAchievements(!expandedAchievements)}
              >
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  Achievements Unlocked 🏆
                </Typography>
                {isMobile && (
                  <IconButton size="small">
                    {expandedAchievements ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </Box>
              <Collapse in={!isMobile || expandedAchievements}>
                <List sx={{ pt: 0 }}>
                  {achievements.map((achievement, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: { xs: 0, sm: 1 }, py: { xs: 1, sm: 1.5 } }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.light' }}>
                            <Typography variant="h6">{achievement.icon}</Typography>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {achievement.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="textSecondary">
                              {achievement.date}
                            </Typography>
                          }
                        />
                        <Chip
                          label={`+${achievement.points}`}
                          size="small"
                          color="success"
                          sx={{ height: { xs: 24, sm: 32 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </ListItem>
                      {index < achievements.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Collapse>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3, md: 4 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && setExpandedHighlights(!expandedHighlights)}
              >
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  Weekly Highlights ⭐
                </Typography>
                {isMobile && (
                  <IconButton size="small">
                    {expandedHighlights ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </Box>
              <Collapse in={!isMobile || expandedHighlights}>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ 
                    mb: { xs: 2, sm: 2.5 }, 
                    p: { xs: 1.5, sm: 2 }, 
                    bgcolor: 'action.hover', 
                    borderRadius: 2 
                  }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🌟 Best Day: Wednesday
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      You studied for 60 minutes and completed 3 lessons!
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mb: { xs: 2, sm: 2.5 }, 
                    p: { xs: 1.5, sm: 2 }, 
                    bgcolor: 'action.hover', 
                    borderRadius: 2 
                  }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      📚 Favorite Subject: {weekData.topSubject}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      You spent most time learning Mathematics (5 hours)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    bgcolor: 'action.hover', 
                    borderRadius: 2 
                  }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🏆 Best Quiz Score: 95%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      In "Introduction to Numbers" quiz
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          </Grid>
        </Grid>

        {/* Action Buttons - Sticky on Mobile */}
        <Box sx={{ 
          mt: { xs: 3, sm: 4 }, 
          mb: { xs: 2, sm: 0 },
          display: 'flex', 
          gap: { xs: 1.5, sm: 2 }, 
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          position: isMobile ? 'sticky' : 'static',
          bottom: isMobile ? 16 : 'auto',
          px: isMobile ? 2 : 0,
          zIndex: 100
        }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
            sx={{ py: { xs: 1, sm: 1.5 } }}
          >
            Download Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={handleShare}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
            sx={{ py: { xs: 1, sm: 1.5 } }}
          >
            Share with Parents
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};

export default WeeklyReport;
