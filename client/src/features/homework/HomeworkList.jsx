import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  Stack,
  Skeleton,
  useMediaQuery,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Today as TodayIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';

const HomeworkList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/assignments');
      const list = Array.isArray(res.data) ? res.data : [];
      setAssignments(list);
    } catch (err) {
      console.error('Fetch assignments error', err);
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const getDueStatus = (dueDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const due = new Date(dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (dueDay.getTime() === today.getTime()) {
      return { label: 'Today', color: 'error', icon: <TodayIcon fontSize="small" /> };
    }
    if (dueDay.getTime() === tomorrow.getTime()) {
      return { label: 'Tomorrow', color: 'warning', icon: <ScheduleIcon fontSize="small" /> };
    }
    if (dueDay < today) {
      return { label: 'Overdue', color: 'error', icon: <ErrorIcon fontSize="small" /> };
    }
    return { 
      label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
      color: 'default', 
      icon: <ScheduleIcon fontSize="small" /> 
    };
  };

  const getAssignmentStatus = (assignment) => {
    const submission = assignment.Submissions?.[0];
    if (submission) {
      return { label: 'Completed', color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
    }
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    if (now > dueDate) {
      return { label: 'Overdue', color: 'error', icon: <ErrorIcon fontSize="small" /> };
    }
    return { label: 'Pending', color: 'warning', icon: <ScheduleIcon fontSize="small" /> };
  };

  // Flattened rows for desktop table
  const tableRows = assignments.map((assignment) => ({
    id: assignment.id,
    subject: assignment.Subject?.name || 'General',
    topic: assignment.Lesson?.title || 'General',
    title: assignment.title,
    description: assignment.description,
    status: getAssignmentStatus(assignment),
    dueStatus: getDueStatus(assignment.dueDate),
    attachmentUrl: assignment.attachmentUrl
  }));
  
  // Calculate counts for header
  const completedCount = assignments.filter(a => !!a.Submissions?.[0]).length;
  const pendingCount = assignments.filter(a => !a.Submissions?.[0] && new Date(a.dueDate) >= new Date()).length;
  const overdueCount = assignments.filter(a => !a.Submissions?.[0] && new Date(a.dueDate) < new Date()).length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={48} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold" 
          gutterBottom 
          sx={{ 
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AssignmentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          Assignments
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary">
            Total: <strong>{assignments.length}</strong>
          </Typography>
          <Typography variant="body2" color="success.main">
            Completed: <strong>{completedCount}</strong>
          </Typography>
          <Typography variant="body2" color="warning.main">
            Pending: <strong>{pendingCount}</strong>
          </Typography>
          <Typography variant="body2" color="error.main">
            Overdue: <strong>{overdueCount}</strong>
          </Typography>
        </Stack>
      </Box>

      {/* Assignments */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isMobile ? (
          <Box sx={{ p: 2 }}>
            {tableRows.map((row) => (
              <Paper key={row.id} sx={{ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" fontWeight="bold">{row.title}</Typography>
                  <Typography variant="caption" color="textSecondary">{row.subject} • {row.topic}</Typography>
                  {row.description && (
                    <Typography variant="caption" color="textSecondary">
                      {row.description.length > 90 ? `${row.description.slice(0, 90)}...` : row.description}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Chip icon={row.status.icon} label={row.status.label} color={row.status.color} size="small" sx={{ fontWeight: 'bold' }} />
                  <Chip icon={row.dueStatus.icon} label={row.dueStatus.label} color={row.dueStatus.color} size="small" variant={row.dueStatus.color === 'default' ? 'outlined' : 'filled'} />
                </Stack>
                {row.attachmentUrl && (
                  <Button size="small" variant="text" sx={{ mt: 1 }} onClick={() => window.open(row.attachmentUrl, '_blank')}>
                    View attachment
                  </Button>
                )}
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant={row.status.label === 'Completed' ? 'outlined' : 'contained'}
                    color={row.status.label === 'Completed' ? 'primary' : 'secondary'}
                    onClick={() => navigate(`/assignments/view/${row.id}`)}
                  >
                    {row.status.label === 'Completed' ? 'View' : 'Submit'}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '18%' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Topic</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '26%' }}>Assignment</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Attachment</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>{row.topic}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="500">
                          {row.title}
                        </Typography>
                        {row.description && (
                          <Typography variant="caption" color="textSecondary">
                            {row.description.length > 60 ? `${row.description.substring(0, 60)}...` : row.description}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={row.status.icon}
                        label={row.status.label}
                        color={row.status.color}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          minWidth: 90,
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={row.dueStatus.icon}
                        label={row.dueStatus.label}
                        color={row.dueStatus.color}
                        size="small"
                        variant={row.dueStatus.color === 'default' ? 'outlined' : 'filled'}
                        sx={{
                          fontWeight: row.dueStatus.color !== 'default' ? 'bold' : 'normal',
                          minWidth: 85
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.attachmentUrl ? (
                        <Button
                          size="small"
                          variant="text"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(row.attachmentUrl, '_blank');
                          }}
                        >
                          View file
                        </Button>
                      ) : (
                        <Typography variant="caption" color="textSecondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={row.status.label === 'Completed' ? 'outlined' : 'contained'}
                        color={row.status.label === 'Completed' ? 'primary' : 'secondary'}
                        onClick={() => navigate(`/assignments/view/${row.id}`)}
                      >
                        {row.status.label === 'Completed' ? 'View' : 'Submit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {assignments.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">No assignments found</Typography>
            <Typography variant="body2" color="textSecondary">You're all caught up for now!</Typography>
          </Box>
        )}
      </Paper>

      {/* Urgent Alert */}
      {overdueCount > 0 && (
        <Alert 
          severity="error" 
          icon={<WarningIcon />}
          sx={{ borderRadius: 3, mt: 3 }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>
            {overdueCount} Overdue Assignment{overdueCount > 1 ? 's' : ''}
          </AlertTitle>
          Please complete these assignments as soon as possible.
        </Alert>
      )}
    </Container>
  );
};

export default HomeworkList;
