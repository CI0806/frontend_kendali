import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Drawer,
  IconButton,
  Tooltip,
  TablePagination,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  colors,
  Card,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Search,
  Edit,
  Delete,
  MeetingRoom,
  Close,
  Save,
  Cancel,
  SubdirectoryArrowRight,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import services from "@/services";
import PageWrapper from "@/components/ui/PageWrapper";

const LokasiFisik = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tipeLokasi, setTipeLokasi] = useState("gedung");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingLokasi, setIsEditingLokasi] = useState(false);
  const [selectedLokasiId, setSelectedLokasiId] = useState(null);

   const [notification, setNotification] = useState({
      open: false,
      message: "",
      severity: "success",
    });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nama_ruang: "",
      nama_rak: "",
      nomor_box: "",
      keterangan: "",
      parent_id: null,
    },
  });

  const flattenTree = (nodes, level = 0) => {
    let result = [];
    nodes.forEach((node) => {
      // Tambahkan informasi level untuk indentasi (jarak kiri)
      result.push({ ...node, level });
      if (node.children && node.children.length > 0) {
        result = [...result, ...flattenTree(node.children, level + 1)];
      }
    });
    return result;
  };

  // Fungsi untuk fetch data (disesuaikan untuk handle flat list dari server)
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await services.lokasi.getall({
        params: { page: page + 1, limit: rowsPerPage, search: searchQuery },
      });
      const flatData = flattenTree(response.data.data);

      setLocations(flatData);
      setTotalData(flatData.length); // Total data dari hasil flatten
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // ... state lainnya
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Fungsi untuk menghapus lokasi
  const handleDelete = async (id) => {
    // Cari data untuk ditampilkan di konfirmasi
    const target = locations.find((l) => l.internal_id === id);
    const name = target
      ? target.nama_ruang || target.nama_rak || target.nomor_box
      : "Lokasi ini";

    if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      try {
        await services.lokasi.delete(id);
        setNotification({
          open: true,
          message: "Data berhasil dihapus",
          severity: "success",
        });
        fetchLocations(); // Refresh data setelah hapus
      } catch (error) {
        setNotification({
          open: true,
          message: "Data gagal dihapus",
          severity: "cancel",
        });
      }
    }
  };

  // Fungsi Edit (Trigger Drawer dengan data lama)
  const handleEditClick = (loc) => {
    setIsEditing(true);
    setCurrentId(loc.internal_id);

    // Deteksi tipe lokasi berdasarkan data yang ada
    if (loc.nomor_box) setTipeLokasi("box");
    else if (loc.nama_rak) setTipeLokasi("rak");
    else setTipeLokasi("gedung");

    reset({
      nama_ruang: loc.nama_ruang || "",
      nama_rak: loc.nama_rak || "",
      nomor_box: loc.nomor_box || "",
      keterangan: loc.keterangan || "",
      parent_id: loc.parent_id || null,
    });
    setDrawerOpen(true);
  };

  // Update Fungsi Submit (Tambah & Edit)
  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        // Pastikan field lain dibersihkan jika tipe berubah
        nama_ruang: tipeLokasi === "gedung" ? data.nama_ruang : "",
        nama_rak: tipeLokasi === "rak" ? data.nama_rak : "",
        nomor_box: tipeLokasi === "box" ? data.nomor_box : "",
      };

      if (isEditing) {
        await services.lokasi.update(currentId, payload);
        setNotification({
          open: true,
          message: "Data berhasil diupdate",
          severity: "success",
        });
      } else {
        await services.lokasi.create(payload);
        setNotification({
          open: true,
          message: "Data berhasil ditambahkan",
          severity: "success",
        });
      }

      setDrawerOpen(false);
      setIsEditing(false); // Reset mode ke Tambah
      setCurrentId(null); // Bersihkan ID terpilih
      reset();
      fetchLocations();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const getFullPath = (node, allNodes) => {
    if (!node.parent_id)
      return node.nama_ruang || node.nama_rak || node.nomor_box;

    const parent = allNodes.find((n) => n.internal_id === node.parent_id);
    if (parent) {
      return `${getFullPath(parent, allNodes)} > ${node.nama_ruang || node.nama_rak || node.nomor_box}`;
    }

    return node.nama_ruang || node.nama_rak || node.nomor_box;
  };

  return (
    <PageWrapper>
      <Stack spacing={4} sx={{ p: { xs: 1, md: 2 } }}>
        <Stack direction="row" justifyContent="space-between" mb={4}>
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
              Master Lokasi Fisik
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
              Pemetaan fisik dokumen asli (Gedung, Rak, Box).
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Cari Ruang/Box..."
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
                  borderRadius: "12px",
                  height: "48px",
                  bgcolor: isDarkMode
                    ? alpha(colors.indigo[900], 0.1)
                    : "#f8fafc",
                },
              }}
              sx={{
                width: 280,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" },
                  "&.Mui-focused fieldset": {
                    border: `1px solid ${colors.indigo[500]}`,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: "24px !important" }} />}
              onClick={() => {
                setIsEditing(false); // <--- Tambahkan ini agar mode kembali ke "Tambah"
                setCurrentId(null); // <--- Reset ID agar tidak menimpa data lama
                setTipeLokasi("gedung");
                reset({
                  nama_ruang: "",
                  nama_rak: "",
                  nomor_box: "",
                  keterangan: "",
                  parent_id: null,
                });
                setDrawerOpen(true);
              }}
              sx={{
                height: "48px",
                px: 3,
                borderRadius: "12px",
                fontWeight: 800,
                textTransform: "none",
                background: `linear-gradient(135deg, ${colors.indigo[500]} 0%, ${colors.indigo[700]} 100%)`,
                boxShadow: `0 8px 20px -6px ${alpha(colors.indigo[500], 0.5)}`,
              }}>
              Tambah Lokasi Baru
            </Button>
          </Stack>
        </Stack>

        <TableContainer
          component={Card}
          sx={{
            borderRadius: 3,
            bgcolor: "background.paper",
            border: isDarkMode ? `1px solid ${theme.palette.divider}` : "none",
          }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 800,
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "#f8fafc"
                        : "background.paper",
                  },
                }}>
                <TableCell>Ruang / Gedung</TableCell>
                {/* <TableCell>Rak</TableCell>
                <TableCell>Nomor Box</TableCell> */}
                <TableCell>Keterangan</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((loc) => {
                  const displayName =
                    loc.nama_ruang ||
                    loc.nama_rak ||
                    loc.nomor_box ||
                    "Tanpa Nama";
                  return (
                    <TableRow key={loc.internal_id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {/* Menampilkan icon Subdirectory jika dia punya parent */}
                          <Box sx={{ width: loc.level * 30 }} />
                          {loc.level > 0 && (
                            <SubdirectoryArrowRight
                              fontSize="small"
                              sx={{ color: "text.disabled" }}
                            />
                          )}

                          {/* Icon berubah sesuai level */}
                          {loc.level === 0 ? (
                            <MeetingRoom
                              sx={{ color: colors.red[600] }}
                              fontSize="small"
                            />
                          ) : loc.nomor_box ? (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: colors.indigo[500],
                                borderRadius: "4px",
                              }}
                            />
                          ) : (
                            <MeetingRoom
                              sx={{ color: "text.secondary" }}
                              fontSize="small"
                            />
                          )}

                          <Typography
                            variant="body2"
                            fontWeight={loc.level === 0 ? 800 : 500}
                            color="text.primary">
                            {displayName}
                          </Typography>

                          {loc.level > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                display: "block",
                                lineHeight: 1.2,
                              }}>
                              Induk: {getFullPath(loc, locations)}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      {/* <TableCell>{loc.nama_rak || "-"}</TableCell>
                      <TableCell>
                        {loc.nomor_box ? (
                          <Chip
                            label={loc.nomor_box}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell> */}
                      <TableCell>{loc.keterangan || "-"}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(loc)} // Gunakan fungsi edit
                            sx={{ color: colors.indigo[600] }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(loc.internal_id)} // Gunakan fungsi hapus
                            sx={{ color: colors.red[600] }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalData}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              width: 400,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}>
            <Box
              sx={{
                p: 3,
                bgcolor: isEditing ? colors.indigo[700] : colors.indigo[700],
                color: "white",
                position: "relative",
              }}>
              <Typography variant="h6" fontWeight="600">
                {isEditing ? "Ubah Data Lokasi" : "Tambah Lokasi Fisik"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {isEditing
                  ? "Perbarui informasi hirarki atau nama lokasi ini"
                  : "Pilih induk lokasi untuk membuat hierarki (Gedung > Rak > Box)"}
              </Typography>
              <IconButton
                onClick={() => setDrawerOpen(false)}
                sx={{ color: "white", position: "absolute", right: 8, top: 8 }}>
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1 }}>
              <Stack spacing={3}>
                {/* PILIH INDUK (PARENT) - Agar bisa jadi Tree */}
                <Controller
                  name="parent_id"
                  control={control}
                  defaultValue={null}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      // 1. Cari objek lokasi yang sesuai dengan value (ID) saat ini
                      value={
                        locations.find((l) => l.internal_id === value) || null
                      }
                      // 2. Update form hanya dengan ID-nya saja saat user memilih
                      onChange={(_, newValue) => {
                        onChange(newValue ? newValue.internal_id : null);
                      }}
                      options={locations.filter(
                        (l) => l.internal_id !== currentId,
                      )}
                      // 3. Tampilkan jalur lengkap (Full Path) di dalam list pilihan
                      getOptionLabel={(option) =>
                        getFullPath(option, locations)
                      }
                      // 4. Pastikan pencarian (mengetik) bekerja berdasarkan label Full Path
                      filterOptions={(options, state) =>
                        options.filter((opt) =>
                          getFullPath(opt, locations)
                            .toLowerCase()
                            .includes(state.inputValue.toLowerCase()),
                        )
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cari Induk Lokasi (Parent)"
                          placeholder="Ketik nama gedung atau rak..."
                          helperText="Kosongkan jika ini adalah Gedung Utama"
                          // Pastikan tidak ada value manual di sini
                        />
                      )}
                      // Styling tambahan agar serasi dengan desain Anda
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  )}
                />

                <TextField
                  select
                  fullWidth
                  label="Saya ingin menambah..."
                  value={tipeLokasi}
                  onChange={(e) => setTipeLokasi(e.target.value)}>
                  <MenuItem value="gedung">Gedung / Ruangan</MenuItem>
                  <MenuItem value="rak">Rak</MenuItem>
                  <MenuItem value="box">Box Dokumen</MenuItem>
                </TextField>

                {/* 3. Tampilkan field HANYA yang relevan */}
                {tipeLokasi === "gedung" && (
                  <TextField
                    fullWidth
                    label="Nama Gedung/Ruangan"
                    {...register("nama_ruang", { required: true })}
                  />
                )}

                {tipeLokasi === "rak" && (
                  <TextField
                    fullWidth
                    label="Nama Rak"
                    {...register("nama_rak", { required: true })}
                  />
                )}

                {tipeLokasi === "box" && (
                  <TextField
                    fullWidth
                    label="Nomor Box"
                    {...register("nomor_box", { required: true })}
                  />
                )}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Keterangan"
                  {...register("keterangan")}
                />
              </Stack>
            </Box>

            <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  type="submit"
                  startIcon={<Save />}
                  sx={{ bgcolor: colors.indigo[700], py: 1.5 }}>
                  Simpan
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setDrawerOpen(false)}
                  sx={{ py: 1.5 }}>
                  Batal
                </Button>
              </Stack>
            </Box>
          </Box>
        </Drawer>

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
      </Stack>
    </PageWrapper>
  );
};

export default LokasiFisik;
