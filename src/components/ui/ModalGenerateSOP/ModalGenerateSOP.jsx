import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Snackbar,
} from "@mui/material";
import { AutoAwesome, Close, ContentCopy, Download as DownloadIcon } from "@mui/icons-material";
import services from "@/services";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const ModalGenerateSOP = ({ open, handleClose }) => {
  const theme = useTheme();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setSnackbar({
        open: true,
        message: "Silakan masukkan topik SOP terlebih dahulu.",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const response = await services.ai.generateSOP({ topic });
      setResult(response.data?.data || "");
      setSnackbar({
        open: true,
        message: "SOP berhasil dibuat oleh AI!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Gagal menghubungi AI",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setSnackbar({
        open: true,
        message: "SOP berhasil disalin ke clipboard!",
        severity: "success",
      });
    }
  };

  const handleExportWord = async () => {
    if (!result) return;
    
    try {
      // 1. Fetch the template from public folder
      const response = await fetch('/template_sop.docx');
      if (!response.ok) throw new Error("File template_sop.docx tidak ditemukan di folder public");
      const arrayBuffer = await response.arrayBuffer();

      // 2. Parse markdown sections securely
      const extractSection = (text, startKeyword, endKeyword) => {
        const startRegex = new RegExp(`(?:\\*\\*\\d+\\.\\s*)?${startKeyword}(?:\\*\\*)?\\s*:\\s*`, 'i');
        const matchStart = text.match(startRegex);
        if (!matchStart) return "";
        const startIndex = matchStart.index + matchStart[0].length;
        let endIndex = text.length;
        if (endKeyword) {
          const endRegex = new RegExp(`(?:\\*\\*\\d+\\.\\s*)?${endKeyword}(?:\\*\\*)?\\s*:\\s*`, 'i');
          const matchEnd = text.slice(startIndex).match(endRegex);
          if (matchEnd) {
            endIndex = startIndex + matchEnd.index;
          }
        }
        // Bersihkan Markdown bold/italic jika diinginkan, tapi docxtemplater dengan linebreaks:true bisa menangani baris baru.
        // Hapus tanda bintang Markdown agar tidak tercetak berantakan di Word.
        return text.slice(startIndex, endIndex).replace(/\*\*/g, '').trim();
      };

      const data = {
        judul: topic.toUpperCase(),
        pengertian: extractSection(result, "Pengertian", "Tujuan"),
        tujuan: extractSection(result, "Tujuan", "Kebijakan"),
        kebijakan: extractSection(result, "Kebijakan", "Referensi"),
        referensi: extractSection(result, "Referensi", "Prosedur"),
        prosedur: extractSection(result, "Prosedur", "Hal-hal yang perlu diperhatikan"),
        perhatian: extractSection(result, "Hal-hal yang perlu diperhatikan", "Unit Terkait"),
        unit: extractSection(result, "Unit Terkait", "Dokumen Terkait"),
        dokumen: extractSection(result, "Dokumen Terkait", "Rekaman Historis Perubahan"),
        historis: extractSection(result, "Rekaman Historis Perubahan", null),
      };

      // 3. Initialize pizzip and docxtemplater
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 4. Set the template variables
      doc.render(data);

      // 5. Generate and download
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(out);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SOP_${topic.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: "SOP berhasil diunduh menggunakan Template Asli!",
        severity: "success",
      });
    } catch (error) {
      console.error("Export Word Error:", error);
      setSnackbar({
        open: true,
        message: "Gagal memproses template Word. Pastikan file template_sop.docx sudah Anda masukkan ke web.",
        severity: "error",
      });
    }
  };

  const onClose = () => {
    setTopic("");
    setResult("");
    handleClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "20px" } }}>
        <DialogTitle
          sx={{ m: 0, p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              p: 1,
              borderRadius: "12px",
              display: "flex",
            }}>
            <AutoAwesome color="secondary" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              ✨ Buat SOP dengan AI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Asisten AI akan membuatkan draf SOP Puskesmas sesuai topik Anda
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", right: 16, top: 16 }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderBottom: "none", px: 3, py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Topik SOP"
              placeholder="Contoh: Peminjaman Barang Inventaris, Penanganan Pasien Gawat Darurat..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              multiline
              rows={2}
            />
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              sx={{ mt: 2, borderRadius: "10px", py: 1.5, fontWeight: "bold" }}>
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Sedang Menganalisis Ratusan File & Menulis SOP...
                </>
              ) : (
                "Mulai Generate SOP"
              )}
            </Button>
          </Box>

          {result && (
            <Box
              sx={{
                bgcolor: alpha(theme.palette.action.hover, 0.05),
                p: 3,
                borderRadius: "12px",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                position: "relative",
              }}>
              <Box sx={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportWord}
                  color="primary">
                  Unduh ke Word
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleCopy}
                  color="secondary">
                  Salin Teks
                </Button>
              </Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Hasil Generate AI:
              </Typography>
              <Box
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: theme.palette.text.primary,
                  maxHeight: "400px",
                  overflowY: "auto",
                  pr: 1,
                }}>
                {result}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} color="inherit">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

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

export default ModalGenerateSOP;
