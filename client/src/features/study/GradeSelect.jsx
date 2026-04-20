import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  LooksOne,
  LooksTwo,
  Looks3,
  Looks4,
  Looks5,
  Looks6
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const gradeStyles = {
  1: { color: '#FF6B6B', icon: <LooksOne sx={{ fontSize: 64, color: 'white' }} />, description: 'Beginner Level' },
  2: { color: '#4ECDC4', icon: <LooksTwo sx={{ fontSize: 64, color: 'white' }} />, description: 'Foundation' },
  3: { color: '#B0125B', icon: <Looks3 sx={{ fontSize: 64, color: 'white' }} />, description: 'Building Skills' },
  4: { color: '#1a237e', icon: <Looks4 sx={{ fontSize: 64, color: 'white' }} />, description: 'Intermediate' },
  5: { color: '#FFEAA7', icon: <Looks5 sx={{ fontSize: 64, color: 'white' }} />, description: 'Advanced' },
  6: { color: '#A78BFA', icon: <Looks6 sx={{ fontSize: 64, color: 'white' }} />, description: 'Advanced' }
};

const fallbackColors = ['#FF6B6B', '#4ECDC4', '#B0125B', '#1a237e', '#FFEAA7', '#A78BFA', '#B0125B', '#22C55E', '#F59E0B', '#F97316'];
const getFallbackColor = (level) => fallbackColors[(Math.max(1, Number(level) || 1) - 1) % fallbackColors.length];

const getGradeStyle = (grade) => {
  const level = Number(grade?.level) || 1;
  const preset = gradeStyles[level];

  const color = preset?.color || grade?.color || getFallbackColor(level);
  const icon = preset?.icon || (
    <Typography sx={{ fontSize: 64, color: 'white', fontWeight: 'bold', fontFamily: '"Comic Neue", cursive' }}>
      {level}
    </Typography>
  );
  const description = grade?.description || preset?.description || `Class ${level}`;

  return { color, icon, description };
};

const GradeSelect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gradeData, setGradeData] = useState([]);
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (user?.role === 'student' && user?.grade) {
      navigate(`/study/grade/${user.grade}`, { replace: true });
    }
  }, [user?.role, user?.grade, navigate]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/grades');
      const allGrades = Array.isArray(response.data) ? response.data : [];
      const visibleGrades = user?.role === 'student' && user?.grade
        ? allGrades.filter((g) => Number(g.level) === Number(user.grade))
        : allGrades;
      const grades = visibleGrades.map((g) => ({
        ...g,
        ...getGradeStyle(g)
      }));
      setGradeData(grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setGradeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSelect = (grade) => {
    navigate(`/study/grade/${grade.level}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isStudent) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh" textAlign="center" gap={2}>
        <CircularProgress />
        <Typography variant="h6" sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold' }}>
          Getting your lessons ready...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '2rem', sm: '3rem' } }}>
            Choose a Class
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Select a grade to view subjects and topics
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch" justifyContent="center">
          {gradeData.map((grade, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={grade.level} sx={{ display: 'flex' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ display: 'flex', flex: 1, width: '100%', minWidth: 0 }}
              >
                <Card
                  onClick={() => handleGradeSelect(grade)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    flex: 1,
                    minWidth: 0,
                    '&:hover': { boxShadow: 8 }
                  }}
                >
                  <Box sx={{ height: { xs: 110, sm: 140 }, backgroundColor: grade.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {grade.icon}
                  </Box>
                  <CardContent sx={{ flex: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2" sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold' }}>
                      {grade.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">{grade.description}</Typography>

                    <Box
                      sx={{
                        mt: 2,
                        backgroundColor: 'success.main',
                        color: 'white',
                        p: 1,
                        borderRadius: 2,
                        textAlign: 'center',
                        visibility: Number(user?.grade) === Number(grade.level) ? 'visible' : 'hidden'
                      }}
                    >
                      Your Current Class
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
};

export default GradeSelect;
