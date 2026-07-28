import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isFirebaseConfigured } from '../lib/firebase'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(
        /invalid-credential|wrong-password|user-not-found/.test(err.code ?? '')
          ? 'שם משתמש או סיסמה שגויים.'
          : err.message || 'הכניסה נכשלה.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>🎓 מעבדת למידה</h1>
        <p className="sub">כניסה למרצים ולמנהלי מערכת</p>

        {!isFirebaseConfigured && (
          <div className="alert warn">
            Firebase עדיין לא מוגדר. מלא את הפרטים ב-<code>src/lib/firebase.js</code>{' '}
            לפי ההוראות ב-README.
          </div>
        )}
        {error && <div className="alert error">{error}</div>}

        <label className="field">
          <span>שם משתמש</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>סיסמה</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'מתחבר…' : 'כניסה'}
        </button>

        <p className="tiny muted" style={{ textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
          לומדים אינם נדרשים להתחבר — הם נכנסים דרך הקישור שקיבלו מהמרצה.
          <br />
          <Link to="/setup">הפעלה ראשונה של המערכת</Link>
        </p>
      </form>
    </div>
  )
}
