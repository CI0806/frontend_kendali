import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  useTheme,
  TablePagination,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  Search,
  TabletMac,
  MenuBook,
  NotificationsActive,
  ListAlt,
  HistoryEdu,
  OpenInNew,
  InfoOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import services from "@/services";
import session from "@/utils/session";
import { url } from "@/utils/constants";

const Peminjaman = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // --- STATE UTAMA ---
  const [katalog, setKatalog] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // --- STATE PAGINATION ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- STATE DIALOG & UI ---
  const [openForm, setOpenForm] = useState(false);
  const [openActionDialog, setOpenActionDialog] = useState(false); // Untuk Approve
  const [openReturnDialog, setOpenReturnDialog] = useState(false); // Untuk Kembali

  const [selectedArsip, setSelectedArsip] = useState(null);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUser = session.getUser() || {};
  const isAdmin = currentUser.role === "admin";
  const [form, setForm] = useState({ keperluan: "", tipe_peminjaman: "" });

  // --- LOGIC DATA ---
  useEffect(() => {
    refreshAllData();
  }, [isAdmin]);

  const refreshAllData = async () => {
    setLoading(true);
    await fetchData();
    if (isAdmin) await fetchHistory();
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      const res = await services.peminjaman.getall();
      setKatalog(res.data?.data || []);
    } catch (err) {
      showSnackbar("Gagal memuat data katalog", "error");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await services.peminjaman.history();
      setHistoryData(res.data?.data || []);
    } catch (err) {
      console.error("History fail:", err);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // --- LOGIC HELPER ---
  const pendingRequests = useMemo(() => {
    const list = [];
    katalog.forEach((arsip) => {
      const items = arsip.peminjamans || arsip.Peminjamans || [];
      items.forEach((p) => {
        if (p.status === "pending") list.push({ ...p, parent_arsip: arsip });
      });
    });
    return list;
  }, [katalog]);

  const isExpired = (tglPinjam) => {
    if (!tglPinjam) return false;
    const now = new Date();
    const pinjamDate = new Date(tglPinjam);
    const diffInHours = (now - pinjamDate) / (1000 * 60 * 60);
    return diffInHours > 48; // Batas akses 24 jam
  };

  // --- HANDLERS ---
  const handleOpenPinjam = (arsip) => {
    setSelectedArsip(arsip);
    setForm({
      keperluan: "",
      tipe_peminjaman: arsip.file_path || arsip.file_url ? "digital" : "fisik",
    });
    setOpenForm(true);
  };

  const handleOpenReturn = (peminjaman, arsip) => {
    setSelectedPeminjaman({ ...peminjaman, parent_arsip: arsip });
    setOpenReturnDialog(true);
  };

  const handleReturnAction = async () => {
    setProcessLoading(true);
    try {
      const id = selectedPeminjaman.ID || selectedPeminjaman.id;
      await services.peminjaman.returnDocument(id);
      showSnackbar("Dokumen berhasil dikembalikan");
      setOpenReturnDialog(false);
      await refreshAllData();
    } catch (err) {
      showSnackbar("Gagal memproses pengembalian", "error");
    } finally {
      setProcessLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessLoading(true);
    try {
      const id = selectedPeminjaman.ID || selectedPeminjaman.id;
      await services.peminjaman.approve(id);
      showSnackbar("Persetujuan berhasil");
      setOpenActionDialog(false);
      await refreshAllData();
    } catch (err) {
      showSnackbar("Gagal menyetujui permintaan", "error");
    } finally {
      setProcessLoading(false);
    }
  };

  const filteredKatalog = useMemo(() => {
    return katalog.filter((item) => {
      // SYARAT 1: Harus ada lokasi fisik (lokasi_id tidak null/0)
      const isPhysical = !!item.lokasi_id;

      // SYARAT 2: Pencarian keyword
      const matchesSearch =
        item.perihal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor_arsip?.toLowerCase().includes(searchTerm.toLowerCase());

      return isPhysical && matchesSearch;
    });
  }, [katalog, searchTerm]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Peminjaman Arsip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User: <strong>{currentUser.nama}</strong> (
            {isAdmin ? "Administrator" : "Pegawai"})
          </Typography>
        </Box>
        {loading && <CircularProgress size={24} />}
      </Stack>

      <Tabs
        value={tabValue}
        onChange={(e, v) => {
          setTabValue(v);
          setPage(0);
        }}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab icon={<ListAlt />} label="Katalog" iconPosition="start" />
        {isAdmin && (
          <Tab
            icon={<NotificationsActive />}
            label={`Antrean (${pendingRequests.length})`}
            iconPosition="start"
          />
        )}
        {isAdmin && (
          <Tab icon={<HistoryEdu />} label="Riwayat Log" iconPosition="start" />
        )}
      </Tabs>

      {/* --- TAB 0: KATALOG --- */}
      {tabValue === 0 && (
        <>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cari perihal atau nomor arsip..."
            sx={{ mb: 2, bgcolor: "background.paper" }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "text.disabled" }} />,
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Informasi Dokumen</TableCell>
                  <TableCell>Media</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredKatalog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      Data tidak ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKatalog
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((arsip) => {
                      const loans =
                        arsip.peminjamans || arsip.Peminjamans || [];
                      const lastLoan = loans[0];
                      const myActive = loans.find(
                        (p) =>
                          p.nama_peminjam === currentUser.nama &&
                          p.status !== "kembali",
                      );
                      const hasFile = arsip.file_path || arsip.file_url;
                      const expired =
                        !isAdmin &&
                        myActive?.status === "dipinjam" &&
                        isExpired(myActive.updated_at || myActive.tgl_pinjam);

                      return (
                        <TableRow key={arsip.internal_id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {arsip.perihal}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              {arsip.nomor_arsip}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {arsip.lokasi_id && (
                                <Tooltip title="Tersedia Fisik">
                                  <MenuBook fontSize="small" color="action" />
                                </Tooltip>
                              )}
                              {hasFile && (
                                <Tooltip title="Tersedia Digital">
                                  <TabletMac fontSize="small" color="primary" />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {lastLoan && lastLoan.status !== "kembali" ? (
                              <Chip
                                label={lastLoan.status.toUpperCase()}
                                color={
                                  lastLoan.status === "pending"
                                    ? "error"
                                    : "warning"
                                }
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="TERSEDIA"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center">
                              {/* Tombol Lihat Dokumen */}
                              {(lastLoan?.status === "dipinjam" ||
                                myActive?.status === "dipinjam") &&
                                hasFile && (
                                  <Tooltip
                                    title={
                                      expired
                                        ? "Batas waktu akses habis"
                                        : "Buka Dokumen"
                                    }>
                                    <span>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="info"
                                        disabled={expired}
                                        startIcon={<OpenInNew />}
                                        onClick={() =>
                                          window.open(
                                            `${url}/${arsip.file_path || arsip.file_url}`,
                                            "_blank",
                                          )
                                        }>
                                        Lihat
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}

                              {/* Tombol Pinjam / Selesai */}
                              {isAdmin ? (
                                lastLoan?.status === "dipinjam" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() =>
                                      handleOpenReturn(lastLoan, arsip)
                                    }>
                                    Selesaikan
                                  </Button>
                                )
                              ) : myActive ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  onClick={() =>
                                    handleOpenReturn(myActive, arsip)
                                  }>
                                  Selesai
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={
                                    lastLoan?.status === "dipinjam" ||
                                    lastLoan?.status === "pending"
                                  }
                                  onClick={() => handleOpenPinjam(arsip)}>
                                  Pinjam
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredKatalog.length}
              page={page}
              onPageChange={(e, n) => setPage(n)}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {/* --- TAB 1: ANTREAN (ADMIN) --- */}
      {tabValue === 1 && isAdmin && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "error.light" }}>
              <TableRow>
                <TableCell>Peminjam</TableCell>
                <TableCell>Dokumen</TableCell>
                <TableCell>Keperluan</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    Tidak ada antrean persetujuan
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((req, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <strong>{req.nama_peminjam}</strong>
                      <br />
                      <Chip
                        label={req.tipe_peminjaman}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>{req.parent_arsip?.perihal}</TableCell>
                    <TableCell sx={{ fontStyle: "italic" }}>
                      "{req.keperluan || "-"}"
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => {
                          setSelectedPeminjaman(req);
                          setOpenActionDialog(true);
                        }}>
                        Setujui
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- TAB 2: RIWAYAT (ADMIN) --- */}
      {tabValue === 2 && isAdmin && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "primary.light" }}>
              <TableRow>
                <TableCell>Waktu Transaksi</TableCell>
                <TableCell>Nama Peminjam</TableCell>
                <TableCell>Dokumen</TableCell>
                <TableCell>Status Akhir</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      Pinjam:{" "}
                      {h.tgl_pinjam
                        ? new Date(h.tgl_pinjam).toLocaleDateString("id-ID")
                        : "-"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={h.tgl_kembali ? "success.main" : "error.main"}>
                      Kembali:{" "}
                      {h.tgl_kembali
                        ? new Date(h.tgl_kembali).toLocaleDateString("id-ID")
                        : "Belum Kembali"}
                    </Typography>
                  </TableCell>
                  <TableCell>{h.nama_peminjam}</TableCell>
                  <TableCell>
                    {h.Arsip?.perihal || h.arsip?.perihal || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip label={h.status} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- DIALOG FORM PINJAM --- */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Formulir Peminjaman</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} mt={1}>
            <Box
              p={2}
              bgcolor={isDarkMode ? "grey.900" : "grey.50"}
              borderRadius={2}
              border="1px solid"
              borderColor="divider">
              <Typography variant="caption" color="primary" fontWeight={700}>
                DOKUMEN
              </Typography>
              <Typography variant="body1" fontWeight={700} mb={1}>
                {selectedArsip?.perihal}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="primary" fontWeight={700}>
                PEMOHON
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {currentUser.nama}
              </Typography>
            </Box>
            <TextField
              select
              fullWidth
              label="Tipe Layanan"
              value={form.tipe_peminjaman}
              onChange={(e) =>
                setForm({ ...form, tipe_peminjaman: e.target.value })
              }>
              <MenuItem value="digital">Akses Digital (Baca Online)</MenuItem>
              {selectedArsip?.lokasi_id && (
                <MenuItem value="fisik">Peminjaman Fisik (Hardcopy)</MenuItem>
              )}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Alasan / Keperluan"
              placeholder="Contoh: Untuk keperluan audit internal"
              value={form.keperluan}
              onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenForm(false)} color="inherit">
            Batal
          </Button>
          <Button
            variant="contained"
            disabled={
              processLoading || !form.keperluan || !form.tipe_peminjaman
            }
            onClick={async () => {
              setProcessLoading(true);
              try {
                await services.peminjaman.create({
                  arsip_id: selectedArsip.internal_id,
                  nama_peminjam: currentUser.nama,
                  ...form,
                });
                setOpenForm(false);
                await refreshAllData();
                showSnackbar("Permintaan pinjam berhasil dikirim");
              } catch (e) {
                showSnackbar("Gagal mengirim permintaan", "error");
              } finally {
                setProcessLoading(false);
              }
            }}>
            {processLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Kirim Pengajuan"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG KONFIRMASI APPROVE --- */}
      <Dialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleOutline color="success" /> Setujui Peminjaman?
        </DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin memberikan izin akses kepada{" "}
          <strong>{selectedPeminjaman?.nama_peminjam}</strong> untuk dokumen
          ini?
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenActionDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processLoading}>
            Ya, Setujui Sekarang
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG KONFIRMASI PENGEMBALIAN --- */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InfoOutlined color="warning" /> Konfirmasi Pengembalian
        </DialogTitle>
        <DialogContent>
          <Typography>
            Anda akan menandai pengembalian untuk dokumen:
            <br />
            <strong>{selectedPeminjaman?.parent_arsip?.perihal}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Aksi ini akan mencabut hak akses digital dan mencatat waktu
            pengembalian secara permanen.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenReturnDialog(false)}
            disabled={processLoading}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleReturnAction}
            disabled={processLoading}>
            {processLoading ? (
              <CircularProgress size={20} />
            ) : (
              "Ya, Kembalikan Dokumen"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Peminjaman;
