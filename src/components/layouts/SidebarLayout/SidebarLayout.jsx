import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  colors,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  Dialog,
  TextField,
  InputBase,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Menu as MenuIcon,
  NotificationsNoneRounded,
  TodayRounded,
  DarkModeRounded,
  LightModeRounded,
  SearchRounded,
  PersonRounded,
  WorkRounded,
  InsertDriveFileRounded,
  VpnKeyRounded,
  Storage,
} from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router";
import Sidebar from "./Sidebar";
import NotificationBell from "../../ui/NotificationBell";

const SidebarLayout = ({ toggleTheme }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const drawerWidth = 260;
  const isDarkMode = theme?.palette?.mode === "dark";

  const menuItems = [
    { title: "Dashboard Utama", path: "/", icon: <TodayRounded /> },
    {
      title: "Master Pegawai",
      path: "/master/pegawai",
      icon: <PersonRounded />,
    },
    {
      title: "Master Kuota Cuti",
      path: "/master/kuota",
      icon: <Storage />,
    },
    { title: "Manajemen Cuti", path: "/pengajuan/cuti", icon: <WorkRounded /> },
    {
      title: "Arsip Digital",
      path: "/pengajuan/dokumen",
      icon: <InsertDriveFileRounded />,
    },
    { title: "Konfigurasi Akun", path: "/pengaturan", icon: <VpnKeyRounded /> },
  ];

  const filteredMenus = menuItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleNavigate = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getPageTitle = (path) => {
    const titles = {
      "/": "Dashboard Utama",
      "/master/pegawai": "Master Pegawai",
      "/master/kuota": "Master Kuota Cuti",
      "/master/klasifikasi": "Master Klasifikasi",
      "/master/lokasi": "Master Lokasi Arsip",
      "/pengajuan/cuti": "Pengajuan Cuti",
      "/pengajuan/dokumen": "Pengajuan Dokumen",
      "/pengajuan/verifikasi": "Verifikasi Koordinator",
      "/pengajuan/persetujuan": "Persetujuan Pimpinan",
      "/riwayat": "Riwayat Pengajuan",
      "/kalendertim": "Kalender Cuti",
      "/arsip": "Arsip Digital",
      "/laporan": "Laporan",
      "/pengaturan": "Konfigurasi Akun",
    };
    return titles[path] || "KENDALI Puskesmas";
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: isDarkMode ? "#0f172a" : "#f8fafc",
      }}>
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDarkMode ? alpha("#1e293b", 0.95) : alpha("#fff", 0.95),
            backdropFilter: "blur(10px)",
            backgroundImage: "none",
            boxShadow:
              "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          },
        }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <SearchRounded sx={{ color: colors.indigo[600] }} />
            <InputBase
              fullWidth
              autoFocus
              placeholder="Cari menu atau fitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "text.primary",
              }}
            />
            <Typography
              variant="caption"
              sx={{ bgcolor: "action.hover", px: 1, borderRadius: 1 }}>
              ESC
            </Typography>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <List sx={{ maxHeight: "300px", overflow: "auto" }}>
            {filteredMenus.length > 0 ? (
              filteredMenus.map((item, index) => (
                <ListItemButton
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ borderRadius: "8px", mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: colors.indigo[600] }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Navigasi
                  </Typography>
                </ListItemButton>
              ))
            ) : (
              <Typography
                sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                Tidak ada hasil untuk "{searchQuery}"
              </Typography>
            )}
          </List>
        </Box>
      </Dialog>
      {/* --- APPBAR CANTIK --- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          // Efek Glassmorphism
          bgcolor: alpha(isDarkMode ? "#1e293b" : "#ffffff", 0.8),
          backdropFilter: "blur(12px)",
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${isDarkMode ? alpha("#fff", 0.05) : colors.grey[200]}`,
          zIndex: theme.zIndex.drawer + 1,
        }}>
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
            minHeight: 70,
          }}>
          {/* SISI KIRI: Brand & Page Info */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                mr: 1,
                display: { md: "none" },
                bgcolor: alpha(colors.indigo[500], 0.1),
              }}>
              <MenuIcon fontSize="small" sx={{ color: colors.indigo[600] }} />
            </IconButton>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontWeight: 700,
                  color: colors.indigo[600],
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontSize: "0.65rem",
                }}>
                Sistem Kendali v2.0
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isDarkMode ? "#f8fafc" : colors.blueGrey[900],
                  letterSpacing: -0.5,
                  lineHeight: 1.2,
                }}>
                {getPageTitle(location.pathname)}
              </Typography>
            </Box>
          </Stack>

          {/* SISI KANAN: Widgets & Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Widget Tanggal (Modern Card Style) */}
            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                alignItems: "center",
                gap: 1.5,
                bgcolor: isDarkMode ? alpha("#fff", 0.05) : colors.grey[100],
                py: 0.8,
                px: 2,
                borderRadius: "12px",
                border: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : "transparent"}`,
              }}>
              <TodayRounded sx={{ fontSize: 18, color: colors.indigo[500] }} />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: isDarkMode ? colors.grey[400] : colors.grey[700],
                }}>
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Typography>
            </Box>

            <Box
              sx={{
                width: "1px",
                height: "24px",
                bgcolor: colors.grey[300],
                mx: 1,
                display: { xs: "none", sm: "block" },
              }}
            />

            {/* Tombol Pencarian Cepat */}
            <IconButton
              onClick={() => setSearchOpen(true)} // Aktifkan fungsi klik
              size="small"
              sx={{
                color: colors.grey[500],
                display: { xs: "none", sm: "flex" },
              }}>
              <SearchRounded />
            </IconButton>

            {/* Notifikasi dengan Badge Glow */}
            <NotificationBell />

            {/* Theme Switcher (Pill Style) */}
            <Tooltip title={isDarkMode ? "Switch to Light" : "Switch to Dark"}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  bgcolor: isDarkMode
                    ? alpha("#fbbf24", 0.1)
                    : colors.blueGrey[900],
                  color: isDarkMode ? "#fbbf24" : "#ffffff",
                  borderRadius: "12px",
                  width: 40,
                  height: 40,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "rotate(15deg)",
                    bgcolor: isDarkMode
                      ? alpha("#fbbf24", 0.2)
                      : colors.blueGrey[800],
                  },
                }}>
                {isDarkMode ? (
                  <LightModeRounded fontSize="small" />
                ) : (
                  <DarkModeRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      {/* --- SIDEBAR --- */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        drawerWidth={drawerWidth}
      />
      {/* --- KONTEN UTAMA --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 5 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: "75px",
          minWidth: 0,
          minHeight: "100vh",
          transition: "background-color 0.3s ease",
        }}>
        <Box
          sx={{
            animation: "slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes slideInUp": {
              "0%": { opacity: 0, transform: "translateY(20px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default SidebarLayout;
