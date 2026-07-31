import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  Stack,
  Card,
  TextField,
  Collapse,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  useTheme,
  alpha,
  colors,
  TablePagination, // Tambahan
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  KeyboardArrowDown,
  Folder,
  SubdirectoryArrowRight,
  PersonAdd,
  People,
  Search, // Tambahan
} from "@mui/icons-material";
import InputDrawer from "@/components/ui/InputDrawer";
import services from "@/services";
import PageWrapper from "@/components/ui/PageWrapper";

// --- 1. KOMPONEN BARIS REKURSIF (Tetap Sama) ---
const RowItem = ({ item, level = 0, onShare, onEdit, onDelete }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isShared = item.shared_to && item.shared_to.length > 0;

  return (
    <React.Fragment>
      <TableRow
        sx={{
          bgcolor: open ? alpha(theme.palette.primary.main, 0.05) : "inherit",
          "&:hover": {
            bgcolor: alpha(theme.palette.action.hover, 0.04),
          },
        }}>
        <TableCell width="60" align="center">
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{
                transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "0.2s",
              }}>
              <KeyboardArrowDown fontSize="small" />
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ fontWeight: 700, color: "primary.main", width: 120 }}>
          {item.kode}
        </TableCell>
        <TableCell>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ ml: level * 4 }}>
            {level > 0 && (
              <SubdirectoryArrowRight
                fontSize="small"
                sx={{ color: "text.disabled", opacity: 0.5 }}
              />
            )}
            <Folder
              sx={{
                color: level === 0 ? "#FFCA28" : theme.palette.text.disabled,
                fontSize: level === 0 ? 24 : 20,
              }}
            />
            <Typography
              variant={level === 0 ? "body1" : "body2"}
              fontWeight={level === 0 ? 700 : 500}
              color="text.primary">
              {item.nama}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={item.tindakan || "Musnah"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.7rem", borderRadius: "6px" }}
            />
            {isShared && (
              <Tooltip title={`Dibagikan ke ${item.shared_to.length} target`}>
                <People sx={{ fontSize: 18, color: "primary.main" }} />
              </Tooltip>
            )}
          </Stack>
        </TableCell>
        <TableCell align="right" sx={{ pr: 3 }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Bagikan Akses">
              <IconButton
                size="small"
                onClick={() => onShare(item)}
                sx={{
                  color: colors.indigo[isDarkMode ? 300 : 600],
                  bgcolor: alpha(colors.indigo[isDarkMode ? 300 : 600], 0.1),
                  "&:hover": {
                    bgcolor: alpha(colors.indigo[isDarkMode ? 300 : 600], 0.2),
                  },
                }}>
                <PersonAdd fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Data">
              <IconButton
                size="small"
                onClick={() => onEdit(item)}
                sx={{
                  color: colors.indigo[isDarkMode ? 300 : 600],
                  bgcolor: alpha(colors.indigo[isDarkMode ? 300 : 600], 0.1),
                  "&:hover": {
                    bgcolor: alpha(colors.indigo[isDarkMode ? 300 : 600], 0.2),
                  },
                }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title="Hapus">
              <IconButton
                size="small"
                onClick={() => onDelete(item)}
                sx={{
                  color: colors.red[isDarkMode ? 300 : 600],
                  bgcolor: alpha(colors.red[isDarkMode ? 300 : 600], 0.1),
                  "&:hover": {
                    bgcolor: alpha(colors.red[isDarkMode ? 300 : 600], 0.2),
                  },
                }}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip> */}
          </Stack>
        </TableCell>
      </TableRow>
      {hasChildren && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  ml: 4,
                  borderLeft: `1px dashed ${theme.palette.divider}`,
                }}>
                <Table size="small">
                  <TableBody>
                    {item.children.map((child) => (
                      <RowItem
                        key={child.internal_id || child.ID}
                        item={child}
                        level={level + 1}
                        onShare={onShare}
                        onEdit={onEdit}
                        onDelete={onDelete} // Pastikan ini dioper ke anak (rekursif)
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

// --- 2. KOMPONEN UTAMA ---
const Klasifikasi = () => {
  const [tableVersion, setTableVersion] = useState(0);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // States
  const [openDrawer, setOpenDrawer] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // State Search
  const [page, setPage] = useState(0); // State Page
  const [rowsPerPage, setRowsPerPage] = useState(10); // State Limit

  const [editData, setEditData] = useState(null); // Data yang akan diedit
  const [isEditMode, setIsEditMode] = useState(false);

  const [shareDialog, setShareDialog] = useState({ open: false, folder: null });
  const [accessOptions, setAccessOptions] = useState([]);
  const [selectedAccess, setSelectedAccess] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fungsi untuk menangani klik tombol Edit
  const handleEdit = (item) => {
    setEditData(item);
    setIsEditMode(true);
    setOpenDrawer(true);
  };

  // Fungsi untuk menutup Drawer dan reset state
  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditData(null);
    setIsEditMode(false);
    fetchTree();
  };

  const handleDelete = async (item) => {
    const id = item.internal_id || item.ID;
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus klasifikasi "${item.nama}"?`,
      )
    ) {
      try {
        await services.klasifikasi.delete(id); // Pastikan service delete sudah ada
        setNotification({
          open: true,
          message: "Data berhasil dihapus",
          severity: "success",
        });
        fetchTree(); // Refresh tabel setelah hapus
      } catch (error) {
        setNotification({
          open: true,
          message: error.response?.data?.error || "Gagal menghapus data",
          severity: "error",
        });
      }
    }
  };

  // Fetch Data
  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await services.klasifikasi.getTree();
      const result = res.data?.data || res.data || [];
      setDataList([...result]); // Gunakan spread operator
      setTableVersion((v) => v + 1); // <--- NAIKKAN VERSI UNTUK MEMAKSA RE-RENDER
    } catch (error) {
      console.error("Gagal fetch tree:", error);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAccessData = async () => {
    try {
      const res = await services.pegawai.allpegawai({ limit: 1000 });
      const pegawais = res.data?.data || [];
      const roles = [...new Set(pegawais.map((p) => p.role))].filter(Boolean);

      const roleOpts = roles.map((role) => ({
        id: `ROLE:${role}`,
        label: role,
        category: "Berdasarkan Role",
      }));

      const pegawaiOpts = pegawais.map((p) => ({
        id: `PEGAWAI:${p.nip}`,
        label: `${p.nama} (${p.nip})`,
        category: "Pegawai Spesifik",
      }));

      setAccessOptions([...roleOpts, ...pegawaiOpts]);
    } catch (err) {
      console.error("Gagal load data akses", err);
    }
  };

  useEffect(() => {
    fetchTree();
    loadAccessData();
  }, []);

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredData = dataList.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenShare = (folder) => {
    setShareDialog({ open: true, folder: folder });
    setSelectedAccess(folder.shared_to || []);
  };

  const handleSaveShare = async () => {
    try {
      const id = shareDialog.folder.internal_id || shareDialog.folder.ID;
      const payload = { shared_to: selectedAccess };
      await services.klasifikasi.update(id, payload);
      setNotification({
        open: true,
        message: "Izin akses berhasil!",
        severity: "success",
      });
      setShareDialog({ open: false, folder: null });
      fetchTree();
    } catch (err) {
      setNotification({
        open: true,
        message: "Gagal menyimpan",
        severity: "error",
      });
    }
  };

  return (
    <PageWrapper>
      <Stack spacing={4} sx={{ p: { xs: 1, md: 2 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          mb={4}>
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
              Master Klasifikasi Arsip
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
              Kelola Kategori dan Izin Akses (Role/User)
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Cari kode atau nama..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <Search
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                ),
                sx: {
                  borderRadius: "12px", // Lebih membulat agar modern
                  height: "48px", // Menyamakan tinggi dengan tombol
                  bgcolor: isDarkMode
                    ? alpha(colors.indigo[900], 0.1)
                    : "#f8fafc",
                },
              }}
              sx={{
                width: 280,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" }, // Menghilangkan border default
                  "&:hover fieldset": { border: "none" },
                  "&.Mui-focused fieldset": {
                    border: `1px solid ${colors.indigo[500]}`,
                  },
                },
              }}
            />

            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: "24px !important" }} />}
              onClick={() => setOpenDrawer(true)}
              sx={{
                height: "48px",
                px: 3,
                borderRadius: "12px",
                fontWeight: 800,
                textTransform: "none",
                fontSize: "0.95rem",
                background: `linear-gradient(135deg, ${colors.indigo[500]} 0%, ${colors.indigo[700]} 100%)`,
                boxShadow: `0 8px 20px -6px ${alpha(colors.indigo[500], 0.5)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 12px 25px -8px ${alpha(colors.indigo[500], 0.6)}`,
                  background: `linear-gradient(135deg, ${colors.indigo[600]} 0%, ${colors.indigo[800]} 100%)`,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}>
              Tambah Klasifikasi
            </Button>
          </Stack>

          {/* <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Cari kode atau nama..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <Search
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                ),
                sx: { borderRadius: "10px", bgcolor: "background.paper" },
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDrawer(true)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}>
              Tambah Klasifikasi
            </Button>
          </Stack> */}
        </Stack>

        <TableContainer
          component={Card}
          sx={{
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)",
            border: isDarkMode ? `1px solid ${theme.palette.divider}` : "none",
          }}>
          <Table>
            <TableHead
              sx={{
                bgcolor: isDarkMode
                  ? alpha(theme.palette.common.white, 0.05)
                  : "#f1f3f4",
              }}>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: "bold" }}>Kode</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Nama Klasifikasi
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Akses</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody key={tableVersion}>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <RowItem
                    key={item.internal_id || item.ID}
                    item={item}
                    onShare={handleOpenShare}
                    onEdit={handleEdit}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" color="text.secondary">
                      Data tidak ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Baris:"
          />
        </TableContainer>

        {/* Dialog Izin Akses */}
        <Dialog
          open={shareDialog.open}
          onClose={() => setShareDialog({ open: false })}
          fullWidth
          maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Atur Izin Akses</DialogTitle>
          <DialogContent dividers>
            <Typography
              variant="caption"
              color="text.secondary"
              mb={2}
              display="block">
              Pilih Role/Pegawai untuk folder{" "}
              <strong>{shareDialog.folder?.kode}</strong>.
            </Typography>
            <Autocomplete
              multiple
              options={accessOptions}
              groupBy={(option) => option.category}
              getOptionLabel={(option) => option.label}
              value={accessOptions.filter((opt) =>
                selectedAccess.includes(opt.id),
              )}
              onChange={(e, val) => setSelectedAccess(val.map((v) => v.id))}
              renderInput={(params) => (
                <TextField {...params} label="Akses" placeholder="Cari..." />
              )}
              renderGroup={(params) => (
                <li key={params.key}>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}>
                    {params.group}
                  </Box>
                  {params.children}
                </li>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setShareDialog({ open: false })}
              color="inherit">
              Batal
            </Button>
            <Button onClick={handleSaveShare} variant="contained">
              Simpan
            </Button>
          </DialogActions>
        </Dialog>

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

        <InputDrawer
          open={openDrawer}
          onClose={handleCloseDrawer}
          fetchKlasifikasiTree={fetchTree}
          editData={editData} // Data yang akan diedit
          isEditMode={isEditMode}
          setNotification={setNotification}
        />
      </Stack>
    </PageWrapper>
  );
};

export default Klasifikasi;
