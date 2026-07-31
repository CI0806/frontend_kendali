import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import services from '@/services';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

const Penomoran = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [tabValue, setTabValue] = useState(0); // 0: Semua, 1: Surat, 2: SOP
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  // Form State (Generate)
  const [jenis, setJenis] = useState('Surat');
  const [kategoriSOP, setKategoriSOP] = useState('');
  const [kodeSurat, setKodeSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [isSisipan, setIsSisipan] = useState(false);
  const [nomorManual, setNomorManual] = useState('');
  const [tglAmbil, setTglAmbil] = useState(dayjs());

  // Form State (Edit)
  const [editPerihal, setEditPerihal] = useState('');
  const [editTglAmbil, setEditTglAmbil] = useState(dayjs());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await services.penomoran.getAll();
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      setToast({ open: true, msg: 'Gagal memuat data penomoran', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    setJenis('Surat');
    setKategoriSOP('');
    setKodeSurat('');
    setPerihal('');
    setIsSisipan(false);
    setNomorManual('');
    setTglAmbil(dayjs());
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSubmit = async () => {
    if (!perihal) {
      setToast({ open: true, msg: 'Perihal harus diisi', severity: 'warning' });
      return;
    }
    if (jenis === 'SOP' && !kategoriSOP) {
      setToast({ open: true, msg: 'Klaster SOP harus dipilih', severity: 'warning' });
      return;
    }
    if (jenis === 'Surat' && !kodeSurat) {
      setToast({ open: true, msg: 'Kode Surat harus diisi', severity: 'warning' });
      return;
    }
    if (isSisipan && !nomorManual) {
      setToast({ open: true, msg: 'Nomor manual/sisipan harus diisi', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        jenis,
        kategori_sop: kategoriSOP,
        kode_surat: kodeSurat,
        perihal,
        is_sisipan: isSisipan,
        nomor_manual: nomorManual,
        tgl_ambil: tglAmbil.format('YYYY-MM-DD')
      };
      
      const res = await services.penomoran.generate(payload);
      setToast({ open: true, msg: 'Berhasil generate nomor: ' + res.data.data.nomor_lengkap, severity: 'success' });
      setOpenModal(false);
      loadData();
    } catch (err) {
      setToast({ open: true, msg: err.response?.data?.message || 'Gagal generate nomor', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setEditPerihal(item.perihal);
    setEditTglAmbil(dayjs(item.tgl_ambil));
    setOpenEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editPerihal) {
      setToast({ open: true, msg: 'Perihal harus diisi', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        perihal: editPerihal,
        tgl_ambil: editTglAmbil.format('YYYY-MM-DD')
      };
      await services.penomoran.update(selectedItem.public_id, payload);
      setToast({ open: true, msg: 'Data berhasil diperbarui', severity: 'success' });
      setOpenEditModal(false);
      loadData();
    } catch (err) {
      setToast({ open: true, msg: err.response?.data?.message || 'Gagal mengedit data', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (item) => {
    setSelectedItem(item);
    setOpenDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    try {
      await services.penomoran.delete(selectedItem.public_id);
      setToast({ open: true, msg: 'Data berhasil dihapus', severity: 'success' });
      setOpenDeleteModal(false);
      loadData();
    } catch (err) {
      setToast({ open: true, msg: err.response?.data?.message || 'Gagal menghapus data', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering Data
  const filteredData = data.filter(item => {
    const matchesTab = tabValue === 0 ? true : (tabValue === 1 ? item.jenis === 'Surat' : item.jenis === 'SOP');
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.perihal.toLowerCase().includes(searchLower) || item.nomor_lengkap.toLowerCase().includes(searchLower);
    return matchesTab && matchesSearch;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Buku Register (Penomoran)</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>
            Ambil Nomor Baru
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 3, borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} indicatorColor="primary" textColor="primary">
            <Tab label="Semua" />
            <Tab label="Surat Umum" />
            <Tab label="SOP" />
          </Tabs>
          <TextField
            size="small"
            placeholder="Cari perihal / nomor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Tanggal Ambil</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Jenis</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Nomor Dokumen</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Perihal</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Pengambil</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }} align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Belum ada data penomoran yang sesuai pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow key={row.internal_id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{moment(row.tgl_ambil).format('DD MMM YYYY HH:mm')}</TableCell>
                    <TableCell>{row.jenis}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.nomor_lengkap}</TableCell>
                    <TableCell>{row.perihal}</TableCell>
                    <TableCell>{row.pegawai ? row.pegawai.nama : '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <IconButton size="small" color="error" onClick={() => openDelete(row)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal Form Generate */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Ambil Nomor Dokumen Baru</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <DatePicker
              label="Tanggal Ambil (Opsional, untuk backdate)"
              value={tglAmbil}
              onChange={(newValue) => setTglAmbil(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />

            <TextField
              select
              label="Jenis Dokumen"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              fullWidth
            >
              <MenuItem value="Surat">Surat Umum</MenuItem>
              <MenuItem value="SOP">SOP</MenuItem>
            </TextField>

            {jenis === 'SOP' && (
              <TextField
                select
                label="Klaster (SOP)"
                value={kategoriSOP}
                onChange={(e) => setKategoriSOP(e.target.value)}
                fullWidth
                helperText="Pilih klaster untuk format SOP"
              >
                <MenuItem value="KL1">KL1 - Manajemen Puskesmas/Mutu</MenuItem>
                <MenuItem value="KL2">KL2 - Kesehatan Ibu dan Anak</MenuItem>
                <MenuItem value="KL3">KL3 - Kesehatan Usia Dewasa dan Lansia</MenuItem>
                <MenuItem value="KL4">KL4 - Penanggulangan Penyakit Menular</MenuItem>
                <MenuItem value="LK">LK - Lintas Klaster</MenuItem>
              </TextField>
            )}

            {jenis === 'Surat' && (
              <TextField
                label="Kode Surat"
                value={kodeSurat}
                onChange={(e) => setKodeSurat(e.target.value)}
                fullWidth
                placeholder="Contoh: 800, 900"
                helperText="Kode klasifikasi surat (Misal 800 untuk Kepegawaian)"
              />
            )}

            <TextField
              label="Perihal / Judul Dokumen"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Checkbox 
                  checked={isSisipan} 
                  onChange={(e) => setIsSisipan(e.target.checked)} 
                  color="primary"
                />
              }
              label="Sisip Nomor (Manual Input)"
            />

            {isSisipan && (
              <TextField
                label="Nomor Sisipan Manual"
                value={nomorManual}
                onChange={(e) => setNomorManual(e.target.value)}
                fullWidth
                placeholder="Contoh: 004A, 001.1"
                helperText="Masukkan nomor urut secara manual (Auto-increment akan diabaikan)"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} disabled={submitting}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Memproses...' : 'Generate Nomor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Edit */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Nomor Dokumen</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info">Anda hanya dapat mengubah Perihal dan Tanggal. Nomor dokumen tidak dapat diubah untuk menjaga sistem auto-increment.</Alert>
            <TextField
              label="Nomor Dokumen"
              value={selectedItem?.nomor_lengkap || ''}
              fullWidth
              disabled
            />
            <DatePicker
              label="Tanggal Ambil"
              value={editTglAmbil}
              onChange={(newValue) => setEditTglAmbil(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              label="Perihal / Judul Dokumen"
              value={editPerihal}
              onChange={(e) => setEditPerihal(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenEditModal(false)} disabled={submitting}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Delete */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Hapus Data?</DialogTitle>
        <DialogContent dividers>
          <Typography>Apakah Anda yakin ingin menghapus nomor registrasi ini?</Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>{selectedItem?.nomor_lengkap}</Typography>
          <Typography variant="body2" color="text.secondary">Tindakan ini tidak dapat dibatalkan.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDeleteModal(false)} disabled={submitting}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSubmit} disabled={submitting}>
            {submitting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Penomoran;
