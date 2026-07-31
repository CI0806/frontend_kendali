import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Grid, // Gunakan Grid2 jika MUI terbaru, atau tetap Grid sesuai setup Anda
  Typography,
  Button,
  MenuItem,
  Stack,
  colors,
  Divider,
  InputAdornment,
  Autocomplete,
  TextField as MuiTextField,
  CircularProgress,
  useTheme, // Tambahkan ini
  alpha,
  Avatar, // Tambahkan ini
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useForm, Controller } from "react-hook-form";
import {
  BeachAccessRounded,
  PersonSearchRounded,
  SendRounded,
  InfoOutlined,
  ContactPhoneRounded,
  HomeWorkRounded,
  AssignmentRounded,
} from "@mui/icons-material";
import dayjs from "dayjs";
import FileUploadWithLoading from "@/components/ui/Forms/FileUploadWIthLoading";
import PageWrapper from "@/components/ui/PageWrapper";
import services from "@/services";
import CustomDialog from "@/components/ui/CustomDialog";
import {DialogForm} from "@/components/ui/DialogForm";
import session from "@/utils/session";

const Cuti = () => {
  const theme = useTheme(); // Hook untuk deteksi mode
  const isDarkMode = theme.palette.mode === "dark";

  const [inputValue, setInputValue] = useState("");
  const [optionsAtasan, setOptionsAtasan] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(false);

  const [openReview, setOpenReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading API
  const [dataToReview, setDataToReview] = useState(null);

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      jenis_cuti: "",
      sisa_cuti: 12,
      tgl_mulai: null,
      tgl_selesai: null,
      jumlah_hari: 0,
      tgl_masuk: "",
      koordinator: null,
      alasan: "",
      alamat: "",
      phone: "",
    },
  });

  const watchMulai = watch("tgl_mulai");
  const watchSelesai = watch("tgl_selesai");

  const user = session.getUser();

  // Logika useEffect tetap sama (dipertahankan)
  useEffect(() => {
    if (dayjs(watchMulai).isValid() && dayjs(watchSelesai).isValid()) {
      const diff = dayjs(watchSelesai).diff(dayjs(watchMulai), "day") + 1;
      if (diff > 0) {
        setValue("jumlah_hari", diff);
        setValue(
          "tgl_masuk",
          dayjs(watchSelesai).add(1, "day").format("DD MMMM YYYY"),
        );
      } else {
        setValue("jumlah_hari", 0);
        setValue("tgl_masuk", "Tanggal tidak valid");
      }
    } else {
      setValue("jumlah_hari", 0);
      setValue("tgl_masuk", "");
    }
  }, [watchMulai, watchSelesai, setValue]);

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

  useEffect(() => {
    const fetchSisaCuti = async () => {
      try {
        const response = await services.pegawai.getMyProfile();
        const sisa = response.data?.data?.sisa_cuti;
        if (sisa !== undefined) setValue("sisa_cuti", sisa);
      } catch (err) {
        console.error("Gagal sinkronisasi sisa cuti:", err);
      }
    };
    fetchSisaCuti();
  }, [setValue]);


  // Fungsi saat tombol "Kirim Pengajuan" diklik
  const onSubmit = (data) => {
    if (data.jenis_cuti === "Cuti Tahunan" && data.jumlah_hari > data.sisa_cuti) {
      alert(`❌ Jatah cuti tidak mencukupi! Sisa: ${data.sisa_cuti} hari.`);
      return;
    }
    // Simpan data ke state sementara untuk ditampilkan di Dialog Review
    setDataToReview(data);
    setOpenReview(true);
  };

  // Fungsi final yang dipanggil dari dalam DialogForm
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const data = dataToReview;

    const formData = new FormData();
    formData.append("jenis_cuti", data.jenis_cuti);
    formData.append(
      "tgl_mulai",
      data.tgl_mulai ? dayjs(data.tgl_mulai).format("YYYY-MM-DD") : "",
    );
    formData.append(
      "tgl_selesai",
      data.tgl_selesai ? dayjs(data.tgl_selesai).format("YYYY-MM-DD") : "",
    );
    formData.append("jumlah_hari", data.jumlah_hari);
    formData.append("koordinator_id", data.koordinator?.id || "");
    formData.append("alasan", data.alasan || "");
    formData.append("alamat", data.alamat || "");
    formData.append("phone", data.phone || "");
    if (selectedFile) formData.append("lampiran", selectedFile);

    try {
      const response = await services.cuti.create(formData);
      if (response.data.status === "success") {
        setOpenReview(false);
        setOpenSuccess(true);
        setSelectedFile(null);
        reset();
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Terjadi kesalahan server";
      alert("❌ Gagal: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          }}>
          {/* HEADER DENGAN ICON ADAPTIF */}
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
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
              }}>
              <BeachAccessRounded sx={{ color: "white", fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight="900"
                color={theme.palette.text.primary}>
                Form Pengajuan Cuti
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Silakan lengkapi data permohonan istirahat Anda
              </Typography>
            </Box>
          </Stack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  color={
                    isDarkMode ? theme.palette.primary.light : colors.indigo[700]
                  }>
                  DETAIL JENIS & WAKTU CUTI
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="jenis_cuti"
                  control={control}
                  rules={{ required: "Jenis cuti wajib diisi" }}
                  render={({ field, fieldState }) => (
                    <MuiTextField
                      {...field}
                      select
                      label="Pilih Jenis Cuti"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}>
                      <MenuItem value="Cuti Tahunan">Cuti Tahunan</MenuItem>
                      <MenuItem value="Cuti Sakit">Cuti Sakit</MenuItem>
                      <MenuItem value="Cuti Karena Alasan Penting">
                        Cuti Karena Alasan Penting
                      </MenuItem>
                      <MenuItem value="Cuti Bersalin">Cuti Bersalin</MenuItem>
                    </MuiTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="sisa_cuti"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Sisa Kuota"
                      fullWidth
                      disabled
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">Hari</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tgl_mulai"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Mulai Cuti"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tgl_selesai"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Selesai Cuti"
                      
                      minDate={dayjs(watchMulai)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="jumlah_hari"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Durasi (Hari)"
                      fullWidth
                      
                      sx={{
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.action.disabledBackground, 0.05)
                          : colors.grey[50],
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tgl_masuk"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Tanggal Masuk Kerja"
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InfoOutlined
                              sx={{
                                mr: 1,
                                color: isDarkMode
                                  ? theme.palette.primary.main
                                  : colors.indigo[600],
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.primary.main, 0.05)
                          : colors.indigo[50],
                      }}
                    />
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
                    isDarkMode ? theme.palette.primary.light : colors.indigo[700]
                  }>
                  PENANGGUNG JAWAB & LOKASI
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="koordinator"
                  control={control}
                  rules={{ required: "Wajib memilih kabag TU" }}
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
                            }}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center">
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
                                }}>
                                {option?.nama?.charAt(0).toUpperCase() || "?"}
                              </Avatar>
                              <Stack>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: "text.primary" }}>
                                  {option?.nama || "Nama tidak terbaca"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary">
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
                          }}>
                          {children}
                        </Paper>
                      )}
                      // 6. TAMPILAN INPUT FIELD
                      renderInput={(params) => (
                        <MuiTextField
                          {...params}
                          label="Cari Kabag. Tata Usaha"
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
                  name="alasan"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Alasan Cuti"
                      fullWidth
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AssignmentRounded
                              sx={{
                                mr: 1,
                                color: theme.palette.text.disabled,
                                mt: 1,
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Controller
                  name="alamat"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Alamat Selama Cuti"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <HomeWorkRounded
                              sx={{ mr: 1, color: theme.palette.text.disabled }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <MuiTextField
                      {...field}
                      label="Nomor HP/WA"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ContactPhoneRounded
                              sx={{ mr: 1, color: theme.palette.text.disabled }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  color={
                    isDarkMode ? theme.palette.primary.light : colors.indigo[700]
                  }
                  mb={1}>
                  UNGGAH BUKTI DUKUNG
                </Typography>
                <FileUploadWithLoading
                  onUploadSuccess={(file) => setSelectedFile(file)}
                  onClear={() => setSelectedFile(null)}
                />
              </Grid>

              <Grid
                size={{ xs: 12 }}
                sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
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
                  }}>
                  Kirim Pengajuan
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <CustomDialog
          open={openSuccess}
          onClose={() => setOpenSuccess(false)}
          type="success"
          title="Berhasil Dikirim"
          subtitle="Berhasil mengirim data pengajuan cuti."
          confirmText="Ok"
          onConfirm={() => setOpenSuccess(false)}
        />

        {/* DIALOG REVIEW */}
        {dataToReview && (
          <DialogForm
            open={openReview}
            handleClose={() => setOpenReview(false)}
            onConfirm={handleConfirmSubmit}
            loading={isSubmitting}
            data={{
              nama: user?.nama, // Bisa ambil dari context/localStorage
              nama_atasan: dataToReview.koordinator?.nama,
              jenis_cuti: dataToReview.jenis_cuti,
              lama_cuti: dataToReview.jumlah_hari,
              alasan: dataToReview.alasan,
              // Tambahan jika ingin menampilkan tanggal di dialog
              periode: `${dayjs(dataToReview.tgl_mulai).format("DD MMM")} - ${dayjs(dataToReview.tgl_selesai).format("DD MMM YYYY")}`,
            }}
          />
        )}
      </LocalizationProvider>
    </PageWrapper>
  );
};

export default Cuti;
