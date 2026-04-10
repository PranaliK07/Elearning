import React from 'react';
import { useAuth } from '../../context/AuthContext';
import VideosHome from './VideosHome';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import { Box, CircularProgress, Stack } from '@mui/material';

const DashboardRouter = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    const renderDashboard = () => {
        switch (user?.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'teacher':
                return <TeacherDashboard />;
      case 'student':
      default:
            return <VideosHome />;
        }
    };

    return (
        <Stack spacing={2}>
            {renderDashboard()}
        </Stack>
    );
};

export default DashboardRouter;
