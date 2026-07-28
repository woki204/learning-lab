import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCourse } from '../lib/db'
import { gradeCourse } from '../lib/blocks'
import SlideNav from '../components/SlideNav'
import BlockRenderer from '../components/BlockRenderer'
import Certificate from '../components/Certificate'

/**
 * מצב לומד — הכניסה הציבורית דרך הקישור שהמרצה שיתף.
 * אין התחברות, ושום דבר לא נשלח חזרה לשרת: השם והתשובות חיים
 * בזיכרון הדפדפן בלבד עד שהלומד סוגר את הלשונית.
 */
export default function Learn() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')

  const [stage, setStage] = useState('intro') // intro → run → done
  const [name, setName] = useState('')
  const [index, setIndex] = useState(0)
  const [visited, setVisited] = useState(new Set([0]))
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    getCourse(id)
      .then((c) => {
        if (!c) return setError('הסביבה המבוקשת לא נמצאה. בדוק את הקישור מול המרצה.')
        if (!c.published) return setError('הסביבה הזו עדיין לא פורסמה על ידי המרצה.')
        setCourse(c)
      })
      .catch(() => setError('לא ניתן לטעון את הסביבה. נסה שוב מאוחר יותר.'))
  }, [id])

  const go = (i) => {
    setIndex(i)
    setVisited((v) => new Set(v).add(i))
  }

  const restart = () => {
    setAnswers({})
    setIndex(0)
    setVisited(new Set([0]))
    setStage('intro')
  }

  if (error) return <div className="center-screen"><div className="alert error">{error}</div></div>
  if (!course) return <div className="center-screen"><p className="muted">טוען…</p></div>

  // ── מסך פתיחה ──
  if (stage === 'intro') {
    return (
      <div className="center-screen">
        <form
          className="login-card"
          onSubmit={(e) => { e.preventDefault(); setStage('run') }}
        >
          <h1>{course.title}</h1>
          {course.description && <p className="sub">{course.description}</p>}
          <p className="tiny muted" style={{ textAlign: 'center' }}>
            {course.slides.length} שלבים · מנחה: {course.ownerName || '—'}
          </p>
          <label className="field">
            <span>השם שלך (יופיע על התעודה)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם פרטי ומשפחה"
              required
            />
          </label>
          <button className="btn" style={{ width: '100%' }}>התחל</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
            🔒 השם והתשובות שלך נשארים במכשיר שלך בלבד ואינם נשמרים במערכת.
          </p>
        </form>
      </div>
    )
  }

  // ── תעודה ──
  if (stage === 'done') {
    const result = gradeCourse(course, answers)
    return (
      <div className="stage-body" style={{ padding: '30px 20px' }}>
        <Certificate course={course} learnerName={name} result={result} onRestart={restart} />
      </div>
    )
  }

  // ── מהלך הלמידה ──
  const slide = course.slides[index]
  const isLast = index === course.slides.length - 1

  return (
    <div className="stage">
      <div className="stage-bar">
        <span className="title">{course.title}</span>
        <span className="spacer" />
        <span className="muted tiny">{name}</span>
      </div>

      <div className="stage-body">
        <div className="slide">
          <h2 className="slide-title">{slide.title}</h2>
          {slide.blocks.length === 0 && <p className="slide-empty">השלב הזה ריק.</p>}
          {slide.blocks.map((b) => (
            <BlockRenderer
              key={b.id}
              block={b}
              answer={answers[b.id]}
              onAnswer={(bid, val) => setAnswers((a) => ({ ...a, [bid]: val }))}
            />
          ))}

          {isLast && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <button className="btn" onClick={() => setStage('done')}>
                🏅 סיים והנפק תעודה
              </button>
            </div>
          )}
        </div>
      </div>

      <SlideNav
        total={course.slides.length}
        current={index}
        onGo={go}
        visited={visited}
      />
    </div>
  )
}
