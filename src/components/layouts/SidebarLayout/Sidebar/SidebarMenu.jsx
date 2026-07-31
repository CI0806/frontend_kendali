import React, { useState, useEffect } from "react";
import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Collapse,
  colors,
  useTheme,
  Badge,
  alpha,
} from "@mui/material";
import {
  Monitor,
  Archive,
  Settings,
  ExpandLess,
  ExpandMore,
  CallSplit,
  AccessTime,
  CalendarMonth,
  Assessment,
  FiberManualRecord,
  FileOpen,
  ListAlt,
  ArchiveRounded,
  BackHandRounded,
  MenuBook,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { jwtDecode } from "jwt-decode";
import session from "@/utils/session";
import services from "@/services";
import styled from "@emotion/styled";

const SidebarMenu = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isDarkMode = theme?.palette?.mode === "dark";

  const [openPengajuan, setOpenPengajuan] = useState(
    currentPath.includes("/pengajuan"),
  );
  const [openMaster, setOpenMaster] = useState(currentPath.includes("/master"));
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ cuti: 0, dokumen: 0, total: 0 });

  const isActive = (path) => currentPath === path;

  // --- UI STYLING CONSTANTS ---
  const menuLabelStyle = (path) => ({
    primaryTypographyProps: {
      fontSize: "0.875rem",
      fontWeight: isActive(path) ? 700 : 500,
      letterSpacing: "-0.01em",
      fontFamily: "'Inter', sans-serif",
    },
  });

  const getMenuItemStyle = (path, isSubMenu = false) => {
    const active = isActive(path);
    return {
      borderRadius: "12px",
      mb: 0.5,
      mx: 1.5,
      py: isSubMenu ? 0.8 : 1.1,
      pl: isSubMenu ? 4 : 2,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",

      // Indikator garis vertikal di samping menu aktif
      "&::before": {
        content: '""',
        position: "absolute",
        left: isSubMenu ? "20px" : "0px",
        height: active ? "50%" : "0%",
        width: "3px",
        borderRadius: "4px",
        bgcolor: colors.indigo[500],
        transition: "height 0.3s ease",
      },

      backgroundColor: active
        ? alpha(colors.indigo[500], isDarkMode ? 0.15 : 0.08)
        : "transparent",

      color: active
        ? colors.indigo[isDarkMode ? 400 : 700]
        : isDarkMode
          ? alpha("#fff", 0.7)
          : colors.blueGrey[700],

      "& .MuiListItemIcon-root": {
        color: active ? colors.indigo[500] : alpha(colors.blueGrey[400], 0.8),
        minWidth: isSubMenu ? "30px" : "38px",
      },

      "&:hover": {
        backgroundColor: alpha(colors.indigo[500], 0.05),
        transform: "translateX(4px)",
        "& .MuiListItemIcon-root": {
          color: colors.indigo[500],
        },
      },
    };
  };

  const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
      backgroundColor: theme.palette?.error?.main || "#ef4444",
      color: "white",
      fontWeight: 800,
      fontSize: "10px",
      borderRadius: "6px",
      border: `2px solid ${theme.palette?.mode === "dark" ? "#1e293b" : "#fff"}`,
      boxShadow: `0 4px 8px ${alpha(theme.palette?.error?.main || "#ef4444", 0.3)}`,
    },
  }));

  const CountChip = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    fontSize: "10px",
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: "20px",
    marginLeft: "8px",
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
  }));

  // --- LOGIC (TETAP SAMA) ---
  const fetchTotalPending = async () => {
    if (!user) return;
    try {
      const role = user.role?.toLowerCase();
      let totalCuti = 0;
      let totalDokumen = 0;
      if (role === "koordinator") {
        const [resCuti, resDoc] = await Promise.all([
          services.cuti.getPendingVerifikasi(),
          services.dokumen.getPendingApproval(),
        ]);
        totalCuti = Array.isArray(resCuti.data)
          ? resCuti.data.length
          : resCuti.data?.data?.length || 0;
        totalDokumen = resDoc.data?.data?.length || 0;
      } else if (role === "pimpinan") {
        const [resCuti, resDoc] = await Promise.all([
          services.cuti.getPendingApproval(),
          services.dokumen.getPendingApproval(),
        ]);
        totalCuti = Array.isArray(resCuti.data)
          ? resCuti.data.length
          : resCuti.data?.data?.length || 0;
        totalDokumen = resDoc.data?.data?.length || 0;
      }
      setCounts({
        cuti: totalCuti,
        dokumen: totalDokumen,
        total: totalCuti + totalDokumen,
      });
    } catch (err) {
      console.error("Gagal sinkron data:", err);
    }
  };

  useEffect(() => {
    const token = session.getToken();
    if (token) {
      try {
        setUser(jwtDecode(token));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const role = user.role?.toString().toLowerCase().trim();
    if (["koordinator", "pimpinan", "admin"].includes(role))
      fetchTotalPending();
    const handleRefresh = () => fetchTotalPending();
    window.addEventListener("refresh-notifications", handleRefresh);
    const interval = setInterval(fetchTotalPending, 120000);
    return () => {
      window.removeEventListener("refresh-notifications", handleRefresh);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      <MenuList disablePadding>
        {/* BERANDA */}
        <MenuItem onClick={() => navigate("/")} sx={getMenuItemStyle("/")}>
          <ListItemIcon>
            <Monitor fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Beranda" {...menuLabelStyle("/")} />
        </MenuItem>

        {/* PENGAJUAN */}
        <MenuItem
          onClick={() => setOpenPengajuan(!openPengajuan)}
          sx={getMenuItemStyle("/pengajuan-parent")}>
          <ListItemIcon>
            <Badge color="error" variant="dot" invisible={counts.total === 0}>
              <CallSplit fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Pengajuan"
            {...menuLabelStyle("/pengajuan-parent")}
          />
          {counts.total > 0 && !openPengajuan && (
            <CountChip>{counts.total}</CountChip>
          )}
          {openPengajuan ? (
            <ExpandLess sx={{ opacity: 0.5 }} />
          ) : (
            <ExpandMore sx={{ opacity: 0.5 }} />
          )}
        </MenuItem>

        <Collapse in={openPengajuan} timeout="auto" unmountOnExit>
          <MenuList disablePadding>
            <MenuItem
              onClick={() => navigate("/pengajuan/cuti")}
              sx={getMenuItemStyle("/pengajuan/cuti", true)}>
              <ListItemIcon>
                <FiberManualRecord
                  sx={{ fontSize: isActive("/pengajuan/cuti") ? 8 : 4 }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Cuti"
                {...menuLabelStyle("/pengajuan/cuti")}
              />
            </MenuItem>
            <MenuItem
              onClick={() => navigate("/pengajuan/dokumen")}
              sx={getMenuItemStyle("/pengajuan/dokumen", true)}>
              <ListItemIcon>
                <FiberManualRecord
                  sx={{ fontSize: isActive("/pengajuan/dokumen") ? 8 : 4 }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Dokumen"
                {...menuLabelStyle("/pengajuan/dokumen")}
              />
            </MenuItem>
            {(user?.role === "koordinator" || user?.role === "admin") && (
              <MenuItem
                onClick={() => navigate("/pengajuan/verifikasi")}
                sx={getMenuItemStyle("/pengajuan/verifikasi", true)}>
                <ListItemIcon>
                  <FiberManualRecord
                    sx={{ fontSize: isActive("/pengajuan/verifikasi") ? 8 : 4 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Verifikasi"
                  {...menuLabelStyle("/pengajuan/verifikasi")}
                />
                {counts.total > 0 && (
                  <StyledBadge badgeContent={counts.total} sx={{ ml: 1 }} />
                )}
              </MenuItem>
            )}
            {(user?.role === "pimpinan" || user?.role === "admin") && (
              <MenuItem
                onClick={() => navigate("/pengajuan/persetujuan")}
                sx={getMenuItemStyle("/pengajuan/persetujuan", true)}>
                <ListItemIcon>
                  <FiberManualRecord
                    sx={{
                      fontSize: isActive("/pengajuan/persetujuan") ? 8 : 4,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Persetujuan"
                  {...menuLabelStyle("/pengajuan/persetujuan")}
                />
                {counts.total > 0 && (
                  <StyledBadge badgeContent={counts.total} sx={{ ml: 1 }} />
                )}
              </MenuItem>
            )}
          </MenuList>
        </Collapse>

        {/* STANDAR MENU */}
        <MenuItem
          onClick={() => navigate("/riwayat")}
          sx={getMenuItemStyle("/riwayat")}>
          <ListItemIcon>
            <AccessTime fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Riwayat Pengajuan"
            {...menuLabelStyle("/riwayat")}
          />
        </MenuItem>

        <MenuItem
          onClick={() => navigate("/kalendertim")}
          sx={getMenuItemStyle("/kalendertim")}>
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Kalender Tim Cuti"
            {...menuLabelStyle("/kalendertim")}
          />
        </MenuItem>

        <MenuItem
          onClick={() => navigate("/arsip")}
          sx={getMenuItemStyle("/arsip")}>
          <ListItemIcon>
            <Archive fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Arsip" {...menuLabelStyle("/arsip")} />
        </MenuItem>

        <MenuItem
          onClick={() => navigate("/peminjaman")}
          sx={getMenuItemStyle("/peminjaman")}>
          <ListItemIcon>
            <BackHandRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Peminjaman Arsip"
            {...menuLabelStyle("/peminjaman")}
          />
        </MenuItem>

        {user?.role === "admin" && (
          <MenuItem
            onClick={() => navigate("/penomoran")}
            sx={getMenuItemStyle("/penomoran")}>
            <ListItemIcon>
              <MenuBook fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Buku Register (Nomor)"
              {...menuLabelStyle("/penomoran")}
            />
          </MenuItem>
        )}

        {(user?.role === "admin" || user?.role === "pimpinan") && (
          <MenuItem
            onClick={() => navigate("/log_activity")}
            sx={getMenuItemStyle("/log_activity")}>
            <ListItemIcon>
              <ListAlt fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Log Activity"
              {...menuLabelStyle("/log_activity")}
            />
          </MenuItem>
        )}

        {/* MASTER DATA */}
        {user?.role?.toLowerCase() === "admin" && (
          <>
            <MenuItem
              onClick={() => setOpenMaster(!openMaster)}
              sx={getMenuItemStyle("/master-parent")}>
              <ListItemIcon>
                <Assessment fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Master Data"
                {...menuLabelStyle("/master-parent")}
              />
              {openMaster ? (
                <ExpandLess sx={{ opacity: 0.5 }} />
              ) : (
                <ExpandMore sx={{ opacity: 0.5 }} />
              )}
            </MenuItem>
            <Collapse in={openMaster} timeout="auto" unmountOnExit>
              <MenuList disablePadding>
                {[
                  { label: "Pegawai", path: "/master/pegawai" },
                  { label: "Kuota Cuti", path: "/master/kuota" },
                  { label: "Klasifikasi Arsip", path: "/master/klasifikasi" },
                  { label: "Lokasi Fisik", path: "/master/lokasi" },
                ].map((sub) => (
                  <MenuItem
                    key={sub.path}
                    onClick={() => navigate(sub.path)}
                    sx={getMenuItemStyle(sub.path, true)}>
                    <ListItemIcon>
                      <FiberManualRecord
                        sx={{ fontSize: isActive(sub.path) ? 8 : 4 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={sub.label}
                      {...menuLabelStyle(sub.path)}
                    />
                  </MenuItem>
                ))}
              </MenuList>
            </Collapse>
          </>
        )}

        {/* {(user?.role === "admin" || user?.role === "pimpinan") && (
          <MenuItem
            onClick={() => navigate("/laporan")}
            sx={getMenuItemStyle("/laporan")}>
            <ListItemIcon>
              <FileOpen fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Laporan" {...menuLabelStyle("/laporan")} />
          </MenuItem>
        )} */}
        {/* 
        <Divider sx={{ mx: 3, mb: 1, opacity: isDarkMode ? 0.1 : 0.5 }} /> */}

        <MenuItem
          onClick={() => navigate("/pengaturan")}
          sx={getMenuItemStyle("/pengaturan")}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Pengaturan Akun"
            {...menuLabelStyle("/pengaturan")}
          />
        </MenuItem>
      </MenuList>
    </Box>
  );
};

export default SidebarMenu;
