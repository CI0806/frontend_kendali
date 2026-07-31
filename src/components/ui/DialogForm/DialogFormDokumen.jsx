import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Stack,
  useTheme,
  IconButton,
} from "@mui/material";
import { 
  Send as SendIcon, 
  Edit as EditIcon, 
  Close as CloseIcon,
  AssignmentTurnedIn as VerifiedIcon 
} from "@mui/icons-material";

const DialogFormDokumen = ({ open, handleClose, data, onConfirm, loading }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const DataRow = ({ label, value }) => (
    <Box sx={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", // Agar sejajar jika teks panjang
      py: 1.25 
    }}>
      <Typography
        variant="body2"
        sx={{ 
          color: "text.secondary", 
          fontWeight: 500,
          fontSize: "0.85rem"
        }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ 
          fontWeight: 600, 
          textAlign: "right", 
          ml: 4, // Beri jarak lebih lebar
          color: "text.primary",
          fontSize: "0.9rem"
        }}>
        {value || "-"}
      </Typography>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4, // Lebih melengkung agar modern
          boxShadow: isDarkMode ? "0 24px 48px rgba(0,0,0,0.5)" : "0 12px 32px rgba(0,0,0,0.1)",
          backgroundImage: "none",
        }
      }}
    >
      {/* Header dengan Ikon dan Tombol Close */}
      <DialogTitle sx={{ m: 0, p: 3, textAlign: "center" }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 1 
        }}>
          <Box sx={{ 
            bgcolor: isDarkMode ? "primary.dark" : "primary.light", 
            color: "primary.contrastText",
            p: 1.5, 
            borderRadius: "50%",
            display: "flex",
            mb: 1
          }}>
            <VerifiedIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Konfirmasi Pengajuan
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "text.disabled",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 2,
            textAlign: "center",
            fontWeight: 800,
            color: "primary.main",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
          Ringkasan Data
        </Typography>

        <Stack 
          divider={<Divider sx={{ borderStyle: "dashed", opacity: 0.6 }} />}
          sx={{ 
            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "grey.50", 
            p: 2, 
            borderRadius: 3,
            border: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid #edf2f7"
          }}
        >
          <DataRow label="Nama Pegawai" value={data.nama} />
          <DataRow label="Koordinator" value={data.nama_atasan} />
          <DataRow label="Judul" value={data.judul_pengajuan} />
          <DataRow label="Kategori" value={data.jenis_dokumen} />
          <DataRow label="Tingkat Urgensi" value={data.tingkat_urgensi} />
          <DataRow label="Klaster" value={data.klaster} />
          <DataRow label="Catatan" value={data.pesan_pengaju} />
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: isDarkMode ? "rgba(255, 193, 7, 0.05)" : "#fff9db",
            borderRadius: 2,
            border: "1px solid",
            borderColor: isDarkMode ? "rgba(255, 193, 7, 0.2)" : "#fff3bf",
            display: "flex",
            alignItems: "center",
            gap: 1.5
          }}>
          <Typography variant="caption" sx={{ color: isDarkMode ? "#ffd43b" : "#856404", fontWeight: 500, lineHeight: 1.5 }}>
            <strong>Catatan:</strong> Mohon pastikan kembali data Anda. Pengajuan yang telah terkirim akan masuk ke proses verifikasi.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, justifyContent: "space-between", gap: 2 }}>
        <Button
          onClick={handleClose}
          startIcon={<EditIcon />}
          color="inherit"
          disabled={loading}
          sx={{ 
            borderRadius: 2, 
            px: 2, 
            textTransform: "none", 
            fontWeight: 700 
          }}>
          Perbaiki
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          elevation={0}
          startIcon={<SendIcon />}
          disabled={loading}
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            py: 1,
            textTransform: "none", 
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(76, 149, 70, 0.3)" // Sesuaikan dengan warna primary Anda
          }}>
          {loading ? "Memproses..." : "Kirim Pengajuan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogFormDokumen;