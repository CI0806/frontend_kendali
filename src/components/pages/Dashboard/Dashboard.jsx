import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  Avatar,
  Skeleton,
  Chip,
  alpha,
  useTheme,
  IconButton,
  Container,
} from "@mui/material";
import {
  PendingActions,
  SwapHoriz,
  Description,
  Archive,
  NotificationsActive,
  Verified,
  Assessment,
  DarkMode,
  LightMode,
  ChevronRight,
  AddCircle,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import services from "@/services";
import session from "@/utils/session";
import styled from "@emotion/styled";
import ModalCuti from "@/components/ui/ModalCuti";

// --- STYLED COMPONENTS (MENGGUNAKAN PALETTE ANDA) ---
const RootBox = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  paddingBottom: "40px",
  // Menghilangkan gradient, menggunakan warna default dari theme Anda
  backgroundColor: theme.palette.background.default,
  transition: "background-color 0.3s ease",
}));

const StyledGlassCard = styled(Paper)(({ theme }) => ({
  padding: "28px",
  borderRadius: "24px", // Sedikit dikurangi agar lebih tegas
  // Menggunakan warna solid paper tanpa transparansi berlebih
  backgroundColor: theme.palette.background.paper,
  backgroundImage: "none", // Menghilangkan overlay default MUI pada dark mode
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 4px 20px 0 rgba(0,0,0,0.4)"
      : "0 4px 20px 0 rgba(0,0,0,0.05)",
  transition: "all 0.2s ease-in-out",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    // Efek hover yang lebih subtle tanpa mengangkat terlalu tinggi
    transform: "translateY(-4px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 12px 30px 0 rgba(0,0,0,0.6)"
        : "0 12px 30px 0 rgba(0,0,0,0.1)",
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

const IconWrapper = styled(Box)(({ color, theme }) => ({
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: alpha(color, theme.palette.mode === "dark" ? 0.2 : 0.1),
  color: color,
  marginBottom: "16px",
}));

// Dashboard menerima props mode dan setMode dari App.js
const Dashboard = ({ mode, setMode }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCuti: 0,
    totalDokumen: 0,
    pendingCuti: 0,
    arsipAktif: 0,
    arsipInaktif: 0,
    pinjamAktif: 0,
    totalStorage: "0 MB",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentArsip, setRecentArsip] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const user = useMemo(() => {
    try {
      return session.getUser();
    } catch {
      return {};
    }
  }, []);
  const role = (user.role || user.Role || "pegawai").toLowerCase();

  const handleToggleMode = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  const initDashboard = async () => {
    setLoading(true);
    try {
      const [resCuti, resDokumen, resArsip] = await Promise.all([
        // Logika Cuti
        role === "pimpinan" || role === "admin" || role === "koordinator"
          ? services.cuti.getPendingApproval()
          : services.cuti.getRiwayatSaya(),

        services.dokumen.getRiwayatDokumen(),
        services.arsip.getall(),
      ]);

      const dataCuti = resCuti?.data?.data || resCuti?.data || [];
      const dataDokumen = resDokumen?.data?.data || resDokumen?.data || [];
      let dataArsip = resArsip?.data?.data || resArsip?.data || [];

      // --- LOGIKA FILTER ARSIP BERDASARKAN ROLE ---
      let filteredArsip = dataArsip;
      if (role !== "admin" && role !== "pimpinan") {
        // Jika Pegawai/Role lain, FILTER berdasarkan field 'created_by'
        filteredArsip = dataArsip.filter(
          (item) => String(item.created_by) === String(user.id)
        );
      }

      // --- HITUNG PENYIMPANAN & KLASIFIKASI ---
      let totalStorageBytes = 0;
      const klasifikasiCounts = {};
      
      filteredArsip.forEach(item => {
        totalStorageBytes += (item.file_size || 0);
        const kName = item.klasifikasi?.nama || "Lainnya";
        klasifikasiCounts[kName] = (klasifikasiCounts[kName] || 0) + 1;
      });

      const pieChartData = Object.keys(klasifikasiCounts).map(key => ({
        name: key,
        value: klasifikasiCounts[key]
      }));
      setPieData(pieChartData);

      const sortedArsip = [...filteredArsip].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentArsip(sortedArsip.slice(0, 6));

      let storageStr = "0 MB";
      if (totalStorageBytes > 0) {
        const gb = totalStorageBytes / (1024 * 1024 * 1024);
        if (gb >= 1) storageStr = `${gb.toFixed(2)} GB`;
        else storageStr = `${(totalStorageBytes / (1024 * 1024)).toFixed(2)} MB`;
      }

      setStats({
        totalCuti: dataCuti.length,
        totalDokumen: dataDokumen.length,
        pendingCuti: dataCuti.filter(
          (x) =>
            (x.status_approve || x.status || "").toLowerCase() === "pending",
        ).length,
        totalArsip: filteredArsip.length,
        arsipAktif: filteredArsip.length,
        arsipInaktif: 0,
        pinjamAktif: dataDokumen.length,
        totalStorage: storageStr,
      });

      setRecentActivity(dataCuti);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      initDashboard();
    }
  }, [role]);

  const chartData = useMemo(
    () => [
      {
        name: "Total Pengajuan",
        cuti: stats.totalCuti,
        dokumen: stats.totalDokumen,
      },
    ],
    [stats],
  );

  if (loading)
    return (
      <Box
        sx={{
          p: 5,
          bgcolor: theme.palette.background.default,
          minHeight: "100vh",
        }}>
        <Skeleton variant="rounded" height="90vh" sx={{ borderRadius: 8 }} />
      </Box>
    );

  return (
    <RootBox>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* HEADER SECTION */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 6 }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
              color="text.primary"
              sx={{ letterSpacing: "-0.02em" }}>
              Dashboard Overview
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Verified sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography variant="body2" color="text.secondary">
                {user.nama} •{" "}
                <b style={{ color: theme.palette.primary.main }}>
                  {role.toUpperCase()}
                </b>
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            {role === "admin" && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<AddCircle />}
                onClick={() => setModalOpen(true)}
                sx={{ mb: 3 }}>
                Input Izin Manual (Potong Cuti)
              </Button>
            )}
          </Stack>
        </Stack>

        {/* STATS CARDS */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <StatCard
            title="Total Arsip"
            value={stats.totalArsip}
            icon={<Archive />}
            color="#6366f1"
          />
          <StatCard
            title="Penyimpanan"
            value={stats.totalStorage}
            icon={<Description />}
            color={theme.palette.primary.main}
          />
          <StatCard
            title="Antrean Cuti"
            value={stats.pendingCuti}
            icon={<PendingActions />}
            color="#f59e0b"
            isAlert={stats.pendingCuti > 0}
          />
          <StatCard
            title="Riwayat Pinjam"
            value={stats.totalDokumen}
            icon={<SwapHoriz />}
            color="#10b981"
          />
        </Grid>

        {/* GRAPHS */}
        <Grid container spacing={4}>
          <Grid item size={{ xs: 12, lg: 8 }}>
            <StyledGlassCard
              sx={{ height: 480, display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" fontWeight={800} mb={3}>
                Sebaran Klasifikasi Arsip
              </Typography>
              <Box sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={140}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f43f5e', '#3b82f6', '#10b981'][index % 8]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: "center", py: 10, opacity: 0.3 }}>
                    <Archive sx={{ fontSize: 48 }} />
                    <Typography>Belum ada arsip</Typography>
                  </Box>
                )}
              </Box>
            </StyledGlassCard>
          </Grid>

          <Grid item size={{ xs: 12, lg: 4 }}>
            <StyledGlassCard
              sx={{ height: 480, display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" fontWeight={800} mb={3}>
                Arsip Baru Diunggah
              </Typography>
              <Stack spacing={2} sx={{ overflowY: "auto", pr: 1 }}>
                {recentArsip.length > 0 ? (
                  recentArsip.map((item, i) => (
                    <ArsipItem key={i} data={item} theme={theme} />
                  ))
                ) : (
                  <Box sx={{ textAlign: "center", py: 10, opacity: 0.3 }}>
                    <Description sx={{ fontSize: 48 }} />
                    <Typography>Belum ada data arsip</Typography>
                  </Box>
                )}
              </Stack>
            </StyledGlassCard>
          </Grid>
        </Grid>
      </Container>
      <ModalCuti
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        refreshData={initDashboard} // Fungsi untuk refresh angka di dashboard
      />
    </RootBox>
  );
};

// --- SMALL COMPONENTS ---
const StatCard = ({ title, value, icon, color, isAlert }) => (
  <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
    <StyledGlassCard>
      <IconWrapper color={color} theme={useTheme()}>
        {icon}
      </IconWrapper>
      <Typography variant="h3" fontWeight={900} color="text.primary">
        {value}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{ textTransform: "uppercase" }}>
        {title}
      </Typography>
      {isAlert && (
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 8,
            height: 8,
            bgcolor: "#ef4444",
            borderRadius: "50%",
            boxShadow: "0 0 10px #ef4444",
          }}
        />
      )}
    </StyledGlassCard>
  </Grid>
);

