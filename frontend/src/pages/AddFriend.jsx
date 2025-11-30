import React, { useState } from 'react'
import api from '../api/axiosInstance'

export default function AddFriend() {
  const [targetUserId, setTargetUserId] = useState('')
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/add-friend', { targetUserId: Number(targetUserId) })
      setMessage(res.data.message || 'Friend request sent')
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
