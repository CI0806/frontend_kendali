import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TextField as MuiTextField,
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Button,
  Stack,
  Breadcrumbs,
  Link,
  Drawer,
  Divider,
  Alert,
  Snackbar,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  useTheme,
  alpha,
  colors,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Folder,
  InsertDriveFile,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Visibility,
  Search,
  Edit,
  Close as CloseIcon,
  Close,
  GetApp,
  DeleteOutline,
  GridView,
  ViewList,
  InfoOutlined,
  CloudUpload,
  CreateNewFolder,
  Archive,
  History,
  Monitor,
  Block,
  Refresh,
  FolderOff,
  Warning,
  DriveFileMove,
  DeleteForever,
  MenuBook,
  KeyboardArrowLeft, // Icon baru untuk button upload
  AutoAwesome,
} from "@mui/icons-material";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import ReactDiffViewer from "react-diff-viewer-continued";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { jwtDecode } from "jwt-decode";
import session from "@/utils/session";
import services from "@/services";
import TextField from "@/components/ui/Forms/TextField";
import { handleDownload } from "@/utils/download";
import { url } from "@/utils/constants";

const flattenTree = (nodes) => {
  let result = [];
  if (!nodes || !Array.isArray(nodes)) return result;
  nodes.forEach((node) => {
    result.push(node);
    const anakAnak = node.children || node.Children;
    if (anakAnak && anakAnak.length > 0) {
      result = [...result, ...flattenTree(anakAnak)];
    }
  });
  return result;
};

const getFullPath = (node, allNodes) => {
  if (!node) return "";
  const currentName =
    node.nama_ruang ||
    node.nama_rak ||
    (node.nomor_box ? `Box ${node.nomor_box}` : null) ||
    "Tanpa Nama";
  const pId = node.parent_id || node.ParentID;
  if (!pId || Number(pId) === 0) return currentName;
  const parent = allNodes.find((n) => String(n.internal_id) === String(pId));
  if (parent) return `${getFullPath(parent, allNodes)} > ${currentName}`;
  return currentName;
};

const flattenKlasifikasi = (nodes) => {
  let flat = [];
  nodes.forEach((node) => {
    flat.push(node);
    if (node.children && node.children.length > 0) {
      flat = [...flat, ...flattenKlasifikasi(node.children)];
    }
  });
  return flat;
};

const calculateRetention = (tglArsip, masaAktif, masaInaktif) => {
  if (!tglArsip) return null;
  const mAktif = parseInt(masaAktif) || 0;
  const mInaktif = parseInt(masaInaktif) || 0;
  if (mAktif === 0 && mInaktif === 0) return { isPermanent: true };
  const start = new Date(tglArsip);
  if (isNaN(start.getTime())) return null;
  const dateToInactive = new Date(start);
  dateToInactive.setFullYear(start.getFullYear() + mAktif);
  const dateToFinal = new Date(dateToInactive);
  dateToFinal.setFullYear(dateToInactive.getFullYear() + mInaktif);
  const today = new Date();
  return {
    tglInactive: dateToInactive,
    tglFinal: dateToFinal,
    isExpiredActive: today > dateToInactive,
    isExpiredInactive: today > dateToFinal,
    isPermanent: false,
  };
};

const getRetentionStatus = (file) => {
  if (!file.tgl_arsip || !file.klasifikasi?.masa_aktif) return { isExpired: false };
  const start = new Date(file.tgl_arsip);
  const mAktif = parseInt(file.klasifikasi.masa_aktif) || 0;
  const dateToInactive = new Date(start);
  dateToInactive.setFullYear(start.getFullYear() + mAktif);
  const today = new Date();
  const diffTime = dateToInactive - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    isExpired: today > dateToInactive,
    daysLeft: diffDays,
    dateToInactive,
  };
};

