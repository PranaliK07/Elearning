import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Download,
  Edit,
  ExpandMore,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const ReportsIssues = () => {
  const [reports, setReports] = useState([]);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportOpen = Boolean(exportAnchorEl);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRes = await api.get('/api/reports');
        const reportsData = Array.isArray(reportsRes.data)
          ? reportsRes.data
          : (reportsRes.data?.reports || []);
        setReports(reportsData);
      } catch (err) {
        console.log('Reports endpoint not available yet');
        setReports([]);
      }
    };

    fetchReports();
  }, []);

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportRows = reports.map((report) => ({
    type: report.type || 'general',
    title: report.title || 'Untitled',
    reportedBy: report.user || report.reportedBy || 'Anonymous',
    date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A',
    status: report.status || 'pending',
  }));

  const exportCSV = () => {
    handleExportClose();
    const headers = ['Type', 'Title', 'Reported By', 'Date', 'Status'];
    const rows = exportRows.map((row) => [row.type, row.title, row.reportedBy, row.date, row.status]);
    const csvContent = `data:text/csv;charset=utf-8,${headers.join(',')}\n${rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'reports_issues.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reports exported as CSV');
  };

  const exportExcel = () => {
    handleExportClose();
    const worksheet = XLSX.utils.json_to_sheet(exportRows.map((row) => ({
      Type: row.type,
      Title: row.title,
      'Reported By': row.reportedBy,
      Date: row.date,
      Status: row.status,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, 'reports_issues.xlsx');
    toast.success('Reports exported as Excel');
  };

  const exportPDF = () => {
    handleExportClose();
    const doc = new jsPDF();
    doc.text('Reports & Issues', 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Type', 'Title', 'Reported By', 'Date', 'Status']],
      body: exportRows.map((row) => [row.type, row.title, row.reportedBy, row.date, row.status]),
    });
    doc.save('reports_issues.pdf');
    toast.success('Reports exported as PDF');
  };

  const exportWord = () => {
    handleExportClose();
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Reports & Issues', bold: true, size: 32 })],
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
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Title', bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Reported By', bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
                ],
              }),
              ...exportRows.map((row) => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(row.type)] }),
                  new DocxTableCell({ children: [new Paragraph(row.title)] }),
                  new DocxTableCell({ children: [new Paragraph(row.reportedBy)] }),
                  new DocxTableCell({ children: [new Paragraph(row.date)] }),
                  new DocxTableCell({ children: [new Paragraph(row.status)] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'reports_issues.docx');
      toast.success('Reports exported as Word');
    });
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Reports & Issues
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Review submitted reports and export them when needed.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              endIcon={<ExpandMore />}
              onClick={handleExportClick}
              disabled={reports.length === 0}
            >
              Export Reports
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
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No reports available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id || report._id} hover>
                      <TableCell>
                        <Chip
                          label={report.type || 'general'}
                          size="small"
                          color={
                            report.type === 'bug' ? 'error'
                              : report.type === 'feedback' ? 'info' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>{report.title || 'Untitled'}</TableCell>
                      <TableCell>{report.user || report.reportedBy || 'Anonymous'}</TableCell>
                      <TableCell>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : (report.date || 'N/A')}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.status || 'pending'}
                          size="small"
                          color={
                            report.status === 'resolved' ? 'success'
                              : report.status === 'in-progress' ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <CheckCircle />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ReportsIssues;
