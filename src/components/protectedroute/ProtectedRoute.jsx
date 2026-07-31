import session from '@/utils/session';
import React from 'react';
// Gunakan react-router (sesuai library yang kamu pakai di App.js)
import { Navigate, Outlet } from 'react-router'; 

const ProtectedRoute = ({ allowedRoles }) => {
  // Ambil data user dari localStorage
  const user = session.getUser();
  //const user = userString ? JSON.parse(userString) : null;

  // DEBUG: Hapus ini jika sudah jalan
  //console.log("User di ProtectedRoute:", user);

  // 1. Jika tidak login, lempar ke /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika ada aturan role dan role user tidak sesuai
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Arahkan ke dashboard saja jika tidak punya akses
    return <Navigate to="/" replace />;
  }

  // 3. JANGAN LUPA return Outlet agar children muncul
  return <Outlet />;
};

export default ProtectedRoute;