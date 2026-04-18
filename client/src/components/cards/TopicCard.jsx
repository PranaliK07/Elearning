import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  PlayCircle,
  MenuBook,
  Quiz,
  Lock,
  CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const TopicCard = ({ topic, onSelect, isLocked = false, progress = 0 }) => {
  const getContentIcon = (type) => {
    switch(type) {
      case 'video': return <PlayCircle color="primary" />;
      case 'reading': return <MenuBook color="secondary" />;
      case 'quiz': return <Quiz color="warning" />;
      default: return <MenuBook />;
    }
  };

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <Card
        sx={{
          opacity: isLocked ? 0.7 : 1,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          borderRadius: 3,
          mb: 2,
          '&:hover': !isLocked ? {
            boxShadow: 6
          } : {}
        }}
        onClick={!isLocked ? onSelect : undefined}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: isLocked ? 'grey.400' : 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                mr: 2
              }}
            >
              {topic.order || 1}
            </Box>
            <Box flex={1}>
              <Typography variant="h6">
                {topic.name}
                {isLocked && <Lock sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {topic.lessonCount || 0} lessons • {topic.quizCount || 0} quizzes
              </Typography>
            </Box>
            {progress === 100 && (
              <CheckCircle color="success" />
            )}
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 3, mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {topic.previewContents?.map((content, index) => (
              <Chip
                key={index}
                icon={getContentIcon(content.type)}
                label={content.type}
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(content);
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopicCard;
