import React, { useState, useEffect } from 'react'
import api from '../api/axiosInstance'
import { useNavigate } from 'react-router-dom'

export default function UpdateProfile() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', date_of_birth: '' })
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.get('/profile')
        if (!mounted) return
        const data = res.data.data
        setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '', date_of_birth: data.date_of_birth || '' })
      } catch (err) {
        setMessage(err.response?.data?.message || err.message)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.put('/profile', form)
      setMessage(res.data.message || 'Profile updated')
      // redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Update Profile</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={submit} className="form">
        <label>Name</label>
        <input name="name" value={form.name} onChange={handle} />
        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handle} />
        <label>Address</label>
        <input name="address" value={form.address} onChange={handle} />
        <label>Date of Birth</label>
        <input name="date_of_birth" value={form.date_of_birth} onChange={handle} type="date" />
        <button type="submit">Update</button>
      </form>
    </div>
  )
}
