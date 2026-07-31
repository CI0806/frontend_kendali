import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Box,
  Typography,
  Alert,
  Grid, // Menggunakan Grid2 terbaru
  Fade,
  GlobalStyles,
  colors,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  LoginRounded,
  AdminPanelSettingsRounded,
  DescriptionRounded,
  EventNoteRounded,
  InventoryRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";

import TextField from "@/components/ui/Forms/TextField";
import session from "@/utils/session";
import services from "@/services";
import logoPuskesmas from "@/assets/img/logo.png";

const loginSchema = Yup.object({
  nip: Yup.string()
    .required("NIP wajib diisi")
    .matches(/^[0-9]+$/, "Hanya boleh berisi angka") // Validasi hanya angka
    .min(16, "Minimal 16 karakter")
    .max(18, "Maksimal 18 karakter"),
  password: Yup.string().required("Password tidak boleh kosong"),
});

const Login = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (values) => {
    setErrorMsg("");
    try {
      const response = await services.auth.login(values);
      const { access_token, refresh_token, user } = response.data.data;
      session.setSession({ access_token, refresh_token, user });
      navigate("/");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "NIP atau Password salah");
    }
  };

  return (
    <>
      <GlobalStyles
        styles={{
          "html, body, #root": {
            margin: 0,
            padding: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#fff",
            overflow: "hidden",
          },
        }}
      />

      <Box sx={{ height: "100vh", width: "100vw" }}>
        <Grid container sx={{ height: "100%" }}>
          {/* SISI KIRI: BRANDING */}
          <Grid
            size={{ xs: 0, sm: 5, md: 7 }}
            sx={{
              position: "relative",
              background: `linear-gradient(135deg, ${colors.indigo[900]} 0%, ${colors.indigo[600]} 100%)`,
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 6,
              overflow: "hidden",
            }}>
            {/* Lingkaran Cahaya Utama */}
            <Box
              sx={{
                position: "absolute",
                width: "600px",
                height: "600px",
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(76, 175, 80, 0.2) 40%, rgba(255,255,255,0) 70%)`,
                top: "-150px",
                left: "-150px",
                zIndex: 1,
                filter: "blur(40px)",
                animation: "floating 6s ease-in-out infinite",
                "@keyframes floating": {
                  "0%, 100%": { transform: "rotate(-15deg) translateY(0)" },
                  "50%": { transform: "rotate(-10deg) translateY(-20px)" },
                },
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: "400px",
                height: "400px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                bottom: "-100px",
                right: "-100px",
                zIndex: 1,
              }}
            />

            {/* Kotak Glassmorphism 1 (Melayang) */}
            <Box
              sx={{
                position: "absolute",
                bottom: "15%",
                right: "5%",
                width: "220px",
                height: "220px",
                bgcolor: "rgba(255, 255, 255, 0.07)",
                borderRadius: "48px",
                transform: "rotate(-15deg)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                animation: "floating 6s ease-in-out infinite",
                "@keyframes floating": {
                  "0%, 100%": { transform: "rotate(-15deg) translateY(0)" },
                  "50%": { transform: "rotate(-10deg) translateY(-20px)" },
                },
              }}>
              <VerifiedUserRounded
                sx={{ fontSize: 80, color: "rgba(255,255,255,0.1)" }}
              />
            </Box>

            {/* Kotak Glassmorphism 2 (Kecil di Belakang) */}
            <Box
              sx={{
                position: "absolute",
                bottom: "25%",
                right: "20%",
                width: "120px",
                height: "120px",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "32px",
                transform: "rotate(20deg)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 1,
                animation: "floating2 8s ease-in-out infinite",
                "@keyframes floating2": {
                  "0%, 100%": { transform: "rotate(20deg) translateX(0)" },
                  "50%": { transform: "rotate(25deg) translateX(15px)" },
                },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: "25%",
                right: "4%",
                width: "120px",
                height: "120px",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "32px",
                transform: "rotate(20deg)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 1,
                animation: "floating2 8s ease-in-out infinite",
                "@keyframes floating2": {
                  "0%, 100%": { transform: "rotate(20deg) translateX(0)" },
                  "50%": { transform: "rotate(25deg) translateX(15px)" },
                },
              }}
            />

            {/* KONTEN UTAMA */}
            <Fade in timeout={1000}>
              <Box
                sx={{
                  position: "relative",
                  zIndex: 3, // Pastikan di atas dekorasi
                  textAlign: "center",
                  color: "white",
                }}>
                <Stack
                  alignItems="center"
                  spacing={1}
                  mb={4}
                  sx={{
                    animation: "fadeInUp 0.8s ease-out forwards",
                    "@keyframes fadeInUp": {
                      "0%": { opacity: 0, transform: "translateY(20px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" },
                    },
                  }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "rgba(255,255,255,0.15)",
                      borderRadius: "24px",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      mb: 2,
                    }}>
                    <AdminPanelSettingsRounded sx={{ fontSize: 50 }} />
                  </Box>
                  <Typography
                    variant="h2"
                    fontWeight="900"
                    letterSpacing={-2}
                    sx={{
                      lineHeight: 1,
                      textShadow: "0 10px 20px rgba(0,0,0,0.2)",
                    }}>
                    KENDALI
                  </Typography>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: "1.1rem",
                      opacity: 0.8,
                      letterSpacing: 4,
                      fontWeight: 600,
                    }}>
                    Puskesmas Digital System
                  </Typography>
                </Stack>

                {/* Animasi Slogan (Delay sedikit) */}
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 0.9,
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.6,
                    maxWidth: "480px",
                    margin: "0 auto",
                    animation: "fadeInUp 0.8s ease-out 0.3s forwards", // Delay 0.3s
                    opacity: 0, // Mulai dari 0 agar animasi terlihat
                    "@keyframes fadeInUp": {
                      "0%": { opacity: 0, transform: "translateY(20px)" },
                      "100%": { opacity: 0.9, transform: "translateY(0)" },
                    },
                  }}>
                  "<b>K</b>ontrol <b>E</b>lektronik <b>N</b>askah <b>D</b>an{" "}
                  <b>A</b>rsip <b>L</b>ayanan <b>I</b>ntegritas"
                </Typography>

                {/* FEATURE LIST */}
                <Stack
                  spacing={2}
                  sx={{
                    mt: 5,
                    alignItems: "flex-start",
                    width: "fit-content",
                    mx: "auto",
                    animation: "fadeInUp 0.8s ease-out 0.6s forwards", // Delay 0.6s
                    opacity: 0,
                    "@keyframes fadeInUp": {
                      "0%": { opacity: 0, transform: "translateY(20px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" },
                    },
                  }}>
                  {[
                    {
                      icon: <DescriptionRounded />,
                      text: "Manajemen Naskah Digital",
                    },
                    {
                      icon: <EventNoteRounded />,
                      text: "Pengajuan Cuti Online",
                    },
                    {
                      icon: <InventoryRounded />,
                      text: "Pengarsipan Terintegrated",
                    },
                  ].map((item, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateX(10px)",
                          opacity: 1,
                        }, // Efek hover interaktif
                      }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          p: 1,
                          borderRadius: "50%",
                          display: "flex",
                        }}>
                        {React.cloneElement(item.icon, {
                          sx: { fontSize: 18, color: "white" },
                        })}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "white",
                          fontWeight: 500,
                          letterSpacing: 0.5,
                        }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box sx={{ mt: 8 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.5,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}>
                    Reliable &bull; Secure &bull; Integrated
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* SISI KANAN: FORM LOGIN */}
          <Grid
            size={{ xs: 12, sm: 7, md: 5 }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "white",
              p: { xs: 3, md: 8 },
            }}>
            <Box sx={{ width: "100%", maxWidth: 400 }}>
              <Fade in timeout={1500}>
                <Box>
                  <Stack
                    spacing={1}
                    mb={5}
                    alignItems={{ xs: "center", sm: "flex-start" }}>
                    <img
                      src={logoPuskesmas}
                      alt="Logo"
                      style={{ width: 80, marginBottom: 8 }}
                    />
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="900"
                        sx={{
                          display: "inline-block",
                          background: `linear-gradient(135deg, ${colors.indigo[800]} 0%, ${colors.indigo[500]} 100%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          letterSpacing: -1,
                          mb: 0.5,
                        }}>
                        KENDALI Karjo
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 2,
                            bgcolor: colors.indigo[500],
                            borderRadius: 1,
                            opacity: 0.6,
                          }}
                        />
                        <Typography
                          variant="body1"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 500,
                            fontStyle: "italic",
                            letterSpacing: 0.5,
                          }}>
                          "Satu Sistem, Kendali Penuh"
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  {errorMsg && (
                    <Alert
                      severity="error"
                      variant="filled"
                      sx={{ mb: 3, borderRadius: "12px" }}>
                      {errorMsg}
                    </Alert>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate>
                    <Stack spacing={2.5}>
                      <TextField
                        name="nip"
                        label="NIP / NIK"
                        control={control}
                        fullWidth
                        // Hapus type="number"
                        inputProps={{
                          inputMode: "numeric", // Muncul keyboard angka di HP
                          pattern: "[0-9]*",
                        }}
                        onInput={(e) => {
                          // Ganti semua karakter non-angka dengan string kosong
                          e.target.value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 18);
                        }}
                      />
                      <TextField
                        name="password"
                        label="Password"
                        control={control}
                        secureText={true}
                        fullWidth
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={!isSubmitting && <LoginRounded />}
                        sx={{
                          py: 2,
                          borderRadius: "14px",
                          fontWeight: "900",
                          fontSize: "1rem",
                          textTransform: "none",
                          backgroundColor: colors.indigo[700],
                          boxShadow: `0 8px 20px -6px ${colors.indigo[400]}`,
                          "&:hover": {
                            backgroundColor: colors.indigo[800],
                            boxShadow: `0 12px 25px -6px ${colors.indigo[500]}`,
                          },
                        }}>
                        {isSubmitting ? "Memverifikasi..." : "Masuk ke Sistem"}
                      </Button>
                    </Stack>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 8 }}>
                    &copy; 2026 Kendali Puskesmas. All Rights Reserved.
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Login;
