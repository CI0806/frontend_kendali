import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Stack,
  Avatar,
  Button,
  Paper,
  IconButton,
  Chip,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  Cancel,
  FilePresent,
  PictureAsPdf,
  OpenInNew,
  AutoAwesome,
} from "@mui/icons-material";
import { url } from "@/utils/constants";
import services from "@/services";

const DetailDrawer = ({
  open,
  onClose,
  data,
  onApprove,
  onReject,
  isPimpinan,
  type, // "cuti" atau "dokumen"
}) => {
  const [catatanVerifikator, setCatatanVerifikator] = useState("");
  const [catatanPimpinan, setCatatanPimpinan] = useState("");
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  const [isAnomalyLoading, setIsAnomalyLoading] = useState(false);
  const [anomalyAnalysis, setAnomalyAnalysis] = useState("");

  // Sinkronisasi data saat drawer dibuka
  useEffect(() => {
    if (open && data) {
      setCatatanVerifikator(data.catatan_verif || "");
      setCatatanPimpinan(data.catatan_pimpinan || "");
    }
  }, [data, open]);

  if (!data) return null;

  const isDokumen = type === "dokumen";
  // Gunakan file_url untuk dokumen, lampiran untuk cuti
  const fileUrl = isDokumen
    ? `${url}/${data.file_url}`
    : data.lampiran
      ? `${url}/${data.lampiran}`
      : null;
  // const fileUrl = isDokumen
  //   ? `http://localhost:3000/${data.file_url}`
  //   : data.lampiran
  //     ? `http://localhost:3000/${data.lampiran}`
  //     : null;

  const handleAction = (actionType) => {
    const finalNote = isPimpinan ? catatanPimpinan : catatanVerifikator;

    if (actionType === "reject" && (!finalNote || finalNote.trim() === "")) {
      alert("Catatan alasan penolakan wajib diisi!");
      return;
    }

    if (actionType === "approve") {
      onApprove(data.public_id || data.id || data.internal_id, finalNote);
    } else {
      onReject(data.public_id || data.internal_id, finalNote);
    } // --- BARIS PENTING: Memicu update badge di Sidebar ---
    window.dispatchEvent(new Event("refresh-notifications"));

    onClose(); // Tutup drawer setelah sukses
  };

  const handleAnalyze = async () => {
    if (!data || !isDokumen) return;
    setIsAiLoading(true);
    setAiSummary("");
    try {
      const id = data.internal_id || data.id;
      const res = await services.dokumen.analyze(id);
      setAiSummary(res.data?.data || "Tidak ada hasil ringkasan.");
    } catch (err) {
      setAiSummary("Gagal meringkas dokumen: " + (err.response?.data?.message || err.message));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnalyzeAnomaly = async () => {
    if (!data || type !== "cuti") return;
    setIsAnomalyLoading(true);
    setAnomalyAnalysis("");
    try {
      // Pada model cuti, id pegawai dikembalikan sebagai pegawai_id, dan ada objek pegawai
      const idPegawai = data.pegawai_id || (data.pegawai && data.pegawai.internal_id);
      if (!idPegawai) {
        setAnomalyAnalysis("Data pegawai tidak valid, tidak bisa menganalisis pola cuti.");
        return;
      }
      const res = await services.cuti.analyzeAnomaly(idPegawai);
      setAnomalyAnalysis(res.data?.data || "Tidak ada hasil analisis pola cuti.");
    } catch (err) {
      setAnomalyAnalysis("Gagal menganalisis pola cuti: " + (err.response?.data?.message || err.message));
    } finally {
      setIsAnomalyLoading(false);
    }
  };

  const renderPreview = () => {
    if (!data.file_url && !data.lampiran)
      return <Typography>Tidak ada file</Typography>;

    // const currentFileUrl = isDokumen
    //   ? `http://localhost:3000${data.file_url}`
    //   : `http://localhost:3000${data.lampiran}`;
    //const ekstensi = url.split(".").pop().toLowerCase();

    const currentFileUrl = isDokumen
      ? `${url}/${data.file_url}`
      : `${url}/${data.lampiran}`;

    const ekstensi = currentFileUrl.split(".").pop().toLowerCase();

    // 1. Jika FOTO (jpg, png, jpeg)
    if (["jpg", "jpeg", "png"].includes(ekstensi)) {
      return (
        <img
          src={url}
          alt="Preview"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      );
    }

    // 2. Jika PDF
    if (ekstensi === "pdf") {
      return (
        <embed
          src={`${url}#toolbar=0`}
          type="application/pdf"
          width="100%"
          height="100%"
        />
      );
    }

    // 3. Jika WORD (.doc, .docx)
    if (["doc", "docx"].includes(ekstensi)) {
      // Google Docs Viewer bisa merender file Word di dalam iframe
      // Catatan: Ini hanya bekerja jika server Anda sudah ONLINE/Public.
      // Jika masih localhost, tampilkan tombol download yang rapi.
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          height="100%"
          spacing={2}
          p={3}>
          <FilePresent sx={{ fontSize: 60, color: "#1e40af" }} />
          <Typography variant="body2" textAlign="center">
            Dokumen Word tidak dapat dipratinjau langsung di sistem lokal.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.open(url, "_blank")}>
            Unduh & Lihat Dokumen
          </Button>
        </Stack>
      );
    }

    return <Typography>Format file tidak didukung untuk pratinjau</Typography>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      disableScrollLock
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 100 }}
      PaperProps={{
        sx: {
          // Lebar otomatis membesar jika tipe dokumen agar PDF terlihat jelas
          width: { xs: "100%", sm: isDokumen ? 800 : 450 },
          height: "100%",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
          transition: "width 0.3s ease-in-out",
        },
      }}>
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}>
          <Typography variant="h6" fontWeight="800">
            {isDokumen
              ? "Pratinjau & Verifikasi Dokumen"
              : isPimpinan
                ? "Persetujuan Pimpinan"
                : "Verifikasi Pengajuan Cuti"}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
          <Stack spacing={3}>
            {/* --- KHUSUS DOKUMEN: Preview PDF --- */}
            {isDokumen && data.file_url && (
              <Box>
                <Typography
                  variant="caption"
                  color="primary"
                  fontWeight="800"
                  sx={{ mb: 1, display: "block" }}>
                  PRATINJAU FILE
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    height: 500,
                    bgcolor: "#f1f5f9",
                    overflow: "hidden",
                    borderRadius: 3,
                  }}>
                  {renderPreview()}
                </Paper>
                <Stack direction="row" spacing={1} mt={1}>
                  <Button
                    startIcon={<OpenInNew />}
                    onClick={() => window.open(fileUrl, "_blank")}
                    sx={{ textTransform: "none" }}>
                    Buka di Tab Baru
                  </Button>
                  <Button
                    color="secondary"
                    variant="outlined"
                    startIcon={isAiLoading ? <CircularProgress size={16} /> : <AutoAwesome />}
                    onClick={handleAnalyze}
                    disabled={isAiLoading}
                    sx={{ textTransform: "none", borderRadius: 2 }}>
                    {isAiLoading ? "Sedang Meringkas..." : "Ringkas dengan AI"}
                  </Button>
                </Stack>

                {aiSummary && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "secondary.light",
                      color: "secondary.contrastText",
                      borderRadius: 2,
                    }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <AutoAwesome fontSize="small" /> Ringkasan AI
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {aiSummary}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Profil Pegawai */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="700">
                DATA PEGAWAI
              </Typography>
              <Stack direction="row" spacing={2} mt={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "#172554",
                    fontWeight: 800,
                  }}>
                  {data.pegawai?.nama?.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight="800" variant="subtitle1">
                    {data.pegawai?.nama}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    NIP. {data.pegawai?.nip}
                  </Typography>
                </Box>
                {!isDokumen && (
                  <Button
                    color="warning"
                    variant="outlined"
                    size="small"
                    startIcon={isAnomalyLoading ? <CircularProgress size={16} /> : <AutoAwesome />}
                    onClick={handleAnalyzeAnomaly}
                    disabled={isAnomalyLoading}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    {isAnomalyLoading ? "Menganalisis..." : "Analisis Pola Cuti"}
                  </Button>
                )}
              </Stack>
              
              {!isDokumen && anomalyAnalysis && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "warning.light",
                    color: "warning.contrastText",
                    borderRadius: 2,
                  }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <AutoAwesome fontSize="small" /> Analisis Pola Cuti (AI)
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {anomalyAnalysis}
                  </Typography>
                </Paper>
              )}
            </Box>
            {isPimpinan && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label="Sudah Diverifikasi Koordinator"
                  color="success"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}

            {/* Rincian Pengajuan */}
            <Box
              sx={{
                bgcolor: "#f8fafc",
                p: 2,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
              }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="700">
                {isDokumen ? "JUDUL & KATEGORI" : "ALASAN / DESKRIPSI"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                {isDokumen
                  ? data.judul
                  : data.alasan || "Tidak ada keterangan."}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={isDokumen ? data.kategori : data.jenis_cuti}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, borderRadius: 1 }}
                />
                {isDokumen && (
                  <Chip
                    label={data.urgensi}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, borderRadius: 1 }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={4}>
              {/* Tanggal Mulai */}
              {data.tgl_mulai && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="700"
                    display="block">
                    TANGGAL MULAI
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "success.main" }}>
                    {formatDate(data.tgl_mulai)} {/* Panggil fungsi di sini */}
                  </Typography>
                </Box>
              )}

              {/* Tanggal Selesai */}
              {data.tgl_selesai && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="700"
                    display="block">
                    TANGGAL SELESAI
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "error.main" }}>
                    {formatDate(data.tgl_selesai)}{" "}
                    {/* Panggil fungsi di sini */}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Area Catatan (Koordinator / Pimpinan) */}
            {!isPimpinan ? (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight="800"
                  color="primary"
                  sx={{ ml: 0.5, mb: 1, display: "block" }}>
                  CATATAN VERIFIKASI (ANDA)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Berikan catatan teknis pengecekan..."
                  value={catatanVerifikator}
                  onChange={(e) => setCatatanVerifikator(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "#fff",
                    },
                  }}
                />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    bgcolor: "#f0fdf4",
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid #bbf7d0",
                  }}>
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight="800">
                    REKOMENDASI KOORDINATOR
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontStyle: "italic", color: "#172554" }}>
                    "{data.catatan_verif || "Tidak ada catatan."}"
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="800"
                    color="primary"
                    sx={{ ml: 0.5, mb: 1, display: "block" }}>
                    CATATAN PIMPINAN
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={catatanPimpinan}
                    onChange={(e) => setCatatanPimpinan(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        bgcolor: "#fff",
                      },
                    }}
                  />
                </Box>
              </>
            )}

            {/* Lampiran (Hanya tampil jika Cuti dan ada lampiran) */}
            {!isDokumen && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="700">
                  LAMPIRAN
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mt: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    borderRadius: 3,
                    alignItems: "center",
                  }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FilePresent
                      sx={{ color: data.lampiran ? "#172554" : "#cbd5e1" }}
                    />
                    <Typography variant="body2" fontWeight="600">
                      {data.lampiran
                        ? "Dokumen_Lampiran.pdf"
                        : "Tidak ada lampiran"}
                    </Typography>
                  </Stack>
                  {data.lampiran && (
                    <Button
                      size="small"
                      onClick={() => window.open(fileUrl, "_blank")}>
                      Buka
                    </Button>
                  )}
                </Paper>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Footer Buttons */}
        <Box sx={{ pt: 3, borderTop: "1px solid #e2e8f0", mt: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleAction("approve")}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                bgcolor: "#172554",
                "&:hover": { bgcolor: "#14532d" },
              }}>
              Setujui
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => handleAction("reject")}
              sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}>
              Tolak
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default DetailDrawer;
