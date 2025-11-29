import React, { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.get('/profile')
        if (mounted) setProfile(res.data.data)
      } catch (err) {
        setMessage(err.response?.data?.message || err.message)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!profile) return <div className="card">{message || 'Loading profile...'}</div>

  return (
    <div className="card">
      <h2>Dashboard</h2>
      <div className="profile">
        <div><strong>Name:</strong> {profile.name}</div>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>UserID:</strong> {profile.userid}</div>
        <div><strong>Phone:</strong> {profile.phone || '-'}</div>
        <div><strong>Address:</strong> {profile.address || '-'}</div>
        <div><strong>DOB:</strong> {profile.date_of_birth || '-'}</div>
      </div>

      <div className="links">
        <Link to="/update-profile">Update Profile</Link>
        <Link to="/add-friend">Add Friend</Link>
        <Link to="/accept-friend">Accept Friend</Link>
        <Link to="/change-password">Change Password</Link>
        <Link to="/logout">Logout</Link>
      </div>
    </div>
  )
}
