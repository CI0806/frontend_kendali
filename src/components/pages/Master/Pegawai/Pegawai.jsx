import React, { useEffect, useState } from "react";
import {
  colors,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  TablePagination,
  useTheme,
  alpha,
  Snackbar,
  Alert,
  Card,
  TextField as MuiTextField,
  InputAdornment,
} from "@mui/material";
import {
  PersonAddAlt1Rounded,
  BadgeRounded,
  WorkRounded,
  DomainRounded,
  AccountCircleRounded,
  InfoOutlined,
  Edit,
  Delete,
  Save,
  Search,
  Clear,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import TextField from "@/components/ui/Forms/TextField";
import Select from "@/components/ui/Forms/Select";
import services from "@/services";
import Table from "@/components/ui/Table";
import PageWrapper from "@/components/ui/PageWrapper";
import CustomDialog from "@/components/ui/CustomDialog";

// --- 1. VALIDASI YUP ---
const pegawaiSchema = Yup.object({
  nip: Yup.string()
    .required("NIP/NIK wajib diisi")
    .min(5, "NIP minimal 5 karakter"),
  nama: Yup.string()
    .required("Nama lengkap wajib diisi")
    .min(3, "Nama terlalu pendek"),
  status: Yup.string().required("Status pegawai wajib dipilih"),
  role: Yup.string().required("Role wajib dipilih"),
});

const Pegawai = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // --- 2. STATES ---
  const [isLoading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pegawaiData, setPegawaiData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState("");

  const [info, openInfo] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState(null);

  // States untuk Edit & Notif
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- 3. REACT HOOK FORM ---
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(pegawaiSchema),
    defaultValues: { nip: "", nama: "", status: "", role: "" },
  });

  // --- 4. FUNCTIONS ---
  const fetchPegawaiData = async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, page: page + 1 };
      if (search.trim()) params.search = search.trim();
      const response = await services.pegawai.allpegawai(params);
      if (response?.data) {
        setPegawaiData(response.data.data || []);
        setTotalRows(response.data.pagination?.total_rows || 0);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Menambahkan delay (debounce) sederhana bisa ditaruh di sini jika diperlukan nanti
    // agar API tidak ter-spam saat user mengetik cepat.
    fetchPegawaiData();
  }, [page, rowsPerPage, search]);

  const handleResetForm = () => {
    reset({ nip: "", nama: "", status: "", role: "" });
    setIsEditMode(false);
    setSelectedId(null);
  };

  const onSimpan = async (values) => {
    try {
      if (isEditMode && selectedId) {
        // Mode Update
        await services.pegawai.update(selectedId, values);
        setNotification({
          open: true,
          message: "Data pegawai berhasil diperbarui!",
          severity: "success",
        });
      } else {
        // Mode Create
        await services.pegawai.create(values);
        setNotification({
          open: true,
          message: "Pegawai baru berhasil ditambahkan!",
          severity: "success",
        });
      }
      await fetchPegawaiData();
      handleResetForm();
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || "Gagal memproses data",
        severity: "error",
      });
    }
  };

  const handleEdit = (row) => {
    setIsEditMode(true);
    setSelectedId(row.internal_id || row.id || row.ID);
    reset({
      nip: row.nip,
      nama: row.nama,
      status: row.statuspegawai || row.status || "",
      role: row.role || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "PNS")
      return {
        bg: isDarkMode ? alpha(colors.indigo[900], 0.3) : colors.indigo[50],
        text: isDarkMode ? colors.indigo[300] : colors.indigo[700],
      };
    if (s === "PPPK")
      return {
        bg: isDarkMode ? alpha(colors.purple[900], 0.3) : colors.purple[50],
        text: isDarkMode ? colors.purple[300] : colors.purple[700],
      };
    return {
      bg: isDarkMode ? alpha(colors.orange[900], 0.3) : colors.orange[50],
      text: isDarkMode ? colors.orange[300] : colors.orange[700],
    };
  };

  const opsiStatus = [
    { value: "PNS", label: "PNS" },
    { value: "PPPK", label: "PPPK" },
    { value: "Tenaga Kontrak", label: "Tenaga Kontrak" },
  ];

  const opsiRole = [
    { value: "admin", label: "Admin" },
    { value: "pegawai", label: "Pegawai" },
    { value: "koordinator", label: "Koordinator" },
    { value: "pimpinan", label: "Pimpinan" },
  ];

  const onDelete = async (id) => {
    try {
      await services.pegawai.delete(id);
      setNotification({
        open: true,
        message: "Pegawai dihapus!",
        severity: "success",
      });
      fetchPegawaiData(); // Refresh tabel
    } catch (error) {
      setNotification({
        open: true,
        message: "Gagal menghapus",
        severity: "error",
      });
    }
  };

  return (
    <PageWrapper>
      <Stack spacing={4} sx={{ p: { xs: 1, md: 2 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: isDarkMode ? colors.indigo[400] : colors.indigo[800],
                letterSpacing: -0.5,
                pl: 2,
                position: "relative",
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
              Master Pegawai
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
              Database Manajemen SDM • v1.0
            </Typography>
          </Box>
          <Tooltip title="Bantuan">
            <IconButton size="small">
              <InfoOutlined />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Form Card */}
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            bgcolor: "background.paper",
            borderRadius: "24px",
            boxShadow: isDarkMode ? "none" : "0px 10px 30px rgba(0,0,0,0.04)",
            border: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
          }}>
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              opacity: isDarkMode ? 0.1 : 0.05,
              transform: "rotate(15deg)",
              color: "text.primary",
            }}>
            <PersonAddAlt1Rounded sx={{ fontSize: 150 }} />
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 4, position: "relative" }}>
            <PersonAddAlt1Rounded
              sx={{ color: colors.indigo[isDarkMode ? 400 : 600] }}
            />
            <Typography variant="h6" fontWeight="700">
              {isEditMode ? "Formulir Edit Pegawai" : "Formulir Tambah Pegawai"}
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit(onSimpan)}>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  name="nip"
                  label="NIP / NIK"
                  control={control}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <BadgeRounded
                        sx={{ color: "action.active", mr: 1, fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <TextField
                  name="nama"
                  label="Masukkan Nama"
                  control={control}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <AccountCircleRounded
                        sx={{ color: "action.active", mr: 1, fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Select
                  name="status"
                  label="Status Pegawai"
                  control={control}
                  fullWidth
                  options={opsiStatus}
                  InputProps={{
                    startAdornment: (
                      <WorkRounded
                        sx={{ color: "action.active", mr: 1, fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 6 }}>
                <Select
                  name="role"
                  label="Role"
                  control={control}
                  fullWidth
                  options={opsiRole}
                  InputProps={{
                    startAdornment: (
                      <DomainRounded
                        sx={{ color: "action.active", mr: 1, fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 5,
                gap: 2,
              }}>
              {isEditMode && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetForm}
                  sx={{
                    px: 4,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: "800",
                  }}>
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isSubmitting}
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: "800",
                  background: isEditMode
                    ? `linear-gradient(45deg, ${colors.indigo[700]} 30%, ${colors.indigo[500]} 90%)`
                    : `linear-gradient(45deg, ${colors.indigo[700]} 30%, ${colors.indigo[500]} 90%)`,
                  boxShadow: isDarkMode
                    ? "none"
                    : isEditMode
                      ? "0 4px 20px rgba(25, 118, 210, 0.3)"
                      : "0 4px 20px rgba(46, 125, 50, 0.3)",
                  "&:hover": {
                    background: isEditMode
                      ? colors.indigo[800]
                      : colors.indigo[800],
                  },
                }}>
                {isSubmitting
                  ? "Memproses..."
                  : isEditMode
                    ? "Perbarui Data"
                    : "Simpan Pegawai"}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tabel Data */}
        <Paper
          component={Card}
          sx={{
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: isDarkMode ? "none" : "0 4px 20px rgba(0,0,0,0.05)",
            border: isDarkMode ? `1px solid ${theme.palette.divider}` : "none",
          }}>
          
          {/* --- BAGIAN PENCARIAN (SEARCH BAR) --- */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <MuiTextField
              size="small"
              placeholder="Cari nama atau NIP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0); // Kembali ke halaman 1 saat mulai mencari
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch("");
                        setPage(0);
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ minWidth: { xs: '100%', sm: '300px' } }}
            />
          </Box>
          {/* --- AKHIR BAGIAN PENCARIAN --- */}

          <Table
            isLoading={isLoading}
            data={pegawaiData}
            columns={[
              {
                id: "nama",
                label: "Pegawai",
                render: (row) => (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: isDarkMode
                          ? alpha(colors.indigo[500], 0.2)
                          : colors.indigo[100],
                        color: isDarkMode
                          ? colors.indigo[300]
                          : colors.indigo[800],
                        fontWeight: "bold",
                      }}>
                      {row.nama?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="700">
                        {row.nama}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        NIP. {row.nip}
                      </Typography>
                    </Box>
                  </Stack>
                ),
              },
              {
                id: "jabatan",
                label: "Role",
                render: (row) => (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textTransform: "capitalize",
                    }}>
                    {row.role}
                  </Typography>
                ),
              },
              {
                id: "status",
                label: "Status",
                render: (row) => {
                  const style = getStatusColor(row.statuspegawai);
                  return (
                    <Chip
                      label={row.statuspegawai || "N/A"}
                      size="small"
                      sx={{
                        bgcolor: style.bg,
                        color: style.text,
                        fontWeight: "800",
                        borderRadius: "8px",
                      }}
                    />
                  );
                },
              },
              {
                id: "action",
                label: "Opsi",
                align: "right",
                render: (row) => (
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit Data">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(row)}
                        sx={{
                          color: colors.indigo[isDarkMode ? 300 : 600],
                          bgcolor: alpha(
                            colors.indigo[isDarkMode ? 300 : 600],
                            0.1,
                          ),
                          "&:hover": {
                            bgcolor: alpha(
                              colors.indigo[isDarkMode ? 300 : 600],
                              0.2,
                            ),
                          },
                        }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedIdToDelete(row.internal_id); // Simpan ID ke state
                          openInfo(true); // Buka dialog
                        }}
                        sx={{
                          color: colors.red[isDarkMode ? 300 : 600],
                          bgcolor: alpha(
                            colors.red[isDarkMode ? 300 : 600],
                            0.1,
                          ),
                          "&:hover": {
                            bgcolor: alpha(
                              colors.red[isDarkMode ? 300 : 600],
                              0.2,
                            ),
                          },
                        }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ),
              },
            ]}
          />
          <TablePagination
            component="div"
            count={totalRows}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}
          />
        </Paper>
      </Stack>

      <CustomDialog
        open={info}
        onClose={() => {
          openInfo(false);
          setSelectedIdToDelete(null); // Reset ID saat tutup
        }}
        onConfirm={() => {
          onDelete(selectedIdToDelete); // Kirim ID dari state
          openInfo(false); // Tutup dialog setelah konfirmasi
        }}
        type="warning"
        title="Konfirmasi"
        subtitle="Apakah anda yakin ingin menghapus data?"
        confirmText="Oke, Hapus"
        showCancel={true}
      />

      {/* Notifikasi */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "12px", fontWeight: 600 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
};

export default Pegawai;