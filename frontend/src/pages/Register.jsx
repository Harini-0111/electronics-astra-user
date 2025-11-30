import React, { useState } from 'react'
import api from '../api/axiosInstance'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [otpMode, setOtpMode] = useState(false)
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await api.post('/api/auth/register', form)
      setMessage(res.data.message || 'Registered — check email for OTP')
      setOtpMode(true)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/api/auth/verify-otp', { email: form.email, otp })
      setMessage(res.data.message || 'Verified — you can login')
      setOtpMode(false)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Register</h2>
      {message && <div className="message">{message}</div>}
      {!otpMode ? (
        <form onSubmit={submit} className="form">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} type="email" required />
          <label>Password</label>
          <input name="password" value={form.password} onChange={handleChange} type="password" required />
          <button type="submit">Register</button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="form">
          <label>Enter OTP sent to your email</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  )
}
