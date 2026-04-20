import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Avatar,
  Typography,
  Chip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  MenuBook as StudyIcon,
  Source as ContentOverviewIcon,
  PlayCircle as PlayIcon,
  Timeline as ProgressIcon,
  EmojiEvents as AchievementsIcon,
  Person as ProfileIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  EventAvailable as AttendanceIcon,
  Class as ClassManagementIcon,
  HelpOutline as DoubtIcon,
  BarChart as ReportsIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  Tune as BusinessSettingsIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  AccountTree as TopicManagerIcon,
  RateReview as FeedbackIcon,
  Description,
  Quiz as QuizIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { useState, useEffect } from 'react';
import { resolveAvatarSrc } from '../../utils/media';
import ConfirmDialog from '../common/ConfirmDialog';

const drawerWidth = 240;
const appBarHeights = { xs: 56, sm: 64 };

const configuredModules = new Set([
  'dashboard',
  'subjects',
  'play',
  'progress',
  'achievements',
  'profile',
  'new-lesson',
  'subject-topic',
  'assignments',
  'communications',
  'class-management',
  'content',
  'users',
  'reports',
  'reports-issues',
  'settings',
  'business-settings',
  'doubts',
  'play',
  'feedback',
  'attendance',
  'quizzes'
]);

const defaultRoleAccess = {
  admin: new Set(['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'users', 'content', 'reports', 'reports-issues', 'settings', 'new-lesson', 'subject-topic', 'assignments', 'attendance', 'class-management', 'communications', 'business-settings', 'doubts', 'feedback']),
  teacher: new Set(['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'new-lesson', 'subject-topic', 'assignments', 'attendance', 'class-management', 'reports', 'communications', 'feedback', 'content', 'doubts']),
  student: new Set(['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'doubts', 'feedback', 'attendance', 'quizzes'])
};

const loadRoleAccess = () => {
  try {
    const saved = localStorage.getItem('roleAccess');
    if (!saved) return defaultRoleAccess;
    const parsed = JSON.parse(saved);
    return Object.fromEntries(
      Object.entries(parsed).map(([role, modules]) => [role, new Set(modules)])
    );
  } catch (e) {
    console.warn('Failed to load role access from storage', e);
    return defaultRoleAccess;
  }
};

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [accessVersion, setAccessVersion] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const handler = () => setAccessVersion(v => v + 1);
    window.addEventListener('roleAccessUpdated', handler);
    return () => window.removeEventListener('roleAccessUpdated', handler);
  }, []);

  useEffect(() => {
    const syncAccess = async () => {
      try {
        const res = await api.get('/api/admin/role-access');
        if (res.data) {
          localStorage.setItem('roleAccess', JSON.stringify(res.data));
          window.dispatchEvent(new Event('roleAccessUpdated'));
        }
      } catch (err) {
        if (import.meta?.env?.DEV) {
          console.warn('Role access fetch skipped', err?.response?.status);
        }
      }
    };
    syncAccess();
  }, [user?.id]);

  const role = user?.role || 'student';
  const roleAccess = loadRoleAccess(accessVersion);
  const baseAllowed = roleAccess[role] || defaultRoleAccess[role] || defaultRoleAccess.student;
  const studentBaseline = new Set(['dashboard', 'subjects', 'progress', 'achievements', 'profile', 'doubts', 'assignments', 'attendance', 'quizzes']);
  const allowed = role === 'student'
    ? new Set([...baseAllowed, ...studentBaseline])
    : baseAllowed;

  const currentPath = `${location.pathname}${location.search || ''}`;
  const currentTab = new URLSearchParams(location.search).get('tab');

  const assignmentPath = role === 'student' ? '/homework' : '/assignments/create';
  const attendancePath = role === 'student' ? '/attendance' : '/attendance/manage';
  const items = [
    { key: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { key: 'users', text: 'User Management', icon: <ProfileIcon />, path: '/admin/users' },
    { key: 'content', text: 'Uploaded Content', icon: <ContentOverviewIcon />, path: '/admin/content' },
    { key: 'subjects', text: role === 'student' ? 'Subjects' : 'Classes', icon: <StudyIcon />, path: '/study' },
    { key: 'new-lesson', text: 'New Lesson', icon: <AddIcon />, path: '/content/create' },
    { key: 'study-material', text: 'Notes', icon: <Description />, path: '/study-material' },
    { key: 'subject-topic', text: 'Add Subject & Topic', icon: <TopicManagerIcon />, path: '/topics/manage' },
    { key: 'quizzes', text: 'Quizzes', icon: <QuizIcon />, path: '/play#quizzes' },
    { key: 'progress', text: 'Progress', icon: <ProgressIcon />, path: '/progress' },
    { key: 'achievements', text: 'Achievements', icon: <AchievementsIcon />, path: '/achievements' },
    { key: 'assignments', text: 'Home Work', icon: <AssignmentIcon />, path: assignmentPath },
    { key: 'attendance', text: 'Attendance', icon: <AttendanceIcon />, path: attendancePath },
    { key: 'class-management', text: 'Class Management', icon: <ClassManagementIcon />, path: '/classes/manage' },
    { 
      key: 'doubts', 
      text: role === 'teacher' ? 'Student Doubts' : 'Doubts', 
      icon: <DoubtIcon />, 
      path: '/doubts' 
    },
    { key: 'reports', text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { key: 'reports-issues', text: 'Reports & Issues', icon: <ReportsIcon />, path: '/admin/reports' },
    { key: 'communications', text: 'Class Communication', icon: <CampaignIcon />, path: '/class-communication' },
    { key: 'settings', text: 'System Settings', icon: <SettingsIcon />, path: '/admin/system-settings' },
    { key: 'business-settings', text: 'Business Settings', icon: <BusinessSettingsIcon />, path: '/admin/business-settings' },
    { key: 'feedback', text: 'Feedback & Ratings', icon: <FeedbackIcon />, path: '/feedback' },
    { key: 'profile', text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];

  const isSelected = (item) => {
    if (!item.path) return false;
    if (item.key === 'dashboard') {
      return location.pathname === '/dashboard' && !currentTab;
    }
    if (item.path.startsWith('/dashboard?tab=')) {
      return location.pathname === '/dashboard' && currentPath === item.path;
    }
    if (item.key === 'quizzes') {
      return location.pathname === '/play' && location.hash === '#quizzes';
    }
    return location.pathname === item.path;
  };

  const displayItems = items.filter(({ key }) => {
    if (role === 'student' && key === 'doubts') return true;
    if (configuredModules.has(key)) {
      return allowed.has(key);
    }
    return true;
  }).filter(({ key }) => {
    if (key === 'assignments' || key === 'reports' || key === 'reports-issues' || key === 'new-lesson' || key === 'subject-topic' || key === 'business-settings' || key === 'communications' || key === 'class-management' || key === 'study-material' || key === 'quizzes') {
      return role === 'teacher' || role === 'admin' || role === 'student' || allowed.has(key);
    }
    if (key === 'feedback') {
      return allowed.has(key);
    }
    return true;
  });

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login');
    if (mobileOpen) handleDrawerToggle();
  };

  const drawer = (
    <div>
      <ConfirmDialog
        open={logoutDialogOpen}
        title="Logout"
        description="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
      />
      <Toolbar>
        <Box
          sx={{ textAlign: 'center', width: '100%', cursor: 'pointer' }}
          onClick={() => {
            navigate('/profile');
            if (mobileOpen) handleDrawerToggle();
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '10px auto',
              border: '3px solid #B0125B'
            }}
            src={resolveAvatarSrc(user?.avatar)}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Typography variant="h6" noWrap>
            {user?.name}
          </Typography>
          <Chip
            icon={<StarIcon />}
            label={user?.role === 'student' ? `${user?.points || 0} Today's Stars` : `${user?.points || 0} Points`}
            size="small"
            color="primary"
            sx={{ mt: 1 }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {displayItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              selected={isSelected(item)}
              onClick={() => {
                navigate(item.path);
                if (mobileOpen) handleDrawerToggle();
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    isSelected(item)
                      ? 'white'
                      : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.9rem', 
                  fontWeight: isSelected(item) ? 'bold' : '500' 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding sx={{ mt: 'auto', mb: 2 }}>
          <ListItemButton
            onClick={handleLogoutClick}
            sx={{
              width: '100% !important',
              backgroundColor: '#8b0000 !important',
              color: '#FFFFFF !important',
              borderRadius: '0px !important',
              py: 1.5,
              '& *': {
                color: '#FFFFFF !important',
              },
              '&:hover': {
                backgroundColor: '#5d0000 !important'
              },
              transition: 'all 0.2s'
            }}
          >
            <ListItemIcon sx={{ color: '#FFFFFF !important', minWidth: 40, ml: 1 }}>
              <LogoutIcon sx={{ color: '#FFFFFF !important' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ 
                sx: { color: '#FFFFFF !important', fontWeight: 'bold !important' } 
              }} 
            />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            mt: `${appBarHeights.xs}px`,
            height: `calc(100% - ${appBarHeights.xs}px)`
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            mt: `${appBarHeights.sm}px`,
            height: `calc(100% - ${appBarHeights.sm}px)`,
            borderRight: 'none',
            boxShadow: '4px 0 10px rgba(0,0,0,0.03)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
