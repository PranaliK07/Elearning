import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
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
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  People,
  School,
  Assignment as AssignmentIcon,
  TrendingUp,
  Search,
  MoreVert,
  Email,
  Download,
  Person,
  ExpandMore,
  HelpOutline,
  ChatBubbleOutline,
  CheckCircle,
  Pending as PendingIcon,
  Send,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios.js';
import { toast } from 'react-hot-toast';
import { resolveAvatarSrc } from '../../utils/media';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({
    students: [],
    classes: [],
    stats: {
      totalStudents: 0,
      activeClasses: 0,
      assignments: 0,
      avgProgress: 0,
    },
    recentSubmissions: [],  
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportOpen = Boolean(exportAnchorEl);
  const [pendingDoubts, setPendingDoubts] = useState([]);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get('tab')) || 0;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = parseInt(searchParams.get('tab'));
    if (!isNaN(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPendingDoubts();
  }, []);

  const fetchPendingDoubts = async () => {
    try {
      const res = await axios.get('/api/doubts/teacher');
      setPendingDoubts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch doubts error', err);
    }
  };

  const handleReplyDoubt = async (doubtId) => {
    if (!replyText.trim()) return;
    try {
      await axios.put(`/api/doubts/${doubtId}/respond`, { answer: replyText });
      setReplyingId(null);
      setReplyText('');
      fetchPendingDoubts();
      toast.success('Reply sent successfully!');
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/teacher');
      setData({
        students: response.data.students || [],
        classes: response.data.classes || [],
        stats: response.data.stats || {
          totalStudents: 0,
          activeClasses: 0,
          assignments: 0,
          avgProgress: 0,
        },
        recentSubmissions: response.data.recentSubmissions || [],
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    handleExportClose();
    const headers = ['Name', 'Email', 'Grade', 'Last Active'];
    const rows = data.students.map(s => [s.name, s.email, s.Grade?.name || 'N/A', new Date(s.updatedAt).toLocaleDateString()]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "teacher_data.csv");
    document.body.appendChild(link);
    link.click();
    toast.success('Data exported as CSV');
  };

  const exportExcel = () => {
    handleExportClose();
    const exportRows = data.students.map(s => ({
      'Name': s.name,
      'Email': s.email,
      'Grade': s.Grade?.name || 'N/A',
      'Last Active': new Date(s.updatedAt).toLocaleDateString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "teacher_data.xlsx");
    toast.success('Data exported as Excel');
  };

  const exportPDF = () => {
    handleExportClose();
    const doc = new jsPDF();
    doc.text("Students Overview Report", 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Name', 'Email', 'Grade', 'Last Active']],
      body: data.students.map(s => [s.name, s.email, s.Grade?.name || 'N/A', new Date(s.updatedAt).toLocaleDateString()]),
    });
    doc.save("teacher_data.pdf");
    toast.success('Data exported as PDF');
  };

  const exportWord = () => {
    handleExportClose();
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Students Overview Report",
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          new DocxTable({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Grade", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Last Active", bold: true })] })] }),
                ],
              }),
              ...data.students.map(s => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(s.name)] }),
                  new DocxTableCell({ children: [new Paragraph(s.email)] }),
                  new DocxTableCell({ children: [new Paragraph(s.Grade?.name || 'N/A')] }),
                  new DocxTableCell({ children: [new Paragraph(new Date(s.updatedAt).toLocaleDateString())] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "teacher_data.docx");
      toast.success('Data exported as Word');
    });
  };

  const filteredStudents = data.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = pendingDoubts.filter(d => d.status === 'pending').length;

  const statsConfig = [
    { label: 'Total Students', value: data.stats.totalStudents, icon: <People />, color: '#0B1F3B' },
    { label: 'Active Classes', value: data.stats.activeClasses, icon: <School />, color: '#f50057' },
    { label: 'Assignments', value: data.stats.assignments, icon: <AssignmentIcon />, color: '#4caf50' },
    { label: 'Student Doubts', value: pendingCount, icon: <ChatBubbleOutline />, color: pendingCount > 0 ? '#ff5722' : '#9e9e9e' },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">Loading teacher dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome back, {user?.name}! 👨‍🏫
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Here's an overview of your classes and student progress
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={() => navigate('/profile')}
            sx={{ borderRadius: 2 }}
          >
            My Profile
          </Button>
        </Box>

        {/* Tabs Selection */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="teacher dashboard tabs"
          >
            <Tab 
              icon={<DashboardIcon sx={{ fontSize: '1.2rem' }} />} 
              iconPosition="start" 
              label="Overview" 
              sx={{ fontWeight: 'bold' }} 
            />
            <Tab 
              icon={
                <Badge badgeContent={pendingCount} color="error" overlap="circular">
                  <ChatBubbleOutline sx={{ fontSize: '1.2rem' }} />
                </Badge>
              } 
              iconPosition="start" 
              label="Student Doubts" 
              sx={{ fontWeight: 'bold' }} 
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statsConfig.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card sx={{ bgcolor: stat.color, color: 'white', borderRadius: 3, boxShadow: 3 }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                            <Typography variant="h4" fontWeight="bold">{stat.value}</Typography>
                          </Box>
                          <Box sx={{ fontSize: 40, opacity: 0.7 }}>
                            {stat.icon}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {activeTab === 0 && (
          <Paper sx={{ p: 3, borderRadius: 3, mb: 4, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Export Data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm="auto">
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<Download />}
                  endIcon={<ExpandMore />}
                  onClick={handleExportClick}
                >
                  Export Data
                </Button>
                <Menu
                  anchorEl={exportAnchorEl}
                  open={exportOpen}
                  onClose={handleExportClose}
                >
                  <MenuItem onClick={exportCSV}>Export as CSV</MenuItem>
                  <MenuItem onClick={exportExcel}>Export as Excel</MenuItem>
                  <MenuItem onClick={exportPDF}>Export as PDF</MenuItem>
                  <MenuItem onClick={exportWord}>Export as Word</MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Recent Submissions */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Recent Submissions
                </Typography>
                {data.recentSubmissions.length > 0 ? (
                  <Box>
                    {data.recentSubmissions.map((sub) => (
                      <Box key={sub.id} sx={{ mb: 2, p: 1, borderBottom: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar src={resolveAvatarSrc(sub.student?.avatar)} sx={{ width: 32, height: 32, mr: 1 }} />
                          <Typography variant="subtitle2">{sub.student?.name}</Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Submitted: {sub.Assignment?.title}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'divider' }} />
                    <Typography color="textSecondary">No recent submissions</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Students Table */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 3
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Students Overview
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                    sx={{ width: { xs: '100%', sm: 200 } }}
                  />
                </Box>

                <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
                  <Table stickyHeader sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Last Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }} src={resolveAvatarSrc(student.avatar)}>
                                {student.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{student.name}</Typography>
                                <Typography variant="caption" color="textSecondary">{student.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{student.Grade?.name || 'Unassigned'}</TableCell>
                          <TableCell>{new Date(student.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Send Email">
                              <IconButton size="small" onClick={() => window.location.href = `mailto:${student.email}`}>
                                <Email fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            No students found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Separate Doubt Management Section */}
        {activeTab === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ChatBubbleOutline color="primary" sx={{ fontSize: '2.2rem' }} /> Doubts Portal
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage and respond to student questions directly from here.
                  </Typography>
                </Box>
                <Chip 
                  label={`${pendingCount} Pending Resolution`} 
                  color={pendingCount > 0 ? "error" : "success"}
                  variant="filled"
                  sx={{ fontWeight: '800', px: 2, py: 2.5, borderRadius: 3 }}
                />
              </Box>
              
              <Divider sx={{ mb: 4 }} />

              {pendingDoubts.length > 0 ? (
                <Stack spacing={3}>
                  {pendingDoubts.map((doubt) => (
                    <Box key={doubt.id} sx={{ 
                      p: 3, 
                      borderRadius: 4, 
                      border: '1px solid',
                      borderColor: doubt.status === 'pending' ? 'rgba(255,87,34,0.15)' : 'rgba(76,175,80,0.15)',
                      bgcolor: doubt.status === 'pending' ? 'rgba(255,87,34,0.02)' : 'rgba(76,175,80,0.02)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Status Strip */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: 6, 
                        bgcolor: doubt.status === 'pending' ? '#ff5722' : '#4caf50' 
                      }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={resolveAvatarSrc(doubt.student?.avatar)} 
                            sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: 2 }}
                          >
                            {doubt.student?.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{doubt.student?.name}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               {new Date(doubt.createdAt).toLocaleDateString()} • {new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={doubt.status.toUpperCase()} 
                          size="small" 
                          color={doubt.status === 'pending' ? 'warning' : 'success'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Typography variant="body1" sx={{ mb: 3, fontWeight: 500, bgcolor: 'rgba(255,255,255,0.5)', p: 2, borderRadius: 2 }}>
                        "{doubt.question}"
                      </Typography>

                      {doubt.answer ? (
                        <Box sx={{ bgcolor: 'rgba(76,175,80,0.05)', p: 2, borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', mb: 0.5, display: 'block' }}>
                            RESOLVED BY YOU:
                          </Typography>
                          <Typography variant="body2">{doubt.answer}</Typography>
                        </Box>
                      ) : (
                        <Box>
                          {replyingId === doubt.id ? (
                            <Box>
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Type your expert answer here..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                sx={{ mb: 2, bgcolor: 'white' }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                  variant="contained" 
                                  startIcon={<Send />} 
                                  onClick={() => handleReplyDoubt(doubt.id)}
                                  disabled={!replyText.trim()}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Submit Answer
                                </Button>
                                <Button 
                                  variant="text" 
                                  onClick={() => setReplyingId(null)}
                                  color="inherit"
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Button 
                              variant="outlined" 
                              startIcon={<ChatBubbleOutline />}
                              onClick={() => { setReplyingId(doubt.id); setReplyText(''); }}
                              sx={{ borderRadius: 2 }}
                            >
                              Provide Answer
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 80, mb: 2, color: 'success.light' }} />
                  <Typography variant="h6">Inbox is Clear!</Typography>
                  <Typography>No students have pending doubts right now.</Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </motion.div>
    </Container>
  );
};

export default TeacherDashboard;
