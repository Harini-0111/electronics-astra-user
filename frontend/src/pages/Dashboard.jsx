import React, { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState(null)
  const [friends, setFriends] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.get('/profile')
        if (mounted) setProfile(res.data.data)
        const f = await api.get('/friends')
        if (mounted) setFriends(f.data.data || [])
      } catch (err) {
        setMessage(err.response?.data?.message || err.message)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!profile) return <div className="card">{message || 'Loading profile...'}</div>

  return (
    <div className="dashboard-grid">
      <section className="card profile-card">
        <div className="profile-header">
          <div className="avatar-large">{(profile.name || 'S').charAt(0).toUpperCase()}</div>
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
      </section>

      <section className="card friends-card">
        <h3>Your Friends</h3>
        {friends.length === 0 ? (
          <div className="muted">You have no friends yet. Add some using Add Friend.</div>
        ) : (
          <ul className="friends-grid">
            {friends.map(fr => (
              <li key={fr.id} className="friend-tile">
                <div className="friend-avatar">{(fr.name || 'U').charAt(0)}</div>
                <div>
                  <div className="friend-name">{fr.name}</div>
                  <div className="small">{fr.userid}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card actions-card">
        <h3>Quick Actions</h3>
        <div className="actions">
          <Link className="action" to="/update-profile">Edit Profile</Link>
          <Link className="action" to="/add-friend">Add Friend</Link>
          <Link className="action" to="/accept-friend">View Requests</Link>
          <Link className="action" to="/change-password">Change Password</Link>
        </div>
      </section>
    </div>
  )
}
