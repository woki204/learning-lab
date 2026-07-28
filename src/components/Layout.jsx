import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Layout({ children }) {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo">
          <span>🎓</span> מעבדת למידה
        </Link>
        <nav>
          <NavLink to="/" end>
            הסביבות שלי
          </NavLink>
          {isAdmin && <NavLink to="/admin">ניהול משתמשים</NavLink>}
          <NavLink to="/account">החשבון שלי</NavLink>
        </nav>
        <span className="spacer" />
        <span className="muted tiny">
          {profile?.displayName || profile?.username}
          {isAdmin && ' · מנהל'}
        </span>
        <button
          className="btn ghost sm"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
        >
          יציאה
        </button>
      </header>
      <main className="page">{children}</main>
    </>
  )
}
