import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
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
    if (status === 'present') return <Chip label="Present" color="success" size="small" />;
    if (status === 'absent') return <Chip label="Absent" color="error" size="small" />;
    return <Chip label="Not marked" variant="outlined" size="small" />;
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Attendance
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        View your daily attendance status (present/absent).
      </Typography>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              fullWidth
              label="From"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="To"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ flex: 1 }} />
            <Chip label={`Present: ${summary.present}`} color="success" variant="outlined" />
            <Chip label={`Absent: ${summary.absent}`} color="error" variant="outlined" />
            <Chip label={`Today: ${summary.todayStatus}`} variant="outlined" />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Box} sx={{ maxHeight: 520, overflowX: 'auto' }}>
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
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                          No attendance records in this date range.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentAttendance;
