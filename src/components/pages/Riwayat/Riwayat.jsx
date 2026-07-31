import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Stack, TextField, TablePagination,
  Skeleton, Container, Tabs, Tab, IconButton, Avatar, InputAdornment,
  Drawer, Divider, Grid, useTheme, alpha
} from "@mui/material";
import {
  Search, DateRange, Visibility, Close, InfoOutlined, CheckCircle,
  Pending, Cancel, Description, InboxOutlined, ArrowForwardIos,
  HistoryEdu
} from "@mui/icons-material";
import services from "@/services";
import moment from "moment";
import "moment/locale/id";
import { url } from "@/utils/constants";

moment.locale("id");

const Riwayat = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        tabValue === 0
          ? await services.cuti.getRiwayatSaya()
          : await services.dokumen.getRiwayatDokumen();
      const result = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setData(result);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const target =
        tabValue === 0
          ? `${item.jenis_cuti} ${item.alasan}`.toLowerCase()
          : `${item.judul} ${item.kategori} ${item.pesan}`.toLowerCase();
      return target.includes(searchQuery.toLowerCase());
    });
  }, [data, searchQuery, tabValue]);

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved" || s === "verified")
      return {
        label: "Disetujui",
        color: "#10b981",
        bg: alpha("#10b981", 0.1),
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
      };
    if (s === "rejected" || s === "ditolak")
      return {
        label: "Ditolak",
        color: "#ef4444",
        bg: alpha("#ef4444", 0.1),
        icon: <Cancel sx={{ fontSize: 16 }} />,
      };
    return {
      label: "Menunggu",
      color: "#f59e0b",
      bg: alpha("#f59e0b", 0.1),
      icon: <Pending sx={{ fontSize: 16 }} />,
    };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6, animation: "fadeIn 0.5s ease" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* HEADER SECTION */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56, borderRadius: 3 }}>
          <HistoryEdu fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-0.5px" }}>
            Riwayat Pengajuan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pantau status dan detail permohonan Anda di sini.
          </Typography>
        </Box>
      </Stack>

      <Paper
        sx={{
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.1),
          boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
          bgcolor: "background.paper",
        }}>
        
        {/* TABS STYLING */}
        <Box sx={{ bgcolor: isDark ? alpha("#fff", 0.02) : "#fafafa", borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => { setTabValue(v); setPage(0); }}
            sx={{
              px: 3,
              "& .MuiTab-root": { py: 2.5, fontWeight: 700, textTransform: "none", fontSize: "1rem" },
              "& .Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": { height: 4, borderRadius: "4px 4px 0 0" }
            }}>
            <Tab icon={<DateRange sx={{ mb: -0.5, mr: 1 }} />} iconPosition="start" label="Cuti & Izin" />
            <Tab icon={<Description sx={{ mb: -0.5, mr: 1 }} />} iconPosition="start" label="Dokumen" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Cari kata kunci, alasan, atau judul..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "primary.main", ml: 1 }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 4, 
                bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : "#f1f5f9",
                "& fieldset": { border: "none" },
                transition: "all 0.2s",
                "&:hover": { bgcolor: isDark ? alpha(theme.palette.common.white, 0.08) : "#e2e8f0" }
              },
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary", py: 2, pl: 4 }}>DATA PENGAJUAN</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary" }}>WAKTU PELAKSANAAN</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "text.secondary" }}>STATUS AKHIR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "text.secondary", pr: 4 }}>OPSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} sx={{ px: 4 }}><Skeleton height={80} sx={{ borderRadius: 2 }} /></TableCell></TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    const isCuti = tabValue === 0;
                    const status = getStatusConfig(item.status_approve || item.status_verif);
                    return (
                      <TableRow key={item.id || item.public_id} hover sx={{ transition: "0.2s" }}>
                        <TableCell sx={{ pl: 4, py: 2.5 }}>
                          <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box sx={{ 
                              p: 1.5, borderRadius: 3, 
                              bgcolor: isCuti ? alpha("#3b82f6", 0.1) : alpha("#3b82f6", 0.1) 
                            }}>
                              {isCuti ? <DateRange sx={{ color: "#3b82f6" }} /> : <Description sx={{ color: "#3b82f6" }} />}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                                {isCuti ? item.jenis_cuti : item.judul}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {isCuti ? item.alasan : `${item.kategori} • ${item.klaster || "Umum"}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {moment(isCuti ? item.tgl_mulai : item.created_at).format("DD MMMM YYYY")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isCuti ? `${item.jumlah_hari} Hari Kerja` : "Tgl Pengajuan"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={status.icon}
                            label={status.label}
                            sx={{
                              fontWeight: 800,
                              bgcolor: status.bg,
                              color: status.color,
                              borderRadius: "8px",
                              border: `1px solid ${status.color}30`,
                              "& .MuiChip-icon": { color: "inherit" }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 4 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => { setSelectedItem(item); setDrawerOpen(true); }}
                            endIcon={<ArrowForwardIos sx={{ fontSize: "10px !important" }} />}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", borderColor: "divider" }}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 12 }}>
                    <InboxOutlined sx={{ fontSize: 64, color: alpha(theme.palette.divider, 0.5), mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">Tidak ada riwayat</Typography>
                    <Typography variant="body2" color="text.disabled">Pengajuan Anda akan muncul di sini.</Typography>
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
          labelRowsPerPage="Baris per halaman:"
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
      </Paper>

      {/* DRAWER ENHANCEMENT */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 500 }, border: "none", boxShadow: "-10px 0 40px rgba(0,0,0,0.1)" } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: isDark ? "background.default" : "#fff" }}>
          
          <Box sx={{ p: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight={900}>Informasi Pengajuan</Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main", "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {selectedItem && (
            <Box sx={{ px: 4, pb: 4, flexGrow: 1, overflowY: "auto" }}>
              <Stack spacing={4}>
                {/* Status Tracker Style */}
                <Box sx={{ p: 3, borderRadius: 4, bgcolor: isDark ? alpha("#fff", 0.03) : "#f8fafc", border: "1px dashed", borderColor: "divider" }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 3, display: "block", textTransform: "uppercase" }}>Progress Approval</Typography>
                  
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: selectedItem.status_verif === "verified" ? "#10b981" : "divider", fontSize: 14 }}>1</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>Verifikasi Koordinator</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedItem.status_verif === "verified" ? "Data telah divalidasi" : "Sedang dalam antrean pengecekan"}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: selectedItem.status_approve === "approved" ? "#10b981" : "divider", fontSize: 14 }}>2</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>Persetujuan Pimpinan</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedItem.status_approve === "approved" ? "Persetujuan final selesai" : "Menunggu tanda tangan digital"}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Rincian Data</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: "Jenis / Judul", value: tabValue === 0 ? selectedItem.jenis_cuti : selectedItem.judul },
                      { label: "Kategori", value: tabValue === 0 ? "Personal/Cuti" : selectedItem.kategori },
                      { label: "Durasi / Urgensi", value: tabValue === 0 ? `${selectedItem.jumlah_hari} Hari` : selectedItem.urgensi },
                      { label: "Waktu Input", value: moment(selectedItem.created_at).format("DD MMM YYYY, HH:mm") },
                    ].map((info, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Typography variant="caption" color="text.secondary">{info.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{info.value || "-"}</Typography>
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Alasan / Pesan</Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: isDark ? "transparent" : "#fafafa" }}>
                        <Typography variant="body2">{tabValue === 0 ? selectedItem.alasan : selectedItem.pesan}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Box>
          )}

          <Box sx={{ p: 4, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              disableElevation
              startIcon={tabValue === 0 ? <Description /> : <Visibility />}
              sx={{ py: 2, borderRadius: 4, fontWeight: 800, textTransform: "none" }}
              onClick={() => {
                const url = tabValue === 0 
                  ? `/cetak/${selectedItem?.public_id}` 
                  : `${url}/${selectedItem?.file_url}`;
                window.open(url, "_blank");
              }}>
              {tabValue === 0 ? "Download Dokumen Cuti" : "Lihat Lampiran File"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Riwayat;