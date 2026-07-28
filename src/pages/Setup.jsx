import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import {
  auth,
  db,
  usernameToEmail,
  USERS_COL,
  META_COL,
  BOOTSTRAP_DOC,
} from '../lib/firebase'

/**
 * עמוד הקמה חד-פעמי — יוצר את מנהל המערכת הראשון.
 *
 * זה קיים כדי שלא יהיה צורך לגעת בקונסול של Firebase: המשתמש
 * בוחר כאן שם וסיסמה, והמערכת יוצרת גם את חשבון ההזדהות וגם את
 * הפרופיל. מיד עם הסיום נכתב מסמך נעילה (ll_meta/bootstrap)
 * שמונע הפעלה חוזרת של העמוד לנצח.
 */
export default function Setup() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const [username, setUsername] = useState('admin')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getDoc(doc(db, META_COL, BOOTSTRAP_DOC))
      .then((snap) => setAlreadyDone(snap.exists()))
      .catch(() => setAlreadyDone(false))
      .finally(() => setChecking(false))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const uname = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,24}$/.test(uname))
      return setErr('שם משתמש: 3–24 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון.')
    if (password.length < 6) return setErr('הסיסמה חייבת להכיל 6 תווים לפחות.')
    if (password !== confirm) return setErr('אימות הסיסמה אינו תואם.')

    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        usernameToEmail(uname),
        password,
      )
      const batch = writeBatch(db)
      batch.set(doc(db, USERS_COL, cred.user.uid), {
        username: uname,
        displayName: displayName.trim() || uname,
        role: 'admin',
        disabled: false,
        mustChangePassword: false,
        createdAt: serverTimestamp(),
      })
      // מסמך הנעילה קריא לכולם (העמוד בודק אותו לפני התחברות),
      // ולכן הוא מכיל תאריך בלבד — שום פרט מזהה.
      batch.set(doc(db, META_COL, BOOTSTRAP_DOC), {
        createdAt: serverTimestamp(),
      })
      await batch.commit()
      navigate('/')
    } catch (e2) {
      setErr(
        e2.code === 'auth/email-already-in-use'
          ? 'שם המשתמש הזה כבר תפוס. בחר שם אחר.'
          : e2.code === 'auth/weak-password'
            ? 'הסיסמה חלשה מדי — בחר סיסמה ארוכה יותר.'
            : e2.message,
      )
      setBusy(false)
    }
  }

  if (checking)
    return <div className="center-screen"><p className="muted">בודק…</p></div>

  if (alreadyDone)
    return (
      <div className="center-screen">
        <div className="login-card">
          <h1>✅ המערכת כבר הוקמה</h1>
          <p className="sub">
            מנהל המערכת נוצר בעבר, ולכן עמוד ההקמה נעול. משתמשים חדשים נרשמים
            מתוך עמוד <strong>ניהול משתמשים</strong>.
          </p>
          <Link className="btn" style={{ width: '100%' }} to="/login">
            למסך הכניסה
          </Link>
        </div>
      </div>
    )

  return (
    <div className="center-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>🚀 הקמת המערכת</h1>
        <p className="sub">
          פעם אחת בלבד — יצירת מנהל המערכת. מכאן והלאה תרשום מרצים מתוך האתר.
        </p>

        {err && <div className="alert error">{err}</div>}

        <label className="field">
          <span>שם משתמש (באנגלית)</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>השם שלך</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="שם פרטי ומשפחה"
          />
        </label>
        <label className="field">
          <span>סיסמה</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="field">
          <span>אימות סיסמה</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'מקים…' : 'צור מנהל מערכת'}
        </button>

        <p className="tiny muted" style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          🔒 הסיסמה נשלחת ישירות ל-Firebase ואינה נשמרת בשום מקום אחר.
          בחר סיסמה שאתה זוכר — אין כרגע שחזור אוטומטי.
        </p>
      </form>
    </div>
  )
}
