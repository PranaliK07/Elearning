import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  MenuBook as StudyIcon,
  Timeline as ProgressIcon
} from '@mui/icons-material';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getValue = () => {
    if (location.pathname.startsWith('/dashboard')) return 0;
    if (location.pathname.startsWith('/study')) return 1;
    if (location.pathname.startsWith('/progress')) return 2;
    return 0;
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        display: { xs: 'block', sm: 'none' },
        zIndex: 1000
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={(event, newValue) => {
          switch(newValue) {
            case 0:
              navigate('/dashboard');
              break;
            case 1:
              navigate('/study');
              break;
            case 2:
              navigate('/progress');
              break;
            default:
              break;
          }
        }}
      >
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Study" icon={<StudyIcon />} />
        <BottomNavigationAction label="Progress" icon={<ProgressIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
