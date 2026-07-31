import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  MenuItem,
  Stack,
  Box,
  Typography,
  IconButton,
  alpha,
  useTheme,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  PersonAddAlt1,
  CalendarMonth,
  Description,
  HistoryEdu,
} from "@mui/icons-material";
import services from "@/services";
import session from "@/utils/session";

const ModalCuti = ({ open, handleClose, refreshData }) => {
  const theme = useTheme();
  const [listPegawai, setListPegawai] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsAtasan, setOptionsAtasan] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);

  // State untuk Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // 'success' | 'error' | 'warning' | 'info'
  });

  const [formData, setFormData] = useState({
    pegawai_id: "",
    jenis_cuti: "Cuti Tahunan",
    jumlah_hari: 1,
    tgl_mulai: "",
    tgl_selesai: "",
    alasan: "",
  });

  // Ambil daftar pegawai
  useEffect(() => {
    if (open) {
      services.pegawai.cariAtasan().then((res) => {
        setListPegawai(res.data?.data || []);
      });
    }
  }, [open]);

  useEffect(() => {
    const fetchAtasan = async () => {
      if (inputValue.length < 3) {
        setOptionsAtasan([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const response = await services.pegawai.cariAtasan({ q: inputValue });
        const rawData = response.data?.data || [];

        // JANGAN di-map ke 'label', biarkan struktur aslinya agar renderOption berfungsi
        const dataAtasan = rawData.map((item) => ({
          ...item,
          id: item.internal_id, // Pastikan ada properti id untuk isOptionEqualToValue
          nama: item.nama, // Pastikan properti ini ada
        }));

        setOptionsAtasan(dataAtasan);
      } catch (err) {
        console.error("Gagal cari atasan:", err);
      } finally {
        setLoadingSearch(false);
      }
    };
    const timer = setTimeout(() => fetchAtasan(), 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Logika Hitung Hari Otomatis
  useEffect(() => {
    if (formData.tgl_mulai && formData.tgl_selesai) {
      const start = new Date(formData.tgl_mulai);
      const end = new Date(formData.tgl_selesai);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setFormData((prev) => ({
        ...prev,
        jumlah_hari: diffDays > 0 ? diffDays : 0,
      }));
    }
  }, [formData.tgl_mulai, formData.tgl_selesai]);

  const handleShowSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    if (!formData.pegawai_id || !formData.tgl_mulai || !formData.alasan) {
      handleShowSnackbar("Mohon lengkapi data yang wajib!", "warning");
      return;
    }

    setLoading(true);
    const user = session.getUser();
    const adminId = user?.internal_id || user?.user_id;

    const payload = {
      ...formData,
      pegawai_id: Number(formData.pegawai_id),
      jumlah_hari: Number(formData.jumlah_hari),
      koordinator_id: Number(adminId || formData.pegawai_id),
      alamat: "-",
      phone: "-",
    };

    try {
      await services.cuti.manual(payload);
      handleShowSnackbar("Cuti manual berhasil disimpan!");

      // Delay sedikit sebelum tutup agar user sempat melihat snackbar
      setTimeout(() => {
        refreshData();
        handleClose();
      }, 1500);
    } catch (err) {
      handleShowSnackbar(
        err.response?.data?.message || "Gagal menyimpan data",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "20px" } }}>
        <DialogTitle
          sx={{ m: 0, p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              p: 1,
              borderRadius: "12px",
              display: "flex",
            }}>
            <HistoryEdu color="primary" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Input Izin Manual
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pencatatan langsung oleh Admin
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", right: 16, top: 16 }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderBottom: "none", px: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={optionsAtasan}
              loading={loadingSearch}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              // Agar tidak bentrok saat data sedang di-fetch
              filterOptions={(x) => x}
              getOptionLabel={(option) =>
                option.nama ? `${option.nama} (NIP: ${option.nip})` : ""
              }
              isOptionEqualToValue={(option, value) =>
                option.internal_id === value.internal_id
              }
              onChange={(e, val) =>
                setFormData({
                  ...formData,
                  pegawai_id: val ? val.internal_id : "",
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Pegawai"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonAddAlt1 color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    // Tambahkan loading spinner di dalam input
                    endAdornment: (
                      <React.Fragment>
                        {loadingSearch ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />

            <TextField
              select
              label="Jenis Izin/Cuti"
              value={formData.jenis_cuti}
              onChange={(e) =>
                setFormData({ ...formData, jenis_cuti: e.target.value })
              }>
              <MenuItem value="Cuti Tahunan">
                Cuti Tahunan (Potong Saldo)
              </MenuItem>
              <MenuItem value="Cuti Sakit">Cuti Sakit (Tanpa Potong)</MenuItem>
              <MenuItem value="Cuti Alasan Penting">Cuti Alasan Penting (Tanpa Potong)</MenuItem>
              <MenuItem value="Cuti Bersalin">Cuti Bersalin (Tanpa Potong)</MenuItem>
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Tgl Mulai"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={(e) =>
                  setFormData({ ...formData, tgl_mulai: e.target.value })
                }
              />
              <TextField
                type="date"
                label="Tgl Selesai"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={(e) =>
                  setFormData({ ...formData, tgl_selesai: e.target.value })
                }
              />
            </Stack>

            <TextField
              fullWidth // Wajib agar lebar sama dengan Grid/DatePicker
              type="number"
              label="Jumlah Hari"
              value={formData.jumlah_hari || ""}
              onChange={(e) =>
                setFormData({ ...formData, jumlah_hari: e.target.value })
              } // Agar bisa diedit manual
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
                },
              }}
            />

            <TextField
              label="Alasan"
              multiline
              rows={2}
              placeholder="Contoh: Izin urusan keluarga"
              onChange={(e) =>
                setFormData({ ...formData, alasan: e.target.value })
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: "10px", px: 4 }}>
            {loading ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ModalCuti;
