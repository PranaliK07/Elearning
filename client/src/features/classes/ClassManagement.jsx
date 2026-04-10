import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ClassManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/grades');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => String(c.name || '').toLowerCase().includes(q) || String(c.level || '').includes(q));
  }, [classes, search]);

  const addClass = async () => {
    const trimmedName = name.trim();
    const parsedLevel = Number(level);
    if (!trimmedName) return toast.error('Class name is required');
    if (!Number.isFinite(parsedLevel)) return toast.error('Class level is required');

    setSaving(true);
    try {
      await api.post('/api/grades', { name: trimmedName, level: parsedLevel });
      toast.success('Class added');
      setName('');
      setLevel('');
      await fetchClasses();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add class');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setSaving(true);
    try {
      await api.delete(`/api/grades/${deleteTarget.id}`);
      toast.success('Class deleted');
      setDeleteTarget(null);
      await fetchClasses();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Class"
        description="Are you sure you want to delete this class? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Class Management
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Add or delete classes.
      </Typography>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              fullWidth
              label="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Class Level"
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              inputProps={{ min: 1 }}
            />
            <Button variant="contained" onClick={addClass} disabled={saving}>
              {saving ? 'Saving...' : 'Add Class'}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              fullWidth
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={fetchClasses} disabled={loading}>
              Refresh
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Box} sx={{ maxHeight: 560, overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.level}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={saving}
                            onClick={() => setDeleteTarget(c)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          No classes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ClassManagement;

