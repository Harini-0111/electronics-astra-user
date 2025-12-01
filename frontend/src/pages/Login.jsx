import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import { Link } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    try {
      // ensure credentials are included on this request
      const res = await api.post('/api/auth/login', form, { withCredentials: true })
      setMessage(res.data.message)
      // session cookie stored automatically; go to dashboard
      navigate('/dashboard')
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={submit} className="form">
        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} type="email" required />
        <label>Password</label>
        <input name="password" value={form.password} onChange={handleChange} type="password" required />
        <button type="submit">Login</button>
      </form>
      <div style={{marginTop:12}}>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  )
}
