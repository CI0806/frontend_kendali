import React, { useState, useMemo, useEffect } from "react"; // Tambahkan useMemo
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "./components/pages/Auth/Login";
import Dashboard from "./components/pages/Dashboard";
import authLoader from "./components/layouts/AuthLayout/AuthLayout.loader";
import sidebarLoader from "./components/layouts/SidebarLayout/SidebarLayout.loader";
import SidebarLayout from "./components/layouts/SidebarLayout";
import Pegawai from "./components/pages/Master/Pegawai";
import Pengaturan from "./components/pages/Pengaturan";
import Cuti from "./components/pages/Pengajuan/Cuti";
import Dokumen from "./components/pages/Pengajuan/Dokumen";
import Verifikasi from "./components/pages/Pengajuan/Verifikasi";
import Persetujuan from "./components/pages/Pengajuan/Persetujuan";
import Riwayat from "./components/pages/Riwayat";
import KalenderTim from "./components/pages/KalenderTim";
import CetakCuti from "./components/pages/CetakCuti";
import Klasifikasi from "./components/pages/Master/Klasifikasi";
import LokasiFisik from "./components/pages/Master/LokasiFisik";
import Arsip from "./components/pages/Arsip";
import Laporan from "./components/pages/Laporan";
import Kuota from "./components/pages/Master/Kuota";
import Log_Activity from "./components/pages/Log_Activity";
import ProtectedRoute from "./components/protectedroute";
import Peminjaman from "./components/pages/Peminjaman";
import Penomoran from "./components/pages/Penomoran/Penomoran";
import Chatbot from "./components/ui/Chatbot";
import { NotificationProvider } from "./components/contexts/NotificationContext";

const App = () => {
  const [mode, setMode] = useState("light");

  // --- TAMBAHKAN KODE INI UNTUK MATIKAN KLIK KANAN ---
  // useEffect(() => {
  //   const handleContextMenu = (e) => {
  //     e.preventDefault(); // Mencegah menu klik kanan muncul
  //   };

  //   // Tambahkan listener ke seluruh dokumen
  //   document.addEventListener("contextmenu", handleContextMenu);

  //   // Membersihkan listener saat komponen di-unmount
  //   return () => {
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //   };
  // }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#193b68", // Biru Mewah (Navy/Royal)
            light: "#3B82F6",
            dark: "#172554",
          },
          background: {
            default: mode === "light" ? "#f8fafc" : "#0f172a",
            paper: mode === "light" ? "#ffffff" : "#1e293b",
          },
          text: {
            primary: mode === "light" ? "#1e293b" : "#f1f5f9",
            secondary: mode === "light" ? "#64748b" : "#94a3b8",
          },
        },
        typography: {
          fontFamily: "Inter, sans-serif",
          button: { textTransform: "none", fontWeight: 600 },
        },
      }),
    [mode],
  );

  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          loader: sidebarLoader,
          element: <SidebarLayout toggleTheme={toggleTheme} />,
          children: [
            // --- LEVEL CHILD 1: Semua yang login bisa akses ---
            {
              element: <ProtectedRoute />, 
              children: [
                {
                  index: true,
                  element: <Dashboard />,
                },
                {
                  path: "pengajuan/cuti",
                  element: <Cuti />,
                },
                {
                  path: "pengajuan/dokumen",
                  element: <Dokumen />,
                },
                {
                  path: "pengajuan/verifikasi",
                  element: <Verifikasi />,
                },
                {
                  path: "pengajuan/persetujuan",
                  element: <Persetujuan />,
                },
                {
                  path: "riwayat",
                  element: <Riwayat />,
                },
                {
                  path: "cetak/:id",
                  element: <CetakCuti />,
                },
                {
                  path: "kalendertim",
                  element: <KalenderTim />,
                },
                {
                  path: "arsip",
                  element: <Arsip />,
                },
                {
                  path: "peminjaman",
                  element: <Peminjaman />,
                },
                {
                  path: "pengaturan",
                  element: <Pengaturan />,
                },
              ]
            },

            // --- LEVEL CHILD 2: Hanya ADMIN yang bisa akses ---
            {
              element: <ProtectedRoute allowedRoles={['admin', 'pimpinan']} />, 
              children: [
                {
                  path: "log_activity",
                  element: <Log_Activity />,
                },
                {
                  path: "master/pegawai",
                  element: <Pegawai />,
                },
                {
                  path: "master/kuota",
                  element: <Kuota />,
                },
                {
                  path: "master/klasifikasi",
                  element: <Klasifikasi />,
                },
                {
                  path: "master/lokasi",
                  element: <LokasiFisik />,
                },
                {
                  path: "laporan",
                  element: <Laporan />,
                },
                {
                  path: "penomoran",
                  element: <Penomoran />,
                },
              ]
            },
          ],
        },
        {
          path: "/login",
          loader: authLoader,
          element: <Login />,
        },
      ]),
    [toggleTheme],
  );
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <NotificationProvider>
          <CssBaseline />
          <RouterProvider router={router} />
          <Chatbot />
        </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
