import {
  Box,
  Button,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
  Stack,
  Divider,
  Autocomplete,
  alpha,
  TextField as BaseTextField,
  Snackbar,
  Alert,
} from "@mui/material";
import TextField from "../Forms/TextField";
import Select from "../Forms/Select";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import services from "@/services";
import { Cancel, Save } from "@mui/icons-material";

const InputDrawer = ({
  open,
  onClose,
  isEditMode,
  editData,
  setNotification,
}) => {
  const [dataList, setDataList] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  
  // Ambil data parent saat drawer dibuka
  const flattenData = (data, level = 0) => {
    let results = [];

    // PENGAMAN: Jika data kosong atau bukan array, langsung return array kosong
    if (!data || !Array.isArray(data)) return [];

    data.forEach((item) => {
      results.push({
        id: item.internal_id || item.ID, // Pastikan handle kedua kemungkinan ID
        label: "— ".repeat(level) + item.kode + " - " + item.nama,
      });

      if (item.children && item.children.length > 0) {
        const childItems = flattenData(item.children, level + 1);
        results = results.concat(childItems);
      }
    });
    return results;
  };
  // 1. Definisikan useForm TERLEBIH DAHULU
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      kode: "",
      nama: "",
      parent_id: null,
      masa_aktif: 0,
      masa_inaktif: 0,
      tindakan: "Dimusnahkan",
    },
  });

  useEffect(() => {
    const initDrawer = async () => {
      if (open) {
        // 1. Ambil data pohon terbaru untuk opsi parent
        try {
          const res = await services.klasifikasi.getTree();
          const rawData = res.data?.data || res.data || [];
          const flattened = flattenData(rawData);
          setParentOptions(flattened); // Isi opsi dulu

          // 2. Baru lakukan reset form setelah opsi tersedia
          if (isEditMode && editData) {
            reset({
              ...editData,
              // Pastikan parent_id adalah angka agar cocok dengan flattened.id
              parent_id: editData.parent_id ? Number(editData.parent_id) : null,
            });
          } else {
            reset({
              kode: "",
              nama: "",
              parent_id: null,
              masa_aktif: 0,
              masa_inaktif: 0,
              tindakan: "Musnah",
            });
          }
        } catch (err) {
          console.error("Gagal memuat opsi parent:", err);
        }
      }
    };

    initDrawer();
  }, [open, isEditMode, editData, reset]);

  // const {
  //   control,
  //   handleSubmit,
  //   reset,
  //   formState: { isSubmitting },
  // } = useForm({
  //   // Sesuaikan defaultValues dengan key yang diharapkan Model Golang kamu
  //   defaultValues: {
  //     kode: "",
  //     nama: "",
  //     parent_id: null, // Bisa dikosongkan untuk Induk Utama
  //     masa_aktif: 0,
  //     masa_inaktif: 0,
  //     tindakan: "Dimusnahkan",
  //     shared_to: [], // Jika ingin handle sharing nanti
  //   },
  // });

  const opsiTindakan = [
    { value: "Dimusnahkan", label: "Dimusnahkan" },
    { value: "Permanen", label: "Permanen" },
    { value: "Dinilai Kembali", label: "Dinilai Kembali" },
  ];

  const fetchKlasifikasiTree = async () => {
    const res = await services.klasifikasi.getTree();
    setDataList(res.data); // Update state tabel
  };

  const onSubmit = async (values) => {
    try {
      // 1. Transformasi Data
      const payload = {
        ...values,
        masa_aktif: Number(values.masa_aktif),
        masa_inaktif: Number(values.masa_inaktif),
        // Jika edit, pastikan parent_id tidak menunjuk ke diri sendiri
        parent_id: values.parent_id ? Number(values.parent_id) : null,
      };

      if (isEditMode && editData) {
        // --- LOGIKA UPDATE ---
        const id = editData.internal_id || editData.id;
        await services.klasifikasi.update(id, payload);
        setNotification({
          open: true,
          message: "Data klasifikasi berhasil diperbarui!",
          severity: "success",
        });
      } else {
        // --- LOGIKA CREATE ---
        await services.klasifikasi.create(payload);
        setNotification({
          open: true,
          message: "Data klasifikasi berhasil disimpan!",
          severity: "success",
        });
      }

      // 3. Panggil fungsi refresh dari props
      if (fetchKlasifikasiTree) {
        await fetchKlasifikasiTree(); // Memicu fetchTree di file Klasifikasi.jsx
        console.log("Fetch terbaru berhasil dipicu dari Drawer");
      }

      // 4. Cleanup
      onClose();
      reset(); // Menghapus isi form
    } catch (error) {
      console.log("Error Full:", error.response);
      alert("Gagal: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 450 },
          borderLeft: "none",
          boxShadow: -5,
        },
      }}>
      {/* Header Drawer */}
      <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h6" fontWeight="600">
          Form Klasifikasi Arsip
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Input kategori arsip berjenjang untuk mempermudah pengarsipan
        </Typography>
      </Box>

      <Box sx={{ p: 4 }}>
        <Stack spacing={3}>
          <TextField
            name="kode"
            control={control}
            fullWidth
            label="Kode Klasifikasi"
            placeholder="Contoh: 800"
          />

          <TextField
            name="nama"
            control={control}
            fullWidth
            label="Nama Klasifikasi"
            placeholder="Contoh: Kepegawaian"
          />

          {/* IMPLEMENTASI AUTOCOMPLETE */}
          <Controller
            name="parent_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                options={parentOptions}
                // Gunakan .label karena sudah kita format dengan prefix "──" di flattenData
                getOptionLabel={(option) => option.label || ""}
                // Memastikan perbandingan ID benar (penting agar label tidak hilang)
                isOptionEqualToValue={(option, val) => {
                  const compareId = typeof val === "object" ? val?.id : val;
                  return option.id === compareId;
                }}
                // Saat dipilih, kirim ID-nya saja ke Form
                onChange={(_, data) => {
                  const idToSave = data ? data.id : null;
                  console.log("ID yang dipilih untuk Parent:", idToSave); // Cek di console
                  onChange(idToSave);
                }}
                // Ambil objek utuh dari list berdasarkan ID yang tersimpan di state
                value={parentOptions.find((opt) => opt.id === value) || null}
                renderInput={(params) => (
                  <BaseTextField
                    {...params}
                    label="Sub Kategori Dari"
                    placeholder="Ketik kode atau nama..."
                  />
                )}
              />
            )}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              name="masa_aktif"
              control={control}
              label="Aktif (Thn)"
              type="number"
              fullWidth
            />
            <TextField
              name="masa_inaktif"
              control={control}
              label="Inaktif (Thn)"
              type="number"
              fullWidth
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel shrink id="label-tindakan">
              Tindakan Akhir
            </InputLabel>
            <Select
              labelId="label-tindakan" // Harus sama dengan ID InputLabel
              name="tindakan"
              control={control}
              label="Tindakan Akhir" // Penting: Ini yang membuat garis outline terputus (notch)
              notched={true} // Memaksa outline memberikan ruang untuk label
              options={opsiTindakan}
              MenuProps={{
                disablePortal: true,
                PaperProps: {
                  sx: { zIndex: (theme) => theme.zIndex.drawer + 2 },
                },
              }}></Select>
          </FormControl>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Save />}
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)} // Trigger Submit
            sx={{ py: 1.5, borderRadius: 2, fontWeight: "600" }}>
            {isSubmitting ? "Menyimpan..." : "Simpan Data"}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Cancel />}
            onClick={onClose}
            sx={{ py: 1.5, borderRadius: 2 }}>
            Batal
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default InputDrawer;
