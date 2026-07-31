import React from 'react';
import { Box, Avatar, Typography, Badge, styled, useTheme, alpha } from '@mui/material';
import session from '@/utils/session';
import { url } from '@/utils/constants';

// Styled Badge dengan animasi ripple yang adaptif
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': { transform: 'scale(.8)', opacity: 1 },
    '100%': { transform: 'scale(2.4)', opacity: 0 },
  },
}));

const ProfileSection = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const user = session.getUser();

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Avatar Section */}
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        <Avatar 
          src={user?.foto ? `${url}${user.foto}` : null}
          //src={user?.foto ? `http://localhost:3000${user.foto}` : null}
          sx={{ 
            width: 72, 
            height: 72, 
            mb: 2, 
            // Menggunakan warna sukses dari tema (biasanya hijau)
            bgcolor: alpha(theme.palette.success.main, isDarkMode ? 0.2 : 0.1), 
            color: theme.palette.success.main,
            fontSize: '1.8rem',
            fontWeight: 800,
            // Shadow adaptif: gelap di light mode, berpijar (glow) di dark mode
            boxShadow: isDarkMode 
              ? `0 8px 24px ${alpha(theme.palette.common.black, 0.8)}`
              : `0 8px 20px ${alpha(theme.palette.success.main, 0.2)}`, 
            border: `2px solid ${theme.palette.background.paper}`,
            transition: 'all 0.3s ease'
          }}
        >
          {user?.nama ? user.nama.charAt(0).toUpperCase() : 'A'}
        </Avatar>
      </StyledBadge>
      
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        {/* Nama User */}
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary, 
            lineHeight: 1.2,
            letterSpacing: -0.2,
            //textTransform: 'capitalize'
          }}
        >
          {user?.nama || "User Puskesmas"}
        </Typography>

        {/* Badge Jabatan (Chip Style) */}
        <Box 
          sx={{ 
            display: 'inline-block',
            bgcolor: alpha(theme.palette.success.main, isDarkMode ? 0.15 : 0.08), 
            color: isDarkMode ? theme.palette.success.light : theme.palette.success.dark,
            px: 1.5,
            py: 0.4,
            borderRadius: '8px',
            mt: 1,
            mb: 0.5,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              fontSize: '0.65rem', 
              textTransform: 'uppercase',
              display: 'block',
              letterSpacing: 0.5
            }}
          >
            {user?.jabatan || "Staff"}
          </Typography>
        </Box>

        {/* NIP / NIK */}
        <Typography 
          variant="caption" 
          display="block"
          sx={{ 
            color: theme.palette.text.disabled, 
            fontSize: '0.7rem',
            fontFamily: "'JetBrains Mono', monospace", 
            mt: 0.5,
            opacity: 0.8
          }}
        >
          {user?.nip?.length === 18 ? "NIP" : "NIK"}: {user?.nip || "-"}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileSection;