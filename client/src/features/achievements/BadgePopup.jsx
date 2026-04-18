import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Avatar,
  Button,
  Zoom
} from '@mui/material';
import {
  EmojiEvents,
  Close
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const BadgePopup = ({ open, onClose, badge }) => {
  return (
    <>
      {open && <Confetti recycle={false} numberOfPieces={200} />}
      
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 4,
            textAlign: 'center',
            p: 3
          }
        }}
      >
        <DialogContent>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'warning.main',
                fontSize: '3rem'
              }}
            >
              {badge?.icon || '🏆'}
            </Avatar>

            <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Comic Neue", cursive' }}>
              Congratulations! 🎉
            </Typography>

            <Typography variant="h5" color="primary" gutterBottom>
              You've earned a new badge!
            </Typography>

            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>
                {badge?.name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {badge?.description}
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 3, mb: 3 }}>
              <Typography variant="h3" color="white">
                +{badge?.points || 10}
              </Typography>
              <Typography variant="body2" color="white">
                Points Earned
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={onClose}
              startIcon={<Close />}
              size="large"
            >
              Awesome!
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BadgePopup;
