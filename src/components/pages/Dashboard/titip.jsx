import React, { useState } from "react";
import { Grid,
  Paper,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Button,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  colors,
} from "@mui/material";
import {
  DateRange,
  AddModerator,
  History,
  InfoOutlined,
  EmojiEvents,
} from "@mui/icons-material";

const Kuota = () => {
  // Data dummy untuk tampilan
  const [quota, setQuota] = useState({
    total: 12,
    terpakai: 4,
    sisa: 8,
    tahun: 2026
  });

  const progress = (quota.terpakai / quota.total) * 100;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}>
          Informasi Kuota Cuti
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pantau sisa jatah cuti tahunan dan riwayat pemakaian Anda.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* 1. VISUAL QUOTA CARD */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 4, borderRadius: 5, bgcolor: "#1e293b", color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}>
              <DateRange sx={{ fontSize: 200 }} />
            </Box>
            
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 500 }}>Sisa Jatah Cuti</Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, my: 1 }}>{quota.sisa} <span style={{ fontSize: '24px' }}>Hari</span></Typography>
                <Chip label={`Periode Tahun ${quota.tahun}`} sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Pemakaian: {quota.terpakai} / {quota.total} Hari</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{Math.round(progress)}%</Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 5, 
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": { bgcolor: colors.indigo[400] }
                  }} 
                />
              </Box>

              <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
              
              <Button 
                variant="contained" 
                startIcon={<AddModerator />}
                sx={{ bgcolor: colors.indigo[600], "&:hover": { bgcolor: colors.indigo[700] }, borderRadius: 2, py: 1.5 }}
              >
                Ajukan Cuti Baru
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 2. RINCIAN PER KATEGORI */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Rincian Jatah Cuti</Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CategoryCard 
                  title="Cuti Tahunan" 
                  count="12 Hari" 
                  desc="Jatah reguler per tahun" 
                  icon={<EmojiEvents sx={{ color: colors.amber[700] }} />} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CategoryCard 
                  title="Cuti Besar" 
                  count="0 Hari" 
                  desc="Tiap 6 tahun masa kerja" 
                  icon={<History sx={{ color: colors.indigo[700] }} />} 
                />
              </Grid>
            </Grid>

            {/* INFO BOX */}
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "#eff6ff", border: `1px solid ${colors.indigo[100]}`, display: "flex", gap: 2 }}>
              <InfoOutlined color="primary" />
              <Typography variant="body2" color="primary.main">
                Jatah cuti tahunan akan hangus pada tanggal 31 Desember jika tidak digunakan. Cuti yang sudah disetujui akan otomatis memotong kuota di atas.
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

// Sub-komponen Kartu Kategori
const CategoryCard = ({ title, count, desc, icon }) => (
  <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 3 }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{count}</Typography>
          <Typography variant="caption" color="text.secondary">{desc}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default Kuota;