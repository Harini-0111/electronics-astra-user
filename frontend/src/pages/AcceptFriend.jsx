import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function AcceptFriend() {
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState(null)

  const load = async () => {
    try {
      const res = await api.get('/friends/requests')
      setRequests(res.data.data || [])
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])
  const navigate = useNavigate()

  const accept = async (fromUserid) => {
    try {
      const res = await api.post('/friends/accept', { fromUserId: fromUserid })
      setMessage(res.data.message || 'Friend request accepted')
      // redirect to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="card">
      <h2>Friend Requests</h2>
      {message && <div className="message">{message}</div>}
      {requests.length === 0 ? (
        <div>No incoming friend requests</div>
      ) : (
        <ul className="requests">
          {requests.map((r) => (
            <li key={r.id} className="request-item">
              <div>
                <strong>{r.from_name}</strong> ({r.from_userid})
                <div className="small">Requested at: {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div>
                <button onClick={() => accept(r.from_userid)}>Accept</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
