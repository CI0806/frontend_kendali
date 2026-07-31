import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Stack, CircularProgress } from "@mui/material";
import { Print, ArrowBack } from "@mui/icons-material";
import services from "@/services";
import moment from "moment";
import "moment/locale/id";

const CetakCuti = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await services.cuti.cetak(id);
        setData(res.data?.data || res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!data)
    return <Box sx={{ p: 3, color: "white" }}>Data tidak ditemukan.</Box>;

  const tglIndo = (tgl) => (tgl ? moment(tgl).format("DD MMMM YYYY") : "-");

  return (
    <Box sx={{ bgcolor: "#525659", minHeight: "100vh", p: 2 }}>
      <style>
        {`
        @media print {
          /* Sembunyikan SEMUA elemen kecuali area cetak */
          nav, aside, footer, .sidebar, .MuiDrawer-root, .no-print, button, header {
            display: none !important;
          }

          /* Paksa body putih dan hilangkan margin browser */
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hilangkan padding container utama saat print */
          .MuiBox-root {
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          
          /* Hilangkan header/footer otomatis dari browser (opsional) */
          @page {
            margin: 1cm;
          }

          /* Pastikan garis tabel terlihat saat dicetak */
          table[border="1"], table[border="1"] td, table[border="1"] th {
            border: 1px solid black !important;
          }
        }

        /* Pastikan garis tabel terlihat di layar juga */
        table[border="1"], table[border="1"] td, table[border="1"] th {
          border: 1px solid black;
        }
      `}
      </style>
      {/* Tombol Navigasi */}
      <Stack
        className="no-print"
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ mb: 4 }}>
        <Button variant="contained" onClick={() => navigate("/riwayat")}>
          Kembali
        </Button>
        <Button variant="contained" onClick={() => window.print()}>
          Cetak
        </Button>
      </Stack>
      <Box
        sx={{
          width: "210mm",
          minHeight: "297mm",
          p: "10mm 15mm",
          margin: "auto",
          bgcolor: "white",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "10pt",
          lineHeight: 1.2,
          "@media print": { margin: 0, width: "100%" },
        }}>
        {/* Header Lampiran */}
        <table width="100%" style={{ marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td width="40%"></td>
              <td>
                ANAK LAMPIRAN 1.b
                <br />
                PERATURAN BADAN KEPEGAWAIAN NEGARA
                <br />
                REPUBLIK INDONESIA
                <br />
                NOMOR 24 TAHUN 2017
                <br />
                TENTANG
                <br />
                TATA CARA PEMBERIAN CUTI PEGAWAI NEGERI SIPIL
              </td>
            </tr>
          </tbody>
        </table>

        {/* Kota dan Tanggal */}
        {/* <div style={{ textAlign: "right", marginBottom: "5px", paddingRight: "50px" }}>
          Tarakan, {tglIndo(data.created_at || new Date())}
        </div> */}

        {/* Tujuan */}
        <div style={{ marginLeft: "60%", marginBottom: "20px" }}>
          Tarakan, {tglIndo(data.created_at || new Date())}
          <br />
          Kepada
          <br />
          <div style={{ marginLeft: "-28px" }}>
            Yth. Kepala Dinas Kesehatan
            <br />
          </div>
          Melalui Kepala Puskesmas
          <br />
          Karang Rejo
          <br />
          Di-
          <br />
          <span style={{ marginLeft: "30px" }}>Tarakan</span>
        </div>

        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            textDecoration: "underline",
            marginBottom: "15px",
          }}>
          FORMULIR PERMINTAAN DAN PEMBERIAN CUTI
        </div>

        {/* I. DATA PEGAWAI */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td colSpan="4">I. DATA PEGAWAI</td>
            </tr>
            <tr>
              <td width="15%">Nama</td>
              <td width="40%">{data.pegawai?.nama}</td>
              <td width="15%">NIP</td>
              <td width="30%">{data.pegawai?.nip?.length === 18 ? data.pegawai?.nip : "-"}</td>
            </tr>
            <tr>
              <td>Jabatan</td>
              <td>{data.pegawai?.jabatan}</td>
              <td>Masa Kerja</td>
              <td>{data.masa_kerja || "11 Tahun"}</td>
            </tr>
            <tr>
              <td>Unit Kerja</td>
              <td colSpan="3">
                {data.pegawai?.unit_kerja || "Puskesmas Karang Rejo"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* II. JENIS CUTI */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td colSpan="4">II. JENIS CUTI YANG DIAMBIL</td>
            </tr>
            <tr>
              <td width="40%">1. Cuti Tahunan</td>
              <td width="10%" align="center">
                <b>{data.jenis_cuti === "Cuti Tahunan" ? "V" : ""}</b>
              </td>
              <td width="40%">2. Cuti Besar</td>
              <td width="10%" align="center">
                {data.jenis_cuti === "Cuti Besar" ? "V" : ""}
              </td>
            </tr>
            <tr>
              <td>3. Cuti Sakit</td>
              <td align="center">
                {data.jenis_cuti === "Cuti Sakit" ? "V" : ""}
              </td>
              <td>4. Cuti Melahirkan</td>
              <td align="center">
                {data.jenis_cuti === "Cuti Melahirkan" ? "V" : ""}
              </td>
            </tr>
            <tr>
              <td>5. Cuti Karena Alasan Penting</td>
              <td align="center">
                {data.jenis_cuti === "Cuti Karena Alasan Penting" ? "V" : ""}
              </td>
              <td>6. Cuti diluar Tanggungan Negara</td>
              <td align="center">
                {data.jenis_cuti === "Cuti Luar Tanggungan" ? "V" : ""}
              </td>
            </tr>
          </tbody>
        </table>

        {/* III. ALASAN CUTI */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td>III. ALASAN CUTI</td>
            </tr>
            <tr>
              <td style={{ height: "40px", verticalAlign: "top" }}>
                {data.alasan}
              </td>
            </tr>
          </tbody>
        </table>

        {/* IV. LAMANYA CUTI */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td colSpan="6">IV. LAMANYA CUTI</td>
            </tr>
            <tr>
              <td width="15%">Selama</td>
              <td width="25%">{data.jumlah_hari} hari</td>
              <td width="10%">mulai tanggal</td>
              <td width="20%">{tglIndo(data.tgl_mulai)}</td>
              <td width="5%">s/d</td>
              <td width="25%">{tglIndo(data.tgl_selesai)}</td>
            </tr>
          </tbody>
        </table>

        {/* V. CATATAN CUTI (SISA CUTI) */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td colSpan="5">V. CATATAN CUTI</td>
            </tr>
            <tr>
              <td colSpan="3" width="50%">
                1. CUTI TAHUNAN
              </td>
              <td width="40%">2. CUTI BESAR</td>
              <td width="10%"></td>
            </tr>
            <tr>
              <td align="center">Tahun</td>
              <td align="center">Sisa</td>
              <td align="center">Keterangan</td>
              <td>3. CUTI SAKIT</td>
              <td></td>
            </tr>
            <tr>
              <td align="center">{new Date().getFullYear()}</td>
              <td align="center">{data.sisa_cuti || "0"}</td>
              <td></td>
              <td>4. CUTI MELAHIRKAN</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="3" style={{ height: "15px" }}></td>
              <td>5. CUTI KARENA ALASAN PENTING</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="3" style={{ height: "15px" }}></td>
              <td>6. CUTI DI LUAR TANGGUNGAN NEGARA</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Alamat Cuti & Tanda Tangan Pemohon */}
        {/* VI. ALAMAT SELAMA MENJALANKAN CUTI */}
        <table
          width="100%"
          border="1"
          cellPadding="0"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td
                colSpan="3"
                style={{ padding: "3px", backgroundColor: "#ffffffff" }}>
                VI. ALAMAT SELAMA MENJALANKAN CUTI
              </td>
            </tr>
            <tr>
              {/* Bagian Alamat Cuti (Kiri) */}
              <td
                width="60%"
                rowSpan="2"
                style={{ verticalAlign: "top", padding: "10px" }}>
                <div style={{ minHeight: "80px" }}>
                  {data.alamat_cuti || "-"}
                </div>
              </td>

              {/* Baris TELP (Kanan Atas) */}
              <td
                width="10%"
                style={{ padding: "5px", borderBottom: "1px solid black" }}>
                TELP
              </td>
              <td
                width="30%"
                style={{ padding: "5px", borderBottom: "1px solid black" }}>
                {data.pegawai?.no_telp || "-"}
              </td>
            </tr>

            <tr>
              {/* Bagian Hormat Saya (Kanan Bawah) */}
              <td
                colSpan="2"
                align="center"
                style={{ verticalAlign: "bottom" }}>
                Hormat Saya,
                <br />
                <br />
                <br />
                <br />( {data.pegawai?.nama} )<br />
                NIP. {data.pegawai?.nip?.length === 18 ? data.pegawai?.nip : "-"}
                
              </td>
            </tr>
          </tbody>
        </table>

        {/* VII. PERTIMBANGAN ATASAN LANGSUNG */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td colSpan="4">VII. PERTIMBANGAN ATASAN LANGSUNG</td>
            </tr>
            <tr>
              <td width="25%" align="center">
                DISETUJUI
              </td>
              <td width="25%" align="center">
                PERUBAHAN
              </td>
              <td width="25%" align="center">
                DITANGGUHKAN
              </td>
              <td width="25%" align="center">
                TIDAK DISETUJUI
              </td>
            </tr>
            <tr>
              <td height="25" align="center">
                {data.status_verif === "verified" ? "V" : ""}
              </td>
              <td></td>
              <td></td>
              <td align="center">
                {data.status_verif === "rejected" ? "V" : ""}
              </td>
            </tr>
            <tr>
              <td colSpan="3"></td>
              <td align="center">
                <u>Atasan Langsung</u>
                <br />
                <br />
                <br />
                <br />
                <u>dr. Ametta Angastuty</u>
                <br />
                NIP. 198102122009022002
              </td>
            </tr>
          </tbody>
        </table>

        {/* VIII. KEPUTUSAN PEJABAT */}
        <table
          width="100%"
          border="1"
          cellPadding="3"
          style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td colSpan="4">
                VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI
              </td>
            </tr>
            <tr>
              <td width="25%" align="center">
                DISETUJUI
              </td>
              <td width="25%" align="center">
                PERUBAHAN
              </td>
              <td width="25%" align="center">
                DITANGGUHKAN
              </td>
              <td width="25%" align="center">
                TIDAK DISETUJUI
              </td>
            </tr>
            <tr>
              <td height="25" align="center">
                {data.status_approve === "approved" ? "V" : ""}
              </td>
              <td></td>
              <td></td>
              <td align="center">
                {data.status_approve === "rejected" ? "V" : ""}
              </td>
            </tr>
            <tr>
              <td colSpan="3"></td>
              <td align="center">
                <u>Kepala Dinas</u>
                <br />
                <br />
                <br />
                <br />
                <u>dr. Devi Indriarti, M.Kes</u>
                <br />
                NIP. 197005172002122006
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default CetakCuti;
