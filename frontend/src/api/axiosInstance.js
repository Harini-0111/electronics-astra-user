import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Ensure axios sends cookies on cross-site requests
api.defaults.withCredentials = true

export default api
