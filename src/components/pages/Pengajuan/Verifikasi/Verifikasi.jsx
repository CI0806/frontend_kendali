import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stack,
  Avatar,
  TextField,
  MenuItem,
  TablePagination,
  Skeleton,
  useTheme, // Tambahkan ini
  alpha,
  colors, // Tambahkan ini
} from "@mui/material";
import {
  Search,
  DateRange,
  Assignment,
  InboxOutlined,
  FiberManualRecord,
} from "@mui/icons-material";
import DetailDrawer from "@/components/ui/DetailDrawer";
import services from "@/services";
import CustomDialog from "@/components/ui/CustomDialog";
import moment from "moment";

const Verifikasi = () => {
  const theme = useTheme(); // Inisialisasi theme
  const isDarkMode = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openSuccess, setOpenSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response =
        tabValue === 0
          ? await services.cuti.getPendingVerifikasi()
          : await services.dokumen.getPendingApproval();

      const rawData = response.data?.data || response.data || [];
      setData(rawData);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApprove = async (id, catatan) => {
    try {
      setLoading(true);
      const payload = {
        status: "verified",
        catatan_verif: catatan,
      };

      const response =
        tabValue === 0
          ? await services.cuti.verify(id, payload)
          : await services.dokumen.verify(id, payload);

      if (response.status === 200 || response.status === 201) {
        setOpenSuccess(true);
        setSelectedItem(null);
        await fetchData();
      }
    } catch (error) {
      console.error("Gagal verifikasi:", error);
      alert(
        "Terjadi kesalahan: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id, catatan) => {
    try {
      setLoading(true);
      const payload = {
        status: "rejected",
        catatan_verif: catatan,
      };

      const response =
        tabValue === 0
          ? await services.cuti.verify(id, payload)
          : await services.dokumen.verify(id, payload);

      if (response.status === 200 || response.status === 201) {
        setOpenSuccess(true);
        setSelectedItem(null);
        await fetchData();
      }
    } catch (error) {
      console.error("Gagal verifikasi:", error);
      alert(
        "Terjadi kesalahan: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        pb: 5,
        animation: "fadeIn 0.5s ease-in-out",
        "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      }}>
      {/* HEADER - Tetap Hijau tapi adaptif bayangannya */}
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: "24px",
          background: isDarkMode
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`
            : "linear-gradient(135deg, #172554 0%, #3b82f6 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: isDarkMode
            ? `0 20px 40px ${alpha(theme.palette.common.black, 0.4)}`
            : "0 20px 40px rgba(34, 197, 94, 0.25)",
        }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center">
          <Box sx={{ zIndex: 1 }}>
            <Typography
              variant="h4"
              fontWeight="900"
              sx={{ letterSpacing: "-0.02em", mb: 1 }}>
              Pusat Verifikasi
            </Typography>
            <Typography
              variant="body1"
              sx={{ opacity: 0.9, fontWeight: 500, maxWidth: "500px" }}>
              Halo, tinjau kembali permohonan yang masuk. Anda memiliki{" "}
              <Box
                component="span"
                sx={{
                  bgcolor: alpha("#fff", 0.2),
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  fontWeight: 700,
                }}>
                {data.length} antrean
              </Box>{" "}
              {tabValue === 0 ? "Cuti" : "Dokumen"} hari ini.
            </Typography>
          </Box>
          <Assignment
            sx={{
              fontSize: 160,
              opacity: 0.15,
              position: "absolute",
              right: -20,
              bottom: -30,
              transform: "rotate(-15deg)",
            }}
          />
        </Stack>
      </Box>

      {/* TOOLBAR */}
      {/* <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Cari berdasarkan Nama, NIP, atau Keperluan..."
          InputProps={{
            startAdornment: (
              <Search sx={{ mr: 1.5, color: colors.indigo[500] }} />
            ),
            sx: {
              borderRadius: "16px",
              bgcolor: theme.palette.background.paper,
              boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
        />
        <Stack direction="row" spacing={2} sx={{ minWidth: { md: 420 } }}>
          <TextField
            select
            fullWidth
            defaultValue="all"
            InputProps={{
              sx: {
                borderRadius: "16px",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
            }}>
            <MenuItem value="all">Semua Kategori</MenuItem>
            <MenuItem value="pending">Prioritas Tinggi</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            sx={{
              borderRadius: "16px",
              px: 4,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: isDarkMode ? theme.palette.grey[800] : "#1e293b",
              "&:hover": {
                bgcolor: isDarkMode ? theme.palette.grey[700] : "#0f172a",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}>
            Ekspor
          </Button>
        </Stack>
      </Stack> */}

      {/* TABLE AREA */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "24px",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
          bgcolor: theme.palette.background.paper,
          boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(0,0,0,0.02)",
        }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => {
            setData([]);
            setPage(0);
            setTabValue(v);
          }}
          sx={{
            px: 3,
            pt: 1,
            bgcolor: isDarkMode
              ? alpha(theme.palette.common.white, 0.02)
              : "#fcfdfc",
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            "& .MuiTab-root": {
              minHeight: 64,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
            },
            "& .Mui-selected": {
              color: isDarkMode
                ? `${theme.palette.primary.light} !important`
                : "#193b68 !important",
            },
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: "4px 4px 0 0",
              bgcolor: isDarkMode ? theme.palette.primary.light : "#193b68",
            },
          }}>
          <Tab
            icon={<DateRange fontSize="small" />}
            iconPosition="start"
            label={`Antrean Cuti`}
          />
          <Tab
            icon={<Assignment fontSize="small" />}
            iconPosition="start"
            label={`Antrean Dokumen`}
          />
        </Tabs>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.common.white, 0.02)
                    : "#f8fafc",
                }}>
                <TableCell
                  sx={{ fontWeight: 800, color: "text.secondary", py: 2.5 }}>
                  PEGAWAI
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary" }}>
                  DETAIL PENGAJUAN
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary" }}>
                  STATUS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "text.secondary", pr: 4 }}>
                  AKSI
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Skeleton variant="circular" width={45} height={45} />
                        <Box sx={{ width: "100%" }}>
                          <Skeleton width="120px" height={20} />
                          <Skeleton width="80px" height={15} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Skeleton width="80%" />
                      <Skeleton width="40%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton
                        variant="rounded"
                        width={90}
                        height={28}
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Skeleton
                        variant="rounded"
                        width={100}
                        height={36}
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow
                      hover
                      key={item.internal_id}
                      sx={{
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                        transition: "background-color 0.2s ease",
                      }}>
                      <TableCell sx={{ py: 2.5 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 45,
                              height: 45,
                              fontSize: "1rem",
                              bgcolor: isDarkMode
                                ? alpha(theme.palette.primary.main, 0.2)
                                : alpha(colors.indigo[500], 0.1),
                              color: isDarkMode
                                ? theme.palette.primary.light
                                : colors.indigo[700],
                              fontWeight: 800,
                              border: `1px solid ${alpha(colors.indigo[500], 0.2)}`,
                            }}>
                            {item.pegawai?.nama?.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="800"
                              sx={{ lineHeight: 1.2 }}>
                              {item.pegawai?.nama}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 600 }}>
                              NIP. {item.pegawai?.nip}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="700"
                          color="text.primary">
                          {tabValue === 0
                            ? item.alasan_cuti || "Pengajuan Cuti"
                            : item.judul || "Dokumen Tanpa Judul"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "text.secondary",
                            mt: 0.5,
                          }}>
                          <FiberManualRecord
                            sx={{ fontSize: 8, color: colors.indigo[500] }}
                          />
                          {tabValue === 0
                            ? item.jenis_cuti
                            : `${item.kategori} • Urgensi: ${item.urgensi}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            tabValue === 0
                              ? "Menunggu"
                              : item.status_verif || "pending"
                          }
                          size="small"
                          sx={{
                            bgcolor: isDarkMode
                              ? alpha("#fbbf24", 0.1)
                              : "#fffbeb",
                            color: isDarkMode ? "#fbbf24" : "#b45309",
                            fontWeight: 800,
                            fontSize: "0.65rem",
                            borderRadius: "8px",
                            border: `1px solid ${alpha("#fbbf24", 0.3)}`,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        <Button
                          size="small"
                          variant="contained"
                          disableElevation
                          onClick={() => setSelectedItem(item)}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 700,
                            textTransform: "none",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            "&:hover": {
                              bgcolor: theme.palette.primary.main,
                              color: "#fff",
                            },
                          }}>
                          Detail Periksa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 12 }}>
                    <Box sx={{ opacity: 0.5 }}>
                      <InboxOutlined
                        sx={{
                          fontSize: 80,
                          color: theme.palette.divider,
                          mb: 2,
                        }}
                      />
                      <Typography
                        fontWeight="700"
                        variant="h6"
                        color="text.secondary">
                        Semua Beres!
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Tidak ada pengajuan yang perlu diverifikasi saat ini.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: isDarkMode
              ? alpha(theme.palette.common.white, 0.01)
              : "#fcfdfc",
          }}
        />
      </Paper>

      <DetailDrawer
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        data={selectedItem}
        onApprove={handleApprove}
        onReject={handleReject}
        type={tabValue === 0 ? "cuti" : "dokumen"}
        isPimpinan={false}
      />

      <CustomDialog
        open={openSuccess}
        onClose={() => setOpenSuccess(false)}
        type="success"
        title="Berhasil"
        subtitle="Verifikasi telah berhasil disimpan."
        confirmText="Ok"
        onConfirm={() => setOpenSuccess(false)}
      />
    </Box>
  );
};

export default Verifikasi;
