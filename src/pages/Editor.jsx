import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, saveCourse, listMedia } from '../lib/db'
import { createSlide, BLOCK_TYPES, gradeBlocks } from '../lib/blocks'
import { RuntimeProvider } from '../lib/runtime'
import { ensureFrame, clampFrame, frameForImage } from '../lib/canvas'
import { useAuth } from '../lib/auth'
import { MediaProvider } from '../lib/mediaContext'
import MediaLibrary from '../components/MediaLibrary'
import { learnLink } from '../lib/links'
import SlideNav from '../components/SlideNav'
import BottomBar from '../components/BottomBar'
import SlideCanvas from '../components/SlideCanvas'
import CanvasBlock from '../components/CanvasBlock'
import StaticBlock from '../components/StaticBlock'
import BlockEditor from '../components/BlockEditor'
import { ElementRibbon, DefaultRibbon } from '../components/Ribbon'
import {
  SideRail,
  TextPanel,
  QuestionPanel,
  MediaPanel,
  CardsPanel,
  SlidesPanel,
} from '../components/SideRail'

const MODES = [
  { key: 'edit', label: '✏️ עריכה' },
  { key: 'preview', label: '👁 תצוגה' },
  { key: 'learner', label: '🎒 לומד' },
]

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [course, setCourse] = useState(null)
  const [mode, setMode] = useState('edit')
  const [index, setIndex] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const [media, setMedia] = useState([])
  const [railTab, setRailTab] = useState('text')
  const [checked, setChecked] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [answers, setAnswers] = useState({})
  const scaleRef = useRef(1)

  useEffect(() => {
    getCourse(id)
      .then((c) => {
        if (!c) return setError('הסביבה לא נמצאה.')
        // כל רכיב מקבל מסגרת אם עדיין אין לו
        c.slides = c.slides.map((s) => ({
          ...s,
          blocks: (s.blocks ?? []).map(ensureFrame),
        }))
        setCourse(c)
      })
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (profile?.id) listMedia(profile.id).then(setMedia).catch(() => {})
  }, [profile?.id])

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

  const patchSlide = useCallback(
    (slideIndex, updater) =>
      patch((c) => ({
        ...c,
        slides: c.slides.map((s, i) =>
          i === slideIndex ? (typeof updater === 'function' ? updater(s) : { ...s, ...updater }) : s,
        ),
      })),
    [patch],
  )

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

  // ── קיצורי מקלדת על הבמה ──
  useEffect(() => {
    if (mode !== 'edit') return
    const onKey = (e) => {
      if (editingId) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!selectedId) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteBlock(selectedId)
        return
      }
      const step = e.shiftKey ? 10 : 1
      const deltas = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      }
      if (deltas[e.key]) {
        e.preventDefault()
        const [dx, dy] = deltas[e.key]
        updateBlockById(selectedId, (b) => ({
          ...b,
          frame: clampFrame({ ...b.frame, x: b.frame.x + dx, y: b.frame.y + dy }),
        }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (error && !course)
    return <div className="center-screen"><div className="alert error">{error}</div></div>
  if (!course) return <div className="center-screen"><p className="muted">טוען…</p></div>

  const slide = course.slides[index] ?? course.slides[0]
  const blocks = slide.blocks ?? []
  const selected = blocks.find((b) => b.id === selectedId) ?? null

  // ── שקופיות ──
  const goToSlide = (i) => {
    setIndex(i)
    setSelectedId(null)
    setEditingId(null)
  }
  const addSlide = () => {
    patch((c) => ({ ...c, slides: [...c.slides, createSlide(c.slides.length)] }))
    setIndex(course.slides.length)
    setSelectedId(null)
  }
  const duplicateSlide = () => {
    const copy = structuredClone(slide)
    copy.id = crypto.randomUUID()
    copy.title += ' (עותק)'
    copy.blocks = copy.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }))
    patch((c) => ({
      ...c,
      slides: [...c.slides.slice(0, index + 1), copy, ...c.slides.slice(index + 1)],
    }))
    setIndex(index + 1)
  }
  const deleteSlide = () => {
    if (course.slides.length === 1) return alert('חייב להישאר לפחות שלב אחד.')
    if (!confirm(`למחוק את שלב ${index + 1}?`)) return
    patch((c) => ({ ...c, slides: c.slides.filter((_, i) => i !== index) }))
    setIndex(Math.max(0, index - 1))
    setSelectedId(null)
  }
  /** גרירת ממוזערת למקום אחר ברצועה */
  const reorderSlides = (from, to) => {
    patch((c) => {
      const slides = [...c.slides]
      const [item] = slides.splice(from, 1)
      slides.splice(to, 0, item)
      return { ...c, slides }
    })
    setIndex(to)
    setSelectedId(null)
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

  // ── רכיבים ──
  const addBlock = (menuItem) => {
    const block = menuItem.make(blocks.length)
    patchSlide(index, (s) => ({ ...s, blocks: [...(s.blocks ?? []), block] }))
    setSelectedId(block.id)
  }
  const updateBlockById = (bid, updater) =>
    patchSlide(index, (s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === bid ? (typeof updater === 'function' ? updater(b) : updater) : b,
      ),
    }))
  const deleteBlock = (bid) => {
    patchSlide(index, (s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== bid) }))
    setSelectedId(null)
    setEditingId(null)
  }
  const duplicateBlock = (bid) => {
    const src = blocks.find((b) => b.id === bid)
    if (!src) return
    const copy = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      frame: clampFrame({ ...src.frame, x: src.frame.x + 20, y: src.frame.y + 20 }),
    }
    patchSlide(index, (s) => ({ ...s, blocks: [...s.blocks, copy] }))
    setSelectedId(copy.id)
  }
  /** שחרור תמונה מהמאגר על הבמה — יוצר רכיב תמונה במקום השחרור */
  const dropMedia = (e, canvasX, canvasY) => {
    const mediaId = e.dataTransfer.getData('application/x-ll-media')
    if (!mediaId) return
    const item = media.find((m) => m.id === mediaId)
    if (!item) return
    const block = {
      ...BLOCK_TYPES.image.create(mediaId),
      frame: frameForImage(canvasX, canvasY, item.w, item.h),
    }
    patchSlide(index, (s) => ({ ...s, blocks: [...(s.blocks ?? []), block] }))
    setSelectedId(block.id)
  }

  // סדר המערך הוא סדר הערימה: אחרון = עליון
  const restack = (bid, dir) =>
    patchSlide(index, (s) => {
      const i = s.blocks.findIndex((b) => b.id === bid)
      const to = dir === 'front' ? s.blocks.length - 1 : dir === 'back' ? 0 : i + dir
      if (i < 0 || to < 0 || to >= s.blocks.length || to === i) return s
      const arr = [...s.blocks]
      const [item] = arr.splice(i, 1)
      arr.splice(to, 0, item)
      return { ...s, blocks: arr }
    })

  const isEditMode = mode === 'edit'
  const mediaMap = Object.fromEntries(media.map((m) => [m.id, m]))

  // בעריכה הרכיבים מוצגים "כבויים"; בתצוגה ובלומד הם חיים
  const runtime = {
    answers,
    setAnswer: (blockId, value) => setAnswers((a) => ({ ...a, [blockId]: value })),
    checked,
    result: checked ? gradeBlocks(blocks, answers) : null,
    onCheck: () => setChecked(true),
    onReset: () => {
      setAnswers({})
      setChecked(false)
    },
    showKey: mode === 'preview',
    interactive: !isEditMode,
  }

  return (
    <MediaProvider value={mediaMap}>
    <RuntimeProvider value={runtime}>
    <div className="stage">
      <div className="stage-bar">
        <button
          className="top-btn"
          onClick={() => {
            if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בכל זאת?')) return
            navigate('/')
          }}
          title="חזרה לרשימת הסביבות"
        >
          🏠
        </button>

        <span className="save-state">
          {saving ? '☁ שומר…' : dirty ? '● לא נשמר' : '✓ נשמר'}
        </span>

        <span className="spacer" />

        {/* שם היחידה נערך במקום, במרכז הסרגל */}
        <input
          className="unit-title"
          value={course.title}
          placeholder="יחידה ללא שם"
          onChange={(e) => patch({ title: e.target.value })}
          title="שם היחידה"
        />

        <span className="spacer" />

        <div className="mode-switch">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={mode === m.key ? 'active' : ''}
              onClick={() => {
                setMode(m.key)
                setSelectedId(null)
                setEditingId(null)
                setChecked(false)
                setAnswers({})
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button className="top-btn" onClick={() => setSettingsOpen(true)} title="הגדרות היחידה">
          ⚙
        </button>
        <button className="top-btn solid" onClick={save} disabled={saving || !dirty}>
          {saving ? 'שומר…' : 'שמור'}
        </button>
      </div>

      {error && <div className="alert error" style={{ margin: '10px 20px 0' }}>{error}</div>}

      {isEditMode && (
        <div className="ribbon">
          {selected ? (
            <ElementRibbon
              block={selected}
              onChange={(nb) => updateBlockById(selected.id, nb)}
              onRestack={(dir) => restack(selected.id, dir)}
              onDuplicate={() => duplicateBlock(selected.id)}
              onDelete={() => deleteBlock(selected.id)}
              onEditContent={() => setContentOpen(true)}
            />
          ) : (
            <DefaultRibbon
              slide={slide}
              index={index}
              total={course.slides.length}
              onRename={(title) => patchSlide(index, { title })}
            />
          )}
        </div>
      )}

      <div className="workspace">
        {isEditMode && <SideRail active={railTab} onSelect={setRailTab} />}

        {isEditMode && railTab && (
          <aside className="side-panel">
            {railTab === 'text' && <TextPanel onAdd={addBlock} />}
            {railTab === 'questions' && <QuestionPanel onAdd={addBlock} />}
            {railTab === 'video' && <MediaPanel onAdd={addBlock} />}
            {railTab === 'cards' && <CardsPanel onAdd={addBlock} />}
            {railTab === 'images' && profile && (
              <MediaLibrary ownerUid={profile.id} media={media} setMedia={setMedia} />
            )}
            {railTab === 'slides' && (
              <SlidesPanel
                slides={course.slides}
                index={index}
                media={media}
                onGo={goToSlide}
                onAdd={addSlide}
                onDuplicate={duplicateSlide}
                onDelete={deleteSlide}
                onMove={moveSlide}
                onRename={(title) => patchSlide(index, { title })}
                onBackground={(background) => patchSlide(index, { background })}
              />
            )}
          </aside>
        )}

        <div className={'stage-body' + (isEditMode ? '' : ' with-nav')}>
        <SlideCanvas
          className={isEditMode ? 'editable' : ''}
          background={slide.background}
          backgroundImage={mediaMap[slide.background?.mediaId]?.dataUrl}
          zoom={isEditMode ? zoom : 1}
          onFitScale={setFitScale}
          onBackgroundPointerDown={() => {
            setSelectedId(null)
            setEditingId(null)
          }}
          onCanvasDrop={isEditMode ? dropMedia : undefined}
        >
          {(scale) => {
            scaleRef.current = scale
            return blocks.map((b) =>
              isEditMode ? (
                <CanvasBlock
                  key={b.id}
                  block={b}
                  scale={scale}
                  selected={b.id === selectedId}
                  editing={b.id === editingId}
                  onSelect={() => setSelectedId(b.id)}
                  onChange={(nb) => updateBlockById(b.id, nb)}
                  onStartEdit={() => setEditingId(b.id)}
                  onEndEdit={() => setEditingId(null)}
                />
              ) : (
                <StaticBlock key={b.id} block={b} />
              ),
            )
          }}
        </SlideCanvas>

        {blocks.length === 0 && isEditMode && (
          <p className="canvas-hint">
            הבמה ריקה — בחר קטגוריה ברצועה שבצד ימין כדי להוסיף רכיב.
          </p>
        )}

        {isEditMode && !selected && blocks.length > 0 && (
          <p className="canvas-hint">
            לחץ על רכיב כדי לבחור ולעצב אותו · גרור להזזה · משוך מהפינות לשינוי גודל ·
            לחיצה כפולה על טקסט פותחת כתיבה
          </p>
        )}

        {mode === 'preview' && (
          <p className="canvas-hint">מצב תצוגה — התשובות הנכונות מסומנות. הלומדים לא רואים אותן.</p>
        )}
        </div>
      </div>

      {isEditMode ? (
        <BottomBar
          slides={course.slides}
          index={index}
          zoom={zoom}
          fitScale={fitScale}
          onZoom={setZoom}
          onGo={goToSlide}
          onAdd={addSlide}
          onDuplicate={duplicateSlide}
          onDelete={deleteSlide}
          onReorder={reorderSlides}
        />
      ) : (
        <SlideNav total={course.slides.length} current={index} onGo={goToSlide} />
      )}

      {contentOpen && selected && (
        <div className="modal-back" onClick={() => setContentOpen(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h2>תוכן הרכיב</h2>
            <BlockEditor
              block={selected}
              onChange={(nb) => updateBlockById(selected.id, nb)}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setContentOpen(false)}>סיום</button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          course={course}
          onChange={patch}
          onClose={() => setSettingsOpen(false)}
          courseId={id}
        />
      )}
    </div>
    </RuntimeProvider>
    </MediaProvider>
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
