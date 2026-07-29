import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listCourses, newCourse, removeCourse } from '../lib/db'
import { learnLink } from '../lib/links'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const load = async () => {
    try {
      setCourses(await listCourses(profile.id))
    } catch (err) {
      setError(err.message)
      setCourses([])
    }
  }

  useEffect(() => {
    if (profile) load()
  }, [profile?.id])

  const create = async () => {
    const id = await newCourse(profile)
    navigate(`/edit/${id}`)
  }

  const copyLink = async (id) => {
    await navigator.clipboard.writeText(learnLink(id))
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const del = async (course) => {
    if (!confirm(`למחוק לצמיתות את "${course.title}"? הפעולה אינה הפיכה.`)) return
    await removeCourse(course.id)
    load()
  }

  return (
    <>
      <div className="page-head">
        <h1>הסביבות שלי</h1>
        <span className="spacer" />
        <button className="btn subtle" onClick={() => navigate('/import')}>
          📄 המרה ממסמך פיתוח
        </button>
        <button className="btn" onClick={create}>+ סביבת למידה חדשה</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {courses === null && <p className="muted">טוען…</p>}

      {courses?.length === 0 && (
        <div className="empty">
          <p style={{ fontSize: 40, margin: 0 }}>🧪</p>
          <p>עדיין לא יצרת סביבות למידה.</p>
          <button className="btn" onClick={create}>צור את הראשונה</button>
        </div>
      )}

      <div className="course-grid">
        {courses?.map((c) => (
          <div className="card course-card" key={c.id}>
            <div>
              <span className={'badge ' + (c.published ? 'on' : 'off')}>
                {c.published ? 'פורסם' : 'טיוטה'}
              </span>
            </div>
            <h3>{c.title}</h3>
            <p className="tiny muted" style={{ margin: 0 }}>
              {c.description || 'ללא תיאור'}
            </p>
            <p className="tiny muted" style={{ margin: 0 }}>
              {c.slides?.length ?? 0} שלבים
            </p>
            <div className="row">
              <button className="btn sm" onClick={() => navigate(`/edit/${c.id}`)}>
                עריכה
              </button>
              <button
                className="btn subtle sm"
                onClick={() => copyLink(c.id)}
                disabled={!c.published}
                title={c.published ? 'העתק קישור ללומדים' : 'יש לפרסם את הסביבה כדי לשתף'}
              >
                {copied === c.id ? '✓ הועתק' : '🔗 קישור'}
              </button>
              <button className="btn danger sm" onClick={() => del(c)}>מחק</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
