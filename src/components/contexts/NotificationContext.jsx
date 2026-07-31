import React, { createContext, useState, useEffect, useContext } from 'react';
import network from '../../utils/network';
import session from '../../utils/session';

export const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);

  // Fungsi untuk ambil data history saat pertama load
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await network.get(`/notifications`);
      const data = response.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  const connectWebSocket = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return;
    
    try {
      const user = JSON.parse(userString);
      const userID = user.id || user.internal_id;
      
      const baseURL = network.defaults.baseURL || 'http://localhost:3000/api/v1';
      // Mengubah http:// menjadi ws://
      const wsUrl = baseURL.replace(/^http/, 'ws') + `/ws/${userID}`;
      
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket Connected");
      };

      socket.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          // Tambahkan ke depan list
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Opsional: Tampilkan browser toast/alert di sini
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting in 5s...");
        setTimeout(connectWebSocket, 5000);
      };

      setWs(socket);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []); // Run once on mount

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await network.put(`/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await network.put(`/notifications/read-all`);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
