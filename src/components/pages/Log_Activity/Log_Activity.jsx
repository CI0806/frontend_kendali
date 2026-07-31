import React, { useEffect, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, Chip, TextField, InputAdornment, Tooltip,
  TablePagination, LinearProgress, Avatar, Stack, useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  History as HistoryIcon, 
  Info as InfoIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon,
  DesktopWindows as DeviceIcon
} from '@mui/icons-material';
import network from '@/utils/network';

const Log_Activity = () => {
  const theme = useTheme(); // Mengambil mode aktif (light/dark) dari ThemeProvider
  const isDarkMode = theme.palette.mode === 'dark';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await network.get('/pegawai/log');
      setLogs(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil log:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStyle = (level) => {
    switch (level?.toUpperCase()) {
      case 'INFO': return { color: 'info', icon: <InfoIcon fontSize="inherit" /> };
      case 'WARNING': return { color: 'warning', icon: <WarningIcon fontSize="inherit" /> };
      case 'ERROR': return { color: 'error', icon: <ErrorIcon fontSize="inherit" /> };
      default: return { color: 'default', icon: null };
    }
  };

  const filteredLogs = logs.filter(log => 
    log.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      bgcolor: 'background.default', // Mengikuti mode light/dark
      minHeight: '100vh',
      transition: 'background-color 0.3s ease'
    }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        
        {/* HEADER SECTION */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { sm: 'flex-end' }, 
          mb: 4, 
          gap: 2 
        }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <HistoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1.2 }}>
                Audit Trail System
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Log Aktivitas
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Cari aktivitas..."
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            sx={{ 
              bgcolor: 'background.paper', 
              width: { xs: '100%', sm: 350 },
              borderRadius: '12px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              }
            }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon color="disabled" /></InputAdornment>),
            }}
          />
        </Box>

        {/* TABLE SECTION */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            bgcolor: 'background.paper',
            backgroundImage: 'none', // Menghilangkan overlay standar MUI dark mode
            boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 10px 15px -3px rgba(0,0,0,0.05)', 
            borderRadius: '16px', 
            overflow: 'hidden',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(226, 232, 240, 0.8)'
          }}
        >
          {loading && <LinearProgress sx={{ height: 3 }} />}
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {['Waktu', 'Pengguna', 'Aksi', 'Modul', 'Detail', 'IP Address'].map((head) => (
                  <TableCell 
                    key={head} 
                    sx={{ 
                      bgcolor: isDarkMode ? '#1e293b' : '#f8fafc', 
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      py: 2,
                      borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9'
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => {
                const style = getLevelStyle(log.level);
                return (
                  <TableRow 
                    key={log.id} 
                    hover 
                    sx={{ '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.02) !important' : '#f1f5f9 !important' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                         {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ 
                          width: 32, height: 32, 
                          bgcolor: isDarkMode ? 'primary.dark' : 'primary.light', 
                          fontSize: '0.85rem' 
                        }}>
                          {log.nama?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{log.nama || 'System'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{log.nip}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip 
                        label={log.action} 
                        size="small" 
                        color={style.color} 
                        icon={style.icon}
                        variant={isDarkMode ? "outlined" : "filled"}
                        sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px' }}
                      />
                    </TableCell>

                    <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {log.module}
                    </TableCell>

                    <TableCell>
                      <Tooltip title={log.details} arrow>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 200, 
                          color: 'text.secondary',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          fontSize: '0.8rem'
                        }}>
                          {log.details}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ 
              color: 'text.secondary',
              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' 
            }}
          />
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Log_Activity;