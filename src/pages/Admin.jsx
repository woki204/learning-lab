import { useEffect, useState } from 'react'
import { initializeApp, deleteApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseConfig, usernameToEmail } from '../lib/firebase'
import { listUsers, createUserProfile, updateUserProfile, usernameTaken } from '../lib/db'

/**
 * יצירת משתמש חדש מתבצעת דרך מופע Firebase משני, כדי שהיצירה
 * לא תחליף את החיבור של המנהל שנמצא כרגע במערכת.
 */
async function createAuthUser(username, password) {
  const name = 'admin-worker'
  const existing = getApps().find((a) => a.name === name)
  const worker = existing ?? initializeApp(firebaseConfig, name)
  const workerAuth = getAuth(worker)
  try {
    const cred = await createUserWithEmailAndPassword(
      workerAuth,
      usernameToEmail(username),
      password,
    )
    await signOut(workerAuth)
    return cred.user.uid
  } finally {
    if (!existing) await deleteApp(worker).catch(() => {})
  }
}

export default function Admin() {
  const [users, setUsers] = useState(null)
  const [msg, setMsg] = useState(null)
  const [open, setOpen] = useState(false)

  const load = () => listUsers().then(setUsers).catch((e) => setMsg({ t: 'error', m: e.message }))
  useEffect(() => { load() }, [])

  const toggleDisabled = async (u) => {
    await updateUserProfile(u.id, { disabled: !u.disabled })
    load()
  }

  return (
    <>
      <div className="page-head">
        <h1>ניהול משתמשים</h1>
        <span className="spacer" />
        <button className="btn" onClick={() => setOpen(true)}>+ מרצה חדש</button>
      </div>

      {msg && <div className={'alert ' + msg.t}>{msg.m}</div>}

      {users === null ? (
        <p className="muted">טוען…</p>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>שם משתמש</th>
              <th>שם מלא</th>
              <th>תפקיד</th>
              <th>סטטוס</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.displayName || '—'}</td>
                <td>{u.role === 'admin' ? 'מנהל מערכת' : 'מרצה'}</td>
                <td>
                  {u.disabled ? (
                    <span className="badge off">מושעה</span>
                  ) : u.mustChangePassword ? (
                    <span className="badge off">סיסמה ראשונית</span>
                  ) : (
                    <span className="badge on">פעיל</span>
                  )}
                </td>
                <td style={{ textAlign: 'end' }}>
                  {u.role !== 'admin' && (
                    <button className="btn ghost sm" onClick={() => toggleDisabled(u)}>
                      {u.disabled ? 'הפעל מחדש' : 'השעה'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="tiny muted" style={{ marginTop: 18 }}>
        איפוס סיסמה של משתמש אחר אינו אפשרי מהדפדפן מטעמי אבטחה של Firebase.
        לאיפוס — Firebase Console → Authentication → בחר משתמש → Reset password.
      </p>

      {open && (
        <NewUserModal
          onClose={() => setOpen(false)}
          onCreated={(m) => { setMsg(m); setOpen(false); load() }}
        />
      )}
    </>
  )
}

function NewUserModal({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const uname = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,24}$/.test(uname))
      return setErr('שם משתמש: 3–24 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון.')
    if (password.length < 6) return setErr('הסיסמה הראשונית חייבת להכיל 6 תווים לפחות.')

    setBusy(true)
    try {
      if (await usernameTaken(uname)) throw new Error('שם המשתמש כבר תפוס.')
      const uid = await createAuthUser(uname, password)
      await createUserProfile(uid, {
        username: uname,
        displayName: displayName.trim(),
        role: 'creator',
        disabled: false,
        mustChangePassword: true,
      })
      onCreated({ t: 'ok', m: `המרצה "${uname}" נוצר. מסור לו את הסיסמה הראשונית שקבעת.` })
    } catch (e2) {
      setErr(
        e2.code === 'auth/email-already-in-use' ? 'שם המשתמש כבר תפוס.' : e2.message,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>רישום מרצה חדש</h2>
        {err && <div className="alert error">{err}</div>}
        <label className="field">
          <span>שם משתמש (באנגלית)</span>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="field">
          <span>שם מלא</span>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="field">
          <span>סיסמה ראשונית</span>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="tiny muted" style={{ margin: '6px 0 0' }}>
            המרצה יתבקש להחליף אותה בכניסה הראשונה.
          </p>
        </label>
        <div className="modal-actions">
          <button className="btn" disabled={busy}>{busy ? 'יוצר…' : 'צור משתמש'}</button>
          <button type="button" className="btn ghost" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </div>
  )
}
