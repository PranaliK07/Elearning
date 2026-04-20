import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, ImageRun, Packer, PageOrientation, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import api from '../../utils/axios';
import { resolveAvatarSrc } from '../../utils/media';
import logoUrl from '../../img/els-logo.png';

const todayDateOnly = () => new Date().toISOString().slice(0, 10);
const shiftDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const PLATFORM_NAME = 'Kids Learn';
const PLATFORM_SUBTITLE = 'Learning Platform';
const STATUS_PRESENT = 'present';
const STATUS_ABSENT = 'absent';

const formatDateLabel = (dateOnly) => {
  try {
    const d = new Date(dateOnly);
    return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return String(dateOnly || '');
  }
};

const TeacherAttendance = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [classes, setClasses] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [date, setDate] = useState(todayDateOnly());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFrom, setReportFrom] = useState(shiftDays(-30));
  const [reportTo, setReportTo] = useState(todayDateOnly());
  const [report, setReport] = useState({ dates: [], students: [], attendance: [], grade: null, from: null, to: null });

  const fetchClasses = async () => {
    const res = await api.get('/api/grades');
    const list = Array.isArray(res.data) ? res.data : [];
    setClasses(list);
    if (!selectedGradeId && list.length) {
      setSelectedGradeId(String(list[0].id));
    }
  };

  const fetchAttendance = async (gradeId, dateOnly) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/attendance/grade/${gradeId}`, { params: { date: dateOnly } });
      const students = Array.isArray(res.data?.students) ? res.data.students : [];
      setRows(
        students.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          avatar: s.avatar,
          status: s.attendance?.status || 'absent',
          note: s.attendance?.note || ''
        }))
      );
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchClasses();
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedGradeId) return;
    fetchAttendance(selectedGradeId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGradeId, date]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
  }, [rows, search]);

  const presentCount = useMemo(() => rows.filter((r) => r.status === 'present').length, [rows]);
  const absentCount = useMemo(() => rows.filter((r) => r.status === 'absent').length, [rows]);

  const setAll = (status) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    if (!selectedGradeId) return;
    try {
      setSaving(true);
      const records = rows.map((r) => ({ studentId: r.id, status: r.status, note: r.note }));
      await api.post(`/api/attendance/grade/${selectedGradeId}/mark`, { date, records });
      toast.success('Attendance saved');
      await fetchAttendance(selectedGradeId, date);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    if (!selectedGradeId) return;
    try {
      setReportLoading(true);
      const res = await api.get(`/api/attendance/grade/${selectedGradeId}/report`, {
        params: { from: reportFrom, to: reportTo }
      });
      setReport({
        dates: Array.isArray(res.data?.dates) ? res.data.dates : [],
        students: Array.isArray(res.data?.students) ? res.data.students : [],
        attendance: Array.isArray(res.data?.attendance) ? res.data.attendance : [],
        grade: res.data?.grade || null,
        from: res.data?.from || reportFrom,
        to: res.data?.to || reportTo
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

  const attendanceLookup = useMemo(() => {
    const map = new Map();
    for (const row of report.attendance || []) {
      if (!row?.studentId || !row?.date) continue;
      map.set(`${row.studentId}_${row.date}`, row);
    }
    return map;
  }, [report.attendance]);

  const renderStatus = (value) => {
    if (value === 'present') return <Chip size="small" color="success" variant="outlined" label="P" />;
    if (value === 'absent') return <Chip size="small" color="error" variant="outlined" label="A" />;
    return <Chip size="small" variant="outlined" label="-" />;
  };

  const buildExportMatrix = () => {
    const dates = report.dates || [];
    const students = report.students || [];
    const header = [
      'Student',
      'Email',
      ...dates.map((d) => formatDateLabel(d)),
      'Present',
      'Absent',
      'Marked',
      'Attendance %'
    ];

    const body = students.map((s) => {
      let presentCount = 0;
      let absentCount = 0;
      let markedCount = 0;

      const row = [s.name || '', s.email || ''];
      for (const d of dates) {
        const rec = attendanceLookup.get(`${s.id}_${d}`);
        const status = rec?.status;
        const v = status === STATUS_PRESENT ? 'P' : status === STATUS_ABSENT ? 'A' : '-';
        row.push(v);
        if (status === STATUS_PRESENT) presentCount += 1;
        if (status === STATUS_ABSENT) absentCount += 1;
        if (status === STATUS_PRESENT || status === STATUS_ABSENT) markedCount += 1;
      }

      const percent = markedCount ? Math.round((presentCount / markedCount) * 100) : 0;
      row.push(String(presentCount), String(absentCount), String(markedCount), `${percent}%`);
      return row;
    });

    return { header, body, dates };
  };

  const loadLogo = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(logoUrl, { signal: controller.signal });
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read logo'));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      return { arrayBuffer, dataUrl };
    } finally {
      clearTimeout(timeout);
    }
  };

  const downloadExcel = () => {
    const { header, body } = buildExportMatrix();
    if (!body.length) return toast.error('Load a report first');

    const titleRows = [
      [PLATFORM_NAME],
      [PLATFORM_SUBTITLE],
      ['────────────────────────────────────────────────────────────'],
      [
        `Attendance Report${report?.grade?.name ? ` - ${report.grade.name}` : ''} (${new Date(reportFrom).toLocaleDateString()} to ${new Date(reportTo).toLocaleDateString()})`
      ],
      ['Legend: P = Present, A = Absent, - = Not marked'],
      []
    ];
    const aoa = [...titleRows, header, ...body];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: header.length - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: header.length - 1 } }
    ];
    worksheet['!cols'] = [
      { wch: 22 }, // Student
      { wch: 26 }, // Email
      ...Array.from({ length: header.length - 2 }, () => ({ wch: 10 }))
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    const safeClass = (report?.grade?.name || `class_${selectedGradeId}`).replace(/[^\w\-]+/g, '_');
    XLSX.writeFile(workbook, `attendance_report_${safeClass}_${reportFrom}_to_${reportTo}.xlsx`);
    toast.success('Excel report downloaded');
  };

  const downloadPDF = async () => {
    try {
      const { header, body, dates } = buildExportMatrix();
      if (!body.length) return toast.error('Load a report first');

      const manyColumns = header.length > 10;
      const doc = new jsPDF({ orientation: manyColumns ? 'landscape' : 'portrait' });
      let startY = 14;

      const logo = await loadLogo().catch(() => null);
      if (logo?.dataUrl) {
        try {
          doc.addImage(logo.dataUrl, 'PNG', 14, 10, 18, 18);
          doc.setFontSize(14);
          doc.text(PLATFORM_NAME, 36, 16);
          doc.setFontSize(10);
          doc.text(PLATFORM_SUBTITLE, 36, 22);
          startY = 28;
        } catch (e) {
          // ignore addImage failures
        }
      }

      doc.setFontSize(12);
      const title = `Attendance Report${report?.grade?.name ? ` - ${report.grade.name}` : ''}`;
      doc.setDrawColor(200);
      doc.setLineWidth(0.4);
      doc.line(14, startY, doc.internal.pageSize.getWidth() - 14, startY);
      const titleY = startY + 6;
      doc.text(title, 14, titleY);
      doc.setFontSize(10);
      doc.text(`From: ${new Date(reportFrom).toLocaleDateString()}  To: ${new Date(reportTo).toLocaleDateString()}`, 14, titleY + 7);
      doc.text('Legend: P = Present, A = Absent, - = Not marked', 14, titleY + 13);

      autoTable(doc, {
        startY: titleY + 18,
        head: [header],
        body,
        theme: 'grid',
        styles: { fontSize: manyColumns ? 7 : 9, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [63, 81, 181], halign: 'center' },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' }
        },
        didParseCell: (data) => {
          const col = data.column.index;
          const isDateCol = col >= 2 && col < 2 + (dates?.length || 0);
          if (!isDateCol || data.section !== 'body') return;
          const v = String(data.cell.raw || '').trim().toUpperCase();
          if (v === 'P') data.cell.styles.textColor = [34, 197, 94];
          if (v === 'A') data.cell.styles.textColor = [239, 68, 68];
        }
      });
      const safeClass = (report?.grade?.name || `class_${selectedGradeId}`).replace(/[^\w\-]+/g, '_');
      doc.save(`attendance_report_${safeClass}_${reportFrom}_to_${reportTo}.pdf`);
      toast.success('PDF report downloaded');
    } catch (err) {
      console.error('PDF download failed:', err);
      toast.error(err?.message || 'Failed to download PDF');
    }
  };

  const downloadWord = async () => {
    const { header, body } = buildExportMatrix();
    if (!body.length) return toast.error('Load a report first');

    let logoArrayBuffer = null;
    try {
      const logo = await loadLogo();
      logoArrayBuffer = logo?.arrayBuffer || null;
    } catch (e) {
      logoArrayBuffer = null;
    }

    const rows = [
      new DocxTableRow({
        children: header.map((h) =>
          new DocxTableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(h), bold: true })] })]
          })
        )
      }),
      ...body.map(
        (r) =>
          new DocxTableRow({
            children: r.map((cell) => new DocxTableCell({ children: [new Paragraph(String(cell ?? ''))] }))
          })
      )
    ];

    const isLandscape = header.length > 10;
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }
            }
          },
          children: [
            new Paragraph({
              children: [
                ...(logoArrayBuffer
                  ? [
                      new ImageRun({
                        data: logoArrayBuffer,
                        transformation: { width: 44, height: 44 }
                      }),
                      new TextRun({ text: '  ' })
                    ]
                  : []),
                new TextRun({ text: PLATFORM_NAME, bold: true, size: 32 })
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [new TextRun({ text: PLATFORM_SUBTITLE })],
              spacing: { after: 250 }
            }),
            new Paragraph({
              border: {
                bottom: {
                  color: 'BDBDBD',
                  space: 1,
                  size: 6
                }
              },
              spacing: { after: 250 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Attendance Report', bold: true, size: 28 })],
              spacing: { after: 250 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `From: ${new Date(reportFrom).toLocaleDateString()}   To: ${new Date(reportTo).toLocaleDateString()}` })],
              spacing: { after: 250 }
            }),
            ...(report?.grade?.name
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: `Class: ${report.grade.name}` })],
                    spacing: { after: 200 }
                  })
                ]
              : []),
            new Paragraph({
              children: [new TextRun({ text: 'Legend: P = Present, A = Absent, - = Not marked' })],
              spacing: { after: 250 }
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const safeClass = (report?.grade?.name || `class_${selectedGradeId}`).replace(/[^\w\-]+/g, '_');
    saveAs(blob, `attendance_report_${safeClass}_${reportFrom}_to_${reportTo}.docx`);
    toast.success('Word report downloaded');
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
        Attendance Management
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Mark daily attendance for your class.
      </Typography>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* ── Filters row ── */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <FormControl fullWidth>
              <InputLabel id="attendance-class-label">Class</InputLabel>
              <Select
                labelId="attendance-class-label"
                label="Class"
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(String(e.target.value))}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name || `Class ${c.level || c.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Search student"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* ── Stats chips + Action buttons ── */}
          {/* Row 1: stat chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`Present: ${presentCount}`} color="success" variant="outlined" />
            <Chip label={`Absent: ${absentCount}`} color="error" variant="outlined" />
          </Stack>

          {/* Row 2: action buttons — wrap on mobile */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& > button': { flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAll('present')}
              disabled={loading || saving}
            >
              Mark All Present
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAll('absent')}
              disabled={loading || saving}
            >
              Mark All Absent
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setReportOpen(true);
                setReportFrom(shiftDays(-30));
                setReportTo(todayDateOnly());
                setReport({ dates: [], students: [], attendance: [] });
              }}
              disabled={!selectedGradeId}
            >
              Attendance Report
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={save}
              disabled={loading || saving || rows.length === 0}
              sx={{ flex: { xs: '1 1 100% !important', sm: '0 0 auto' } }}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </Box>

          {/* ── Student list ── */}
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : filteredRows.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No students found.
              </Typography>
            ) : isMobile ? (
              // ── Mobile card layout ────────────────────────────────────
              <Stack spacing={1.5}>
                {filteredRows.map((r) => (
                  <Paper
                    key={r.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    {/* Student info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar
                        src={resolveAvatarSrc(r.avatar)}
                        alt={r.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        {r.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {r.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" noWrap>
                          {r.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status selector */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Button
                        size="small"
                        fullWidth
                        variant={r.status === 'present' ? 'contained' : 'outlined'}
                        color="success"
                        onClick={() => updateRow(r.id, { status: 'present' })}
                      >
                        Present
                      </Button>
                      <Button
                        size="small"
                        fullWidth
                        variant={r.status === 'absent' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => updateRow(r.id, { status: 'absent' })}
                      >
                        Absent
                      </Button>
                    </Stack>

                    {/* Note */}
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Optional note"
                      value={r.note}
                      onChange={(e) => updateRow(r.id, { note: e.target.value })}
                    />
                  </Paper>
                ))}
              </Stack>
            ) : (
              // ── Desktop table layout ──────────────────────────────────
              <TableContainer component={Box} sx={{ maxHeight: 520, overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 160 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              component="img"
                              alt={r.name}
                              src={resolveAvatarSrc(r.avatar)}
                              sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'grey.100', flexShrink: 0 }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '';
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {r.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" noWrap>
                                {r.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: 160 }}>
                          <FormControl fullWidth>
                            <Select
                              size="small"
                              value={r.status}
                              onChange={(e) => updateRow(r.id, { status: e.target.value })}
                            >
                              <MenuItem value="present">Present</MenuItem>
                              <MenuItem value="absent">Absent</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Optional note"
                            value={r.note}
                            onChange={(e) => updateRow(r.id, { note: e.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Attendance Report</DialogTitle>
        <DialogContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="From"
              type="date"
              value={reportFrom}
              onChange={(e) => setReportFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="To"
              type="date"
              value={reportTo}
              onChange={(e) => setReportTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={loadReport} disabled={reportLoading}>
              {reportLoading ? 'Loading...' : 'Load'}
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            {reportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : report.students.length === 0 || report.dates.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                Select a date range and click Load to view the report.
              </Typography>
            ) : (
              <TableContainer component={Box} sx={{ maxHeight: 560, overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: Math.max(720, 220 + report.dates.length * 90) }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 2 }}>
                        Student
                      </TableCell>
                      {report.dates.map((d) => (
                        <TableCell key={d} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {new Date(d).toLocaleDateString()}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.students.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              component="img"
                              alt={s.name}
                              src={resolveAvatarSrc(s.avatar)}
                              sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'grey.100' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '';
                              }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {s.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" noWrap>
                                {s.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {report.dates.map((d) => {
                          const row = attendanceLookup.get(`${s.id}_${d}`);
                          return (
                            <TableCell key={`${s.id}_${d}`} align="center">
                              {renderStatus(row?.status)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Button
            onClick={downloadPDF}
            variant="outlined"
            size="small"
            disabled={reportLoading || report.students.length === 0 || report.dates.length === 0}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }}
          >
            Download PDF
          </Button>
          <Button
            onClick={downloadWord}
            variant="outlined"
            size="small"
            disabled={reportLoading || report.students.length === 0 || report.dates.length === 0}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }}
          >
            Download Word
          </Button>
          <Button
            onClick={downloadExcel}
            variant="outlined"
            size="small"
            disabled={reportLoading || report.students.length === 0 || report.dates.length === 0}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }}
          >
            Download Excel
          </Button>
          <Button
            onClick={() => setReportOpen(false)}
            variant="outlined"
            size="small"
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherAttendance;
