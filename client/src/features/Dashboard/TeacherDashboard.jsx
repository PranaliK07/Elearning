import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
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
} from '@mui/material';
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
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
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

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const statsConfig = [
    { label: 'Total Students', value: data.stats.totalStudents, icon: <People />, color: '#0B1F3B' },
    { label: 'Active Classes', value: data.stats.activeClasses, icon: <School />, color: '#f50057' },
    { label: 'Assignments', value: data.stats.assignments, icon: <AssignmentIcon />, color: '#4caf50' },
    { label: 'Avg Progress', value: `${data.stats.avgProgress}%`, icon: <TrendingUp />, color: '#ff9800' },
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

        {/* Quick Actions */}
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
      </motion.div>
    </Container>
  );
};

export default TeacherDashboard;
