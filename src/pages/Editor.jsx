import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, saveCourse } from '../lib/db'
import { BLOCK_TYPES, blockTypeList, createSlide } from '../lib/blocks'
import { learnLink } from '../lib/links'
import SlideNav from '../components/SlideNav'
import BlockEditor from '../components/BlockEditor'
import BlockRenderer from '../components/BlockRenderer'

const MODES = [
  { key: 'edit', label: '✏️ עריכה' },
  { key: 'preview', label: '👁 תצוגה' },
  { key: 'learner', label: '🎒 לומד' },
]

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [mode, setMode] = useState('edit')
  const [index, setIndex] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [answers, setAnswers] = useState({}) // רק לניסוי במצב לומד

  useEffect(() => {
    getCourse(id)
      .then((c) => (c ? setCourse(c) : setError('הסביבה לא נמצאה.')))
      .catch((e) => setError(e.message))
  }, [id])

  // אזהרה לפני יציאה עם שינויים שלא נשמרו
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const patch = useCallback((updater) => {
    setCourse((c) => (typeof updater === 'function' ? updater(c) : { ...c, ...updater }))
    setDirty(true)
  }, [])

  const patchSlide = (slideIndex, updater) =>
    patch((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === slideIndex ? (typeof updater === 'function' ? updater(s) : { ...s, ...updater }) : s,
      ),
    }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await saveCourse(id, course)
      setDirty(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (error && !course) return <div className="center-screen"><div className="alert error">{error}</div></div>
  if (!course) return <div className="center-screen"><p className="muted">טוען…</p></div>

  const slide = course.slides[index] ?? course.slides[0]

  // ── פעולות על שקופיות ──
  const addSlide = () => {
    patch((c) => ({ ...c, slides: [...c.slides, createSlide(c.slides.length)] }))
    setIndex(course.slides.length)
  }
  const duplicateSlide = () => {
    const copy = structuredClone(slide)
    copy.id = crypto.randomUUID()
    copy.title += ' (עותק)'
    copy.blocks = copy.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }))
    patch((c) => ({ ...c, slides: [...c.slides.slice(0, index + 1), copy, ...c.slides.slice(index + 1)] }))
    setIndex(index + 1)
  }
  const deleteSlide = () => {
    if (course.slides.length === 1) return alert('חייב להישאר לפחות שלב אחד.')
    if (!confirm(`למחוק את שלב ${index + 1}?`)) return
    patch((c) => ({ ...c, slides: c.slides.filter((_, i) => i !== index) }))
    setIndex(Math.max(0, index - 1))
  }
  const moveSlide = (dir) => {
    const to = index + dir
    if (to < 0 || to >= course.slides.length) return
    patch((c) => {
      const slides = [...c.slides]
      ;[slides[index], slides[to]] = [slides[to], slides[index]]
      return { ...c, slides }
    })
    setIndex(to)
  }

  // ── פעולות על בלוקים ──
  const addBlock = (typeKey) =>
    patchSlide(index, (s) => ({ ...s, blocks: [...s.blocks, BLOCK_TYPES[typeKey].create()] }))
  const updateBlock = (bi, block) =>
    patchSlide(index, (s) => ({ ...s, blocks: s.blocks.map((b, i) => (i === bi ? block : b)) }))
  const deleteBlock = (bi) =>
    patchSlide(index, (s) => ({ ...s, blocks: s.blocks.filter((_, i) => i !== bi) }))
  const moveBlock = (bi, dir) =>
    patchSlide(index, (s) => {
      const to = bi + dir
      if (to < 0 || to >= s.blocks.length) return s
      const blocks = [...s.blocks]
      ;[blocks[bi], blocks[to]] = [blocks[to], blocks[bi]]
      return { ...s, blocks }
    })

  return (
    <div className="stage">
      <div className="stage-bar">
        <button className="btn ghost sm" onClick={() => {
          if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בכל זאת?')) return
          navigate('/')
        }}>
          → חזרה
        </button>
        <span className="title">{course.title}</span>
        {dirty && <span className="tiny" style={{ color: 'var(--warn)' }}>● לא נשמר</span>}

        <span className="spacer" />

        <div className="mode-switch">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={mode === m.key ? 'active' : ''}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button className="btn ghost sm" onClick={() => setSettingsOpen(true)}>⚙ הגדרות</button>
        <button className="btn sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'שומר…' : 'שמור'}
        </button>
      </div>

      {error && <div className="alert error" style={{ margin: '10px 20px 0' }}>{error}</div>}

      <div className="stage-body">
        <div className="slide">
          {mode === 'edit' ? (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 20 }}>
                <label className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <span>כותרת השלב ({index + 1} מתוך {course.slides.length})</span>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => patchSlide(index, { title: e.target.value })}
                  />
                </label>
                <button className="btn ghost sm" onClick={() => moveSlide(-1)} disabled={index === 0} title="הזז שלב אחורה">▲</button>
                <button className="btn ghost sm" onClick={() => moveSlide(1)} disabled={index === course.slides.length - 1} title="הזז שלב קדימה">▼</button>
                <button className="btn subtle sm" onClick={duplicateSlide}>שכפל</button>
                <button className="btn danger sm" onClick={deleteSlide}>מחק שלב</button>
              </div>

              {slide.blocks.length === 0 && (
                <p className="slide-empty">השלב ריק — הוסף כלי מהתפריט שלמטה.</p>
              )}

              {slide.blocks.map((b, bi) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  onChange={(nb) => updateBlock(bi, nb)}
                  onDelete={() => deleteBlock(bi)}
                  onMove={(d) => moveBlock(bi, d)}
                  isFirst={bi === 0}
                  isLast={bi === slide.blocks.length - 1}
                />
              ))}

              <div className="add-menu">
                <span className="tiny muted" style={{ alignSelf: 'center' }}>הוסף כלי:</span>
                {blockTypeList.map((t) => (
                  <button key={t.key} className="btn subtle sm" onClick={() => addBlock(t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
                <span className="spacer" style={{ flex: 1 }} />
                <button className="btn subtle sm" onClick={addSlide}>+ שלב חדש</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="slide-title">{slide.title}</h2>
              {slide.blocks.length === 0 && <p className="slide-empty">השלב הזה ריק.</p>}
              {slide.blocks.map((b) => (
                <BlockRenderer
                  key={b.id}
                  block={b}
                  answer={answers[b.id]}
                  onAnswer={(bid, val) => setAnswers((a) => ({ ...a, [bid]: val }))}
                  showKey={mode === 'preview'}
                />
              ))}
              {mode === 'preview' && (
                <p className="tiny muted" style={{ marginTop: 24, marginBottom: 0 }}>
                  מצב תצוגה — התשובות הנכונות מסומנות. הלומדים לא רואים אותן.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <SlideNav total={course.slides.length} current={index} onGo={setIndex} />

      {settingsOpen && (
        <SettingsModal
          course={course}
          onChange={patch}
          onClose={() => setSettingsOpen(false)}
          courseId={id}
        />
      )}
    </div>
  )
}

function SettingsModal({ course, onChange, onClose, courseId }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>הגדרות הסביבה</h2>
        <label className="field">
          <span>שם הסביבה</span>
          <input type="text" value={course.title} onChange={(e) => onChange({ title: e.target.value })} />
        </label>
        <label className="field">
          <span>תיאור קצר</span>
          <textarea rows={3} value={course.description} onChange={(e) => onChange({ description: e.target.value })} />
        </label>
        <label className="field">
          <span>ציון עובר (0–100)</span>
          <input
            type="number" min="0" max="100"
            value={course.passScore ?? 60}
            onChange={(e) => onChange({ passScore: Number(e.target.value) })}
          />
        </label>
        <label style={{ display: 'flex', gap: 9, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!course.published}
            onChange={(e) => onChange({ published: e.target.checked })}
            style={{ width: 'auto' }}
          />
          <span>פרסם — מאפשר ללומדים להיכנס דרך הקישור</span>
        </label>

        <div className="field" style={{ marginTop: 18 }}>
          <span>קישור ללומדים</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" readOnly value={learnLink(courseId)} onFocus={(e) => e.target.select()} />
            <button
              className="btn subtle"
              onClick={async () => {
                await navigator.clipboard.writeText(learnLink(courseId))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? '✓' : 'העתק'}
            </button>
          </div>
          {!course.published && (
            <p className="tiny muted" style={{ margin: '6px 0 0' }}>
              הקישור יעבוד רק אחרי פרסום ושמירה.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  )
}
