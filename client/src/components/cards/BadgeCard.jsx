import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  EmojiEvents,
  Lock,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const BadgeCard = ({ badge, earned = false, progress = 0, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          borderRadius: 3,
          position: 'relative',
          opacity: earned ? 1 : 0.7,
          '&:hover': {
            boxShadow: 6
          }
        }}
      >
        {earned && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1
            }}
          >
            <Chip
              icon={<EmojiEvents />}
              label="Earned!"
              color="success"
              size="small"
            />
          </Box>
        )}

        {!earned && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1
            }}
          >
            <Chip
              icon={<Lock />}
              label="Locked"
              size="small"
              variant="outlined"
            />
          </Box>
        )}

        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: earned ? 'warning.main' : 'grey.400',
              fontSize: '2rem'
            }}
          >
            {badge.icon || '🏆'}
          </Avatar>

          <Typography variant="h6" gutterBottom>
            {badge.name}
          </Typography>

          <Typography variant="body2" color="textSecondary" paragraph>
            {badge.description}
          </Typography>

          {!earned && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Progress
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'primary.main'
                  }
                }}
              />
            </Box>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Chip
              icon={<Star />}
              label={`+${badge.points} points`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BadgeCard;
