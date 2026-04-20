import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import { MenuBook, EmojiEvents, ArrowForward } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../utils/axios';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

const TopicList = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSubjectProgress } = useProgress();
  const [topics, setTopics] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, [subjectId]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const [subjectRes, topicRes] = await Promise.all([
        axios.get(`/api/subjects/${subjectId}`),
        axios.get(`/api/subjects/${subjectId}/topics`)
      ]);
      const nextSubject = subjectRes.data || null;
      const nextTopics = Array.isArray(topicRes.data) ? topicRes.data : [];
      setSubject(nextSubject);
      setTopics(nextTopics);

      if (user?.role === 'student' && user?.grade && nextSubject?.GradeId && Number(nextSubject.GradeId) !== Number(user.grade)) {
        navigate(`/study/grade/${user.grade}`, { replace: true });
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setSubject(null);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic) => {
    navigate(`/study/topic/${topic.id}`);
  };

  const subjectProgress = getSubjectProgress(Number(subjectId));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
            {subject?.name || 'Subject'} Topics
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip icon={<EmojiEvents />} label={`${subjectProgress}% Complete`} color="primary" variant="outlined" />
            <Chip icon={<MenuBook />} label={`${topics.length} Topics`} variant="outlined" />
          </Box>

          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={subjectProgress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Pick a Topic</Typography>
          <Grid container spacing={2}>
            {topics.map((topic, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic.id}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                  <Card
                    onClick={() => handleTopicSelect(topic)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 4,
                      boxShadow: 3,
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 3,
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {topic.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {topic.Contents?.length || 0} lessons
                        </Typography>
                      </Box>
                      <ArrowForward color="action" />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {topics.length === 0 && (
              <Grid size={12}>
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Typography color="textSecondary">No topics available yet.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </motion.div>
    </Box>
  );
};

export default TopicList;
