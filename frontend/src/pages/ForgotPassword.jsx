import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [stage, setStage] = useState(0) // 0 = enter email, 1 = enter otp to verify, 2 = enter new password
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const sendOtp = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/forgot-password', { email })
      setMessage(res.data.message)
      setStage(1)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/check-reset-otp', { email, otp })
      setMessage(res.data.message)
      setStage(2)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  const reset = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/reset-password', { email, otp, newPassword })
      setMessage(res.data.message)
      // After successful reset, redirect to login
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <h2>Forgot Password</h2>
      {message && <div className="message">{message}</div>}
      {stage === 0 && (
        <form onSubmit={sendOtp} className="form">
          <label>Enter your registered email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>
      )}
      {stage === 1 && (
        <form onSubmit={verifyOtp} className="form">
          <label>Enter OTP sent to your email</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>
      )}
      {stage === 2 && (
        <form onSubmit={reset} className="form">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      )}
      <div style={{ marginTop: 12 }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  )
}
