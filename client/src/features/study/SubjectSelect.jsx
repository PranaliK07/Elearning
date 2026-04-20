import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import SubjectCard from '../../components/cards/SubjectCard';

const SubjectSelect = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjectData, setSubjectData] = useState([]);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchSubjects();
  }, [gradeId]);

  useEffect(() => {
    if (user?.role === 'student' && user?.grade && Number(gradeId) !== Number(user.grade)) {
      navigate(`/study/grade/${user.grade}`, { replace: true });
    }
  }, [user?.role, user?.grade, gradeId, navigate]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/subjects?gradeId=${gradeId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setSubjectData(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjectData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subjectId) => {
    navigate(`/study/subject/${subjectId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2, px: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold', color: 'primary.main' }}>
            {isStudent ? 'Pick a Subject' : `Class ${gradeId} Subjects`}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {isStudent ? 'Tap a subject to start learning' : 'Choose a subject to view topics'}
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {subjectData.map((subject, index) => (
            <Grid item xs={12} sm={6} md={4} key={subject.id}>
              <SubjectCard
                subject={subject}
                progress={0}
                index={index}
                onClick={() => handleSubjectSelect(subject.id)}
              />
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
};

export default SubjectSelect;
