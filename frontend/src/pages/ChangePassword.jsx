import React, { useState } from 'react'
import api from '../api/axiosInstance'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState(null)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.put('/change-password', form)
      setMessage(res.data.message || 'Password changed')
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Change Password</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={submit} className="form">
        <label>Current Password</label>
        <input name="currentPassword" type="password" value={form.currentPassword} onChange={handle} required />
        <label>New Password</label>
        <input name="newPassword" type="password" value={form.newPassword} onChange={handle} required />
        <button type="submit">Change Password</button>
      </form>
    </div>
  )
}