const FolderTree = ({
  item,
  onSelect,
  selectedId,
  onDropToFolder,
  countsMap,
  onRightClick,
}) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.internal_id;

  const totalCount = countsMap ? countsMap[item.internal_id] || 0 : 0;

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <>
      <ListItemButton
        onClick={() => onSelect(item)}
        onContextMenu={(e) => {
          if (onRightClick) {
            e.preventDefault();
            e.stopPropagation();
            onRightClick(e, item);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          // Menggunakan palette action hover atau primary dengan opacity agar adaptif
          e.currentTarget.style.backgroundColor = isDark
            ? theme.palette.primary.dark
            : theme.palette.primary.light;
          e.currentTarget.style.opacity = "0.7";
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.opacity = "1";
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.opacity = "1";
          //console.log("Dropping ke Folder ID:", item.internal_id);
          onDropToFolder(e, item.internal_id);
        }}
        selected={isSelected}
        sx={{
          pl: (item.level || 0) * 2 + 2,
          borderRadius: 2,
          mb: 0.5,
          mx: 1,
          // Menangani warna saat selected secara otomatis
          "&.Mui-selected": {
            backgroundColor: isDark ? "rgba(25, 118, 210, 0.16)" : "#e3f2fd",
            "&:hover": {
              backgroundColor: isDark ? "rgba(25, 118, 210, 0.24)" : "#d1e9ff",
            },
          },
        }}>
        <ListItemIcon
          sx={{
            minWidth: 32,
            // Menggunakan warna primary tema jika selected
            color: isSelected ? theme.palette.primary.main : "inherit",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}>
          {hasChildren ? (
            open ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowRight fontSize="small" />
            )
          ) : (
            <Box sx={{ width: 20 }} />
          )}
          <Folder fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={item.kode}
          primaryTypographyProps={{
            variant: "body2",
            sx: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              // Memastikan teks tetap kontras
              color: isSelected ? theme.palette.primary.main : "text.primary",
              fontWeight: isSelected ? 600 : 400,
            },
          }}
        />

        {/* Tombol Edit Langsung */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onRightClick) onRightClick(e, item);
          }}
          sx={{
            padding: "2px",
            mr: 0.5,
            color: isSelected ? theme.palette.primary.main : "text.secondary",
            opacity: 0.5,
            "&:hover": { opacity: 1 },
          }}>
          <Edit sx={{ fontSize: 14 }} />
        </IconButton>

        {totalCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: isSelected
                ? "white"
                : alpha(theme.palette.primary.main, 0.1),
              color: isSelected ? theme.palette.primary.main : "primary.main",
              px: 0.8,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "10px",
              ml: 1,
            }}>
            {totalCount}
          </Typography>
        )}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <FolderTree
                key={child.internal_id}
                item={{ ...child, level: (item.level || 0) + 1 }}
                onSelect={onSelect}
                selectedId={selectedId}
                onDropToFolder={onDropToFolder}
                countsMap={countsMap} // TERUSKAN KE SINI
                onRightClick={onRightClick}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Arsip = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [viewMode, setViewMode] = useState("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [isFolderUploading, setIsFolderUploading] = useState(false);
  const [folderProgress, setFolderProgress] = useState({ current: 0, total: 0, step: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isEditingLokasi, setIsEditingLokasi] = useState(false);
  const [lokasiValue, setLokasiValue] = useState("");
  const [loadingLokasi, setLoadingLokasi] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchFile, setSearchFile] = useState("");
  const [listLokasi, setListLokasi] = useState([]);
  const [statusFilter, setStatusFilter] = useState("aktif");
  const [selectedFileIds, setSelectedFileIds] = useState([]); // Menyimpan ID file yang dicentang
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Untuk loading state
  const [tempIdsToDelete, setTempIdsToDelete] = useState([]);
  const [showRetentionAlert, setShowRetentionAlert] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const versionInputRef = useRef(null);

  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerDocs, setDocViewerDocs] = useState([]);

  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffOldText, setDiffOldText] = useState("");
  const [diffNewText, setDiffNewText] = useState("");

  const [folderContextMenu, setFolderContextMenu] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderData, setRenameFolderData] = useState({ id: null, nama: "", kode: "" });
  const [isRenaming, setIsRenaming] = useState(false);

  // AI States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Deteksi HP
  const [mobileOpen, setMobileOpen] = useState(false); // Drawer Folder untuk HP

  const [countsData, setCountsData] = useState([]);

  const [adminNips, setAdminNips] = useState([]);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    lokasi: null, // Berisi internal_id lokasi
    klasifikasi: null, // Berisi internal_id klasifikasi
  });

  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [aiSearchIds, setAiSearchIds] = useState([]);

  // State untuk Session User
  const [user, setUser] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  const { control } = useForm();
  const toggleSelectFile = (id) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === visibleFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(visibleFiles.map((f) => f.internal_id || f.ID));
    }
  };

  const loadLokasi = async () => {
    setLoadingLokasi(true);
    try {
      const res = await services.lokasi.getall("?limit=1000");

      // 1. Ambil data tree dari backend (yang isinya Puskesmas -> Children)
      const treeData = res.data?.data || res.data || [];

      // 2. Bongkar Tree menjadi List Datar menggunakan fungsi flattenTree
      // (Pastikan fungsi flattenTree sudah kamu definisikan di atas)
      const flatData = flattenTree(treeData);

      //console.log("Data setelah dibongkar (Flatten):", flatData);

      // 3. Simpan data yang sudah datar ke state
      setListLokasi(flatData);
    } catch (err) {
      //console.error("Gagal load lokasi:", err);
      setListLokasi([]);
    } finally {
      setLoadingLokasi(false);
    }
  };

  const loadTree = async () => {
    try {
      const res = await services.klasifikasi.getTree();
      setTreeData(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFiles = async (folderId) => {
    if (!folderId) return;

    setIsLoading(true); // Sekarang ini tidak akan error lagi
    try {
      const res = await services.arsip.getByKlasifikasi(folderId);
      setFileList(res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat berkas:", err);
      setToast({
        open: true,
        message: "Gagal memuat daftar berkas",
        severity: "error",
      });
    } finally {
      setIsLoading(false); // Mematikan indikator loading
    }
  };

  const loadAdminList = async () => {
    try {
      // Kita panggil dengan limit besar agar semua admin terambil
      const res = await services.pegawai.allpegawai({ page: 1, limit: 1000 });

      // Sesuai kode Golang Anda, data user ada di dalam 'users' (atau res.data)
      // Mari kita buat pengecekan yang aman:
      const rawData = Array.isArray(res.data) ? res.data : res.data?.data || [];

      if (Array.isArray(rawData)) {
        const nips = rawData
          .filter((p) => {
            // Sesuaikan dengan nama field role di struct models.User Anda
            const role = String(p.role || "").toLowerCase();
            return role === "admin" || role === "superadmin";
          })
          .map((p) => String(p.nip).trim());

        setAdminNips(nips);
        return nips;
      }
    } catch (err) {
      console.error("Gagal mengambil daftar admin:", err);
    }
    return [];
  };

  const isInitialized = useRef(false);
  const folderInputRef = useRef(null);

  const loadData = async (folderId, nipsOverride) => {
    setIsLoading(true);
    try {
      const res = await services.arsip.getall(folderId);
      if (res.data) {
        const currentUser = session.getUser();
        const myNip = String(currentUser?.nip || "").trim();
        const myRole = String(currentUser?.role || "").toLowerCase();
        const nips = nipsOverride !== undefined ? nipsOverride : adminNips;

        const filteredData = res.data.filter((file) => {
          if (myRole === "admin" || myRole === "superadmin") return true;
          const creatorNip = String(file.created_by || "").trim();
          const isMine = creatorNip !== "" && creatorNip === myNip;
          const isUploadedByAdmin =
            nips.includes(creatorNip) || creatorNip === "admin";
          const shareString = `PEGAWAI:${myNip}`;
          const folderIsSharedToMe =
            !!file.klasifikasi?.shared_to?.includes(shareString);
          return isMine || (folderIsSharedToMe && isUploadedByAdmin);
        });

        setFileList(filteredData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = session.getToken();
      if (token) {
        try {
          setUser(jwtDecode(token));
        } catch (e) {
          console.error("Token tidak valid", e);
        }
      }
      const [nips] = await Promise.all([
        loadAdminList(),
        loadTree(),
        loadLokasi(),
      ]);
      await loadData(null, nips ?? []);
      isInitialized.current = true;
    };
    init();
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;
    loadData(selectedFolder?.internal_id || null);
  }, [selectedFolder]);

  const getBadgeCount = (folderId) => {
    const currentUser = session.getUser();
    const myNip = String(currentUser?.nip || "").trim();
    const myRole = String(currentUser?.role || "").toLowerCase();

    return countsData.filter((file) => {
      // 1. Cek apakah file berada di folder ini
      const isInFolder = Number(file.klasifikasi_id) === Number(folderId);
      if (!isInFolder) return false;

      // 2. Jika saya Admin, saya bisa lihat semua di folder ini
      if (myRole === "admin" || myRole === "superadmin") return true;

      // 3. Logika Akses User Biasa/Koordinator
      const creatorNip = String(file.created_by || "").trim();
      const isMine = creatorNip !== "" && creatorNip === myNip;

      // Cek apakah pengunggah adalah salah satu admin (dari state adminNips)
      const isUploadedByAdmin =
        adminNips.includes(creatorNip) || creatorNip === "admin";

      // Cek apakah folder dishare ke saya
      const isShared = file.klasifikasi?.shared_to?.includes(
        `PEGAWAI:${myNip}`,
      );

      // Aturan: Milik sendiri ATAU (Folder Share DAN yang upload Admin)
      return isMine || (isShared && isUploadedByAdmin);
    }).length;
  };

  const fetchAllForCounts = async () => {
    try {
      const res = await services.arsip.getall();
      // Di service Anda, data biasanya langsung di res.data
      if (res && res.data) {
        setCountsData(res.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data hitungan", err);
    }
  };

  useEffect(() => {
    fetchAllForCounts();
  }, []);

  const handleDeletePermanen = async () => {
    if (isDeleting) return;

    // LOGIKA BARU:
    // 1. Cek tempIdsToDelete (untuk hapus satuan via drawer)
    // 2. Jika kosong, cek selectedFileIds (untuk hapus massal via bar biru)
    const idsToDelete =
      tempIdsToDelete.length > 0 ? tempIdsToDelete : selectedFileIds;

    //console.log("Data yang akan dieksekusi:", idsToDelete);

    if (!idsToDelete || idsToDelete.length === 0) {
      setToast({
        open: true,
        msg: "Tidak ada berkas yang dipilih untuk dihapus",
        severity: "warning",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Kirim ke backend
      await services.arsip.delete({ ids: idsToDelete });

      setOpenConfirmDelete(false);
      loadFiles(selectedFolder.internal_id);

      // Bersihkan centang checkbox
      setSelectedFileIds((prev) =>
        prev.filter((id) => !idsToDelete.includes(id)),
      );

      // Reset temporary state
      setTempIdsToDelete([]);

      setToast({
        open: true,
        msg: `${idsToDelete.length} Berkas Berhasil Dihapus`,
        severity: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        msg: error.response?.data?.message || "Gagal menghapus arsip",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteSingle = (id) => {
    setTempIdsToDelete([id]);
    setOpenConfirmDelete(true);
  };

  // Gunakan ini untuk tombol Bar Biru (Massal)
  const openDeleteBulk = () => {
    setTempIdsToDelete([]); // Kosongkan temp agar dia beralih mengambil dari selectedFileIds
    setOpenConfirmDelete(true);
  };
  // Actions
  const handleUpdateFile = async (data) => {
    try {
      const id = selectedFile.internal_id || selectedFile.ID;

      // Kirim ke Backend
      await services.arsip.update(id, data);

      if (data.status) {
        setDetailsOpen(false);
        setSelectedFile(null);
      }

      // Refresh data
      loadFiles(selectedFolder.internal_id);

      // Update State di Frontend agar UI sinkron
      setFileList((prev) =>
        prev.map((f) => {
          const currentId = f.internal_id || f.ID;
          return currentId === id ? { ...f, ...data } : f;
        }),
      );

      // Update detail yang sedang dibuka
      setSelectedFile((prev) => ({ ...prev, ...data }));

      // Jika kita sedang mengubah status, tutup drawer agar user bisa lihat file berpindah tab
      if (data.status) {
        setDetailsOpen(false);
        setToast({
          open: true,
          msg: `Berkas dipindahkan ke tab ${data.status.toUpperCase()}`,
          severity: "success",
        });
      } else {
        setToast({ open: true, msg: "Data diperbarui!", severity: "success" });
      }
    } catch (err) {
      setToast({
        open: true,
        msg: "Gagal memperbarui data",
        severity: "error",
      });
    }
  };

  // Di Frontend (Arsip.jsx)
  const handleFolderRightClick = (e, folder) => {
    e.preventDefault();
    setFolderContextMenu({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
      folder: folder
    });
  };

  const closeFolderContextMenu = () => {
    setFolderContextMenu(null);
  };

  const openRenameFolderDialog = () => {
    if (folderContextMenu?.folder) {
      setRenameFolderData({
        id: folderContextMenu.folder.internal_id || folderContextMenu.folder.ID,
        nama: folderContextMenu.folder.nama,
        kode: folderContextMenu.folder.kode,
        folder: folderContextMenu.folder
      });
      setRenameDialogOpen(true);
    }
    closeFolderContextMenu();
  };

  const handleRenameFolderSubmit = async () => {
    if (!renameFolderData.nama.trim() || !renameFolderData.kode.trim()) {
      setToast({ open: true, msg: "Kode dan Nama folder tidak boleh kosong", severity: "error" });
      return;
    }
    try {
      setIsRenaming(true);
      await services.klasifikasi.update(renameFolderData.id, {
        ...renameFolderData.folder,
        kode: renameFolderData.kode,
        nama: renameFolderData.nama
      });
      setToast({ open: true, msg: "Nama folder berhasil diubah", severity: "success" });
      setRenameDialogOpen(false);
      loadTree(); // Refresh folder list
    } catch (err) {
      setToast({ open: true, msg: "Gagal mengubah nama folder", severity: "error" });
    } finally {
      setIsRenaming(false);
    }
  };

  const openVersionHistory = async () => {
    try {
      const res = await services.arsip.getVersions(selectedFile.internal_id || selectedFile.ID);
      setVersions(res.data?.data || []);
      setVersionModalOpen(true);
    } catch (err) {
      setToast({ open: true, msg: "Gagal memuat riwayat versi", severity: "error" });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAiLoading(true);
    setAiModalOpen(true);
    setAiResult("");
    try {
      const id = selectedFile.internal_id || selectedFile.ID;
      const res = await services.arsip.analyze(id);
      setAiResult(res.data?.data || "Tidak ada hasil");
    } catch (err) {
      setAiResult("Gagal menganalisis dokumen: " + (err.response?.data?.message || err.message));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!filters.search || filters.search.trim() === "") {
      setToast({ open: true, msg: "Masukkan kata kunci pencarian terlebih dahulu", severity: "warning" });
      return;
    }
    
    setIsAiSearching(true);
    try {
      const res = await services.ai.semanticSearch({ query: filters.search });
      if (res.data && res.data.success) {
        setAiSearchIds(res.data.data || []);
        setAiSearchActive(true);
        if (res.data.data.length === 0) {
          setToast({ open: true, msg: "Tidak ada arsip yang cocok secara semantik", severity: "info" });
        } else {
          setToast({ open: true, msg: "Menampilkan hasil pencarian cerdas AI", severity: "success" });
        }
      }
    } catch (err) {
      setToast({ open: true, msg: "Gagal menggunakan fitur pencarian AI", severity: "error" });
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleUploadNewVersion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setIsUploading(true);
      await services.arsip.uploadVersion(selectedFile.internal_id || selectedFile.ID, formData);
      await openVersionHistory();
      loadFiles(selectedFolder?.internal_id);
      setToast({ open: true, msg: "Versi baru berhasil diunggah!", severity: "success" });
    } catch (err) {
      setToast({ open: true, msg: "Gagal mengunggah versi baru", severity: "error" });
    } finally {
      setIsUploading(false);
      if (versionInputRef.current) versionInputRef.current.value = "";
    }
  };

  const handleDropToFolder = async (e, targetFolderId) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData("fileIds");
    if (!rawData || !targetFolderId) return;

    const idsToMove = JSON.parse(rawData);

    try {
      setIsUploading(true);

      // 1. Jalankan update ke backend
      const promises = idsToMove.map((id) =>
        services.arsip.update(id, {
          klasifikasi_id: Number(targetFolderId),
        }),
      );
      await Promise.all(promises);

      // 2. UPDATE STATE LOKAL (Penting agar data tidak hilang dari layar)
      // Kita ubah klasifikasi_id file-file tersebut di dalam state fileList
      setFileList((prevList) =>
        prevList.map((file) => {
          const currentId = file.internal_id || file.ID;
          if (idsToMove.includes(currentId)) {
            return { ...file, klasifikasi_id: Number(targetFolderId) };
          }
          return file;
        }),
      );

      setToast({
        open: true,
        msg: `${idsToMove.length} Berkas berhasil dipindahkan!`,
        severity: "success",
      });

      // 3. Reset seleksi
      setSelectedFileIds([]);
      getTotalFileCountRecursive();
      // 4. Opsional: Jika ingin sinkron total dengan backend
      // pastikan loadData() dipanggil untuk mengambil state terbaru
      // await loadData();
    } catch (err) {
      console.error("Gagal memindahkan berkas:", err);
      setToast({
        open: true,
        msg: "Gagal memindahkan berkas",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMoveFiles = async (targetFolderId) => {
    if (!selectedFileIds.length || !targetFolderId) return;

    try {
      setIsUploading(true);

      // 1. Proses Update di Backend
      const promises = selectedFileIds.map((id) =>
        services.arsip.update(id, {
          klasifikasi_id: Number(targetFolderId),
        }),
      );
      await Promise.all(promises);

      // 2. REFRESH DATA (Inilah yang membuat badge update tanpa refresh halaman)
      // Kita panggil kedua fungsi ini dan TUNGGU (await) sampai selesai
      await Promise.all([
        fetchAllForCounts(), // Update angka badge
        loadData(selectedFolder?.internal_id || null), // Update list file di folder aktif
      ]);

      setToast({
        open: true,
        msg: `${selectedFileIds.length} Berkas berhasil dipindahkan!`,
        severity: "success",
      });

      // 3. Reset State & Tutup Dialog
      setSelectedFileIds([]);
      setMoveDialogOpen(false);
    } catch (err) {
      console.error("Gagal memindahkan berkas:", err);
      setToast({
        open: true,
        msg: "Gagal memindahkan berkas",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFolderUpload = async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = "";

    if (!files.length) return;

    if (!selectedFolder) {
      setToast({ open: true, msg: "Pilih folder klasifikasi terlebih dahulu!", severity: "warning" });
      return;
    }

    setIsFolderUploading(true);

    try {
      // 1. Kumpulkan semua sub-folder unik
      // webkitRelativePath format: "NamaFolder/SubFolder/file.pdf"
      const folderSet = new Set();
      files.forEach((file) => {
        const parts = file.webkitRelativePath.split("/");
        for (let i = 1; i <= parts.length - 1; i++) {
          folderSet.add(parts.slice(0, i).join("/"));
        }
      });

      // 2. Urutkan dari yang paling dangkal ke dalam
      const folderPaths = Array.from(folderSet).sort(
        (a, b) => a.split("/").length - b.split("/").length,
      );

      setFolderProgress({
        current: 0,
        total: folderPaths.length + files.length,
        step: "Membuat struktur folder...",
      });

      // 3. Buat klasifikasi untuk setiap folder
      const pathToId = {}; // "FolderA/SubB" → internal_id

      for (let i = 0; i < folderPaths.length; i++) {
        const path = folderPaths[i];
        const parts = path.split("/");
        const folderName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join("/");
        const rawParentId = parentPath
          ? pathToId[parentPath]
          : selectedFolder.internal_id;

        const parentId = rawParentId ? Number(rawParentId) : null;

        if (!parentId) {
          throw new Error(
            `Gagal mendapat parent untuk folder "${folderName}". Pastikan klasifikasi parent sudah berhasil dibuat.`,
          );
        }

        // Kode: alfanumerik, max 20 char, unik per sesi upload
        const sanitized = folderName
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 12);
        const kode = `${sanitized || "F"}${i + 1}`;

        const res = await services.klasifikasi.create({
          kode,
          nama: folderName,
          parent_id: parentId,
          masa_aktif: 0,
          masa_inaktif: 0,
          tindakan: "Dimusnahkan",
        });

        console.log(`[Upload Folder] Klasifikasi "${folderName}" response:`, res.data);

        const newId =
          res.data?.data?.internal_id ||
          res.data?.internal_id ||
          res.data?.data?.ID ||
          res.data?.ID;

        if (!newId) {
          throw new Error(
            `Backend tidak mengembalikan ID untuk folder "${folderName}". Cek console untuk detail.`,
          );
        }

        pathToId[path] = newId;
        setFolderProgress((prev) => ({ ...prev, current: i + 1 }));
      }

      // 4. Upload setiap file ke klasifikasi yang sesuai
      setFolderProgress((prev) => ({ ...prev, step: "Mengunggah berkas..." }));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parts = file.webkitRelativePath.split("/");
        const folderPath = parts.slice(0, -1).join("/");
        const klasifikasiId =
          pathToId[folderPath] || selectedFolder.internal_id;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("perihal", parts[parts.length - 1].split(".")[0]);
        formData.append("klasifikasi_id", String(klasifikasiId));
        formData.append("tgl_arsip", new Date().toISOString().split("T")[0]);
        formData.append("status", "aktif");

        await services.arsip.create(formData);

        setFolderProgress((prev) => ({
          ...prev,
          current: folderPaths.length + i + 1,
        }));
      }

      // 5. Refresh tree + data
      await Promise.all([loadTree(), fetchAllForCounts()]);
      loadData(selectedFolder.internal_id);

      setToast({
        open: true,
        msg: `Berhasil mengimpor ${files.length} berkas dari ${folderPaths.length} folder!`,
        severity: "success",
      });
    } catch (err) {
      console.error("Gagal upload folder:", err);
      console.error("[Upload Folder] Backend response:", err.response?.data);
      setToast({
        open: true,
        msg:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengimpor folder",
        severity: "error",
      });
    } finally {
      setIsFolderUploading(false);
      setFolderProgress({ current: 0, total: 0, step: "" });
    }
  };

  const handleBack = () => {
  if (selectedFolder && selectedFolder.parent_id) {
    // Cari data folder parent dari flatKlasifikasi
    const parentFolder = flatKlasifikasi.find(
      (f) => Number(f.internal_id) === Number(selectedFolder.parent_id)
    );
    if (parentFolder) {
      setSelectedFolder(parentFolder);
    } else {
      setSelectedFolder(null); // Jika tidak ketemu, kembali ke Root
    }
  } else {
    setSelectedFolder(null); // Jika di level 1, kembali ke Root
  }
};

  const onDrop = async (acceptedFiles) => {
    if (!selectedFolder)
      return setToast({
        open: true,
        msg: "Pilih folder dulu!",
        severity: "warning",
      });

    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        // 1. Pastikan key "file" sama dengan c.FormFile("file") di Go
        formData.append("file", file);

        // 2. Pastikan field lain adalah string
        formData.append("perihal", file.name.split(".")[0]);
        formData.append("klasifikasi_id", String(selectedFolder.internal_id));
        formData.append("tgl_arsip", new Date().toISOString().split("T")[0]);
        formData.append("status", "aktif");

        // 3. Kirim satu per satu (lebih aman untuk debugging)
        await services.arsip.create(formData);
      }

      loadFiles(selectedFolder.internal_id);
      setToast({ open: true, msg: "Upload berhasil!", severity: "success" });
    } catch (err) {
      console.error("Detail Error:", err);
      setToast({
        open: true,
        msg: "Network Error: Server mati atau File terlalu besar",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentUser = session.getUser();
  const myNip = String(currentUser?.nip || "");
  const myRole = String(currentUser?.role || "").toLowerCase();

  const accessibleFiles = useMemo(() => {
    if (!fileList || fileList.length === 0) return [];

    // const currentUser = session.getUser();
    // const myNip = String(currentUser?.nip || "");
    // const myRole = String(currentUser?.role || "").toLowerCase();

    if (myRole === "admin" || myRole === "pimpinan") return fileList;

    return fileList.filter((f) => {
      const isMine = String(f.created_by) === myNip;

      // LOGIKA BARU: Jika NIP saya ada di dalam daftar shared_to folder ini, izinkan lihat
      const isSharedToMe = f.klasifikasi?.shared_to?.includes(
        `PEGAWAI:${myNip}`,
      );

      return isMine || isSharedToMe;
    });
  }, [fileList]);

  const getFolderFileCount = (folderId, allFolders, allFiles) => {
    // 1. Cari semua ID folder yang merupakan turunan dari folder ini (rekursif)
    const getAllChildFolderIds = (id) => {
      let ids = [id];
      const children = allFolders.filter((f) => f.parent_id === id);
      children.forEach((child) => {
        ids = [...ids, ...getAllChildFolderIds(child.internal_id)];
      });
      return ids;
    };

    const folderIdsToCount = getAllChildFolderIds(folderId);

    // 2. Hitung semua file yang klasifikasi_id-nya ada dalam daftar folderIdsToCount
    return allFiles.filter((file) =>
      folderIdsToCount.includes(file.klasifikasi_id),
    ).length;
  };

  const getRecursiveCount = (folder, allFiles) => {
    // Hitung file di folder saat ini
    let count = allFiles.filter(
      (file) => file.klasifikasi_id === folder.internal_id,
    ).length;

    // Jika punya anak, hitung file di setiap anak secara rekursif
    if (folder.children && folder.children.length > 0) {
      folder.children.forEach((child) => {
        count += getRecursiveCount(child, allFiles);
      });
    }
    return count;
  };

  const visibleFiles = useMemo(() => {
    // 1. Identifikasi apakah user sedang melakukan filter
    const isFiltering =
      (filters.search && filters.search.trim() !== "") ||
      filters.lokasi !== null ||
      filters.klasifikasi !== null;

    // 2. Tentukan Data Sumber: Gunakan accessibleFiles agar hak akses (admin/nip) tetap terjaga
    let sourceData = accessibleFiles;

    if (showRetentionAlert) {
      return sourceData.filter((file) => {
        const status = getRetentionStatus(file);
        // Hanya tampilkan yang sudah expired tapi statusnya masih 'aktif'
        return (
          status.isExpired && (file.status || "aktif").toLowerCase() === "aktif"
        );
      });
    }

    if (isFiltering) {
      if (aiSearchActive && aiSearchIds.length > 0) {
        // --- MODE SEMANTIC SEARCH AI ---
        // Kita filter hanya id yang ada di aiSearchIds,
        // dan kita urutkan sesuai urutan dari AI (paling relevan di awal)
        const matchedFiles = sourceData.filter(f => aiSearchIds.includes(f.internal_id || f.ID));
        
        return matchedFiles.sort((a, b) => {
          const idxA = aiSearchIds.indexOf(a.internal_id || a.ID);
          const idxB = aiSearchIds.indexOf(b.internal_id || b.ID);
          return idxA - idxB;
        });
      } else if (aiSearchActive && aiSearchIds.length === 0) {
        // AI mencari tapi tidak ada hasil
        return [];
      } else {
        // --- MODE PENCARIAN GLOBAL biasa ---
        return sourceData.filter((file) => {
          const matchSearch =
            !filters.search ||
            file.perihal?.toLowerCase().includes(filters.search.toLowerCase());

          const matchLokasi =
            !filters.lokasi || String(file.lokasi_id) === String(filters.lokasi);

          const matchKlasifikasi =
            !filters.klasifikasi ||
            String(file.klasifikasi_id) === String(filters.klasifikasi);

          return matchSearch && matchLokasi && matchKlasifikasi;
        });
      }
    }

    // --- MODE NAVIGASI FOLDER (Default) ---
    const currentFolderId = selectedFolder?.internal_id || null;
    return sourceData.filter((file) => {
      // Tampilkan hanya file yang berada di folder (atau root) yang sedang dibuka
      const matchFolder = file.klasifikasi_id === currentFolderId;
      // Tetap filter berdasarkan Tab (Aktif/Inaktif)
      const matchStatus =
        (file.status || "aktif").toLowerCase() === statusFilter.toLowerCase();

      return matchFolder && matchStatus;
    });
  }, [
    accessibleFiles,
    filters,
    selectedFolder,
    statusFilter,
    showRetentionAlert,
  ]);

  const { getRootProps, getInputProps, open } = useDropzone({
    noClick: true, // Dropzone hanya aktif saat drag & drop, atau via button custom
    onDrop,
  });

  const filesInCurrentFolder = useMemo(() => {
    const currentFolderId = selectedFolder?.internal_id || null;
    return accessibleFiles.filter((f) => f.klasifikasi_id === currentFolderId);
  }, [accessibleFiles, selectedFolder]);

  // Hitung Badge berdasarkan file di folder tersebut
  const countAktif = useMemo(() => {
    return filesInCurrentFolder.filter(
      (f) => (f.status || "aktif").toLowerCase() === "aktif",
    ).length;
  }, [filesInCurrentFolder]);

  const countInaktif = useMemo(() => {
    return filesInCurrentFolder.filter(
      (f) => (f.status || "").toLowerCase() === "inaktif",
    ).length;
  }, [filesInCurrentFolder]);

  const currentSubFolders = useMemo(() => {
    if (!selectedFolder) return treeData;
    const findNode = (nodes) => {
      const sId = selectedFolder.internal_id || selectedFolder.ID;
      for (const node of nodes) {
        const nId = node.internal_id || node.ID;
        if (String(nId) === String(sId)) return node;
        if (node.children?.length) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const freshFolder = findNode(treeData);
    return freshFolder?.children || selectedFolder.children || [];
  }, [selectedFolder, treeData]);

  const breadcrumbs = useMemo(() => {
    const path = [];
    const findPath = (nodes, targetId) => {
      for (const node of nodes) {
        const nId = node.internal_id || node.ID;
        if (String(nId) === String(targetId)) {
          path.push(node);
          return true;
        }
        if (node.children && findPath(node.children, targetId)) {
          path.unshift(node);
          return true;
        }
      }
      return false;
    };
    if (selectedFolder) findPath(treeData, selectedFolder.internal_id || selectedFolder.ID);
    return path;
  }, [treeData, selectedFolder]);

  // UPDATE selectedFolder object reference when treeData changes (e.g. after rename)
  useEffect(() => {
    if (selectedFolder && treeData && treeData.length > 0) {
      const sId = selectedFolder.internal_id || selectedFolder.ID;
      const findNode = (nodes, targetId) => {
        for (const node of nodes) {
          const nId = node.internal_id || node.ID;
          if (String(nId) === String(targetId)) return node;
          if (node.children?.length) {
            const found = findNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const freshFolder = findNode(treeData, sId);
      // Hanya perbarui jika objek berbeda (misal, karena namanya berubah di server)
      if (freshFolder && freshFolder !== selectedFolder) {
        setSelectedFolder(freshFolder);
      }
    }
  }, [treeData]);

  const expiredCount = useMemo(
    () =>
      accessibleFiles.filter(
        (f) =>
          getRetentionStatus(f).isExpired &&
          (f.status || "aktif") === "aktif",
      ).length,
    [accessibleFiles],
  );

  const flatKlasifikasi = useMemo(
    () => flattenKlasifikasi(treeData),
    [treeData],
  );

  const lokasiMap = useMemo(() => {
    const map = new Map();
    listLokasi.forEach((l) => map.set(Number(l.internal_id), l));
    return map;
  }, [listLokasi]);

  const lokasiPathCache = useMemo(() => {
    const cache = new Map();
    listLokasi.forEach((l) => {
      cache.set(Number(l.internal_id), getFullPath(l, listLokasi));
    });
    return cache;
  }, [listLokasi]);

  const getTotalFileCountRecursive = (folderId) => {
    // 1. Ambil jumlah file di folder ini saja (menggunakan logika filter admin/share yang sudah kita buat)
    let total = getBadgeCount(folderId);

    // 2. Cari semua folder yang merupakan "anak" dari folder ini
    const children = flatKlasifikasi.filter(
      (item) => Number(item.parent_id) === Number(folderId),
    );

    // 3. Lakukan rekursi ke bawah (anak-anaknya)
    children.forEach((child) => {
      total += getTotalFileCountRecursive(child.internal_id);
    });

    return total;
  };

  const folderCountsMap = useMemo(() => {
    const counts = {};
    flatKlasifikasi.forEach((folder) => {
      // Kita panggil fungsi rekursif yang sudah Anda buat di sini
      counts[folder.internal_id] = getTotalFileCountRecursive(
        folder.internal_id,
      );
    });
    return counts;
  }, [countsData, flatKlasifikasi, adminNips]);

  // Hitung jumlah aktif dan inaktif dari seluruh data yang ada di folder tersebut
  // const countAktif = fileList.filter(
  //   (f) => (f.status || f.Status || "aktif").toLowerCase() === "aktif",
  // ).length;
  // const countInaktif = fileList.filter(
  //   (f) => (f.status || f.Status || "").toLowerCase() === "inaktif",
  // ).length;

  return (
    <Box
      {...getRootProps()}
      sx={{
        display: "flex",
        alignItems: "flex-start", // PENTING: Agar sidebar tidak dipaksa stretching ke bawah
        minHeight: "100vh",
        bgcolor: isDark ? "background.default" : "#f8fafc",
        gap: 1, // Beri sedikit jarak antar sidebar dan konten
      }}>
      <input {...getInputProps()} />
      {isMobile ? (
        // TAMPILAN SIDEBAR UNTUK HP (DRAWER)
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }} // Performa lebih baik di mobile
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
              borderRadius: "0 24px 24px 0",
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.9)
                : "#ffffff",
            },
          }}>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: "#5f6368" }}>
              STRUKTUR FOLDER
            </Typography>
            <List>
              {treeData.map((root) => (
                <FolderTree
                  key={root.internal_id}
                  item={root}
                  onSelect={(folder) => {
                    setSelectedFolder(folder);
                    setMobileOpen(false); // Tutup drawer setelah pilih folder di HP
                  }}
                  selectedId={selectedFolder?.internal_id}
                  onDropToFolder={handleDropToFolder}
                  countsMap={folderCountsMap}
                  onRightClick={handleFolderRightClick}
                />
              ))}
            </List>
          </Box>
        </Drawer>
      ) : (
        // TAMPILAN SIDEBAR UNTUK DESKTOP (KODE ASLI ANDA)
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            mb: 2,
            ml: 2,
            width: 260,
            borderRadius: "24px",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 20,
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha("#ffffff", 0.7),
            backdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.08)}`,
            boxShadow: isDark
              ? `0 8px 32px 0 ${alpha("#000000", 0.4)}`
              : `0 8px 32px 0 ${alpha(theme.palette.grey[500], 0.15)}`,
          }}>
          <Typography
            variant="overline"
            sx={{ p: 2, fontWeight: 700, color: "#5f6368" }}>
            STRUKTUR FOLDER
          </Typography>
          <List>
            {treeData.map((root) => (
              <FolderTree
                key={root.internal_id}
                item={root}
                onSelect={setSelectedFolder}
                selectedId={selectedFolder?.internal_id}
                onDropToFolder={handleDropToFolder}
                countsMap={folderCountsMap}
                onRightClick={handleFolderRightClick}
              />
            ))}
          </List>
        </Paper>
      )}

      {/* --- AREA KONTEN UTAMA --- */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          p: { xs: 1, sm: 2, md: 3 },
        }}>
        {/* TOMBOL MENU (Hanya muncul di HP) */}
        {isMobile && (
          <Button
            variant="contained"
            startIcon={<MenuBook />}
            onClick={() => setMobileOpen(true)}
            sx={{ mb: 2, borderRadius: "12px", alignSelf: "flex-start" }}>
            Folder
          </Button>
        )}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "400px",
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* MAIN CONTENT WRAPPER (Satu bingkai besar yang melengkung) */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : "#ffffff",
            borderRadius: "24px", // Kelengkungan menyeluruh
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: isDark ? "none" : "0 10px 40px -10px rgba(0,0,0,0.05)",
            overflow: "hidden", // Memastikan isi (header/list) tidak keluar dari lengkungan
          }}>
          {/* --- 1. TOP HEADER TOOLBAR --- */}
          <Box
            sx={{
              p: 2,
              px: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: alpha(
                isDark ? theme.palette.background.paper : "#fff",
                0.8,
              ),
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ flexGrow: 1 }}>
                {selectedFolder && (
    <Button
      variant="outlined"
      startIcon={<KeyboardArrowLeft />}
      onClick={handleBack}
      size="small"
      sx={{ borderRadius: 2 }}
    >
      Kembali
    </Button>
  )}
              <Breadcrumbs separator={<KeyboardArrowRight fontSize="small" />}>
                <Link
                  component="button"
                  underline="hover"
                  color="inherit"
                  sx={{
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "none",
                    bg: "transparent",
                    p: 0,
                  }}
                  onClick={() => {
                    setSelectedFolder(null);
                    //setFileList([]);
                  }}>
                  Root
                </Link>
                {breadcrumbs.map((folder, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return isLast ? (
                    <Typography
                      key={folder.internal_id}
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "primary.main",
                      }}>
                      {folder.kode}
                    </Typography>
                  ) : (
                    <Link
                      key={folder.internal_id}
                      component="button"
                      underline="hover"
                      color="inherit"
                      sx={{
                        cursor: "pointer",
                        fontSize: 14,
                        border: "none",
                        bg: "transparent",
                        p: 0,
                      }}
                      onClick={() => setSelectedFolder(folder)}>
                      {folder.kode}
                    </Link>
                  );
                })}
              </Breadcrumbs>

              <Tooltip
                title={!selectedFolder ? "Pilih folder terlebih dahulu" : ""}>
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUpload />}
                    onClick={open}
                    disabled={!selectedFolder}
                    sx={{ textTransform: "none", borderRadius: "10px", px: 2 }}>
                    Upload Berkas
                  </Button>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  !selectedFolder
                    ? "Pilih folder terlebih dahulu"
                    : "Upload seluruh folder beserta isinya ke klasifikasi ini"
                }>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CreateNewFolder />}
                    onClick={() => folderInputRef.current?.click()}
                    disabled={!selectedFolder || isFolderUploading}
                    sx={{ textTransform: "none", borderRadius: "10px", px: 2 }}>
                    Upload Folder
                  </Button>
                </span>
              </Tooltip>
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFolderUpload}
                ref={(el) => {
                  folderInputRef.current = el;
                  if (el) el.setAttribute("webkitdirectory", "");
                }}
              />

              <Badge badgeContent={expiredCount} color="error">
                <Button
                  variant={showRetentionAlert ? "contained" : "outlined"}
                  color="warning"
                  startIcon={<Warning />}
                  onClick={() => {
                    setShowRetentionAlert(!showRetentionAlert);
                    if (!showRetentionAlert) setSelectedFolder(null); // Reset folder agar fokus ke daftar global
                  }}
                  sx={{ borderRadius: "10px", textTransform: "none", ml: 1 }}>
                  {showRetentionAlert ? "Tampilkan Semua" : "Perlu Inaktif"}
                </Button>
              </Badge>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, val) => val && setViewMode(val)}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.action.hover, 0.05),
                  borderRadius: "10px",
                  p: 0.5,
                }}>
                <ToggleButton
                  value="grid"
                  sx={{ border: "none", borderRadius: "8px !important" }}>
                  <GridView fontSize="small" />
                </ToggleButton>
                <ToggleButton
                  value="list"
                  sx={{ border: "none", borderRadius: "8px !important" }}>
                  <ViewList fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              {/* Search Box Menyeluruh & AI Search */}
              <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                <MuiTextField
                  placeholder="Cari perihal atau nama file..."
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ color: "text.disabled", mr: 1 }} />
                    ),
                  }}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filters.search) {
                      handleSemanticSearch();
                    }
                  }}
                />
                <Button 
                  variant={aiSearchActive ? "contained" : "outlined"}
                  color="primary"
                  size="small"
                  onClick={handleSemanticSearch}
                  disabled={isAiSearching || !filters.search}
                  sx={{ minWidth: "140px", whiteSpace: "nowrap", borderRadius: "10px" }}
                  startIcon={isAiSearching ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                >
                  {isAiSearching ? "Mencari..." : "AI Search"}
                </Button>
              </Stack>

              {/* Filter Lokasi (Autocomplete) */}
              <Autocomplete
                options={listLokasi}
                size="small"
                sx={{ width: { md: 300 } }}
                getOptionLabel={(opt) => getFullPath(opt, listLokasi)}
                value={
                  listLokasi.find((l) => l.internal_id === filters.lokasi) ||
                  null
                }
                onChange={(_, nv) =>
                  setFilters({
                    ...filters,
                    lokasi: nv?.internal_id || null,
                  })
                }
                renderInput={(params) => (
                  <MuiTextField {...params} label="Filter Lokasi" />
                )}
              />

              {/* Filter Klasifikasi (Folder) */}
              <Autocomplete
                // GUNAKAN DATA YANG SUDAH FLAT
                options={flatKlasifikasi}
                size="small"
                sx={{ width: { md: 300 } }}
                // Pastikan field 'nama' sesuai dengan data API Anda (misal: nama_klasifikasi atau nama)
                getOptionLabel={(opt) => opt.nama_klasifikasi || opt.nama || ""}
                value={
                  flatKlasifikasi.find(
                    (t) => t.internal_id === filters.klasifikasi,
                  ) || null
                }
                onChange={(_, nv) =>
                  setFilters({
                    ...filters,
                    klasifikasi: nv?.internal_id || null,
                  })
                }
                renderInput={(params) => (
                  <MuiTextField {...params} label="Filter Klasifikasi" />
                )}
              />

              {/* Tombol Reset */}
              <Button
                variant="outlined"
                onClick={() =>
                  setFilters({
                    search: "",
                    lokasi: null,
                    klasifikasi: null,
                  })
                }
                sx={{ borderRadius: 2 }}>
                <Refresh />
              </Button>
            </Stack>
          </Paper>
          {/* --- 2. MULTI-SELECT BAR (Pop-up style) --- */}
          {selectedFileIds.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                px: 3,
                bgcolor: isDark ? "primary.dark" : "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between", // Memisahkan info kiri dan aksi kanan
                gap: 2,
                color: "white",
                animation: "slideDown 0.3s ease",
                zIndex: 1000,
                position: "sticky", // Agar tetap terlihat saat scroll
                top: 0,
              }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  size="small"
                  onClick={toggleSelectAll}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.5)",
                    borderRadius: "10px",
                  }}
                  variant="outlined">
                  {selectedFileIds.length === visibleFiles.length
                    ? "Batal"
                    : "Pilih Semua"}
                </Button>
                <Typography variant="body2" fontWeight={600}>
                  {selectedFileIds.length} Berkas terpilih
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                {/* TOMBOL PINDAH */}
                <Button
                  variant="contained"
                  disabled={
                    myRole !== "admin" &&
                    fileList
                      .filter((f) => selectedFileIds.includes(f.internal_id))
                      .some((f) => String(f.created_by) !== myNip)
                  }
                  size="small"
                  startIcon={<DriveFileMove />}
                  onClick={() => setMoveDialogOpen(true)} // Membuka modal pemilih folder
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "10px",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  }}>
                  Pindah Folder
                </Button>

                {/* TOMBOL HAPUS */}
                <Button
                  variant="contained"
                  // Logika: Tombol mati jika user adalah PEGAWAI dan ada salah satu file terpilih yang bukan miliknya
                  disabled={
                    myRole !== "admin" &&
                    fileList
                      .filter((f) => selectedFileIds.includes(f.internal_id))
                      .some((f) => String(f.created_by) !== myNip)
                  }
                  size="small"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => openDeleteBulk(true)}
                  sx={{
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>
                  Hapus Permanen
                </Button>
              </Stack>
            </Box>
          )}
          {/* --- 3. FILTER & STATUS BAR --- */}
          <Box
            sx={{
              px: 3,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              bgcolor: alpha(theme.palette.action.hover, 0.02),
            }}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, val) => val && setStatusFilter(val)}
              size="small"
              sx={{ gap: 1.5 }}>
              <ToggleButton
                value="aktif"
                sx={{
                  borderRadius: "12px !important",
                  border: "1px solid transparent",
                  px: 4, // Padding ekstra agar badge punya ruang
                  overflow: "visible", // PENTING: Agar badge tidak terpotong
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: "success.dark",
                    border: `1px solid ${theme.palette.success.main}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                    },
                    // Mengubah warna ring badge saat tombol terpilih
                    "& .MuiBadge-badge": {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.1)}`,
                    },
                  },
                }}>
                <Badge
                  badgeContent={countAktif}
                  color="success"
                  max={99}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -14, // Sedikit lebih jauh agar lebih clean
                      top: 2,
                      fontSize: "0.65rem",
                      height: "18px",
                      minWidth: "18px",
                      fontWeight: 800,
                      boxShadow: (theme) =>
                        `0 0 0 2px ${theme.palette.background.paper}`,
                      transition: "all 0.2s ease",
                    },
                  }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      letterSpacing: "1px", // Sedikit lebih renggang agar premium
                      color: "inherit", // Ikut warna ToggleButton (success.dark saat dipilih)
                    }}>
                    AKTIF
                  </Typography>
                </Badge>
              </ToggleButton>

              <ToggleButton
                value="inaktif"
                sx={{
                  borderRadius: "12px !important",
                  border: "1px solid transparent",
                  px: 4, // Padding ekstra untuk ruang badge
                  overflow: "visible", // Agar badge tidak terpotong
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: "error.dark",
                    border: `1px solid ${theme.palette.error.main}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.15),
                    },
                    // Menyesuaikan ring badge dengan warna latar tombol saat dipilih
                    "& .MuiBadge-badge": {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.error.main, 0.1)}`,
                    },
                  },
                }}>
                <Badge
                  badgeContent={countInaktif}
                  color="error"
                  max={99}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -14,
                      top: 2,
                      fontSize: "0.65rem",
                      height: "18px",
                      minWidth: "18px",
                      fontWeight: 800,
                      boxShadow: (theme) =>
                        `0 0 0 2px ${theme.palette.background.paper}`,
                      transition: "all 0.2s ease",
                    },
                  }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      letterSpacing: "1px",
                      color: "inherit", // Mengikuti warna teks error.dark saat dipilih
                    }}>
                    INAKTIF
                  </Typography>
                </Badge>
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}>
              Menampilkan:{" "}
              <b style={{ color: theme.palette.text.primary }}>
                {visibleFiles.length} Berkas
              </b>
            </Typography>
          </Box>

          {/* --- 4. SCROLLABLE CONTENT AREA --- */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: { xs: 2, sm: 3 },
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha(theme.palette.divider, 0.2),
                borderRadius: "10px",
                "&:hover": { bgcolor: alpha(theme.palette.divider, 0.3) },
              },
            }}>
            {(filters.search || filters.lokasi || filters.klasifikasi) && (
              <Box
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="primary" fontWeight={600}>
                  🔍 Menampilkan hasil pencarian global...
                </Typography>
                <Link
                  component="button"
                  variant="caption"
                  onClick={() =>
                    setFilters({ search: "", lokasi: null, klasifikasi: null })
                  }>
                  Kembali ke Folder
                </Link>
              </Box>
            )}

            {/* FILE MANAGER AREA */}
            <Box
              sx={{
                p: 2,
                flexGrow: 1,
                overflowY: "auto",
                position: "relative",
              }}>
              {(isUploading || isFolderUploading) && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: isDark
                      ? "rgba(0,0,0,0.7)"
                      : "rgba(255,255,255,0.7)",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 1,
                  }}>
                  <CircularProgress
                    size={40}
                    variant={
                      isFolderUploading && folderProgress.total > 0
                        ? "determinate"
                        : "indeterminate"
                    }
                    value={
                      isFolderUploading && folderProgress.total > 0
                        ? Math.round(
                            (folderProgress.current / folderProgress.total) * 100,
                          )
                        : undefined
                    }
                  />
                  <Typography sx={{ mt: 1, fontWeight: 600 }}>
                    {isFolderUploading
                      ? folderProgress.step || "Memproses folder..."
                      : "Mengunggah..."}
                  </Typography>
                  {isFolderUploading && folderProgress.total > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {folderProgress.current} / {folderProgress.total}
                    </Typography>
                  )}
                </Box>
              )}

              {viewMode === "grid" ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 2,
                  }}>
                  {!(filters.search || filters.lokasi || filters.klasifikasi) &&
                    currentSubFolders.map((item) => (
                      <Paper
                        key={item.internal_id}
                        elevation={0}
                        onClick={() => setSelectedFolder(item)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFolderRightClick(e, item);
                        }}
                        sx={{
                          p: 2.5,
                          height: 180,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          position: "relative",
                          borderRadius: "24px", // Lebih membulat = lebih modern
                          transition:
                            "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                          bgcolor: alpha(theme.palette.background.paper, 0.4),
                          backdropFilter: "blur(12px)",
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          overflow: "hidden", // Untuk aksen cahaya di hover

                          "&:hover": {
                            transform: "translateY(-10px) scale(1.02)",
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                            boxShadow: `0 20px 40px -12px ${alpha(theme.palette.common.black, 0.3)}`,
                            "& .folder-icon": {
                              transform: "scale(1.1) translateY(-5px)",
                              filter:
                                "drop-shadow(0 8px 15px rgba(241, 196, 15, 0.5))",
                            },
                            "&::after": {
                              // Efek kilatan cahaya saat hover
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: -100,
                              width: "50%",
                              height: "100%",
                              background:
                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                              transform: "skewX(-25deg)",
                              transition: "0.5s",
                            },
                          },
                        }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFolderRightClick(e, item);
                          }}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10,
                            color: "text.secondary",
                            opacity: 0.6,
                            "&:hover": { opacity: 1, color: "primary.main" },
                          }}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                        <ListItemIcon>
                          <Badge
                            badgeContent={getTotalFileCountRecursive(
                              item.internal_id,
                            )}
                            color="primary"
                            max={999}
                            sx={{
                              "& .MuiBadge-badge": {
                                right: -2,
                                top: 4,
                                fontSize: "10px",
                              },
                            }}>
                            <Folder
                              className="folder-icon"
                              sx={{
                                fontSize: 64,
                                color: "#f1c40f",
                                mb: 1,
                                transition: "0.3s",
                              }}
                            />
                          </Badge>
                        </ListItemIcon>

                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            mb: 0.5,
                          }}>
                          {item.kode}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            textAlign: "center",
                            px: 1,
                            fontWeight: 500,
                            lineHeight: 1.2,
                          }}>
                          {item.nama}
                        </Typography>
                      </Paper>
                    ))}

                  {visibleFiles.map((file) => {
                    const fileId = file.internal_id || file.ID;
                    const isSelected = selectedFileIds.includes(fileId);
                    const isFromAdmin =
                      String(file.user_role || file.UserRole).toLowerCase() ===
                      "admin";
                    const isMine =
                      String(file.created_by || file.CreatedBy) ===
                      String(user.id);
                    // Hitung retensi untuk setiap file di dalam loop
                    const retensi = calculateRetention(
                      file.tgl_arsip,
                      file.klasifikasi?.masa_aktif, // Pastikan field ini ada
                      file.klasifikasi?.masa_inaktif, // Pastikan field ini ada
                    );

                    return (
                      <Paper
                        key={fileId}
                        draggable
                        onDragStart={(e) => {
                          if (isSelected) {
                            e.dataTransfer.setData(
                              "fileIds",
                              JSON.stringify(selectedFileIds),
                            );
                            const dragIcon = document.createElement("div");
                            dragIcon.innerHTML = `<div style="background:${theme.palette.primary.main}; color:white; padding:8px 16px; border-radius:12px; font-weight:bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2)">📦 Memindahkan ${selectedFileIds.length} berkas</div>`;
                            dragIcon.style.position = "absolute";
                            dragIcon.style.top = "-1000px";
                            document.body.appendChild(dragIcon);
                            e.dataTransfer.setDragImage(dragIcon, 0, 0);
                          } else {
                            e.dataTransfer.setData(
                              "fileIds",
                              JSON.stringify([fileId]),
                            );
                          }
                        }}
                        onClick={(e) => {
                          if (
                            e.target.type === "checkbox" ||
                            e.target.closest(".MuiCheckbox-root")
                          )
                            return;
                          setSelectedFile(file);
                          setDetailsOpen(true);
                        }}
                        sx={{
                          p: 2,
                          height: 180, // Tinggi optimal untuk semua info
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          position: "relative",
                          borderRadius: "16px",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          cursor: "pointer",

                          // Background & Border Logic
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.background.paper, 0.4),
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
                          boxShadow: isSelected
                            ? `0 0 0 1px ${theme.palette.primary.main}`
                            : "none",

                          "&:hover": {
                            transform: "translateY(-4px)",
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.15)
                              : alpha(theme.palette.action.hover, 0.05),
                            borderColor: theme.palette.primary.main,
                            "& .file-icon": {
                              color: theme.palette.primary.main,
                            },
                          },
                        }}>
                        {/* Checkbox Custom Style */}

                        <Box
                          sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            zIndex: 5,
                          }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelectFile(fileId)}
                            style={{
                              cursor: "pointer",
                              width: "16px",
                              height: "16px",
                              accentColor: theme.palette.primary.main,
                            }}
                          />
                        </Box>

                        {isFromAdmin && !isMine && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              bgcolor: "primary.main",
                              color: "white",
                              fontSize: "10px",
                              px: 1,
                              borderRadius: 1,
                            }}>
                            Shared by Admin
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "100%",
                            mt: 1,
                          }}>
                          <InsertDriveFile
                            className="file-icon"
                            sx={{
                              fontSize: 48,
                              color: isSelected
                                ? theme.palette.primary.main
                                : isDark
                                  ? "#90caf9"
                                  : "#3498db",
                              mb: 1,
                              transition: "color 0.3s ease",
                            }}
                          />

                          {/* PERIHAL */}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "text.primary",
                              fontSize: "0.75rem",
                              textAlign: "center",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              width: "100%",
                              px: 1,
                              lineHeight: 1.2,
                            }}>
                            {file.perihal}
                            {(showRetentionAlert || filters.search) && (
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{ display: "block", mt: 0.5 }}>
                                📍 Lokasi:{" "}
                                {lokasiPathCache.get(Number(file.lokasi_id)) || ""}
                              </Typography>
                            )}
                          </Typography>

                          {/* INFO LOKASI FISIK */}
                          <Box
                            sx={{ mt: 1, width: "100%", textAlign: "center" }}>
                            {(() => {
                              const lokasiPath = lokasiPathCache.get(Number(file.lokasi_id));
                              return (
                                <Typography
                                  variant="caption"
                                  title={lokasiPath || ""}
                                  sx={{
                                    fontSize: "9px",
                                    color: isDark
                                      ? theme.palette.primary.light
                                      : theme.palette.primary.dark,
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1,
                                    ),
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    cursor: "help",
                                  }}>
                                  <span style={{ fontSize: "10px" }}>📍</span>
                                  {lokasiPath || "Belum Diatur"}
                                </Typography>
                              );
                            })()}
                          </Box>
                        </Box>

                        {/* INDIKATOR RETENSI */}
                        {retensi && (
                          <Box
                            sx={{
                              width: "100%",
                              pt: 1,
                              borderTop: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.2,
                            }}>
                            {retensi?.isPermanent ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "9px",
                                  color: colors.indigo[500],
                                  fontWeight: 700,
                                  textAlign: "center",
                                }}>
                                ♾️ BERKAS PERMANEN
                              </Typography>
                            ) : (
                              <>
                                {retensi?.isExpiredActive ? (
                                  <Box
                                    sx={{
                                      bgcolor: alpha(colors.red[500], 0.1),
                                      color: colors.red[500],
                                      borderRadius: "4px",
                                      textAlign: "center",
                                      py: 0.2,
                                      border: `1px solid ${alpha(colors.red[500], 0.2)}`,
                                    }}>
                                    <Typography
                                      variant="caption"
                                      sx={{ fontSize: "9px", fontWeight: 900 }}>
                                      ⚠️ WAKTUNYA INAKTIF
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "9px",
                                      textAlign: "center",
                                      color: "text.secondary",
                                    }}>
                                    Inaktif:{" "}
                                    <b>
                                      {retensi?.tglInactive
                                        ? retensi.tglInactive.getFullYear()
                                        : "-"}
                                    </b>
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "9px",
                                    color: "text.disabled",
                                    textAlign: "center",
                                  }}>
                                  Nasib:{" "}
                                  <b>
                                    {selectedFolder?.tindakan || "Musnah"} (
                                    {retensi?.tglFinal
                                      ? retensi.tglFinal.getFullYear()
                                      : "-"}
                                    )
                                  </b>
                                </Typography>
                              </>
                            )}
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                  {visibleFiles.length === 0 &&
                    currentSubFolders.length === 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          py: 10, // Memberi ruang vertikal agar tidak terlihat sempit
                          px: 2,
                          width: "100%",
                          opacity: 0.8,
                        }}>
                        <Stack spacing={2} alignItems="center">
                          {/* Lingkaran Background untuk Ikon */}
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.05)"
                                  : "#f1f5f9",
                              mb: 1,
                            }}>
                            <FolderOff
                              sx={{
                                fontSize: 40,
                                color: "text.disabled",
                              }}
                            />
                          </Box>

                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: "text.primary",
                                mb: 0.5,
                              }}>
                              Data Tidak Ditemukan
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                maxWidth: 300,
                                mx: "auto",
                              }}>
                              Folder ini kosong atau belum ada berkas yang
                              diunggah ke dalam klasifikasi ini.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    // Mengambil tinggi penuh agar memenuhi area konten
                    height: "100%",
                    width: "100%",

                    // Menghilangkan border default Paper karena sudah ada border di Box luar
                    border: "none",

                    // Mengikuti lengkungan container luar jika di posisi paling bawah
                    borderRadius: "0 0 24px 24px",

                    // Background transparan agar warna latar container luar (putih/dark) yang terlihat
                    bgcolor: "transparent",

                    // Memastikan tabel tidak tumpah
                    overflow: "auto",

                    // Kustomisasi Header Tabel agar tetap Sticky saat scroll
                    "& .MuiTableHead-root": {
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      bgcolor: isDark ? "background.paper" : "#ffffff",
                    },

                    // Garis antar baris yang lebih halus
                    "& .MuiTableCell-root": {
                      borderColor: alpha(theme.palette.divider, 0.05),
                      py: 1.5, // Padding baris lebih lega dan modern
                    },

                    // Hover effect pada baris agar interaktif
                    "& .MuiTableRow-root:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.02),
                    },

                    // Scrollbar kustom agar senada dengan desain sebelumnya
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: alpha(theme.palette.divider, 0.1),
                      borderRadius: "10px",
                    },
                  }}>
                  <Table size="small">
                    <TableHead
                      sx={{
                        bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                      }}>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: 700, color: "text.primary" }}>
                          Nama
                        </TableCell>
                        {user?.role === "admin" && (
                          <TableCell
                            sx={{ fontWeight: 700, color: "text.primary" }}>
                            Pemilik
                          </TableCell>
                        )}
                        <TableCell
                          sx={{ fontWeight: 700, color: "text.primary" }}>
                          Lokasi Fisik
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: "text.primary" }}>
                          Tanggal
                        </TableCell>
                        <TableCell align="right">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* 1. TAMPILKAN SUB-FOLDER (Hanya jika tidak sedang Search/Filter) */}
                      {!(
                        filters.search ||
                        filters.lokasi ||
                        filters.klasifikasi
                      ) &&
                        currentSubFolders.map((item) => (
                          <TableRow
                            key={item.internal_id}
                            hover
                            onClick={() => setSelectedFolder(item)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFolderRightClick(e, item);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.warning.light, 0.05),
                              cursor: "pointer",
                            }}>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center">
                                <Folder
                                  fontSize="small"
                                  sx={{ color: "#f1c40f" }}
                                />
                                <Typography variant="body2" fontWeight={700}>
                                  {item.kode} - {item.nama}
                                </Typography>
                              </Stack>
                            </TableCell>
                            {user?.role === "admin" && <TableCell>-</TableCell>}
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFolderRightClick(e, item);
                                }}
                                sx={{ mr: 1, color: "text.secondary" }}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <KeyboardArrowRight fontSize="small" />
                            </TableCell>
                          </TableRow>
                        ))}

                      {/* 2. TAMPILKAN FILE (Gunakan visibleFiles yang sudah terfilter otomatis) */}
                      {visibleFiles.map((file) => (
                        <TableRow
                          key={file.internal_id || file.ID}
                          sx={{
                            "& td": { border: "none" },
                            bgcolor: alpha(theme.palette.background.paper, 0.4),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center">
                              <InsertDriveFile
                                fontSize="small"
                                sx={{ color: "#3498db" }}
                              />
                              <Typography variant="body2">
                                {file.perihal}
                              </Typography>
                            </Stack>
                            {(showRetentionAlert || filters.search) && (
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{ display: "block", mt: 0.5 }}>
                                📍 Lokasi:{" "}
                                {lokasiPathCache.get(Number(file.lokasi_id)) || ""}
                              </Typography>
                            )}
                          </TableCell>

                          {user?.role === "admin" && (
                            <TableCell sx={{ fontSize: 12 }}>
                              {file.owner_nip || file.created_by}
                            </TableCell>
                          )}

                          <TableCell>
                            {lokasiMap.get(Number(file.lokasi_id))?.nama_ruang || "Internal"}
                          </TableCell>

                          <TableCell>
                            {file.tgl_arsip?.substring(0, 10)}
                          </TableCell>

                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedFile(file);
                                setDetailsOpen(true);
                              }}>
                              <InfoOutlined fontSize="inherit" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* 3. TAMPILKAN PESAN JIKA KOSONG */}
                      {visibleFiles.length === 0 &&
                        currentSubFolders.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              align="center"
                              sx={{ py: 10 }}>
                              <Typography color="text.secondary">
                                Folder ini kosong
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* DRAWER DETAIL */}
      <Drawer
        anchor="right"
        open={Boolean(detailsOpen && selectedFile)}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 100 }}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{
          sx: {
            width: 380,
            bgcolor: "background.paper", // Otomatis berubah
            backgroundImage: "none",
          },
        }}>
        {selectedFile && (
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={800}>
                Detail Berkas
              </Typography>
              <IconButton
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedFile(null);
                  setIsEditing(false);
                  setIsEditingLokasi(false);
                }}>
                <Close />
              </IconButton>
            </Stack>

            {/* File Icon Preview */}
            <Box
              sx={{
                textAlign: "center",
                mb: 4,
                py: 4,
                // Menggunakan theme.palette.action.hover atau palette.background.default
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "action.hover" : "#f8f9fa",
                borderRadius: 4,
                border: "1px dashed",
                borderColor: "divider", // Warna garis otomatis
              }}>
              <InsertDriveFile sx={{ fontSize: 60, color: "primary.main" }} />
              <Typography
                variant="caption"
                display="block"
                color="textSecondary"
                sx={{ mt: 1 }}>
                {selectedFile.file_type?.toUpperCase() || "PDF"} Document
              </Typography>
            </Box>

            <Stack spacing={3}>
              {/* Nama / Perihal Section */}
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  fontWeight={700}>
                  NAMA / PERIHAL
                </Typography>
                {isEditing ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    mt={1}
                    alignItems="flex-start">
                    <TextField
                      name="edit_perihal"
                      control={control}
                      size="small"
                      fullWidth
                      defaultValue={selectedFile.perihal}
                      sx={{ mb: 0 }}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ height: "40px" }}
                      onClick={() => {
                        handleUpdateFile({ perihal: editValue });
                        setIsEditing(false);
                      }}>
                      OK
                    </Button>
                  </Stack>
                ) : (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedFile.perihal || "-"}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsEditing(true);
                        setEditValue(selectedFile.perihal);
                      }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              {/* Lokasi Fisik Section */}
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  fontWeight={700}>
                  LOKASI FISIK
                </Typography>
                {isEditingLokasi ? (
                  <Stack spacing={1} mt={1}>
                    <Autocomplete
                      options={listLokasi}
                      loading={loadingLokasi}
                      // Mencocokkan ID lokasi yang dipilih dengan objek di listLokasi
                      value={
                        listLokasi.find((l) => l.internal_id === lokasiValue) ||
                        null
                      }
                      // Ini yang menentukan apa yang tampil saat list dibuka & setelah dipilih
                      getOptionLabel={(option) =>
                        getFullPath(option, listLokasi)
                      }
                      isOptionEqualToValue={(option, value) =>
                        Number(option.internal_id) === Number(value.internal_id)
                      }
                      onChange={(event, newValue) => {
                        // Simpan internal_id ke state/form arsip
                        setLokasiValue(newValue ? newValue.internal_id : "");
                      }}
                      // Agar bisa mencari dengan mengetik nama induknya juga
                      filterOptions={(options, { inputValue }) =>
                        options.filter((item) =>
                          getFullPath(item, listLokasi)
                            .toLowerCase()
                            .includes(inputValue.toLowerCase()),
                        )
                      }
                      renderOption={(props, option) => (
                        <li {...props} key={option.internal_id}>
                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}>
                            {/* Nama Lengkap Path */}
                            <Typography variant="body2">
                              {getFullPath(option, listLokasi)}
                            </Typography>
                            {/* Keterangan Tambahan jika ada */}
                            {option.keterangan && (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {option.keterangan}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <MuiTextField
                          {...params}
                          label="Pilih Lokasi Fisik"
                          variant="outlined"
                          size="small"
                          placeholder="Ketik Gedung/Rak/Box..."
                        />
                      )}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      onClick={() => {
                        handleUpdateFile({ lokasi_id: lokasiValue });
                        setIsEditingLokasi(false);
                      }}>
                      Simpan Lokasi
                    </Button>
                  </Stack>
                ) : (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={0.5}>
                    <Box>
                      {(() => {
                        // Pastikan pencarian menggunakan tipe data yang konsisten (gunakan == atau Number)
                        const selected = listLokasi.find(
                          (l) =>
                            Number(l.internal_id) ===
                            Number(selectedFile.lokasi_id),
                        );

                        if (!selected) {
                          return (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ fontStyle: "italic" }}>
                              Belum diatur
                            </Typography>
                          );
                        }

                        return (
                          <>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="primary">
                              {/* Menampilkan jalur lengkap dari fungsi getFullPath */}
                              {getFullPath(selected, listLokasi)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: "block" }}>
                              Keterangan:{" "}
                              {selected.keterangan || "Tidak ada catatan"}
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsEditingLokasi(true);
                        setLokasiValue(selectedFile.lokasi_id);
                      }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              {/* Retensi Info Section */}
              {selectedFile && selectedFolder && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    // Background adaptif menggunakan palette
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                  }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <History fontSize="small" /> Informasi Retensi
                  </Typography>

                  {(() => {
                    const retensi = calculateRetention(
                      selectedFile.tgl_arsip,
                      selectedFolder.masa_aktif,
                      selectedFolder.masa_inaktif,
                    );
                    if (!retensi)
                      return (
                        <Typography variant="caption">
                          Data klasifikasi tidak lengkap
                        </Typography>
                      );

                    return (
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            display="block">
                            Jadwal Inaktif (Pindah Gudang):
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              retensi.isExpiredActive
                                ? "error.main"
                                : "textPrimary"
                            }>
                            {retensi.isPermanent
                              ? "Permanen"
                              : retensi.tglInactive?.toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                            {retensi.isExpiredActive && " (Sudah Waktunya!)"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            display="block">
                            Nasib Akhir ({selectedFolder.tindakan || "Musnah"}):
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {retensi.isPermanent
                              ? "Permanen"
                              : retensi.tglFinal?.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }) || "-"}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })()}
                </Box>
              )}

              {/* Tanggal Arsip Section */}
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  fontWeight={700}>
                  TANGGAL ARSIP
                </Typography>
                <input
                  type="date"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    // Menggunakan variabel CSS MUI agar warna border dan teks mengikuti tema
                    border: "1px solid var(--mui-palette-divider, #ccc)",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    backgroundColor: "transparent",
                    color: "inherit",
                  }}
                  value={
                    selectedFile?.tgl_arsip
                      ? selectedFile.tgl_arsip.substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateFile({ tgl_arsip: e.target.value })
                  }
                />
              </Box>

              <Divider />

              {/* Action Buttons */}
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  color={
                    selectedFile.status === "inaktif" ? "success" : "warning"
                  }
                  startIcon={
                    selectedFile.status === "inaktif" ? (
                      <Monitor />
                    ) : (
                      <Archive />
                    )
                  }
                  onClick={() =>
                    handleUpdateFile({
                      status:
                        selectedFile.status === "inaktif" ? "aktif" : "inaktif",
                    })
                  }>
                  {selectedFile.status === "inaktif"
                    ? "Aktifkan Kembali"
                    : "Pindahkan ke Inaktif"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  //disabled={!selectedFile?.file_path}
                  onClick={() => {
                    const path = (selectedFile.file_path || selectedFile.file_url || "").replace(/\\/g, '/');
                    setDocViewerDocs([{ uri: `${url}/${path}` }]);
                    setDocViewerOpen(true);
                  }}>
                  Lihat Dokumen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  color="primary"
                  onClick={() => {
                    handleDownload(
                      `${url}/api/v1/arsip/${selectedFile.internal_id}/download`, // Memanggil route backend baru
                      selectedFile.perihal || "dokumen",
                    );
                  }}>
                  Unduh Berkas
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<History />}
                  color="info"
                  onClick={openVersionHistory}>
                  Riwayat Versi
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  sx={{
                    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                    color: "white",
                    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                  }}
                  onClick={handleAnalyze}>
                  Analisis AI ✨
                </Button>

                <Button
                  color="error"
                  disabled={
                    String(selectedFile.created_by) !== myNip &&
                    myRole !== "admin"
                  }
                  variant="outlined"
                  startIcon={<DeleteOutline />}
                  onClick={() => openDeleteSingle(selectedFile.internal_id)}>
                  Hapus Permanen
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Drawer>

      <Dialog
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Riwayat Versi</DialogTitle>
        <DialogContent dividers>
          {versions.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>Belum ada riwayat versi.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Versi</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>v{v.version}</TableCell>
                    <TableCell>{v.file_path.split("/").pop()}</TableCell>
                    <TableCell>{new Date(v.created_at).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          const path = (v.file_path || "").replace(/\\/g, '/');
                          window.open(`${url}/${path}#toolbar=0`, "_blank");
                        }}
                        startIcon={<Visibility />}>
                        Lihat
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          const path = (v.file_path || "").replace(/\\/g, '/');
                          handleDownload(`${url}/${path}`, `v${v.version}_${selectedFile?.perihal}`);
                        }}
                        startIcon={<GetApp />}>
                        Unduh
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setDiffOldText(v.extracted_text || "Teks tidak tersedia di versi lama.");
                          setDiffNewText(selectedFile?.extracted_text || "Teks tidak tersedia di versi baru.");
                          setDiffModalOpen(true);
                        }}
                        startIcon={<History />}>
                        Bandingkan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Box>
            <input
              type="file"
              style={{ display: "none" }}
              ref={versionInputRef}
              onChange={handleUploadNewVersion}
            />
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => versionInputRef.current?.click()}
              disabled={isUploading}>
              {isUploading ? "Mengunggah..." : "Unggah Versi Baru"}
            </Button>
          </Box>
          <Button onClick={() => setVersionModalOpen(false)} variant="outlined">Tutup</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Perbandingan Versi Dokumen</Typography>
          <IconButton onClick={() => setDiffModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'auto' }}>
          <Box sx={{ p: 2, minHeight: '100%' }}>
            <ReactDiffViewer
              oldValue={diffOldText}
              newValue={diffNewText}
              splitView={true}
              leftTitle="Versi Terdahulu"
              rightTitle="Versi Saat Ini"
              hideLineNumbers={true}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesome sx={{ color: "#FE6B8B" }} /> Analisis Dokumen AI
        </DialogTitle>
        <DialogContent dividers>
          {isAiLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#FE6B8B", mb: 2 }} />
              <Typography color="textSecondary">Sedang menganalisis detail dokumen...</Typography>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {aiResult}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAiModalOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirmDelete}
        onClose={() => !isDeleting && setOpenConfirmDelete(false)} // Jangan tutup saat proses hapus
        PaperProps={{
          sx: { borderRadius: 3, padding: 1 },
        }}>
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}>
          <Warning color="error" /> Konfirmasi Hapus Permanen
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {selectedFileIds.length > 0 ? (
              <>
                Apakah Anda yakin ingin menghapus{" "}
                <strong>{selectedFileIds.length} berkas terpilih</strong> secara
                permanen?
              </>
            ) : (
              <>
                Apakah Anda yakin ingin menghapus{" "}
                <strong>{selectedFile?.judul || "arsip ini"}</strong>?
              </>
            )}
            <br />
            <br />
            Tindakan ini akan{" "}
            <strong>
              menghapus data dari database dan menghapus file fisik
            </strong>{" "}
            di server. Data yang sudah dihapus tidak dapat dikembalikan.
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => setOpenConfirmDelete(false)}
            disabled={isDeleting}
            color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleDeletePermanen}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DeleteOutline />
              )
            }
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            {isDeleting ? "Menghapus..." : "Ya, Hapus Selamanya"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        fullWidth
        maxWidth="xs">
        <DialogTitle>Pindahkan ke Folder...</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: "400px" }}>
          <List>
            {flatKlasifikasi.map((folder) => (
              <ListItemButton
                key={folder.internal_id}
                onClick={() => handleMoveFiles(folder.internal_id)}
                sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemIcon>
                  <Folder sx={{ color: "#f1c40f" }} />
                </ListItemIcon>
                <ListItemText
                  primary={folder.nama_klasifikasi}
                  secondary={folder.kode}
                />
                {/* Gunakan folderCountsMap untuk mendapatkan angka hasil rekursi */}
                <Badge
                  badgeContent={folderCountsMap[folder.internal_id] || 0}
                  color="primary"
                  max={999}
                  sx={{
                    "& .MuiBadge-badge": {
                      right: 0,
                      top: 10,
                      fontSize: "10px",
                      height: "18px",
                      minWidth: "18px",
                    },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Batal</Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={folderContextMenu !== null}
        onClose={closeFolderContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          folderContextMenu !== null
            ? { top: folderContextMenu.mouseY, left: folderContextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={openRenameFolderDialog}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          Ubah Nama
        </MenuItem>
      </Menu>

      <Dialog open={renameDialogOpen} onClose={() => !isRenaming && setRenameDialogOpen(false)}>
        <DialogTitle>Ubah Nama Folder</DialogTitle>
        <DialogContent dividers>
          <MuiTextField
            autoFocus
            margin="dense"
            label="Kode Folder"
            fullWidth
            value={renameFolderData.kode}
            onChange={(e) => setRenameFolderData({ ...renameFolderData, kode: e.target.value })}
            sx={{ mb: 2 }}
          />
          <MuiTextField
            margin="dense"
            label="Nama Folder"
            fullWidth
            value={renameFolderData.nama}
            onChange={(e) => setRenameFolderData({ ...renameFolderData, nama: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} disabled={isRenaming}>Batal</Button>
          <Button variant="contained" onClick={handleRenameFolderSubmit} disabled={isRenaming}>
            {isRenaming ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Preview Dokumen</Typography>
          <IconButton onClick={() => setDocViewerOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {docViewerDocs.length > 0 && (
            <DocViewer
              documents={docViewerDocs}
              pluginRenderers={DocViewerRenderers}
              style={{ height: "100%" }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Arsip;
