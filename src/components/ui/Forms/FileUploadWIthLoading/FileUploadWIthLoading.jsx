import React, { useState, useEffect } from "react";
import { 
  Box, Typography, LinearProgress, Stack, colors, IconButton, Paper 
} from "@mui/material";
import { 
  CloudUploadRounded, CheckCircleRounded, InsertDriveFileRounded, CloseRounded 
} from "@mui/icons-material";

const FileUploadWithLoading = ({ onUploadSuccess, onClear, accept }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  // Fungsi Utama Proses File
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    if (onUploadSuccess) onUploadSuccess(selectedFile);
    setUploading(true);
    setProgress(0);

    // Buat Preview Gambar (Base64)
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Simulasi Progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (onClear) onClear();
  };

  return (
    <Box sx={{ width: "100%" }}>
      {!file ? (
        <Box
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            processFile(e.dataTransfer.files[0]);
          }}
          sx={{
            width: "100%", height: "120px",
            border: `2px dashed ${isDragActive ? colors.indigo[500] : colors.grey[300]}`,
            borderRadius: "16px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", cursor: "pointer",
            "&:hover": { borderColor: colors.indigo[500], bgcolor: colors.indigo[50] }
          }}
        >
          <input
            type="file"
            accept={accept} // <--- Ini sangat penting
            onChange={(e) => processFile(e.target.files[0])}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          />
          <CloudUploadRounded sx={{ fontSize: 40, color: colors.grey[400], mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Klik atau tarik file bukti di sini
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: "16px", bgcolor: colors.grey[50], position: "relative", overflow: "hidden" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* KOTAK PREVIEW */}
            <Box sx={{ 
              width: 50, height: 50, borderRadius: "8px", overflow: "hidden", 
              bgcolor: "white", border: `1px solid ${colors.grey[300]}`,
              display: "flex", alignItems: "center", justifyContent: "center" 
            }}>
              {preview ? (
                <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <InsertDriveFileRounded sx={{ color: colors.indigo[500] }} />
              )}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap fontWeight={700}>{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>
            </Box>

            {/* ACTION BUTTONS */}
            <Stack direction="row" spacing={1} alignItems="center">
              {uploading ? (
                <Typography variant="caption" fontWeight="bold" color="primary">{progress}%</Typography>
              ) : (
                <>
                  <CheckCircleRounded sx={{ color: colors.indigo[500] }} />
                  <IconButton size="small" onClick={handleRemove} color="error">
                    <CloseRounded fontSize="small" />
                  </IconButton>
                </>
              )}
            </Stack>
          </Stack>

          {/* PROGRESS BAR BAWAH */}
          {uploading && (
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4 }} 
            />
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FileUploadWithLoading;