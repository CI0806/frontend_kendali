import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  colors,
  IconButton
} from "@mui/material";
import { 
  CheckCircleRounded, 
  ErrorRounded, 
  InfoRounded, 
  CloseRounded,
  WarningRounded 
} from "@mui/icons-material";

const CustomDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  subtitle, 
  type = "success", // success, error, warning, info
  confirmText = "Oke",
  showCancel = false
}) => {

  // Konfigurasi Warna & Icon berdasarkan tipe
  const config = {
    success: { icon: <CheckCircleRounded sx={{ fontSize: 60, color: colors.indigo[500] }} />, color: colors.indigo[600] },
    error: { icon: <ErrorRounded sx={{ fontSize: 60, color: colors.red[500] }} />, color: colors.red[600] },
    warning: { icon: <WarningRounded sx={{ fontSize: 60, color: colors.orange[500] }} />, color: colors.orange[600] },
    info: { icon: <InfoRounded sx={{ fontSize: 60, color: colors.indigo[500] }} />, color: colors.indigo[600] },
  };

  const currentConfig = config[type] || config.success;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: "24px", p: 2, maxWidth: "400px", textAlign: "center" }
      }}
    >
      {/* Tombol Close di Pojok */}
      <IconButton 
        onClick={onClose} 
        sx={{ position: "absolute", right: 16, top: 16, color: colors.grey[400] }}
      >
        <CloseRounded />
      </IconButton>

      <DialogContent>
        <Stack alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Box sx={{ mb: 1 }}>{currentConfig.icon}</Box>
          <Typography variant="h6" fontWeight="900">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3, gap: 1 }}>
        {showCancel && (
          <Button 
            onClick={onClose} 
            fullWidth
            variant="outlined" 
            sx={{ borderRadius: "12px", py: 1.2, fontWeight: "bold", color: colors.grey[600], borderColor: colors.grey[300] }}
          >
            Batal
          </Button>
        )}
        <Button 
          onClick={onConfirm || onClose} 
          fullWidth
          variant="contained" 
          sx={{ 
            borderRadius: "12px", 
            py: 1.2, 
            fontWeight: "bold", 
            bgcolor: currentConfig.color,
            "&:hover": { bgcolor: currentConfig.color }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;