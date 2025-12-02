import React from 'react'
import { NavLink } from 'react-router-dom'
import { HomeIcon, UserIcon, PlusIcon, MailIcon, LockIcon, LogoutIcon, LibraryIcon } from './icons'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="profile-blurb">
          <div className="avatar">EA</div>
          <div>
            <div className="name">Student</div>
            <div className="small">Welcome back</div>
          </div>
        </div><br></br>
        <nav className="side-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}><HomeIcon className="side-icon"/> Dashboard</NavLink>
          <NavLink to="/update-profile" className={({isActive}) => isActive ? 'active' : ''}><UserIcon className="side-icon"/> Profile</NavLink>
          <NavLink to="/library" className={({isActive}) => isActive ? 'active' : ''}><LibraryIcon className="side-icon"/> Library</NavLink>
          <NavLink to="/add-friend" className={({isActive}) => isActive ? 'active' : ''}><PlusIcon className="side-icon"/> Add Friend</NavLink>
          <NavLink to="/accept-friend" className={({isActive}) => isActive ? 'active' : ''}><MailIcon className="side-icon"/> Requests</NavLink>
          <NavLink to="/change-password" className={({isActive}) => isActive ? 'active' : ''}><LockIcon className="side-icon"/> Change Password</NavLink>
          <NavLink to="/logout"><LogoutIcon className="side-icon"/> Logout</NavLink>
        </nav>
      </div>
    </aside>
  )
}
