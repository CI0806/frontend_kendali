import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Tooltip,
  IconButton,
  Grid,
  Container,
  CircularProgress,
  Chip,
  Avatar,
  useTheme, // Tambahkan ini
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Group,
} from "@mui/icons-material";
import services from "@/services";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

// Helper untuk warna status yang adaptif terhadap mode
const getStatusStyle = (jenis, mode) => {
  const isDark = mode === 'dark';
  switch (jenis) {
    case "Cuti Sakit":
      return {
        bg: isDark ? "rgba(251, 113, 133, 0.1)" : "#fff1f2",
        border: isDark ? "#fb7185" : "#fb7185",
        text: isDark ? "#fda4af" : "#9f1239",
        dot: "#e11d48",
      };
    case "Cuti Tahunan":
      return {
        bg: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
        border: isDark ? "#3b82f6" : "#3b82f6",
        text: isDark ? "#93c5fd" : "#172554",
        dot: "#193b68",
      };
    default:
      return {
        bg: isDark ? "rgba(125, 211, 252, 0.1)" : "#f0f9ff",
        border: isDark ? "#7dd3fc" : "#7dd3fc",
        text: isDark ? "#7dd3fc" : "#075985",
        dot: "#0284c7",
      };
  }
};

const KalenderTim = () => {
  const theme = useTheme(); // Gunakan theme dari MUI
  const isDark = theme.palette.mode === 'dark';
  
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = currentMonth.format("MM");
      const year = currentMonth.format("YYYY");
      const res = await services.cuti.getKalenderTim(month, year);
      setEvents(Array.isArray(res.data?.data) ? res.data.data : res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startDay = currentMonth.clone().startOf("month").startOf("week");
  const endDay = currentMonth.clone().endOf("month").endOf("week");
  const date = startDay.clone().subtract(1, "day");
  const calendar = [];

  while (date.isBefore(endDay, "day")) {
    calendar.push(
      Array(7).fill(0).map(() => date.add(1, "day").clone())
    );
  }

  const getCutiOnDate = (day) => {
    const targetDay = day.clone().startOf("day");
    return events.filter((item) => {
      const start = moment(item.tgl_mulai).startOf("day");
      const end = moment(item.tgl_selesai).startOf("day");
      return targetDay.isSameOrAfter(start) && targetDay.isSameOrBefore(end);
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 1. HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: isDark 
            ? `linear-gradient(to right, ${theme.palette.background.paper}, ${theme.palette.action.hover})`
            : "linear-gradient(to right, #ffffff, #f8fafc)",
        }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
              <Group fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                Kalender Tim
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pantau ketersediaan tim dan jadwal cuti anggota.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              bgcolor: theme.palette.background.default,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              p: 0.5,
            }}>
            <IconButton onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, "month"))}>
              <ChevronLeft />
            </IconButton>
            <Typography sx={{ minWidth: 140, textAlign: "center", fontWeight: 700, color: theme.palette.text.primary }}>
              {currentMonth.format("MMMM YYYY")}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(currentMonth.clone().add(1, "month"))}>
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* 2. CALENDAR BODY */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
          width: "100%",
        }}>
        <Box sx={{ display: "flex", width: "100%", bgcolor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}` }}>
          {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
            <Box key={day} sx={{ flex: 1, py: 1.5, textAlign: "center", borderRight: `1px solid ${theme.palette.divider}`, "&:last-child": { borderRight: "none" } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: "uppercase", letterSpacing: 1 }}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          calendar.map((week, i) => (
            <Box key={i} sx={{ display: "flex", width: "100%", borderBottom: `1px solid ${theme.palette.divider}` }}>
              {week.map((day, j) => {
                const listCuti = getCutiOnDate(day);
                const isSelectedMonth = currentMonth.isSame(day, "month");
                const isToday = moment().isSame(day, "day");

                return (
                    <Box
                    key={j}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 140,
                      maxHeight: 180, // Tambahkan maxHeight agar tidak merusak layout
                      overflowY: "auto", // Berikan scrollbar jika isinya banyak
                      p: 1,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      bgcolor: !isSelectedMonth 
                        ? (isDark ? theme.palette.action.disabledBackground : "#f8fafc") 
                        : theme.palette.background.paper,
                      transition: "0.2s",
                      "&:hover": { bgcolor: theme.palette.action.hover },
                      // Kustomisasi scrollbar agar lebih tipis & rapi
                      "&::-webkit-scrollbar": { width: "4px" },
                      "&::-webkit-scrollbar-thumb": { backgroundColor: theme.palette.divider, borderRadius: "4px" }
                    }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday ? 800 : 500,
                          color: isToday ? "#fff" : (!isSelectedMonth ? theme.palette.text.disabled : theme.palette.text.primary),
                          bgcolor: isToday ? theme.palette.primary.main : "transparent",
                          width: 28, height: 28,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "8px",
                        }}>
                        {day.format("D")}
                      </Typography>
                      {listCuti.length > 0 && (
                        <Chip label={listCuti.length} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                      )}
                    </Stack>

                    <Stack spacing={0.5}>
                      {/* Tampilkan semua orang yang cuti tanpa di-slice */}
                      {listCuti.map((cuti, idx) => {
                        const style = getStatusStyle(cuti.jenis_cuti, theme.palette.mode);
                        return (
                          <Tooltip title={`${cuti.pegawai?.nama} (${cuti.jenis_cuti})`} key={idx} arrow>
                            <Box sx={{
                                display: "flex", alignItems: "center", gap: 0.5, px: 0.8, py: 0.4,
                                borderRadius: "6px", bgcolor: style.bg, border: `1px solid ${style.border}`, overflow: "hidden",
                              }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: style.dot, flexShrink: 0 }} />
                              <Typography variant="caption" noWrap sx={{ fontWeight: 600, color: style.text, fontSize: "0.65rem" }}>
                                {cuti.pegawai?.nama?.split(" ")[0]}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Paper>

      {/* 3. LEGEND */}
      <Stack
        direction="row"
        spacing={3}
        sx={{
          mt: 3, justifyContent: "center", p: 2,
          bgcolor: theme.palette.action.hover,
          borderRadius: 3,
        }}>
        <LegendItem color={theme.palette.primary.main} label="Hari Ini" textColor={theme.palette.text.secondary} />
        <LegendItem color="#193b68" label="Cuti Tahunan" textColor={theme.palette.text.secondary} />
        <LegendItem color="#e11d48" label="Cuti Sakit" textColor={theme.palette.text.secondary} />
        <LegendItem color="#0284c7" label="Cuti Lainnya" textColor={theme.palette.text.secondary} />
      </Stack>
    </Container>
  );
};

const LegendItem = ({ color, label, textColor }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
    <Typography variant="caption" sx={{ fontWeight: 700, color: textColor }}>
      {label}
    </Typography>
  </Stack>
);

export default KalenderTim;