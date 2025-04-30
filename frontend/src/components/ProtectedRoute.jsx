// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// // สร้าง component สำหรับปกป้องเส้นทางที่ต้องล็อกอินก่อนเข้าถึง
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   const location = useLocation();

//   // ถ้ากำลังโหลดข้อมูลผู้ใช้ จะแสดง loading
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-t-[#800000] border-gray-200 rounded-full animate-spin mx-auto"></div>
//           <p className="mt-2 text-gray-600">กำลังโหลด...</p>
//         </div>
//       </div>
//     );
//   }

//   // ถ้าไม่พบผู้ใช้ (ยังไม่ล็อกอิน) จะ redirect ไปที่หน้าล็อกอิน
//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // ถ้าล็อกอินแล้ว จะแสดง component ลูก
//   return children;
// };

// export default ProtectedRoute;

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.id)) {
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;