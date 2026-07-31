import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Divider,
  Alert,
  colors,
  CircularProgress,
  TablePagination,
  useTheme, // Tambahkan ini
  alpha,
  Snackbar, // Tambahkan ini untuk manipulasi warna
} from "@mui/material";
import { GroupAdd, PersonSearch, Save, HistoryEdu } from "@mui/icons-material";
import services from "@/services";
import PageWrapper from "@/components/ui/PageWrapper";

const Kuota = () => {
  const theme = useTheme(); // Inisialisasi theme
  const isDarkMode = theme.palette.mode === "dark";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const currentYear = new Date().getFullYear();

  const [dataPegawai, setDataPegawai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
      });

  const [massal, setMassal] = useState({
    [`th${currentYear - 2}`]: 0,
    [`th${currentYear - 1}`]: 0,
    [`th${currentYear}`]: 12,
  });

  const fetchPegawai = async () => {
    try {
      setLoading(true);
      const response = await services.pegawai.allpegawai({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });

      if (response.data.status === "Success") {
        const sanitized = response.data.data.map((p) => ({
          ...p,
          [`sisa${currentYear - 2}`]: p.sisa_n2 || 0,
          [`sisa${currentYear - 1}`]: p.sisa_n1 || 0,
          [`sisa${currentYear}`]: p.sisa_n || 0,
        }));
        setDataPegawai(sanitized);
        setTotalRows(response.data.pagination.total_rows);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPegawai();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, rowsPerPage, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const applyMassal = () => {
    const updated = dataPegawai.map((p) => {
      const nValue = massal[`th${currentYear}`] || 0;
      return {
        ...p,
        [`sisa${currentYear}`]: nValue,
      };
    });
    setDataPegawai(updated);
  };

  const handleIndividualChange = (internalId, field, value) => {
    const updated = dataPegawai.map((p) => {
      if (p.internal_id === internalId) {
        return { ...p, [field]: parseInt(value) || 0 };
      }
      return p;
    });
    setDataPegawai(updated);
  };

  const handleSave = async () => {
    try {
      const payload = dataPegawai.flatMap((p) => [
        {
          pegawai_internal_id: p.internal_id,
          tahun: currentYear - 2,
          sisa: p[`sisa${currentYear - 2}`] || 0,
        },
        {
          pegawai_internal_id: p.internal_id,
          tahun: currentYear - 1,
          sisa: p[`sisa${currentYear - 1}`] || 0,
        },
        {
          pegawai_internal_id: p.internal_id,
          tahun: currentYear,
          sisa: p[`sisa${currentYear}`] || 0,
        },
      ]);

      const res = await services.pegawai.kuotaUpdate(payload);
      if (res.data.status === "Success") {
        setNotification({
          open: true,
          message: "Data berhasil diupdate",
          severity: "success",
        });
        fetchPegawai();
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data");
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <PageWrapper>
      <Stack spacing={4} sx={{ p: { xs: 1, md: 2 } }}>
        {/* HEADER */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: isDarkMode ? colors.indigo[400] : colors.indigo[800],
                letterSpacing: -0.5,
                position: "relative",
                pl: 2,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "15%",
                  height: "70%",
                  width: "4px",
                  bgcolor: colors.indigo[500],
                  borderRadius: "10px",
                },
              }}>
              Master Kuota Cuti
            </Typography>
            <Typography
              variant="caption"
              sx={{
                pl: 2,
                color: "text.disabled",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: 1.5,
              }}>
              Mengelola saldo tahun <b>{currentYear}</b> dan akumulasi N-2.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* PANEL INPUT MASSAL */}
          <Grid item size={{ xs: 12, lg: 3 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
                boxShadow: isDarkMode
                  ? "none"
                  : "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}>
              <Stack spacing={2.5}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  <GroupAdd color="primary" /> Setup Massal
                </Typography>
                <Divider />

                <TextField
                  fullWidth
                  label={`Jatah Baru ${currentYear}`}
                  type="number"
                  size="small"
                  value={massal[`th${currentYear}`]}
                  onChange={(e) =>
                    setMassal({
                      ...massal,
                      [`th${currentYear}`]: parseInt(e.target.value) || 0,
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">Hari</InputAdornment>
                    ),
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={applyMassal}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2.5,
                  }}>
                  Terapkan ke Semua
                </Button>

                <Alert
                  severity="info"
                  sx={{ fontSize: "0.75rem", borderRadius: 2 }}>
                  Pegawai <b>Honor</b> otomatis 0 pada tahun {currentYear - 2} &{" "}
                  {currentYear - 1}.
                </Alert>
              </Stack>
            </Paper>
          </Grid>

          {/* TABEL PREVIEW */}
          <Grid item size={{ xs: 12, lg: 9 }}>
            <Paper
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDarkMode
                  ? "none"
                  : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                bgcolor: "background.paper",
              }}>
              {/* HEADER TABEL */}
              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "inherit",
                }}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: "text.primary" }}>
                    Preview Data Saldo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Menampilkan {rowsPerPage} Pegawai
                  </Typography>
                </Box>
                <TextField
                  placeholder="Cari nama..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    width: 280,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.common.white, 0.05)
                        : "#f8fafc",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <PersonSearch
                        sx={{ mr: 1, color: "text.disabled", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Box>

              <TableContainer sx={{ maxHeight: "60vh" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          bgcolor: isDarkMode ? "#1e1e1e" : "#f8fafc",
                          color: "text.secondary",
                          py: 2,
                        }}>
                        PEGAWAI
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          bgcolor: isDarkMode ? "#1e1e1e" : "#f8fafc",
                          color: "text.secondary",
                        }}>
                        STATUS
                      </TableCell>
                      {[currentYear - 2, currentYear - 1, currentYear].map(
                        (year, i) => (
                          <TableCell
                            key={year}
                            align="center"
                            sx={{
                              fontWeight: 800,
                              bgcolor:
                                i === 2
                                  ? isDarkMode
                                    ? alpha(colors.indigo[900], 0.4)
                                    : "#eff6ff"
                                  : isDarkMode
                                    ? "#1e1e1e"
                                    : "#f8fafc",
                              color:
                                i === 2
                                  ? theme.palette.primary.main
                                  : "text.secondary",
                              width: 100,
                            }}>
                            SISA {year}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <CircularProgress size={30} thickness={5} />
                          <Typography
                            sx={{
                              mt: 2,
                              color: "text.secondary",
                              fontWeight: 500,
                            }}>
                            Memuat data...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataPegawai.map((row) => (
                        <TableRow key={row.internal_id} hover>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "text.primary" }}>
                              {row.nama}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                display: "block",
                              }}>
                              ID: {row.internal_id}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Box
                              sx={{
                                display: "inline-flex",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                bgcolor:
                                  row.statuspegawai === "Tenaga Kontrak"
                                    ? isDarkMode
                                      ? alpha(colors.orange[900], 0.3)
                                      : "#fff7ed"
                                    : isDarkMode
                                      ? alpha(colors.indigo[900], 0.3)
                                      : "#eff6ff",
                                color:
                                  row.statuspegawai === "Tenaga Kontrak"
                                    ? isDarkMode
                                      ? colors.orange[300]
                                      : "#c2410c"
                                    : isDarkMode
                                      ? colors.indigo[300]
                                      : "#1d4ed8",
                                border: `1px solid ${isDarkMode ? "transparent" : row.statuspegawai === "Tenaga Kontrak" ? "#ffedd5" : "#dbeafe"}`,
                              }}>
                              {row.statuspegawai || "N/A"}
                            </Box>
                          </TableCell>

                          {[currentYear - 2, currentYear - 1, currentYear].map(
                            (year, i) => {
                              const fieldName = `sisa${year}`;
                              const isCurrent = i === 2;
                              const isDisabled =
                                row.statuspegawai === "Tenaga Kontrak" && i < 2;

                              return (
                                <TableCell
                                  key={year}
                                  align="center"
                                  sx={{
                                    bgcolor: isCurrent
                                      ? isDarkMode
                                        ? alpha(
                                            theme.palette.primary.main,
                                            0.05,
                                          )
                                        : "#f0f7ff"
                                      : "inherit",
                                  }}>
                                  <TextField
                                    value={row[fieldName]}
                                    type="number"
                                    disabled={isDisabled}
                                    size="small"
                                    onChange={(e) =>
                                      handleIndividualChange(
                                        row.internal_id,
                                        fieldName,
                                        e.target.value,
                                      )
                                    }
                                    slotProps={{
                                      input: {
                                        style: {
                                          textAlign: "center",
                                          fontWeight: isCurrent ? 800 : 500,
                                          fontSize: "13px",
                                          color: isCurrent
                                            ? theme.palette.primary.main
                                            : theme.palette.text.primary,
                                        },
                                      },
                                    }}
                                    sx={{
                                      width: 70,
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: isDisabled
                                          ? "action.disabledBackground"
                                          : "background.paper",
                                        "& fieldset": {
                                          borderColor: isCurrent
                                            ? theme.palette.primary.light
                                            : "divider",
                                        },
                                      },
                                    }}
                                  />
                                </TableCell>
                              );
                            },
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.common.black, 0.2)
                    : "#f8fafc",
                }}
              />

              <Box
                sx={{
                  p: 3,
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.common.black, 0.3)
                    : "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}>
                <Typography variant="caption" color="text.secondary">
                  * Gunakan <b>Setup Massal</b> untuk mengisi kolom SISA{" "}
                  {currentYear} secara cepat.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Save />}
                  onClick={handleSave}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: isDarkMode
                      ? "none"
                      : "0 4px 14px 0 rgba(34, 197, 94, 0.39)",
                  }}>
                  Simpan Perubahan
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 3, color: "text.disabled" }}>
          <HistoryEdu fontSize="small" />
          <Typography variant="caption">
            Data ini akan menjadi dasar perhitungan jatah cuti otomatis periode
            mendatang.
          </Typography>
        </Stack>
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

export default Kuota;
