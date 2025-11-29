import React from 'react'
import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">Electronics Astra</div>
        <div className="links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </nav>
  )
}
