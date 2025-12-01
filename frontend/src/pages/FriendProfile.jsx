import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function FriendProfile() {
  const { userid } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!userid) throw new Error('Missing userid')
        const res = await api.get(`/friend-profile/${userid}`)
        if (!mounted) return
        setProfile(res.data?.data || null)
      } catch (err) {
        if (!mounted) return
        const msg = err.response?.data?.message || err.message || 'Failed to load profile'
        setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [userid])

  if (loading) return <div className="card">Loading friend profile...</div>
  if (error) return (
    <div className="card error">
      <div>{error}</div>
      <div style={{ marginTop: 8 }}><Link to="/dashboard">Back to Dashboard</Link></div>
    </div>
  )
  if (!profile) return <div className="card">No profile available.</div>

  return (
    <div className="card profile-card">
      <div className="profile-header">
        <div className="avatar-large">{(profile.name || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <h2>{profile.name}</h2>
          <div className="small">{profile.email}</div>
          <div className="small">UserID: <strong>{profile.userid}</strong></div>
        </div>
      </div>
      <div className="profile-body">
        <div><strong>Phone:</strong> {profile.phone || '-'}</div>
        <div><strong>Address:</strong> {profile.address || '-'}</div>
        <div><strong>DOB:</strong> {profile.date_of_birth || '-'}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link to="/dashboard" className="action">Back to Dashboard</Link>
      </div>
    </div>
  )
}

