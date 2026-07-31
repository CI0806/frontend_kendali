import React, { useState } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider,
  Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
    handleClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifikasi</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => markAllAsRead()}>Tandai Semua Dibaca</Button>
          )}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>Tidak ada notifikasi</MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              sx={{ 
                backgroundColor: notif.is_read ? 'inherit' : 'action.hover',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                {notif.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
                {notif.message}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {new Date(notif.created_at).toLocaleString('id-ID')}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
