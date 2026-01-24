import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';

export default function AdminRoute() {
  const { currentUser } = useSelector((state) => state.user);

  // Check if the user exists and if their role is strictly 'admin'
  // If true, allow access to the child routes (Outlet)
  // If false, redirect them to the home page
  return currentUser && currentUser.role === 'admin' ? (
    <Outlet /> 
  ) : (
    <Navigate to='/' />
  );
}