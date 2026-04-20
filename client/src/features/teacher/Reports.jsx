import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import {
  GetApp,
  People,
  Assignment,
  EmojiEvents,
  ExpandMore,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import axios from '../../utils/axios.js';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Reports = () => {
  const [period, setPeriod] = useState('daily');
  const [reportData, setReportData] = useState({
    summary: {},
    studentProgress: [],
    classPerformance: [],
    weeklyActivity: [],
    performanceMetrics: {
      avgScore: 0,
      completionRate: '0%',
      assignmentCompletionRate: '0%',
      totalHours: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const open = Boolean(anchorEl);

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let response;
      const endpoints = [
        `/api/reports?period=${period}`,
        '/api/reports',
        `/api/reports/${period}`
      ];

      let lastError;
      for (const endpoint of endpoints) {
        try {
          response = await axios.get(endpoint);
          break;
        } catch (err) {
          lastError = err;
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('No report endpoint is available');
      }

      setReportData({
        summary: response.data?.summary || {},
        studentProgress: response.data?.studentProgress || [],
        classPerformance: response.data?.classPerformance || [],
        weeklyActivity: response.data?.weeklyActivity || [],
        performanceMetrics: response.data?.performanceMetrics || {
          avgScore: 0,
          completionRate: '0%',
          assignmentCompletionRate: '0%',
          totalHours: 0,
        },
      });
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || 'Failed to load report data');
      setReportData({
        summary: {},
        studentProgress: [],
        classPerformance: [],
        weeklyActivity: [],
        performanceMetrics: {
          avgScore: 0,
          completionRate: '0%',
          assignmentCompletionRate: '0%',
          totalHours: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const summaryMap = {
    daily: [
      { label: 'Active Students Today', value: reportData.summary.activeStudentsToday ?? 0 },
      { label: 'Videos Watched Today', value: reportData.summary.videosWatchedToday ?? 0 },
      { label: 'Topics Completed Today', value: reportData.summary.topicsCompletedToday ?? 0 },
      { label: 'New Enrollments Today', value: reportData.summary.newEnrollmentsToday ?? 0 },
      { label: 'Assignment Completion', value: `${reportData.summary.assignmentCompletionPercentage ?? 0}%` },
    ],
    weekly: [
      { label: 'Total Active Users (Week)', value: reportData.summary.totalActiveUsersThisWeek ?? 0 },
      { label: 'Total Videos Watched', value: reportData.summary.totalVideosWatched ?? 0 },
      { label: 'Average Progress / Student', value: `${reportData.summary.averageProgressPerStudent ?? 0}%` },
      { label: 'Most Active Subject', value: reportData.summary.mostActiveSubject || 'N/A' },
      { label: 'Assignment Completion', value: `${reportData.summary.assignmentCompletionPercentage ?? 0}%` },
    ],
    monthly: [
      { label: 'Total Users', value: reportData.summary.totalUsers ?? 0 },
      { label: 'Total Completed Topics', value: reportData.summary.totalCompletedTopics ?? 0 },
      { label: 'Total Videos Watched', value: reportData.summary.totalVideosWatched ?? 0 },
      { label: 'Top Performing Students', value: reportData.summary.topPerformingStudents?.length ?? 0 },
      { label: 'Overall Progress', value: `${reportData.summary.overallProgressPercentage ?? 0}%` },
      { label: 'Assignment Completion', value: `${reportData.summary.assignmentCompletionPercentage ?? 0}%` },
    ],
  };

  const selectedSummary = summaryMap[period] || [];

  const barData = {
    labels: reportData.studentProgress.map(s => s.name),
    datasets: [
      {
        label: 'Quiz Scores',
        data: reportData.studentProgress.map(s => s.score),
        backgroundColor: 'rgba(63, 81, 181, 0.6)',
        borderColor: 'rgba(63, 81, 181, 1)',
        borderWidth: 1,
      },
      {
        label: 'Overall Progress',
        data: reportData.studentProgress.map(s => s.progress),
        backgroundColor: 'rgba(245, 0, 87, 0.6)',
        borderColor: 'rgba(245, 0, 87, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: reportData.weeklyActivity.map(d => d.day),
    datasets: [
      {
        label: 'Active Students',
        data: reportData.weeklyActivity.map(d => d.active),
        fill: true,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 1)',
        tension: 0.4,
      },
    ],
  };

  const exportCSV = () => {
    handleExportClose();
    const headers = ['Student Name', 'Class', 'Score', 'Progress', 'Assignment Completion'];
    const rows = reportData.studentProgress.map(s => [s.name, s.className || 'Unassigned', s.score, s.progress, s.assignmentCompletion ?? 0]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('CSV Report exported');
  };

  const exportExcel = () => {
    handleExportClose();
    const data = reportData.studentProgress.map(s => ({
      'Student Name': s.name,
      'Class': s.className || 'Unassigned',
      'Score (%)': s.score,
      'Progress (%)': s.progress,
      'Assignment Completion (%)': s.assignmentCompletion ?? 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `student_report_${period}.xlsx`);
    toast.success('Excel Report exported');
  };

  const exportPDF = () => {
    handleExportClose();
    const doc = new jsPDF();
    doc.text(`Student Performance Report - ${period.toUpperCase()}`, 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Student Name', 'Class', 'Score (%)', 'Progress (%)', 'Assignment Completion (%)']],
      body: reportData.studentProgress.map(s => [s.name, s.className || 'Unassigned', `${s.score}%`, `${s.progress}%`, `${s.assignmentCompletion ?? 0}%`]),
    });
    doc.save(`student_report_${period}.pdf`);
    toast.success('PDF Report exported');
  };

  const exportWord = () => {
    handleExportClose();
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Student Performance Report - ${period.toUpperCase()}`,
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
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Student Name", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Class", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Progress", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Assignment Completion", bold: true })] })] }),
                ],
              }),
              ...reportData.studentProgress.map(s => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(s.name)] }),
                  new DocxTableCell({ children: [new Paragraph(s.className || 'Unassigned')] }),
                  new DocxTableCell({ children: [new Paragraph(s.score.toString() + "%")] }),
                  new DocxTableCell({ children: [new Paragraph(s.progress.toString() + "%")] }),
                  new DocxTableCell({ children: [new Paragraph((s.assignmentCompletion ?? 0).toString() + "%")] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `student_report_${period}.docx`);
      toast.success('Word Report exported');
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Box>
          <Typography variant={isMobile ? "h4" : "h3"} fontWeight="900" gutterBottom sx={{ 
            background: 'linear-gradient(45deg, #1A237E 30%, #3F51B5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Learning Analytics 📊
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
            Real-time insights and performance tracking
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <ButtonGroup variant="outlined" size="large" fullWidth={isMobile} sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
            <Button variant={period === 'daily' ? 'contained' : 'outlined'} onClick={() => setPeriod('daily')} disabled={loading}>Daily</Button>
            <Button variant={period === 'weekly' ? 'contained' : 'outlined'} onClick={() => setPeriod('weekly')} disabled={loading}>Weekly</Button>
            <Button variant={period === 'monthly' ? 'contained' : 'outlined'} onClick={() => setPeriod('monthly')} disabled={loading}>Monthly</Button>
          </ButtonGroup>
          <Button 
            variant="contained" 
            startIcon={<GetApp />} 
            endIcon={<ExpandMore />}
            onClick={handleExportClick}
            fullWidth={isMobile}
            sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
          >
            Export
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleExportClose}
            PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 180, boxShadow: 4 } }}
          >
            <MenuItem onClick={exportCSV}>Export CSV</MenuItem>
            <MenuItem onClick={exportExcel}>Export Excel</MenuItem>
            <MenuItem onClick={exportPDF}>Export PDF</MenuItem>
            <MenuItem onClick={exportWord}>Export Word</MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>{selectedSummary[0]?.label || 'Metric 1'}</Typography>
                  <Typography variant="h4" fontWeight="bold">{selectedSummary[0]?.value ?? 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assignment fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>{selectedSummary[1]?.label || 'Metric 2'}</Typography>
                  <Typography variant="h4" fontWeight="bold">{selectedSummary[1]?.value ?? 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People fontSize="large" />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>{selectedSummary[2]?.label || 'Metric 3'}</Typography>
                  <Typography variant="h4" fontWeight="bold">{selectedSummary[2]?.value ?? 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 4, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          {selectedSummary.slice(3).map((item) => (
            <Grid item xs={6} sm={4} md={2} key={item.label}>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {item.value}
              </Typography>
            </Grid>
          ))}
          {reportData.classPerformance.length > 0 && (
            <Grid item xs={12} sm={4} md={3}>
              <Typography variant="caption" color="primary" display="block" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Top Performing Class
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                {reportData.classPerformance[0].className} ({reportData.classPerformance[0].avgScore}%)
              </Typography>
            </Grid>
          )}
          {!selectedSummary.slice(3).length && !reportData.classPerformance.length && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">AVG SCORE</Typography>
                  <Typography variant="h6" fontWeight="bold">{reportData.performanceMetrics.avgScore}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">COMPLETION</Typography>
                  <Typography variant="h6" fontWeight="bold">{reportData.performanceMetrics.completionRate}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">TOTAL HOURS</Typography>
                  <Typography variant="h6" fontWeight="bold">{reportData.performanceMetrics.totalHours}h</Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Student Performance</Typography>
            <Box sx={{ height: { xs: 220, sm: 300 } }}>
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>{period === 'monthly' ? 'Monthly Student Activity' : period === 'daily' ? 'Daily Student Activity' : 'Weekly Student Activity'}</Typography>
            <Box sx={{ height: { xs: 220, sm: 300 } }}>
              <Line data={lineData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>Detailed Student Performance</Typography>
      
      {isMobile ? (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {reportData.studentProgress.map((row) => (
            <Card key={row.name} sx={{ borderRadius: 3, border: '1px solid #eee' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">{row.name}</Typography>
                  <Typography color="primary" variant="subtitle2" fontWeight="bold">{row.className || 'N/A'}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Quiz Match</Typography>
                    <Typography variant="body2" fontWeight="bold">{row.score}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Success Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">{row.progress}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Last Active</Typography>
                    <Typography variant="body2">{row.lastActive ? new Date(row.lastActive).toLocaleDateString() : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Typography variant="body2" color={row.score > 80 ? 'success.main' : 'warning.main'} fontWeight="bold">
                      {row.score > 80 ? 'Excellent' : 'On Track'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ mt: 4, borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Class</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quiz Performance</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Lessons Completed</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Assignment Completion</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Last Active</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.studentProgress.map((row) => (
                  <TableRow key={row.name} hover>
                    <TableCell component="th" scope="row">{row.name}</TableCell>
                    <TableCell align="center">{row.className || 'Unassigned'}</TableCell>
                    <TableCell align="center">{row.score}%</TableCell>
                    <TableCell align="center">{row.progress}%</TableCell>
                    <TableCell align="center">{row.assignmentCompletion ?? 0}%</TableCell>
                    <TableCell align="center">{row.lastActive ? new Date(row.lastActive).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Typography color={row.score > 80 ? 'success.main' : 'warning.main'} fontWeight="bold">
                        {row.score > 80 ? 'Excellent' : 'On Track'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default Reports;
