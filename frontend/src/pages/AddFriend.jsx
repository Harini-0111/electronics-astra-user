import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function AddFriend() {
  const [targetUserId, setTargetUserId] = useState('')
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/friends/request', { targetUserId: Number(targetUserId) })
      setMessage(res.data.message || 'Friend request sent')
      // redirect to dashboard after short delay
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Add Friend</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={submit} className="form">
        <label>Target UserID (5-digit)</label>
        <input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} required />
        <button type="submit">Send Friend Request</button>
      </form>
    </div>
  )
}
