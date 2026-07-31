import React, { useEffect, useState } from "react";
import {
  Paper,
  Grid,
  Typography,
  Button,
  MenuItem,
  Stack,
  colors,
  Divider,
  Box,
  TextField as MuiTextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  useTheme, // Tambahkan ini
  alpha,
  Avatar, // Tambahkan ini
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useForm, Controller } from "react-hook-form";
import {
  DescriptionRounded,
  SendRounded,
  AccountTreeRounded,
  AssignmentTurnedInRounded,
  HistoryEduRounded,
  ShortTextRounded,
  ErrorOutlineRounded,
  PersonSearchRounded,
} from "@mui/icons-material";
import FileUploadWithLoading from "@/components/ui/Forms/FileUploadWIthLoading";
import PageWrapper from "@/components/ui/PageWrapper";
import services from "@/services";
import CustomDialog from "@/components/ui/CustomDialog";
import session from "@/utils/session";
import DialogFormDokumen from "@/components/ui/DialogForm/DialogFormDokumen";
import ModalGenerateSOP from "@/components/ui/ModalGenerateSOP";
import { AutoAwesome } from "@mui/icons-material";

const Dokumen = () => {
  const theme = useTheme(); // Inisialisasi theme
  const isDarkMode = theme.palette.mode === "dark";

  const [inputValue, setInputValue] = useState("");
  const [optionsAtasan, setOptionsAtasan] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(false);

  const [openReview, setOpenReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading API
  const [dataToReview, setDataToReview] = useState(null);
  const [openAI, setOpenAI] = useState(false);

  const [isPolishing, setIsPolishing] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues } = useForm({
    defaultValues: {
      judul_pengajuan: "",
      jenis_dokumen: "",
      klaster: "",
      tingkat_urgensi: "Normal",
      koordinator: "",
      pesan_pengaju: "",
    },
  });

  // --- Logika useEffect dan onSubmit tetap sama ---
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

  const onSubmit = async (data) => {
    if (!selectedFile) {
      alert("File belum dipilih atau belum selesai diunggah!");
      return;
    }
    // Simpan data ke state sementara untuk ditampilkan di Dialog Review
    setDataToReview(data);
    setOpenReview(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const data = dataToReview;
    const formData = new FormData();
    formData.append("judul_pengajuan", data.judul_pengajuan);
    formData.append("jenis_dokumen", data.jenis_dokumen);
    formData.append("klaster", data.klaster);
    formData.append("tingkat_urgensi", data.tingkat_urgensi);
    formData.append("pesan_pengaju", data.pesan_pengaju);
    formData.append("koordinator_id", data.koordinator?.id || "");
    formData.append("lampiran", selectedFile);

    try {
      const response = await services.dokumen.create(formData);
      if (response.status === 201 || response.status === 200) {
        setOpenReview(false);
        setOpenSuccess(true);
        reset();
        setSelectedFile(null);
        setInputValue("");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Sesi habis, silakan login kembali");
      }
      console.error("Error submit:", error);
    }
  };

  const handlePolishText = async () => {
    const currentText = getValues("pesan_pengaju");
    if (!currentText || currentText.trim() === "") {
      alert("Catatan masih kosong. Tulis sesuatu terlebih dahulu.");
      return;
    }

    setIsPolishing(true);
    try {
      const res = await services.ai.polishText({ text: currentText });
      if (res.data && res.data.success) {
        setValue("pesan_pengaju", res.data.data);
      }
    } catch (err) {
      alert(
        "Gagal memoles bahasa: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setIsPolishing(false);
    }
  };

  const user = session.getUser();

  return (
    <PageWrapper>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "24px",
            border: `1px solid ${theme.palette.divider}`, // Adaptif divider
            background: isDarkMode
              ? `linear-gradient(to bottom, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${theme.palette.background.paper} 300px)`
              : `linear-gradient(to bottom, ${colors.indigo[50]} 0%, #ffffff 250px)`,
            transition: "background 0.3s ease",
          }}
        >
          {/* HEADER */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={4}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  bgcolor: isDarkMode
                    ? theme.palette.primary.main
                    : colors.indigo[600],
                  p: 1.5,
                  borderRadius: "16px",
                  display: "flex",
                  boxShadow: isDarkMode
                    ? `0 8px 20px ${alpha(theme.palette.common.black, 0.5)}`
                    : `0 8px 16px -4px ${colors.indigo[200]}`,
                }}
              >
                <DescriptionRounded sx={{ color: "white", fontSize: 32 }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="900"
                  color={theme.palette.text.primary}
                >
                  Pengajuan Review Dokumen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kirim draf berkas untuk proses verifikasi atasan
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesome />}
              onClick={() => setOpenAI(true)}
              sx={{
                borderRadius: "12px",
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              ✨ Buat SOP dengan AI
            </Button>
          </Stack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  color={
                    isDarkMode
                      ? theme.palette.primary.light
                      : colors.indigo[700]
                  }
                >
                  INFORMASI DOKUMEN
                </Typography>
              </Grid>

              {/* Input Fields (MuiTextField secara otomatis adaptif dengan theme) */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="judul_pengajuan"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Judul Dokumen / Nama Proyek"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <AssignmentTurnedInRounded
                            sx={{ mr: 1, color: theme.palette.text.disabled }}
                          />
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="jenis_dokumen"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      select
                      label="Kategori Dokumen"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <HistoryEduRounded
                            sx={{ mr: 1, color: theme.palette.text.disabled }}
                          />
                        ),
                      }}
                    >
                      <MenuItem value="SOP">Draf SOP</MenuItem>
                      <MenuItem value="SK">Draf SK</MenuItem>
                      <MenuItem value="MOU">Dokumen Kerjasama (MoU)</MenuItem>
                    </MuiTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tingkat_urgensi"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      select
                      label="Tingkat Urgensi"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <ErrorOutlineRounded
                            sx={{ mr: 1, color: theme.palette.text.disabled }}
                          />
                        ),
                      }}
                    >
                      <MenuItem value="Normal">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              bgcolor: colors.indigo[500],
                              borderRadius: "50%",
                            }}
                          />
                          <Typography variant="body2">Normal</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="Penting">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              bgcolor: colors.orange[500],
                              borderRadius: "50%",
                            }}
                          />
                          <Typography variant="body2">
                            Penting / Segera
                          </Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="Mendesak">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              bgcolor: colors.red[500],
                              borderRadius: "50%",
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            Mendesak (Prioritas)
                          </Typography>
                        </Stack>
                      </MenuItem>
                    </MuiTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="klaster"
                  control={control}
                  rules={{ required: "Klaster harus dipilih" }}
                  render={({ field, fieldState: { error } }) => (
                    <MuiTextField
                      {...field}
                      select
                      label="Klaster"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        startAdornment: (
                          <AccountTreeRounded
                            sx={{ mr: 1, color: theme.palette.text.disabled }}
                          />
                        ),
                      }}
                    >
                      <MenuItem value="Klaster 1">Klaster 1</MenuItem>
                      <MenuItem value="Klaster 2">Klaster 2</MenuItem>
                      <MenuItem value="Klaster 3">Klaster 3</MenuItem>
                      <MenuItem value="Klaster 4">Klaster 4</MenuItem>
                      <MenuItem value="Lintas Klaster">Lintas Klaster</MenuItem>
                    </MuiTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  color={
                    isDarkMode
                      ? theme.palette.primary.light
                      : colors.indigo[700]
                  }
                >
                  TUJUAN PEMERIKSAAN
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="koordinator"
                  control={control}
                  rules={{ required: "Wajib memilih koordinator" }}
                  render={({ field: { onChange, value }, fieldState }) => (
                    <Autocomplete
                      // 1. DATA & STATE
                      options={optionsAtasan}
                      loading={loadingSearch}
                      value={value || null} // Pastikan null jika tidak ada value
                      inputValue={inputValue}
                      // 2. LOGIKA PENCARIAN & LABEL
                      // getOptionLabel menentukan apa yang tertulis di kotak input setelah dipilih
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option?.nama || "";
                      }}
                      // isOptionEqualToValue mencegah peringatan 'mismatch' antara value dan options
                      isOptionEqualToValue={(option, val) =>
                        option?.id === val?.id
                      }
                      filterOptions={(x) => x} // Karena filter sudah dilakukan di sisi API (useEffect)
                      autoComplete
                      includeInputInList
                      filterSelectedOptions
                      // 3. EVENT HANDLERS
                      onInputChange={(_, newInputValue) =>
                        setInputValue(newInputValue)
                      }
                      onChange={(_, newValue) => {
                        // Logika agar opsi yang dipilih tetap muncul di list meskipun keyword dihapus
                        if (
                          newValue &&
                          !optionsAtasan.some((o) => o.id === newValue.id)
                        ) {
                          setOptionsAtasan([newValue, ...optionsAtasan]);
                        }
                        onChange(newValue);
                      }}
                      // 4. TAMPILAN LIST ITEM (DROPDOWN)
                      renderOption={(props, option) => {
                        // Kita ekstrak key dari props untuk kestabilan render
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            component="li"
                            key={option?.id || key}
                            {...optionProps}
                            sx={{
                              borderRadius: "8px",
                              m: "4px 8px !important",
                              transition: "all 0.2s",
                              "&:hover": {
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.05,
                                ),
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.1,
                                  ),
                                  color: theme.palette.primary.main,
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                }}
                              >
                                {option?.nama?.charAt(0).toUpperCase() || "?"}
                              </Avatar>
                              <Stack>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: "text.primary" }}
                                >
                                  {option?.nama || "Nama tidak terbaca"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option?.jabatan || "Koordinator"} •{" "}
                                  {option?.nip || "NIP tidak tersedia"}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      }}
                      // 5. TAMPILAN CONTAINER (PAPER)
                      PaperComponent={({ children }) => (
                        <Paper
                          elevation={8}
                          sx={{
                            borderRadius: "16px",
                            mt: 1,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                          }}
                        >
                          {children}
                        </Paper>
                      )}
                      // 6. TAMPILAN INPUT FIELD
                      renderInput={(params) => (
                        <MuiTextField
                          {...params}
                          label="Cari Atasan / Koordinator"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          placeholder="Ketik minimal 3 huruf..."
                          // sx={{
                          //   "& .MuiOutlinedInput-root": {
                          //     borderRadius: "12px",
                          //     transition: "all 0.3s ease",
                          //     "&.Mui-focused fieldset": { borderWidth: "2px" },
                          //   },
                          // }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonSearchRounded
                                  sx={{
                                    ml: 1,
                                    color: fieldState.error
                                      ? theme.palette.error.main
                                      : isDarkMode
                                        ? theme.palette.primary.main
                                        : theme.palette.success.main,
                                  }}
                                />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <React.Fragment>
                                {loadingSearch ? (
                                  <CircularProgress color="primary" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="pesan_pengaju"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ position: "relative" }}>
                      <MuiTextField
                        {...field}
                        label="Catatan Tambahan"
                        fullWidth
                        multiline
                        rows={3}
                        InputProps={{
                          startAdornment: (
                            <ShortTextRounded
                              sx={{
                                mr: 1,
                                color: theme.palette.text.disabled,
                                mt: 1,
                              }}
                            />
                          ),
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={handlePolishText}
                        disabled={isPolishing}
                        startIcon={isPolishing ? <CircularProgress size={16} /> : <AutoAwesome />}
                        sx={{
                          position: "absolute",
                          bottom: 12,
                          right: 12,
                          borderRadius: "8px",
                          textTransform: "none",
                          bgcolor: isDarkMode ? alpha(theme.palette.secondary.main, 0.1) : "white",
                          "&:hover": {
                            bgcolor: isDarkMode ? alpha(theme.palette.secondary.main, 0.2) : alpha(theme.palette.secondary.main, 0.05),
                          }
                        }}
                      >
                        {isPolishing ? "Memoles..." : "Poles Bahasa AI"}
                      </Button>
                    </Box>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  color={
                    isDarkMode
                      ? theme.palette.primary.light
                      : colors.indigo[700]
                  }
                  mb={1}
                >
                  UNGGAH DRAF BERKAS (DOC/DOCX)
                </Typography>
                <FileUploadWithLoading
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onUploadSuccess={(file) => {
                    const fileExtension = file.name
                      .split(".")
                      .pop()
                      .toLowerCase();
                    if (fileExtension !== "doc" && fileExtension !== "docx") {
                      alert("Hanya file .doc dan .docx yang diperbolehkan!");
                      setSelectedFile(null);
                      return;
                    }
                    setSelectedFile(file);
                  }}
                  onClear={() => setSelectedFile(null)}
                />
              </Grid>

              <Grid
                size={{ xs: 12 }}
                sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  startIcon={<SendRounded />}
                  sx={{
                    borderRadius: "14px",
                    px: 6,
                    py: 2,
                    bgcolor: isDarkMode
                      ? theme.palette.primary.main
                      : colors.indigo[700],
                    fontWeight: "bold",
                    boxShadow: isDarkMode
                      ? `0 8px 24px -6px ${alpha(theme.palette.common.black, 0.6)}`
                      : `0 8px 24px -6px ${colors.indigo[400]}`,
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? theme.palette.primary.dark
                        : colors.indigo[800],
                      boxShadow: "none",
                    },
                  }}
                >
                  Kirim Dokumen
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        <CustomDialog
          open={openSuccess}
          onClose={() => setOpenSuccess(false)}
          type="success"
          title="Dokumen Terkirim"
          subtitle="Draf Anda telah berhasil dikirim ke Koordinator untuk diperiksa."
          confirmText="Oke"
          onConfirm={() => setOpenSuccess(false)}
        />

        {/* DIALOG REVIEW */}
        {dataToReview && (
          <DialogFormDokumen
            open={openReview}
            handleClose={() => setOpenReview(false)}
            onConfirm={handleConfirmSubmit}
            loading={isSubmitting}
            data={{
              nama: user?.nama, // Bisa ambil dari context/localStorage
              nama_atasan: dataToReview.koordinator?.nama,
              judul_pengajuan: dataToReview.judul_pengajuan,
              jenis_dokumen: dataToReview.jenis_dokumen,
              tingkat_urgensi: dataToReview.tingkat_urgensi,
              klaster: dataToReview.klaster,
              pesan_pengaju: dataToReview.pesan_pengaju,
            }}
          />
        )}

        <ModalGenerateSOP open={openAI} handleClose={() => setOpenAI(false)} />
      </LocalizationProvider>
    </PageWrapper>
  );
};

export default Dokumen;
