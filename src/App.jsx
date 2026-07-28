import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Learn from './pages/Learn'
import Admin from './pages/Admin'
import Account from './pages/Account'
import Setup from './pages/Setup'

function Guard({ children, adminOnly = false }) {
  const { user, profile, loading, isAdmin } = useAuth()
  if (loading) return <div className="center-screen"><p className="muted">טוען…</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile)
    return (
      <div className="center-screen">
        <div className="alert error">
          לחשבון הזה אין פרופיל במערכת. פנה למנהל המערכת.
        </div>
      </div>
    )
  if (profile.disabled)
    return <div className="center-screen"><div className="alert error">החשבון הושעה.</div></div>
  if (adminOnly && !isAdmin)
    return <div className="center-screen"><div className="alert error">אין לך הרשאה לעמוד הזה.</div></div>
  return children
}

function RedirectIfLoggedIn({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="center-screen"><p className="muted">טוען…</p></div>
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* מצב לומד — ציבורי, ללא התחברות */}
          <Route path="/learn/:id" element={<Learn />} />

          <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />

          {/* הקמה חד-פעמית של מנהל המערכת הראשון */}
          <Route path="/setup" element={<Setup />} />

          {/* העורך תופס מסך מלא ולכן אינו עטוף ב-Layout */}
          <Route path="/edit/:id" element={<Guard><Editor /></Guard>} />

          <Route path="/" element={<Guard><Layout><Dashboard /></Layout></Guard>} />
          <Route path="/account" element={<Guard><Layout><Account /></Layout></Guard>} />
          <Route path="/admin" element={<Guard adminOnly><Layout><Admin /></Layout></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
