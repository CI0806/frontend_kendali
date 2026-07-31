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
  Skeleton,
  TextField,
  MenuItem,
  TablePagination,
  InputAdornment,
  useTheme,
  alpha,
  colors, // Tambahkan alpha & colors
} from "@mui/material";
import {
  Assignment,
  DateRange,
  InboxOutlined,
  Search,
  FiberManualRecord,
} from "@mui/icons-material";
import DetailDrawer from "@/components/ui/DetailDrawer";
import services from "@/services";
import CustomDialog from "@/components/ui/CustomDialog";

const Persetujuan = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openSuccess, setOpenSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response =
        tabValue === 0
          ? await services.cuti.getPendingApproval()
          : await services.dokumen.getPendingApproval();

      const rawData = response.data?.data || response.data || [];
      setData(rawData);
    } catch (error) {
      console.error("Gagal memuat data persetujuan:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPage(0);
  }, [tabValue]);

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const nama = item.pegawai?.nama?.toLowerCase() || "";
    const nip = item.pegawai?.nip?.toLowerCase() || "";
    const info =
      tabValue === 0
        ? item.jenis_cuti?.toLowerCase() || ""
        : item.judul?.toLowerCase() || "";

    return (
      nama.includes(searchLower) ||
      nip.includes(searchLower) ||
      info.includes(searchLower)
    );
  });

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
        status_approve: "approved",
        catatan_pimpinan: catatan,
      };

      const response =
        tabValue === 0
          ? await services.cuti.approve(id, payload)
          : await services.dokumen.approve(id, payload);

      if (response.status === 200 || response.status === 201) {
        setOpenSuccess(true);
        setSelectedItem(null);
        await fetchData();
        window.dispatchEvent(new Event("refresh-notifications"));
      }
    } catch (error) {
      console.error("Gagal persetujuan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id, catatan) => {
    try {
      setLoading(true);
      const payload = {
        status_approve: "rejected", // Status ditolak
        catatan_pimpinan: catatan,
      };

      const response =
        tabValue === 0
          ? await services.cuti.approve(id, payload) // Biasanya endpointnya sama, hanya beda payload status
          : await services.dokumen.approve(id, payload);

      if (response.status === 200 || response.status === 201) {
        // Anda bisa menggunakan dialog sukses yang sama atau buat baru khusus reject
        setOpenSuccess(true);
        setSelectedItem(null);
        await fetchData();
        window.dispatchEvent(new Event("refresh-notifications"));
      }
    } catch (error) {
      console.error("Gagal menolak pengajuan:", error);
      // Tambahkan notifikasi error jika perlu
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        pb: 5,
        animation: "fadeIn 0.5s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}>
      {/* HEADER - Hijau Gradient selaras dengan Verifikasi */}
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
            : "0 20px 40px rgba(22, 101, 52, 0.25)",
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
              Panel Pimpinan
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
              Terdapat{" "}
              <Box
                component="span"
                sx={{
                  bgcolor: alpha("#fff", 0.2),
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  fontWeight: 700,
                }}>
                {filteredData.length} pengajuan
              </Box>{" "}
              menunggu persetujuan Anda.
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
          placeholder="Cari nama pegawai, NIP, atau perihal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: colors.indigo[500], ml: 1 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "16px",
              bgcolor: "background.paper",
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
                bgcolor: "background.paper",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
            }}>
            <MenuItem value="all">Semua Urgensi</MenuItem>
            <MenuItem value="tinggi">Prioritas Tinggi</MenuItem>
          </TextField>
          <Button
            variant="contained"
            disableElevation
            sx={{
              borderRadius: "16px",
              px: 4,
              fontWeight: 700,
              textTransform: "none",
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
        sx={{
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: "background.paper",
          boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(0,0,0,0.02)",
        }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
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
            },
            "& .Mui-selected": {
              color: isDarkMode ? "primary.light" : "#193b68 !important",
            },
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: "4px 4px 0 0",
              bgcolor: isDarkMode ? "primary.light" : "#193b68",
            },
          }}>
          <Tab
            icon={<DateRange fontSize="small" />}
            iconPosition="start"
            label={`Antrean Cuti (${tabValue === 0 ? filteredData.length : "..."})`}
          />
          <Tab
            icon={<Assignment fontSize="small" />}
            iconPosition="start"
            label={`Antrean Dokumen (${tabValue === 1 ? filteredData.length : "..."})`}
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
                  STATUS VERIF
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
                          <Skeleton width="120px" />
                          <Skeleton width="80px" />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Skeleton width="80%" />
                      <Skeleton width="40%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={90} height={28} />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 4 }}>
                      <Skeleton variant="rounded" width={100} height={36} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow
                      key={item.internal_id}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                        transition: "all 0.2s",
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
                        <Typography variant="body2" fontWeight="700">
                          {tabValue === 0 ? item.jenis_cuti : item.judul}
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
                            ? `${item.jumlah_hari} Hari`
                            : `No: ${item.nomor_dokumen || "-"}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Terverifikasi"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.65rem",
                            borderRadius: "8px",
                            bgcolor: isDarkMode
                              ? alpha(colors.indigo[500], 0.1)
                              : alpha(colors.indigo[500], 0.1),
                            color: isDarkMode
                              ? colors.indigo[400]
                              : colors.indigo[700],
                            border: `1px solid ${alpha(colors.indigo[500], 0.3)}`,
                            textTransform: "uppercase",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        <Button
                          variant="contained"
                          disableElevation
                          size="small"
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
                          Tinjau & TTD
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 12 }}>
                    <Box sx={{ opacity: 0.5 }}>
                      <InboxOutlined
                        sx={{ fontSize: 80, color: "divider", mb: 2 }}
                      />
                      <Typography
                        fontWeight="700"
                        variant="h6"
                        color="text.secondary">
                        Meja Bersih!
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Semua pengajuan sudah Anda proses.
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
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.1),
            bgcolor: isDarkMode
              ? alpha(theme.palette.common.white, 0.01)
              : "#fcfdfc",
          }}
        />
      </Paper>

      {/* FOOTER COMPONENTS */}
      <DetailDrawer
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        data={selectedItem}
        onApprove={handleApprove}
        onReject={handleReject}
        type={tabValue === 0 ? "cuti" : "dokumen"}
        isPimpinan={true}
      />

      <CustomDialog
        open={openSuccess}
        onClose={() => setOpenSuccess(false)}
        type="success"
        title="Persetujuan Berhasil"
        subtitle="Dokumen telah ditandatangani secara digital dan diarsipkan."
        confirmText="Selesai"
      />
    </Box>
  );
};

export default Persetujuan;
