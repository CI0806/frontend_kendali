import React, { useState, useEffect } from "react";
import {Grid, // Menggunakan Grid2 sesuai standar MUI terbaru jika tersedia, atau tetap Grid
  Paper,
  Typography,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  useTheme, // Tambahkan ini
  alpha,    // Tambahkan ini
} from "@mui/material";
import { 
  Print, 
  FilterList, 
  PictureAsPdf, 
  Article,
  CheckCircle,
  PendingActions
} from "@mui/icons-material";
import services from "@/services";

const Laporan = () => {
  const theme = useTheme(); // Hook untuk akses tema aktif
  const [reportData, setReportData] = useState([]);
  const [filter, setFilter] = useState({ jenis: "arsip", status: "semua" });

  const stats = {
    total: reportData.length,
    completed: reportData.filter(d => d.status === "Selesai" || d.status === "aktif").length,
    pending: reportData.filter(d => d.status === "Pending").length
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      bgcolor: "background.default", // Mengikuti tema
      color: "text.primary",         // Mengikuti tema
      minHeight: "100vh" 
    }}>
      
      {/* 1. KOP SURAT (Didesain tetap kontras/hitam saat print) */}
      <Box sx={{ 
        display: "none", 
        "@media print": { display: "block" }, 
        mb: 4, 
        textAlign: "center",
        color: "#000" // Kop surat biasanya tetap hitam untuk dokumen resmi
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ borderBottom: "3px double #000", pb: 2 }}>
          <Box component="img" src="/logo-instansi.png" sx={{ width: 80, height: 80 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
              Kementerian Lingkungan Hidup dan Kehutanan
            </Typography>
            <Typography variant="body2">
              Direktorat Jenderal Konservasi Sumber Daya Alam dan Ekosistem
            </Typography>
            <Typography variant="caption">
              Jl. Jenderal Gatot Subroto, Jakarta Pusat | Telp: (021) 123456 | Website: www.menlhk.go.id
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* 2. HEADER & ACTION BUTTONS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} className="no-print">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.5px" }}>
            Rekapitulasi Manajerial
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Laporan berkala aktivitas pengarsipan dan manajemen SDM
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>
            Cetak
          </Button>
          <Button variant="contained" disableElevation startIcon={<PictureAsPdf />} sx={{ bgcolor: "error.main", borderRadius: 2, "&:hover": { bgcolor: "error.dark" } }}>
            Export PDF
          </Button>
        </Stack>
      </Stack>

      {/* 3. EXECUTIVE SUMMARY CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryItem label="Total Records" value={stats.total} icon={<Article color="primary" />} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryItem label="Aktif/Disetujui" value={stats.completed} icon={<CheckCircle color="success" />} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryItem label="Menunggu Proses" value={stats.pending} icon={<PendingActions color="warning" />} />
        </Grid>
      </Grid>

      {/* 4. FILTER PANEL */}
      <Paper sx={{ 
        p: 3, mb: 4, borderRadius: 4, 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : "#f8fafc", 
        boxShadow: "none", 
        border: "1px solid",
        borderColor: "divider" 
      }} className="no-print">
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: "text.secondary" }}>Parameter Laporan</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label="Kategori Data" value={filter.jenis} size="small"
              onChange={(e) => setFilter({ ...filter, jenis: e.target.value })}>
              <MenuItem value="arsip">Arsip Dokumen Digital</MenuItem>
              <MenuItem value="cuti">Pengajuan Cuti Pegawai</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField type="date" fullWidth label="Mulai" size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField type="date" fullWidth label="Selesai" size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button fullWidth variant="contained" startIcon={<FilterList />} sx={{ height: "40px", borderRadius: 2 }}>
              Terapkan
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 5. DATA TABLE */}
      <TableContainer component={Paper} sx={{ 
        boxShadow: "none", 
        border: "1px solid",
        borderColor: "divider", 
        borderRadius: 4, 
        overflow: "hidden",
        bgcolor: "background.paper"
      }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? "primary.dark" : "#1e293b" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>NO</TableCell>
              {filter.jenis === "arsip" ? (
                <>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>ID NASKAH</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>PERIHAL</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>TGL ARSIP</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>KLASIFIKASI</TableCell>
                </>
              ) : (
                <>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>PEGAWAI</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>JENIS CUTI</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>DURASI</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>STATUS</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((row, idx) => (
              <TableRow key={idx} sx={{ 
                "&:nth-of-type(even)": { 
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.action.hover, 0.05) : "#fcfcfc" 
                } 
              }}>
                <TableCell>{idx + 1}</TableCell>
                {filter.jenis === "arsip" ? (
                  <>
                    <TableCell sx={{ fontWeight: 600 }}>{row.nomor_arsip}</TableCell>
                    <TableCell>{row.perihal}</TableCell>
                    <TableCell>{row.tgl_arsip}</TableCell>
                    <TableCell>
                       <Box sx={{ 
                         fontSize: "11px", px: 1, 
                         bgcolor: theme.palette.mode === 'dark' ? "grey.800" : "#f1f5f9", 
                         color: "text.primary",
                         borderRadius: 1, display: "inline-block" 
                       }}>
                         {row.klasifikasi?.kode || "N/A"}
                       </Box>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 600 }}>{row.pegawai?.nama}</TableCell>
                    <TableCell>{row.jenis_cuti}</TableCell>
                    <TableCell>{row.lama_cuti} Hari</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 6. SIGNATURE SECTION */}
      <Grid container sx={{ mt: 6, display: "none", "@media print": { display: "flex", color: "#000" } }}>
        <Grid size={{ xs: 8 }} />
        <Grid size={{ xs: 4 }} sx={{ textAlign: "center" }}>
          <Typography variant="body2">Jakarta, {new Date().toLocaleDateString("id-ID", { dateStyle: 'long' })}</Typography>
          <Typography variant="body2" sx={{ mb: 8, fontWeight: 700 }}>Kepala Bagian Umum,</Typography>
          <Typography sx={{ fontWeight: 900, textDecoration: "underline" }}>DR. ANDRI SETIAWAN, M.SI</Typography>
          <Typography variant="body2">NIP. 19850112 201001 1 002</Typography>
        </Grid>
      </Grid>

      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            @page { margin: 1.5cm; }
            body { 
              -webkit-print-color-adjust: exact; 
              background-color: white !important; 
              color: black !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

const SummaryItem = ({ label, value, icon }) => {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ 
      p: 2, 
      borderRadius: 3, 
      display: "flex", 
      alignItems: "center", 
      gap: 2,
      bgcolor: "background.paper" 
    }}>
      <Box sx={{ 
        p: 1, 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : "#f8fafc", 
        borderRadius: 2 
      }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary" }}>{value}</Typography>
      </Box>
    </Paper>
  );
};

export default Laporan;