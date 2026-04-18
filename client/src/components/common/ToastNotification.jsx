import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const ToastNotification = ({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'center' }
}) => {
  return (
    <AnimatePresence>
      {open && (
        <Snackbar
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={onClose}
          anchorOrigin={anchorOrigin}
        >
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Alert
              onClose={onClose}
              severity={severity}
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                minWidth: 300,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
            >
              {message}
            </Alert>
          </motion.div>
        </Snackbar>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
