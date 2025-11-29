import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Dashboard'
import Register from './pages/Register'
import Login from './pages/Login'
import UpdateProfile from './pages/UpdateProfile'
import ChangePassword from './pages/ChangePassword'
import AddFriend from './pages/AddFriend'
import AcceptFriend from './pages/AcceptFriend'
import Logout from './pages/Logout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <div>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

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
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </div>
    </div>
  )
}
