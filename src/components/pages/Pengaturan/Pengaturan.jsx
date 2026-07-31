import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid, // Menggunakan Grid2 untuk konsistensi sistem layout terbaru
  Avatar,
  Button,
  Stack,
  colors,
  IconButton,
  useTheme, // Tambahkan ini
  alpha,
  Snackbar,
  Alert, // Tambahkan ini
} from "@mui/material";
import {
  PhotoCameraRounded,
  PersonRounded,
  VpnKeyRounded,
  SaveRounded,
  EditRounded,
  CloseRounded,
  BadgeRounded,
  WorkRounded,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import TextField from "@/components/ui/Forms/TextField";
import PageWrapper from "@/components/ui/PageWrapper";
import services from "@/services";
import { url } from "@/utils/constants";

const Settings = () => {
  const theme = useTheme(); // Akses tema sistem
  const isDarkMode = theme.palette.mode === "dark";

  const [isEditable, setIsEditable] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      jabatan: "",
      pangkat: "",
      email: "",
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await services.pegawai.getMyProfile();
      const data = res.data?.data || res.data;
      setProfile(data);
      reset({
        pangkat: data?.pangkat || "",
        jabatan: data?.jabatan || "",
        email: data?.email || "",
      });
    } catch (err) {
      console.error("Gagal load profil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onUpdateProfile = async (data) => {
    try {
      const formData = new FormData();
      formData.append("pangkat", data.pangkat);
      formData.append("jabatan", data.jabatan);
      formData.append("email", data.email);
      if (selectedFile) formData.append("foto", selectedFile);

      const res = await services.pegawai.updateProfile(formData);
      const updatedData = res.data?.data || res.data;

      try {
        const rawSession = localStorage.getItem("session");
        if (rawSession) {
          const currentSession = JSON.parse(rawSession);
          const updatedSession = {
            ...currentSession,
            user: { ...currentSession.user, ...updatedData },
          };
          localStorage.setItem("session", JSON.stringify(updatedSession));
        }
      } catch (sessionErr) {
        console.error("Gagal update local storage:", sessionErr);
      }
      
      //alert("Profil diperbarui!");
      setIsEditable(false);
      //window.location.reload();
      setNotification({
        open: true,
        message: "Profil diperbarui!",
        severity: "success",
      });
    } catch (err) {
      alert(
        "Gagal update profil: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const onUpdatePassword = async (data) => {
    try {
      // Pastikan nama field: old_password dan new_password
      await services.pegawai.updatePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      setNotification({
        open: true,
        message: "Berhasil! Password Anda telah diperbarui.",
        severity: "success",
      });
      //alert("Berhasil! Password Anda telah diperbarui.");
      setShowPasswordForm(false);
      reset(); // Kosongkan form
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Gagal ganti password",
        severity: "cancel",
      });
      //alert(err.response?.data?.message || "Gagal ganti password");
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsEditable(false);
    reset();
  };

  return (
    <PageWrapper>
      <Stack spacing={4}>
        <Grid container spacing={3}>
          {/* Sisi Kiri: Informasi Statis */}
          <Grid item size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: "24px",
                border: "1px solid",
                borderColor: "divider", // Mengikuti warna garis tema
                bgcolor: "background.paper", // Putih di light, Abu gelap di dark
              }}>
              <Box
                sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                <Avatar
                  src={
                    previewUrl ||
                    (profile?.foto ? `${url}${profile.foto}` : null)
                    // (profile?.foto
                    //   ? `http://localhost:3000${profile.foto}`
                    //   : null)
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: colors.indigo[600],
                    fontSize: "3rem",
                    fontWeight: "bold",
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[2],
                  }}>
                  {profile?.nama ? profile.nama.charAt(0).toUpperCase() : "A"}
                </Avatar>
                {isEditable && (
                  <>
                    <input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <IconButton
                      onClick={() => fileInputRef.current.click()}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: "success.main",
                        color: "white",
                        "&:hover": { bgcolor: "success.dark" },
                      }}>
                      <PhotoCameraRounded fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>
              <Typography variant="h6" fontWeight="800" color="text.primary">
                {profile?.nama || "Memuat..."}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 600,
                }}>
                {profile?.nip || "Memuat..."}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 3,
                borderRadius: "24px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}>
              <Typography
                variant="subtitle2"
                fontWeight="800"
                mb={2}
                color="text.primary">
                Dokumen Digital
              </Typography>
              <Stack spacing={1.5}>
                {[
                  {
                    label: "KTP Pegawai",
                    icon: <BadgeRounded />,
                    color: colors.indigo[500],
                  },
                  {
                    label: "SK Pengangkatan",
                    icon: <WorkRounded />,
                    color: colors.purple[500],
                  },
                ].map((doc, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: "16px",
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.action.hover, 0.05)
                        : colors.grey[50],
                    }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: isDarkMode ? "background.default" : "white",
                          color: doc.color,
                          width: 36,
                          height: 36,
                        }}>
                        {doc.icon}
                      </Avatar>
                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="text.primary">
                        {doc.label}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="primary"
                      fontWeight="800"
                      sx={{ cursor: "pointer" }}>
                      LIHAT
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Sisi Kanan: Form Kelola Profil */}
          <Grid item size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: "24px",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={4}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonRounded sx={{ color: "success.main" }} />
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      color="text.primary">
                      Detail Profil
                    </Typography>
                  </Stack>

                  {!isEditable ? (
                    <Button
                      variant="outlined"
                      startIcon={<EditRounded />}
                      onClick={() => setIsEditable(true)}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}>
                      Edit Profil
                    </Button>
                  ) : (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<CloseRounded />}
                      onClick={handleCancel}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}>
                      Batalkan
                    </Button>
                  )}
                </Stack>

                <Box component="form" onSubmit={handleSubmit(onUpdateProfile)}>
                  <Grid container spacing={3}>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        name="pangkat"
                        label="Pangkat"
                        control={control}
                        fullWidth
                        disabled={!isEditable}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 6 }}>
                      <TextField
                        name="jabatan"
                        label="Jabatan"
                        control={control}
                        fullWidth
                        disabled={!isEditable}
                      />
                    </Grid>
                    <Grid item size={{ xs: 12 }}>
                      <TextField
                        name="email"
                        label="Email Pribadi"
                        control={control}
                        fullWidth
                        helperText="Gunakan email aktif untuk mendapatkan notifikasi"
                        disabled={!isEditable}
                      />
                    </Grid>
                  </Grid>

                  {isEditable && (
                    <Box
                      sx={{
                        mt: 4,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveRounded />}
                        sx={{
                          borderRadius: "12px",
                          px: 4,
                          py: 1.2,
                          bgcolor: "success.dark",
                          fontWeight: 700,
                        }}>
                        Simpan Perubahan
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Form Keamanan / Password */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: showPasswordForm ? "warning.light" : "divider",
                  bgcolor: showPasswordForm
                    ? "background.paper"
                    : isDarkMode
                      ? alpha(theme.palette.action.hover, 0.05)
                      : colors.grey[50],
                }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <VpnKeyRounded sx={{ color: "warning.main" }} />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight="800"
                        color="text.primary">
                        Keamanan Akun
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ganti kata sandi secara berkala
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant={showPasswordForm ? "text" : "contained"}
                    color={showPasswordForm ? "error" : "inherit"}
                    size="small"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    sx={{
                      textTransform: "none",
                      borderRadius: "8px",
                      bgcolor:
                        !showPasswordForm && isDarkMode
                          ? "grey.800"
                          : undefined,
                    }}>
                    {showPasswordForm ? "Batal" : "Ubah Password"}
                  </Button>
                </Stack>

                {showPasswordForm && (
                  <Box
                    component="form"
                    onSubmit={handleSubmit(onUpdatePassword)}
                    sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                      {/* Field Password Lama wajib ada untuk verifikasi */}
                      <Grid item size={{ xs: 12 }}>
                        <TextField
                          name="old_password"
                          label="Password Saat Ini"
                          type="password"
                          control={control}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          name="new_password"
                          label="Password Baru"
                          type="password"
                          control={control}
                          fullWidth
                        />
                      </Grid>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          name="confirm_password"
                          label="Konfirmasi Password Baru"
                          type="password"
                          control={control}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      fullWidth
                      sx={{ mt: 2, borderRadius: "10px", fontWeight: 700 }}>
                      Perbarui Password Aman
                    </Button>
                  </Box>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000} // Sedikit lebih lama agar user sempat membaca
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }} // Posisi pojok biasanya lebih premium
        sx={{
          // Memberikan efek melayang dengan shadow yang dalam
          filter: "drop-shadow(0px 8px 24px rgba(0,0,0,0.15))",
        }}>
        <Alert
          severity={notification.severity}
          variant="filled" // Gunakan filled untuk warna yang lebih solid dan modern
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{
            width: "100%",
            minWidth: "300px",
            borderRadius: "16px", // Melengkung senada dengan desain container Anda sebelumnya
            fontWeight: 600,
            fontSize: "0.95rem",
            alignItems: "center",

            // Glassmorphism effect: sedikit transparan namun tetap terbaca
            backdropFilter: "blur(10px)",
            bgcolor: (theme) =>
              alpha(
                notification.severity === "success"
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                0.9,
              ),

            // Border halus untuk mempertegas bentuk
            border: "1px solid rgba(255, 255, 255, 0.2)",

            // Styling khusus icon
            "& .MuiAlert-icon": {
              fontSize: "24px",
              opacity: 1,
            },

            // Efek animasi masuk (Slide + Fade)
            animation:
              "slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            "@keyframes slideInRight": {
              from: { transform: "translateX(100%)", opacity: 0 },
              to: { transform: "translateX(0)", opacity: 1 },
            },
          }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
};

export default Settings;