const ActivityItem = ({ data, theme }) => (
  <Stack direction="row" spacing={2} alignItems="center">
    <Avatar
      sx={{
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        width: 40,
        height: 40,
      }}>
      {(data.pegawai?.nama || "U")[0]}
    </Avatar>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="body2" fontWeight={700}>
        {data.pegawai?.nama || "User"}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block" }}>
        {data.jenis_cuti}
      </Typography>
    </Box>
    <Chip
      label={data.status || "Pending"}
      size="small"
      sx={{ fontSize: 10, fontWeight: 800, height: 20 }}
      color="warning"
      variant="outlined"
    />
  </Stack>
);

const ArsipItem = ({ data, theme }) => {
  const isImage = data.file_type?.includes('image');
  const isPdf = data.file_type?.includes('pdf');
  
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ 
      p: 1.5, 
      borderRadius: 2,
      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : alpha('#000', 0.02) }
    }}>
      <Avatar
        variant="rounded"
        sx={{
          bgcolor: alpha(isPdf ? '#ef4444' : isImage ? '#3b82f6' : theme.palette.primary.main, 0.1),
          color: isPdf ? '#ef4444' : isImage ? '#3b82f6' : theme.palette.primary.main,
          width: 40,
          height: 40,
        }}>
        <Description fontSize="small" />
      </Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {data.perihal || data.nomor_arsip}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
          noWrap>
          {data.klasifikasi?.nama || "Tanpa Kategori"} • {new Date(data.created_at).toLocaleDateString('id-ID')}
        </Typography>
      </Box>
      <Chip
        label={(data.file_size / 1024 / 1024).toFixed(1) + " MB"}
        size="small"
        sx={{ fontSize: 10, height: 20, bgcolor: 'transparent' }}
      />
    </Stack>
  );
};

export default Dashboard;
