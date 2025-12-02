import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Sidebar from './components/Sidebar'
import Home from './pages/Dashboard'
import Register from './pages/Register'
import Login from './pages/Login'
import UpdateProfile from './pages/UpdateProfile'
import ChangePassword from './pages/ChangePassword'
import AddFriend from './pages/AddFriend'
import AcceptFriend from './pages/AcceptFriend'
import FriendProfile from './pages/FriendProfile'
import Library from './pages/Library'
import Logout from './pages/Logout'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation()
  const hideSidebarOn = ['/login', '/register', '/forgot-password']
  const showSidebar = !hideSidebarOn.includes(location.pathname)
  return (
    <div>
      <Nav />
      <div className="dashboard-layout">
        {showSidebar && <Sidebar />}
        <div className="container main-content">
          <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><Home /></ProtectedRoute>}
          />
          <Route
            path="/update-profile"
            element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>}
          />
          <Route
            path="/change-password"
            element={<ProtectedRoute><ChangePassword /></ProtectedRoute>}
          />
          <Route
            path="/add-friend"
            element={<ProtectedRoute><AddFriend /></ProtectedRoute>}
          />
          <Route
            path="/accept-friend"
            element={<ProtectedRoute><AcceptFriend /></ProtectedRoute>}
          />
          <Route
            path="/friend-profile/:userid"
            element={<ProtectedRoute><FriendProfile /></ProtectedRoute>}
          />
          <Route
            path="/library"
            element={<ProtectedRoute><Library /></ProtectedRoute>}
          />
          <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
