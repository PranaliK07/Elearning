import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Calculate,
  MenuBook,
  Science,
  Language,
  Public,
  EmojiObjects
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SubjectCard = ({ subject, progress, onClick, index }) => {
  const getIcon = (name) => {
    const key = name.toLowerCase();
    switch (key) {
      case 'mathematics':
      case 'math':
        return <Calculate sx={{ fontSize: 56, color: 'white' }} />;
      case 'english':
        return <MenuBook sx={{ fontSize: 56, color: 'white' }} />;
      case 'science':
        return <Science sx={{ fontSize: 56, color: 'white' }} />;
      case 'hindi':
        return <Language sx={{ fontSize: 56, color: 'white' }} />;
      case 'environmental studies':
      case 'evs':
        return <Public sx={{ fontSize: 56, color: 'white' }} />;
      default:
        return <EmojiObjects sx={{ fontSize: 56, color: 'white' }} />;
    }
  };

  const getColor = (name) => {
    const key = name.toLowerCase();
    switch (key) {
      case 'mathematics':
      case 'math':
        return '#FF8B94';
      case 'english':
        return '#9AE3D7';
      case 'science':
        return '#1a237e'; // Navy Blue
      case 'hindi':
        return '#B8E994';
      case 'environmental studies':
      case 'evs':
        return '#FFE08A';
      default:
        return '#B0125B'; // Dark Pink fallback
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          height: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: 8
          }
        }}
      >
        <Box
          sx={{
            height: 110,
            backgroundColor: getColor(subject.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {getIcon(subject.name)}
        </Box>

        <CardContent>
          <Typography
            gutterBottom
            variant="h5"
            component="h2"
            sx={{ fontFamily: '"Comic Neue", cursive', fontWeight: 'bold' }}
          >
            {subject.name}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Progress
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="bold">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: getColor(subject.name)
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${subject.topicCount ?? 0} Topics`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${subject.videoCount ?? 0} Videos`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${subject.quizCount ?? 0} Quizzes`}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubjectCard;
