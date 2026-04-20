import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Avatar,
  TextField,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Search, Edit, Delete } from '@mui/icons-material';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import {
  validateEmail,
  validateName,
  validatePositiveInteger,
  validateSelectRequired
} from '../../utils/validation';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    grade: '',
    studentEmail: '',
    parentPhone: '',
    status: 'active'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get('/api/users');
      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : (usersRes.data?.users ? usersRes.data.users : []);
      setUsers(usersData);
    } catch (err) {
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (Array.isArray(users) ? users : []).filter((user) => {
      const matchesSearch = (user.name || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term);
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId && u._id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const validateUserForm = () => {
    const nextErrors = {};
    const nameError = validateName(newUser.name, 'Full name');
    const emailError = validateEmail(newUser.email);
    const roleError = validateSelectRequired(newUser.role, 'Role');
    const statusError = validateSelectRequired(newUser.status, 'Status');

    if (nameError) nextErrors.name = nameError;
    if (emailError) nextErrors.email = emailError;
    if (roleError) nextErrors.role = roleError;
    if (statusError) nextErrors.status = statusError;

    if (newUser.role === 'student') {
      const gradeError = validatePositiveInteger(newUser.grade, 'Grade');
      if (gradeError) nextErrors.grade = gradeError;
    }

    if (newUser.role === 'parent') {
      const phone = String(newUser.parentPhone || '').trim();
      if (!phone) {
        nextErrors.parentPhone = 'Parent mobile number is required';
      } else if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) {
        nextErrors.parentPhone = 'Enter a valid parent mobile number';
      }
    }

    if (newUser.role === 'parent' && newUser.studentEmail.trim()) {
      const studentEmailError = validateEmail(newUser.studentEmail, 'Student email');
      if (studentEmailError) nextErrors.studentEmail = studentEmailError;
    }

    return nextErrors;
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3
          }}
        >
          <Typography variant="h6">User Management</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="Filter by Role"
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="student">Students</MenuItem>
                <MenuItem value="teacher">Teachers</MenuItem>
                <MenuItem value="parent">Parents</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ width: { xs: '100%', sm: 250 } }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => {
                setEditingUserId(null);
                setNewUser({ name: '', email: '', role: 'student', grade: '', studentEmail: '', parentPhone: '', status: 'active' });
                setOpenUserDialog(true);
              }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id || user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{user.name || 'Unknown'}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.email || 'No email'}
                            </Typography>
                            {user.role === 'student' && user.parent && (
                              <Typography variant="caption" color="textSecondary" display="block">
                                Parent: {user.parent.name} ({user.parent.email})
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || 'student'}
                          size="small"
                          color={
                            user.role === 'admin'
                              ? 'error'
                              : user.role === 'teacher'
                                ? 'warning'
                                : user.role === 'parent'
                                  ? 'secondary'
                                  : 'primary'
                          }
                        />
                      </TableCell>
                      <TableCell>{user.grade || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status || 'active'}
                          size="small"
                          color={(user.status === 'active' || user.status === 'Active') ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{user.lastLogin || 'Never'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingUserId(user.id || user._id);
                            setNewUser({
                              name: user.name || '',
                              email: user.email || '',
                              role: user.role || 'student',
                              grade: user.grade || '',
                              studentEmail: '',
                              parentPhone: user.parentPhone || '',
                              status: (user.status === 'inactive' || user.isActive === false) ? 'inactive' : 'active'
                            });
                            setOpenUserDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('Delete this user? This cannot be undone.')) {
                              handleDeleteUser(user.id || user._id);
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openUserDialog}
        onClose={() => {
          setOpenUserDialog(false);
          setEditingUserId(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingUserId ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={newUser.name}
                onChange={(e) => {
                  setNewUser((prev) => ({ ...prev, name: e.target.value }));
                  setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={newUser.email}
                onChange={(e) => {
                  setNewUser((prev) => ({ ...prev, email: e.target.value }));
                  setFormErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={newUser.role}
                  onChange={(e) => {
                    setNewUser((prev) => ({ ...prev, role: e.target.value, studentEmail: '' }));
                    setFormErrors((prev) => ({ ...prev, role: '', grade: '', studentEmail: '' }));
                  }}
                  error={!!formErrors.role}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Grade (if student)"
                value={newUser.grade}
                onChange={(e) => {
                  setNewUser((prev) => ({ ...prev, grade: e.target.value.replace(/[^\d]/g, '') }));
                  setFormErrors((prev) => ({ ...prev, grade: '' }));
                }}
                disabled={newUser.role !== 'student'}
                error={!!formErrors.grade}
                helperText={formErrors.grade}
              />
            </Grid>
            {newUser.role === 'parent' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Parent Mobile Number"
                  value={newUser.parentPhone}
                  onChange={(e) => {
                    setNewUser((prev) => ({ ...prev, parentPhone: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, parentPhone: '' }));
                  }}
                  error={!!formErrors.parentPhone}
                  helperText={formErrors.parentPhone}
                  placeholder="+91 9876543210"
                />
              </Grid>
            )}
            {newUser.role === 'parent' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Student Email to Link"
                  value={newUser.studentEmail}
                  onChange={(e) => {
                    setNewUser((prev) => ({ ...prev, studentEmail: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, studentEmail: '' }));
                  }}
                  placeholder="Optional"
                  error={!!formErrors.studentEmail}
                  helperText={formErrors.studentEmail}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={newUser.status}
                  onChange={(e) => {
                    setNewUser((prev) => ({ ...prev, status: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, status: '' }));
                  }}
                  error={!!formErrors.status}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenUserDialog(false);
              setEditingUserId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              const nextErrors = validateUserForm();
              setFormErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) {
                toast.error('Please fix the highlighted fields');
                return;
              }

              try {
                const payload = {
                  name: newUser.name.trim(),
                  email: newUser.email.trim(),
                  role: newUser.role,
                  grade: newUser.role === 'student' && newUser.grade ? Number(newUser.grade) : null,
                  isActive: newUser.status === 'active',
                  studentEmail: newUser.role === 'parent' && newUser.studentEmail ? newUser.studentEmail.trim() : undefined,
                  parentPhone: newUser.role === 'parent' ? String(newUser.parentPhone || '').trim() : undefined
                };

                let response;

                if (editingUserId) {
                  response = await api.put(`/api/users/${editingUserId}`, payload);
                  await fetchUsers();
                } else {
                  try {
                    response = await api.post('/api/users', payload);
                  } catch (postErr) {
                    if (postErr?.response?.status === 404) {
                      response = await api.post('/api/admin/users', payload);
                    } else {
                      throw postErr;
                    }
                  }

                  const createdUser = response?.data?.user;

                  if (createdUser) {
                    setUsers((prev) => [{ ...createdUser, status: createdUser.isActive ? 'active' : 'inactive' }, ...prev]);
                  } else {
                    await fetchUsers();
                  }
                }

                setNewUser({ name: '', email: '', role: 'student', grade: '', studentEmail: '', parentPhone: '', status: 'active' });
                setOpenUserDialog(false);
                setEditingUserId(null);

                const tempPassword = response?.data?.temporaryPassword;
                if (!editingUserId && tempPassword) {
                  toast.success(`User added. Temporary password: ${tempPassword}`);
                } else {
                  toast.success(response?.data?.message || (editingUserId ? 'User updated successfully' : 'User added successfully'));
                }
              } catch (err) {
                toast.error(err?.response?.data?.message || (editingUserId ? 'Failed to update user' : 'Failed to add user'));
              }
            }}
          >
            {editingUserId ? 'Update User' : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
