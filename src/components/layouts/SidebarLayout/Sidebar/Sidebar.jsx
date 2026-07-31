import {
  Box,
  Button,
  colors,
  Divider,
  Typography,
  Drawer,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import SidebarMenu from "./SidebarMenu";
import ProfileSection from "./ProfileSection";
import { LogoutRounded } from "@mui/icons-material"; // Gunakan versi Rounded agar lebih modern
import session from "@/utils/session";
import { useNavigate } from "react-router-dom";
import logoPuskesmas from "@/assets/img/logo.png";
import { useState } from "react";
import CustomDialog from "@/components/ui/CustomDialog";
import network from "@/utils/network";

const Sidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth = 260 }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [openLogout, setOpenLogout] = useState(false);
  const token = session.getToken();

  const handleLogout = async () => {
    // Ambil token dari session/storage sebelum dihapus
    const token = session.getToken(); // atau localStorage.getItem("token")

    try {
      // Kirim token agar backend bisa mengenali siapa yang logout
      await network.post(
        "/pegawai/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error("Logout log failed:", error);
    } finally {
      // Setelah lapor ke backend selesai, baru hapus session
      session.clearSession();
      navigate("/login");
    }
  };

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: isDarkMode ? "#1e293b" : "#ffffff", // Warna yang lebih deep untuk dark mode
        color: theme.palette.text.primary,
      }}>
      {/* 1. LOGO SECTION (Dibuat Lebih Premium) */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          // Efek halus di bagian bawah untuk pemisah yang elegan
          //borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        }}>
        {/* CONTAINER LOGO DENGAN EFEK GLOW */}
        <Box
          sx={{
            width: 48, // Sedikit lebih besar agar lebih proporsional
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px", // Sudut lebih halus (Squircle)
            bgcolor: isDarkMode
              ? alpha(colors.indigo[500], 0.15)
              : alpha(colors.indigo[500], 0.08),
            border: `1px solid ${alpha(colors.indigo[500], 0.2)}`,
            boxShadow: `0 8px 16px -4px ${alpha(colors.indigo[500], 0.2)}`, // Efek bayangan berwarna
            position: "relative",
            transition: "transform 0.3s ease",
            "&:hover": { transform: "rotate(-5deg) scale(1.05)" }, // Interaksi kecil saat hover
          }}>
          <img
            src={logoPuskesmas}
            alt="Logo"
            style={{
              width: 28,
              height: "auto",
              filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))",
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              // EFEK GRADIENT TEXT
              background: `linear-gradient(45deg, ${colors.indigo[700]}, ${colors.indigo[400]})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: 0.5, // Dikurangi sedikit agar lebih profesional
              fontSize: "1.2rem",
              lineHeight: 1.1,
              mb: 0.2,
            }}>
            KENDALI!
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: isDarkMode ? colors.grey[400] : colors.grey[600],
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}>
              Digital System
            </Typography>
            {/* DOT INDICATOR HIJAU (Menandakan Sistem Online/Live) */}
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: colors.indigo[500],
                boxShadow: `0 0 8px ${colors.indigo[500]}`,
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* 2. PROFIL SECTION */}
      <ProfileSection />

      <Divider sx={{ mx: 3, mb: 1, opacity: isDarkMode ? 0.1 : 0.5 }} />

      {/* 3. MENU (SCROLLABLE DENGAN CUSTOM SCROLLBAR) */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2, // Beri sedikit nafas di sisi menu
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: alpha(colors.grey[400], 0.2),
            borderRadius: "10px",
          },
        }}>
        <SidebarMenu key={token} />
      </Box>

      {/* 4. FOOTER / LOGOUT SECTION */}
      <Box sx={{ p: 2, mt: "auto" }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<LogoutRounded />}
          onClick={() => setOpenLogout(true)}
          sx={{
            borderRadius: "14px",
            textTransform: "none",
            fontWeight: 800,
            py: 1.2,
            bgcolor: alpha(theme.palette.error.main, 0.1), // Background transparan merah
            color: theme.palette.error.main,
            boxShadow: "none",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: theme.palette.error.main,
              color: "#fff",
              boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.3)}`,
              transform: "translateY(-2px)",
            },
          }}>
          Logout
        </Button>
      </Box>

      <CustomDialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onConfirm={handleLogout}
        type="warning"
        title="Konfirmasi Logout"
        subtitle="Sesi Anda akan berakhir. Pastikan semua pekerjaan telah disimpan."
        confirmText="Keluar Sekarang"
        showCancel={true}
      />
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            border: "none",
            boxShadow: "10px 0 30px rgba(0,0,0,0.1)",
          },
        }}>
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: `1px solid ${isDarkMode ? alpha("#fff", 0.05) : colors.grey[100]}`,
            boxShadow: isDarkMode ? "none" : "5px 0 20px rgba(0,0,0,0.02)",
          },
        }}
        open>
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
