import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from '@/pages/Login';

import ForgetPassword from '@/pages/ForgetPassword';
import ResetPassword from '@/pages/ResetPassword';

export default function AuthRouter() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />
      <Route path="*" element={<Navigate to="/login" replace state={{ from }} />} />
    </Routes>
  );
}
