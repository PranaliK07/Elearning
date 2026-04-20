import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../../utils/axios';

const dateOnly = (d) => d.toISOString().slice(0, 10);

const StudentAttendance = () => {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return dateOnly(d);
  });
  const [to, setTo] = useState(() => dateOnly(new Date()));
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance/me', { params: { from, to } });
      const list = Array.isArray(res.data?.attendance) ? res.data.attendance : [];
      setRows(list);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const summary = useMemo(() => {
    const present = rows.filter((r) => r.status === 'present').length;
    const absent = rows.filter((r) => r.status === 'absent').length;
    const today = dateOnly(new Date());
    const todayRow = rows.find((r) => r.date === today);
    return { present, absent, todayStatus: todayRow?.status || 'not_marked' };
  }, [rows]);

  const statusChip = (status) => {
    if (status === 'present') return <Chip label="Present" sx={{ bgcolor: '#FFD93D', color: '#0B1F3B', fontWeight: 900, size: 'small' }} />;
    if (status === 'absent') return <Chip label="Absent" sx={{ bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', fontWeight: 900, size: 'small' }} />;
    return <Chip label="Not marked" variant="outlined" size="small" sx={{ opacity: 0.5 }} />;
  };

  return (
    <Box sx={{ py: 4, px: 1 }}>
      <Box sx={{ mb: 4, p: 4, background: 'linear-gradient(135deg, #B0125B 0%, #1a237e 100%)', borderRadius: 5, color: 'white' }}>
        <Typography variant="h3" fontWeight="900" gutterBottom>
          My Attendance
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Track your daily presence and earn your monthly stars!
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 5, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              label="From Date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="To Date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label={`Present: ${summary.present}`} sx={{ bgcolor: 'rgba(255, 217, 61, 0.15)', color: '#FFD93D', fontWeight: 900, border: '1px solid #FFD93D' }} />
              <Chip label={`Absent: ${summary.absent}`} sx={{ bgcolor: 'rgba(255, 107, 107, 0.15)', color: '#FF6B6B', fontWeight: 900, border: '1px solid #FF6B6B' }} />
              <Chip 
                label={`Today: ${summary.todayStatus.replace('_', ' ')}`} 
                sx={{ 
                    bgcolor: summary.todayStatus === 'present' ? '#FFD93D' : 'rgba(0,0,0,0.05)', 
                    color: summary.todayStatus === 'present' ? '#0B1F3B' : 'inherit',
                    fontWeight: 900 
                }} 
              />
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 6 }}>
              No attendance records in this date range.
            </Typography>
          ) : (
            <Box>
              {/* Mobile View */}
              <Stack spacing={2} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 2 }}>
                {rows.map((r) => (
                  <Paper key={r.date} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {new Date(r.date).toLocaleDateString()}
                      </Typography>
                      {statusChip(r.status)}
                    </Box>
                    {r.note && (
                      <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        Note: {r.note}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>

              {/* Desktop Table View */}
              <TableContainer component={Box} sx={{ display: { xs: 'none', sm: 'block' }, maxHeight: 520, overflowX: 'auto', mt: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={`${r.date}-${r.status}`} hover>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>{statusChip(r.status)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {r.note || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentAttendance;
