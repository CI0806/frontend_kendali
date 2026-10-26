import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Close,
  OpenInNew,
  GetApp,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  RotateRight,
  RestartAlt,
  PictureAsPdf,
  Description,
  Image as ImageIcon,
  TableChart,
  Slideshow,
  InsertDriveFile,
  InfoOutlined,
  DownloadDone,
} from "@mui/icons-material";
import { url as API_BASE_URL } from "@/utils/constants";
import { handleDownload } from "@/utils/download";

// Helper untuk format ukuran berkas
const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || Number(bytes) === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper normalisasi URL berkas
export const getCleanDocumentUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "";
  const str = String(pathOrUrl).trim().replace(/\\/g, "/");
  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("blob:") ||
    str.startsWith("data:")
  ) {
    return str;
  }
  const cleanRelative = str.replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanRelative}`;
};

// Helper deteksi tipe berkas
export const detectFileType = (file, fileUrl) => {
  let ext = "";
  if (file?.file_type) {
    ext = String(file.file_type).toLowerCase().replace(/^\./, "");
  } else if (fileUrl) {
    const clean = fileUrl.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    if (parts.length > 1) {
      ext = parts.pop().toLowerCase();
    }
  }

  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["txt", "log", "json", "md"].includes(ext)) return "text";
  return "other";
};

const DocumentPreviewModal = ({
  open,
  onClose,
  file, // Bisa object arsip atau string URL
  title: customTitle,
  onCustomDownload,
}) => {
  const theme = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState("");
  const [tryCloudViewer, setTryCloudViewer] = useState(false);

  // Ambil path dan bangun URL lengkap
  const rawPath =
    typeof file === "string"
      ? file
      : file?.file_path || file?.file_url || file?.lampiran || "";
  const documentUrl = getCleanDocumentUrl(rawPath);
  const fileType = detectFileType(file, documentUrl);

  const fileName =
    file?.file_name ||
    rawPath.split("/").pop() ||
    file?.perihal ||
    "Dokumen";
  const displayTitle = customTitle || file?.perihal || fileName;
  const fileSize = file?.file_size ? formatFileSize(file.file_size) : null;
  const nomorArsip = file?.nomor_arsip || null;

  // Reset state saat modal dibuka/ganti dokumen
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setLoadError(false);
      setZoom(1);
      setRotation(0);
      setTextContent("");
      setTryCloudViewer(false);

      // Jika format teks, ambil isinya
      if (fileType === "text" && documentUrl) {
        fetch(documentUrl)
          .then((res) => {
            if (!res.ok) throw new Error("Gagal mengambil teks");
            return res.text();
          })
          .then((text) => {
            setTextContent(text);
            setIsLoading(false);
          })
          .catch(() => {
            setLoadError(true);
            setIsLoading(false);
          });
      }
    }
  }, [open, documentUrl, fileType]);

  const handleDownloadFile = () => {
    if (onCustomDownload) {
      onCustomDownload(file);
      return;
    }
    if (file?.internal_id) {
      handleDownload(
        `${API_BASE_URL}/api/v1/arsip/${file.internal_id}/download`,
        file.perihal || fileName,
      );
    } else if (documentUrl) {
      handleDownload(documentUrl, fileName);
    }
  };

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetImage = () => {
    setZoom(1);
    setRotation(0);
  };

  // Badge konfigurasi tipe berkas
  const getTypeBadge = () => {
    switch (fileType) {
      case "pdf":
        return {
          label: "PDF Document",
          color: "error",
          icon: <PictureAsPdf fontSize="small" />,
        };
      case "image":
        return {
          label: "Gambar",
          color: "success",
          icon: <ImageIcon fontSize="small" />,
        };
      case "word":
        return {
          label: "Microsoft Word",
          color: "primary",
          icon: <Description fontSize="small" />,
        };
      case "excel":
        return {
          label: "Excel / Spreadsheet",
          color: "success",
          icon: <TableChart fontSize="small" />,
        };
      case "ppt":
        return {
          label: "PowerPoint",
          color: "warning",
          icon: <Slideshow fontSize="small" />,
        };
      default:
        return {
          label: "Berkas Dokumen",
          color: "default",
          icon: <InsertDriveFile fontSize="small" />,
        };
    }
  };

  const badge = getTypeBadge();

  // Render Konten Pratinjau berdasarkan Format
  const renderPreviewContent = () => {
    if (!documentUrl) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          height="100%"
          spacing={2}
          p={4}>
          <InsertDriveFile sx={{ fontSize: 72, color: "text.disabled" }} />
          <Typography variant="h6" color="textSecondary">
            File tidak ditemukan atau belum diunggah.
          </Typography>
        </Stack>
      );
    }

    // 1. PDF PREVIEW (Native Browser Embed via iframe)
    if (fileType === "pdf") {
      return (
        <Box sx={{ position: "relative", width: "100%", height: "100%", bgcolor: "#525659" }}>
          {isLoading && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                bgcolor: "background.paper",
              }}>
              <CircularProgress size={44} />
              <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                Memuat pratinjau PDF...
              </Typography>
            </Stack>
          )}

          <iframe
            src={`${documentUrl}#toolbar=1&navpanes=1`}
            title={displayTitle}
            width="100%"
            height="100%"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
            style={{
              border: "none",
              display: "block",
              width: "100%",
              height: "100%",
            }}
          />

          {loadError && (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              p={4}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "background.paper",
                zIndex: 3,
              }}>
              <PictureAsPdf sx={{ fontSize: 64, color: "error.main" }} />
              <Typography variant="h6" fontWeight={700}>
                Pratinjau PDF Tidak Dapat Dimuat Langsung
              </Typography>
              <Typography variant="body2" color="textSecondary" textAlign="center" maxWidth={450}>
                Browser Anda mungkin memblokir tampilan PDF tersemat atau file memerlukan otorisasi.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleDownloadFile}>
                  Unduh PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNew />}
                  onClick={handleOpenInNewTab}>
                  Buka di Tab Baru
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      );
    }

    // 2. IMAGE PREVIEW
    if (fileType === "image") {
      return (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            bgcolor: theme.palette.mode === "dark" ? "#0f172a" : "#1e293b",
            p: 2,
          }}>
          {isLoading && (
            <CircularProgress
              size={44}
              sx={{ color: "white", position: "absolute" }}
            />
          )}

          <img
            src={documentUrl}
            alt={displayTitle}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
            style={{
              maxWidth: zoom <= 1 ? "100%" : "none",
              maxHeight: zoom <= 1 ? "100%" : "none",
              objectFit: "contain",
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
          />

          {/* Floating Controls for Image */}
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: 5,
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: "blur(12px)",
              border: `1px solid ${theme.palette.divider}`,
              zIndex: 10,
            }}>
            <Tooltip title="Perkecil (-)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}>
                  <ZoomOut fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 42, textAlign: "center", fontWeight: 700 }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Perbesar (+)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}>
                  <ZoomIn fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Tooltip title="Putar 90°">
              <IconButton size="small" onClick={handleRotate}>
                <RotateRight fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton size="small" onClick={handleResetImage}>
                <RestartAlt fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>

          {loadError && (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              p={4}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "background.paper",
                zIndex: 3,
              }}>
              <ImageIcon sx={{ fontSize: 64, color: "error.main" }} />
              <Typography variant="h6" fontWeight={700}>
                Gagal Memuat Gambar
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Gambar tidak dapat ditampilkan atau tautan telah kedaluwarsa.
              </Typography>
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={handleDownloadFile}>
                Unduh Gambar
              </Button>
            </Stack>
          )}
        </Box>
      );
    }

    // 3. WORD / EXCEL / PPT (OFFICE DOCUMENTS)
    if (fileType === "word" || fileType === "excel" || fileType === "ppt") {
      const isWord = fileType === "word";
      const isExcel = fileType === "excel";
      const officeColor = isWord
        ? "#2563eb"
        : isExcel
          ? "#16a34a"
          : "#ea580c";
      const OfficeIcon = isWord
        ? Description
        : isExcel
          ? TableChart
          : Slideshow;

      // Opsi Cloud Viewer (Google Docs Viewer) jika diaktifkan user
      if (tryCloudViewer) {
        return (
          <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
              title={displayTitle}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => setTryCloudViewer(false)}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bgcolor: "background.paper",
              }}>
              Kembali ke Menu Unduh
            </Button>
          </Box>
        );
      }

      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          height="100%"
          spacing={3}
          p={4}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(officeColor, 0.05)
                : alpha(officeColor, 0.03),
          }}>
          <Box
            sx={{
              p: 3,
              borderRadius: "50%",
              bgcolor: alpha(officeColor, 0.12),
              color: officeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 24px ${alpha(officeColor, 0.2)}`,
            }}>
            <OfficeIcon sx={{ fontSize: 64 }} />
          </Box>

          <Box textAlign="center" maxWidth={540}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              {displayTitle}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
              Dokumen ini berformat{" "}
              <strong>
                {fileType === "word"
                  ? "Microsoft Word (.doc/.docx)"
                  : fileType === "excel"
                    ? "Excel Spreadsheet (.xlsx/.xls)"
                    : "PowerPoint (.pptx/.ppt)"}
              </strong>
              .
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              File dokumen dapat diunduh untuk diedit langsung menggunakan aplikasi
              pengolah kata (Microsoft Office / WPS / LibreOffice) di perangkat Anda.
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              width: "100%",
              maxWidth: 480,
              bgcolor: "background.paper",
            }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="textSecondary">
                  Nama Berkas
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{
                    maxWidth: 280,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                  {fileName}
                </Typography>
              </Stack>
              {fileSize && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary">
                    Ukuran File
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {fileSize}
                  </Typography>
                </Stack>
              )}
              {nomorArsip && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary">
                    Nomor Arsip
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {nomorArsip}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GetApp />}
              onClick={handleDownloadFile}
              sx={{
                bgcolor: officeColor,
                "&:hover": { bgcolor: alpha(officeColor, 0.85) },
                px: 3,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: "none",
              }}>
              Unduh Berkas Sekarang
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<OpenInNew />}
              onClick={handleOpenInNewTab}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
              }}>
              Buka di Tab Baru
            </Button>
            {documentUrl.startsWith("http") && !documentUrl.includes("localhost") && (
              <Button
                variant="text"
                size="large"
                onClick={() => setTryCloudViewer(true)}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}>
                Coba Google Docs Viewer
              </Button>
            )}
          </Stack>
        </Stack>
      );
    }

    // 4. TEXT FILE PREVIEW
    if (fileType === "text") {
      return (
        <Box sx={{ p: 3, height: "100%", overflow: "auto", bgcolor: "background.default" }}>
          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" height="100%">
              <CircularProgress size={36} />
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                fontFamily: "monospace",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f8fafc",
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}>
              {textContent || "Konten berkas kosong."}
            </Paper>
          )}
        </Box>
      );
    }

    // 5. OTHER / UNKNOWN FORMATS
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        height="100%"
        spacing={3}
        p={4}>
        <InsertDriveFile sx={{ fontSize: 72, color: "primary.main" }} />
        <Box textAlign="center" maxWidth={450}>
          <Typography variant="h6" fontWeight={700}>
            {displayTitle}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Format berkas ini tidak dapat dipratinjau secara langsung di browser.
            Silakan unduh untuk membukanya dengan aplikasi terkait di komputer Anda.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleDownloadFile}
            sx={{ borderRadius: 2.5, textTransform: "none" }}>
            Unduh Berkas
          </Button>
          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            onClick={handleOpenInNewTab}
            sx={{ borderRadius: 2.5, textTransform: "none" }}>
            Buka Link File
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          height: isFullscreen ? "100vh" : "90vh",
          maxHeight: isFullscreen ? "100vh" : "90vh",
          borderRadius: isFullscreen ? 0 : "18px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.25s ease-in-out",
        },
      }}>
      {/* Header Dialog */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1, pr: 2 }}>
          <Chip
            size="small"
            icon={badge.icon}
            label={badge.label}
            color={badge.color}
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: "8px" }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
              sx={{
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                color: "text.primary",
              }}>
              {displayTitle}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {nomorArsip && (
                <Typography variant="caption" color="textSecondary">
                  No: {nomorArsip}
                </Typography>
              )}
              {fileSize && (
                <Typography variant="caption" color="textSecondary">
                  • {fileSize}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Toolbar Aksi Header */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Buka di Tab Baru">
            <IconButton onClick={handleOpenInNewTab} size="small" color="primary">
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Unduh Berkas">
            <IconButton onClick={handleDownloadFile} size="small" color="primary">
              <GetApp fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}>
            <IconButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              size="small">
              {isFullscreen ? (
                <FullscreenExit fontSize="small" />
              ) : (
                <Fullscreen fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Tutup">
            <IconButton onClick={onClose} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      {/* Content Dialog */}
      <DialogContent
        sx={{
          p: 0,
          m: 0,
          flex: 1,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "#f8fafc",
        }}>
        {renderPreviewContent()}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
