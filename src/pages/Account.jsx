import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function Account() {
  const { profile, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (next.length < 6) return setMsg({ t: 'error', m: 'הסיסמה חייבת להכיל 6 תווים לפחות.' })
    if (next !== confirm) return setMsg({ t: 'error', m: 'אימות הסיסמה אינו תואם.' })
    setBusy(true)
    try {
      await changePassword(current, next)
      setMsg({ t: 'ok', m: 'הסיסמה עודכנה בהצלחה.' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      setMsg({
        t: 'error',
        m: /invalid-credential|wrong-password/.test(err.code ?? '')
          ? 'הסיסמה הנוכחית שגויה.'
          : err.message,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>החשבון שלי</h1>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 480 }}>
        <p className="muted" style={{ marginTop: 0 }}>
          שם משתמש: <strong>{profile?.username}</strong>
          <br />
          תפקיד: {profile?.role === 'admin' ? 'מנהל מערכת' : 'מרצה / יוצר'}
        </p>

        {profile?.mustChangePassword && (
          <div className="alert warn">
            נכנסת עם סיסמה ראשונית שקבע המנהל. מומלץ להחליף אותה עכשיו.
          </div>
        )}

        <h3 style={{ marginTop: 20 }}>החלפת סיסמה</h3>
        {msg && <div className={'alert ' + msg.t}>{msg.m}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>סיסמה נוכחית</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
          </label>
          <label className="field">
            <span>סיסמה חדשה</span>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" />
          </label>
          <label className="field">
            <span>אימות סיסמה חדשה</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'מעדכן…' : 'עדכן סיסמה'}</button>
        </form>
      </div>
    </>
  )
}
