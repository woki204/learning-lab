import { useState, useMemo } from 'react'
import { textCss, normalizeTextBlock } from '../lib/typography'
import { useMedia } from '../lib/mediaContext'
import { useRuntime } from '../lib/runtime'
import { parseCloze, clozeBlankCorrect, CALLOUT_TONES, BLOCK_TYPES } from '../lib/blocks'
import { parseGlossary, hasGlossary, stableShuffle } from '../lib/inline'
import { videoEmbed } from '../lib/video'
import GlossaryTerm from './GlossaryTerm'
import Lightbox from './Lightbox'

/**
 * מציג את תוכן הרכיב בלבד — בלי מסגרת, מילוי או מיקום.
 * העטיפה (CanvasBlock בעריכה, StaticBlock בתצוגה) אחראית לעיצוב
 * התיבה ולמיקום שלה על הבמה.
 */
export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'text':
      return <TextView block={normalizeTextBlock(block)} />
    case 'image':
      return <ImageView block={block} />
    case 'video':
      return <VideoView block={block} />
    case 'question':
      return <ChoiceView block={block} />
    case 'multi':
      return <MultiView block={block} />
    case 'cloze':
      return <ClozeView block={block} />
    case 'audio':
      return <AudioView block={block} />
    case 'gallery':
      return <GalleryView block={block} />
    case 'reveal':
      return <RevealView block={block} />
    case 'tabs':
      return <TabsView block={block} />
    case 'match':
      return <MatchView block={block} />
    case 'sort':
      return <SortView block={block} />
    case 'open':
      return <OpenView block={block} />
    case 'callout':
      return <CalloutView block={block} />
    case 'tool':
      return <ToolView block={block} />
    case 'source':
      return <SourceView block={block} />
    case 'check':
      return <CheckView block={block} />
    default:
      return (
        <div className="muted tiny">
          סוג רכיב לא מוכר: <code>{block.type}</code>
        </div>
      )
  }
}

function TextView({ block }) {
  const Tag = block.variant === 'title' ? 'h2' : block.variant === 'subtitle' ? 'h3' : 'div'
  return (
    <Tag className="text-content" style={{ ...textCss(block.style), margin: 0 }}>
      <RichText text={block.content} />
    </Tag>
  )
}

/** טקסט שעשוי לכלול "מילים חמות" בסימון ((מילה|הסבר)) */
function RichText({ text }) {
  if (!hasGlossary(text)) return text ?? ''
  return parseGlossary(text).map((p, i) =>
    p.kind === 'text' ? (
      <span key={i}>{p.text}</span>
    ) : (
      <GlossaryTerm key={i} term={p.term} definition={p.definition} />
    ),
  )
}

function ImageView({ block }) {
  const media = useMedia()
  const { interactive } = useRuntime()
  const [zoom, setZoom] = useState(false)
  const item = media[block.mediaId]

  if (!item)
    return (
      <div className="media-placeholder">
        <span>🖼</span>
        <span className="tiny">גרור תמונה מהמאגר</span>
      </div>
    )

  const canZoom = block.zoomable !== false && interactive
  return (
    <>
      <img
        className={'image-block' + (canZoom ? ' zoomable' : '')}
        src={item.dataUrl}
        alt={block.alt || item.name || ''}
        style={{ objectFit: block.fit ?? 'contain' }}
        draggable={false}
        onClick={() => canZoom && setZoom(true)}
        title={canZoom ? 'לחצו להגדלה' : undefined}
      />
      {zoom && (
        <Lightbox
          src={item.dataUrl}
          alt={block.alt}
          caption={block.alt}
          onClose={() => setZoom(false)}
        />
      )}
    </>
  )
}

function AudioView({ block }) {
  if (!block.url)
    return (
      <div className="media-placeholder">
        <span>🎧</span>
        <span className="tiny">הדבק קישור לקובץ שמע בסרגל</span>
      </div>
    )
  return (
    <div className="audio-block">
      {block.title && <div className="audio-title">🎧 {block.title}</div>}
      <audio src={block.url} controls preload="none" />
    </div>
  )
}

function GalleryView({ block }) {
  const media = useMedia()
  const { interactive } = useRuntime()
  const [shown, setShown] = useState(1)
  const [zoom, setZoom] = useState(null)
  const items = (block.items ?? []).filter((it) => media[it.mediaId])

  if (items.length === 0)
    return (
      <div className="media-placeholder">
        <span>🖼️</span>
        <span className="tiny">הוסף תמונות לגלריה בסרגל</span>
      </div>
    )

  const sequence = block.mode === 'sequence'
  const visible = sequence ? items.slice(0, shown) : items

  return (
    <div className="gallery-block">
      <div className="gallery-strip">
        {visible.map((it) => (
          <figure key={it.id} className="gallery-item" onClick={() => interactive && setZoom(it)}>
            <img src={media[it.mediaId].dataUrl} alt={it.caption ?? ''} draggable={false} />
            {it.caption && <figcaption>{it.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {sequence && interactive && (
        <div className="gallery-controls">
          <button
            className="btn sm"
            onClick={() => setShown((n) => Math.min(items.length, n + 1))}
            disabled={shown >= items.length}
          >
            התמונה הבאה
          </button>
          <span className="tiny muted">{Math.min(shown, items.length)} מתוך {items.length}</span>
          {shown > 1 && (
            <button className="btn ghost sm" onClick={() => setShown(1)}>מהתחלה</button>
          )}
        </div>
      )}

      {zoom && (
        <Lightbox
          src={media[zoom.mediaId].dataUrl}
          alt={zoom.caption}
          caption={zoom.caption}
          onClose={() => setZoom(null)}
        />
      )}
    </div>
  )
}

function RevealView({ block }) {
  const { interactive } = useRuntime()
  const media = useMedia()
  const [open, setOpen] = useState(false)
  const item = media[block.mediaId]

  const body = (
    <>
      {item && <img className="reveal-image" src={item.dataUrl} alt="" draggable={false} />}
      {block.title && <strong className="reveal-title">{block.title}</strong>}
      <div className="reveal-body">
        <RichText text={block.body} />
      </div>
      {block.credit && <div className="reveal-credit tiny muted">{block.credit}</div>}
    </>
  )

  if (block.mode === 'popup') {
    return (
      <>
        <button
          className="reveal-card"
          onClick={() => interactive && setOpen(true)}
          disabled={!interactive}
        >
          <span className="reveal-front">
            <RichText text={block.front} />
          </span>
          <span className="reveal-hint tiny">לחצו להרחבה ↗</span>
        </button>
        {open && (
          <div className="modal-back" onClick={() => setOpen(false)}>
            <div className="modal reveal-modal" onClick={(e) => e.stopPropagation()}>
              {body}
              <div className="modal-actions">
                <button className="btn" onClick={() => setOpen(false)}>סגירה</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="reveal-inline">
      {block.front && (
        <div className="reveal-front">
          <RichText text={block.front} />
        </div>
      )}
      {open ? (
        <div className="reveal-opened">{body}</div>
      ) : (
        <button className="btn" onClick={() => setOpen(true)} disabled={!interactive}>
          {block.buttonLabel || 'גלו את התשובה'}
        </button>
      )}
    </div>
  )
}

function TabsView({ block }) {
  const items = block.items ?? []
  const [active, setActive] = useState(0)
  if (items.length === 0) return <div className="muted tiny">הוסיפו לשוניות בסרגל.</div>
  const current = items[Math.min(active, items.length - 1)]

  return (
    <div className="tabs-block">
      <div className="tabs-head" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={i === active}
            className={'tab-btn' + (i === active ? ' active' : '')}
            onClick={() => setActive(i)}
          >
            {it.label || `לשונית ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="tabs-body">
        <RichText text={current.body} />
      </div>
    </div>
  )
}

function MatchView({ block }) {
  const { answers, setAnswer, checked, showKey, interactive } = useRuntime()
  const linked = answers[block.id] ?? {}
  const [pick, setPick] = useState(null)
  const pairs = block.pairs ?? []

  // הטור הימני מעורבב, אחרת ההתאמה הנכונה היא פשוט שורה מול שורה
  const rights = useMemo(
    () => (block.shuffle === false ? pairs : stableShuffle(pairs, block.id)),
    [pairs, block.shuffle, block.id],
  )

  const usedBy = (rightId) => pairs.find((p) => linked[p.id] === rightId)
  const link = (leftId, rightId) => {
    if (!interactive || checked) return
    const next = { ...linked }
    // ביטול התאמה קודמת של אותו פריט ימני
    Object.keys(next).forEach((k) => next[k] === rightId && delete next[k])
    next[leftId] = rightId
    setAnswer(block.id, next)
    setPick(null)
  }

  const numOf = (leftId) => pairs.findIndex((p) => p.id === leftId) + 1

  return (
    <div className="q-block match-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}

      <div className="match-cols">
        <div className="match-col">
          {pairs.map((p) => {
            const state = checked ? (linked[p.id] === p.id ? 'right' : 'wrong') : null
            return (
              <button
                key={p.id}
                className={
                  'match-item' +
                  (pick === p.id ? ' picked' : '') +
                  (linked[p.id] ? ' linked' : '') +
                  (state ? ' ' + state : '')
                }
                onClick={() => interactive && !checked && setPick(pick === p.id ? null : p.id)}
              >
                <span className="match-num">{numOf(p.id)}</span>
                <span>{p.left}</span>
                {state && <Mark state={state} />}
              </button>
            )
          })}
        </div>

        <div className="match-col">
          {rights.map((p) => {
            const owner = usedBy(p.id)
            const state = checked && owner ? (owner.id === p.id ? 'right' : 'wrong') : null
            return (
              <button
                key={p.id}
                className={
                  'match-item' +
                  (owner ? ' linked' : '') +
                  (showKey ? ' key' : '') +
                  (state ? ' ' + state : '')
                }
                onClick={() => pick && link(pick, p.id)}
              >
                {owner && <span className="match-num">{numOf(owner.id)}</span>}
                <span>{p.right}</span>
              </button>
            )
          })}
        </div>
      </div>

      {interactive && !checked && (
        <p className="tiny muted match-hint">
          {pick ? 'עכשיו לחצו על הפריט המתאים בטור השני' : 'לחצו על פריט בטור הראשון'}
        </p>
      )}

      <Feedback block={block} />
    </div>
  )
}

function VideoView({ block }) {
  const embed = videoEmbed(block.url, block.start)
  if (!embed)
    return (
      <div className="media-placeholder">
        <span>🎬</span>
        <span className="tiny">הדבק קישור לסרטון בסרגל</span>
      </div>
    )
  if (embed.kind === 'file')
    return <video className="video-block" src={embed.src} controls playsInline />
  return (
    <iframe
      className="video-block"
      src={embed.src}
      title="סרטון"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  )
}

/** סימון ✓ / ✗ שמופיע אחרי בדיקה */
function Mark({ state }) {
  if (!state) return null
  return <span className={'ans-mark ' + state}>{state === 'right' ? '✓' : '✗'}</span>
}

function ChoiceView({ block }) {
  const { answers, setAnswer, checked, showKey, interactive } = useRuntime()
  const answer = answers[block.id]
  const cards = block.display === 'cards'
  const options = useShuffledOptions(block)

  return (
    <div className="q-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}
      <div
        className={cards ? 'q-cards' : 'q-options'}
        style={cards ? { gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` } : undefined}
      >
        {options.map((opt) => {
          const selected = answer === opt.id
          const isKey = block.correctId === opt.id
          // בסקר עמדה אין נכון ושגוי — רק סימון מה נבחר
          const state = block.poll
            ? null
            : checked
              ? isKey
                ? 'right'
                : selected
                  ? 'wrong'
                  : null
              : null
          return (
            <label
              key={opt.id}
              className={
                (cards ? 'q-card' : 'q-option') +
                (selected ? ' selected' : '') +
                (showKey && isKey && !block.poll ? ' key-correct' : '') +
                (state ? ' ' + state : '')
              }
            >
              <input
                type="radio"
                name={block.id}
                checked={!!selected}
                disabled={!interactive || checked}
                onChange={() => setAnswer(block.id, opt.id)}
              />
              {cards && <OptionImage mediaId={opt.mediaId} />}
              <span className="q-text">{opt.text}</span>
              <Mark state={state} />
            </label>
          )
        })}
      </div>
      <Feedback block={block} selectedOption={block.options.find((o) => o.id === answer)} />
    </div>
  )
}

/** מערבב את האפשרויות אם המרצה ביקש. הסדר יציב לאורך השלב. */
function useShuffledOptions(block) {
  return useMemo(
    () => (block.shuffle ? stableShuffle(block.options ?? [], block.id) : (block.options ?? [])),
    [block.options, block.shuffle, block.id],
  )
}

function MultiView({ block }) {
  const { answers, setAnswer, checked, showKey, interactive } = useRuntime()
  const picked = Array.isArray(answers[block.id]) ? answers[block.id] : []
  const options = useShuffledOptions(block)

  const toggle = (id) =>
    setAnswer(block.id, picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])

  return (
    <div className="q-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}
      <div
        className="q-options"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns || 1}, 1fr)` }}
      >
        {options.map((opt) => {
          const selected = picked.includes(opt.id)
          const state = checked
            ? opt.correct && selected
              ? 'right'
              : opt.correct && !selected
                ? 'missed'
                : selected
                  ? 'wrong'
                  : null
            : null
          return (
            <label
              key={opt.id}
              className={
                'q-option' +
                (selected ? ' selected' : '') +
                (showKey && opt.correct ? ' key-correct' : '') +
                (state ? ' ' + state : '')
              }
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={!interactive || checked}
                onChange={() => toggle(opt.id)}
              />
              <span className="q-text">{opt.text}</span>
              {state === 'missed' ? <span className="ans-mark missed">חסר</span> : <Mark state={state} />}
            </label>
          )
        })}
      </div>
      <Feedback block={block} />
    </div>
  )
}

function ClozeView({ block }) {
  const { answers, setAnswer, checked, interactive } = useRuntime()
  const filled = answers[block.id] ?? {}
  const parts = parseCloze(block.template)

  const set = (index, value) => setAnswer(block.id, { ...filled, [index]: value })

  return (
    <div className="q-block cloze">
      <div className="cloze-flow">
        {parts.map((p, i) => {
          if (p.kind === 'text') return <span key={i}>{p.text}</span>
          const state = checked ? (clozeBlankCorrect(p, filled[p.index]) ? 'right' : 'wrong') : null
          return (
            <span key={i} className="cloze-slot">
              {p.kind === 'select' ? (
                <select
                  className="cloze-select"
                  value={filled[p.index] ?? ''}
                  disabled={!interactive || checked}
                  onChange={(e) => set(p.index, e.target.value)}
                  aria-label={`בחירה ${p.index + 1}`}
                >
                  <option value="">בחרו…</option>
                  {p.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filled[p.index] ?? ''}
                  disabled={!interactive || checked}
                  onChange={(e) => set(p.index, e.target.value)}
                  aria-label={`חסר ${p.index + 1}`}
                />
              )}
              <Mark state={state} />
            </span>
          )
        })}
      </div>
      <Feedback block={block} />
    </div>
  )
}

function CheckView({ block }) {
  const { checked, result, onCheck, onReset, interactive } = useRuntime()
  return (
    <div className="check-bar">
      <button
        className="btn"
        onClick={onCheck}
        disabled={!interactive || checked}
      >
        {block.label || 'בדיקה'}
      </button>

      {checked && block.allowRetry !== false && (
        <button className="icon-round" onClick={onReset} title="נסה שוב">↻</button>
      )}

      {checked && block.showScore !== false && result && (
        <span className={'check-score ' + (result.score >= 60 ? 'ok' : 'low')}>
          ניקוד: {result.earned % 1 ? result.earned.toFixed(1) : result.earned} / {result.max}
        </span>
      )}
    </div>
  )
}

/**
 * מיון לקבוצות. הכרטיסים יושבים במגש עד שגוררים אותם לאזור קבוצה.
 * אפשר גם ללחוץ על כרטיס ואז על קבוצה — כדי שזה יעבוד גם במגע.
 */
function SortView({ block }) {
  const { answers, setAnswer, checked, showKey, interactive } = useRuntime()
  const placed = answers[block.id] ?? {}
  const [held, setHold] = useState(null)
  const cards = block.cards ?? []
  const groups = block.groups ?? []

  const put = (cardId, groupId) => {
    if (!interactive || checked) return
    const next = { ...placed }
    if (groupId) next[cardId] = groupId
    else delete next[cardId]
    setAnswer(block.id, next)
    setHold(null)
  }

  // בסדרה הכרטיסים מוגשים אחד אחרי השני, כדי שכרטיס ארוך יהיה קריא
  const ordered = useMemo(
    () => (block.shuffle === false ? cards : stableShuffle(cards, block.id)),
    [cards, block.shuffle, block.id],
  )
  const tray = ordered.filter((c) => !placed[c.id])

  if (block.mode === 'sequence') {
    const current = tray[0]
    const done = cards.length - tray.length
    return (
      <div className="q-block sort-block sequence">
        {block.prompt && <div className="q-prompt">{block.prompt}</div>}

        <div className="seq-progress tiny muted">
          כרטיס {Math.min(done + 1, cards.length)} מתוך {cards.length}
        </div>

        {current ? (
          <div className="seq-card">{current.text}</div>
        ) : (
          <div className="seq-card done">כל הכרטיסים מוינו ✓</div>
        )}

        <div className="seq-zones" style={{ gridTemplateColumns: `repeat(${groups.length || 1}, 1fr)` }}>
          {groups.map((g) => (
            <button
              key={g.id}
              className="seq-zone"
              disabled={!current || !interactive || checked}
              onClick={() => current && put(current.id, g.id)}
            >
              <strong>{g.label}</strong>
              {g.description && <span className="tiny muted">{g.description}</span>}
              <span className="tiny seq-count">
                {cards.filter((c) => placed[c.id] === g.id).length} כרטיסים
              </span>
            </button>
          ))}
        </div>

        {checked && (
          <div className="seq-review">
            {cards.map((c) => (
              <span
                key={c.id}
                className={'sort-card ' + (placed[c.id] === c.groupId ? 'right' : 'wrong')}
              >
                {c.text}
              </span>
            ))}
          </div>
        )}

        <Feedback block={block} />
      </div>
    )
  }

  const Card = ({ card, inGroup }) => {
    const state = checked ? (placed[card.id] === card.groupId ? 'right' : 'wrong') : null
    return (
      <div
        className={
          'sort-card' +
          (held === card.id ? ' held' : '') +
          (state ? ' ' + state : '') +
          (showKey ? ' key' : '')
        }
        draggable={interactive && !checked}
        onDragStart={(e) => e.dataTransfer.setData('text/ll-card', card.id)}
        onClick={() => interactive && !checked && setHold(held === card.id ? null : card.id)}
        title={showKey ? groups.find((g) => g.id === card.groupId)?.label : undefined}
      >
        <span>{card.text}</span>
        {inGroup && state && <Mark state={state} />}
        {inGroup && !checked && interactive && (
          <button className="sort-remove" onClick={(e) => { e.stopPropagation(); put(card.id, null) }} title="החזר למגש">↺</button>
        )}
      </div>
    )
  }

  return (
    <div className="q-block sort-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}

      <div
        className="sort-tray"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); put(e.dataTransfer.getData('text/ll-card'), null) }}
      >
        {tray.length === 0 ? (
          <span className="tiny muted">כל הכרטיסים מוינו</span>
        ) : (
          tray.map((c) => <Card key={c.id} card={c} />)
        )}
      </div>

      <div className="sort-groups" style={{ gridTemplateColumns: `repeat(${groups.length || 1}, 1fr)` }}>
        {groups.map((g) => (
          <div
            key={g.id}
            className={'sort-group' + (held ? ' droppable' : '')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); put(e.dataTransfer.getData('text/ll-card'), g.id) }}
            onClick={() => held && put(held, g.id)}
          >
            <div className="sort-group-head">
              <strong>{g.label}</strong>
              {g.description && <span className="tiny muted">{g.description}</span>}
            </div>
            <div className="sort-group-body">
              {cards.filter((c) => placed[c.id] === g.id).map((c) => (
                <Card key={c.id} card={c} inGroup />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Feedback block={block} />
    </div>
  )
}

function OpenView({ block }) {
  const { answers, setAnswer, checked, interactive } = useRuntime()
  const value = answers[block.id] ?? ''
  const words = String(value).trim() ? String(value).trim().split(/\s+/).length : 0

  return (
    <div className="q-block open-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}
      <textarea
        className="open-input"
        value={value}
        rows={block.rows || 4}
        placeholder={block.placeholder}
        disabled={!interactive}
        onChange={(e) => setAnswer(block.id, e.target.value)}
      />
      <div className="open-foot tiny muted">
        <span>{words} מילים</span>
        <span>התשובה תופיע בתעודה שלכם</span>
      </div>
      {checked && block.afterText && <div className="q-explain">💡 {block.afterText}</div>}
    </div>
  )
}

function CalloutView({ block }) {
  const tone = CALLOUT_TONES[block.tone] ?? CALLOUT_TONES.info
  return (
    <div className={'callout tone-' + (block.tone ?? 'info')} style={{ '--tone': tone.color }}>
      {block.label && <div className="callout-label">{block.label}</div>}
      <div className="callout-text">{block.text}</div>
    </div>
  )
}

function ToolView({ block }) {
  return (
    <div className="tool-card">
      <div className="tool-head">
        <span className="tool-badge">כלי</span>
        <strong>{block.name || 'שם הכלי'}</strong>
      </div>
      {block.intro && <div className="tool-intro">{block.intro}</div>}
      <ol className="tool-steps">
        {(block.steps ?? []).filter((s) => s.trim()).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  )
}

function SourceView({ block }) {
  return (
    <div className="source-card">
      <div className="source-head">
        <span className="source-icon">📰</span>
        <strong>{block.publisher || 'שם הגוף המפרסם'}</strong>
        {block.translated && <span className="source-tag">מתורגם מאנגלית</span>}
        {block.adapted && <span className="source-tag">מעובד לשפה נגישה</span>}
      </div>
      <div className="source-excerpt">{block.excerpt}</div>
      {block.url && (
        <a className="source-link" href={block.url} target="_blank" rel="noopener noreferrer">
          {block.linkText || 'למקור המלא'} ↗
        </a>
      )}
    </div>
  )
}

function OptionImage({ mediaId }) {
  const media = useMedia()
  const item = media[mediaId]
  if (!item) return <span className="q-card-img empty">🖼</span>
  return <img className="q-card-img" src={item.dataUrl} alt="" draggable={false} />
}

/**
 * המשוב שנחשף אחרי הבדיקה. לפי סדר: משוב הצמוד לתשובה שנבחרה,
 * אחריו המשוב לנכון/לא נכון, ואחריו ההסבר הכללי.
 * למרצה בתצוגה מקדימה מוצג ההסבר הכללי בלבד.
 */
function Feedback({ block, selectedOption }) {
  const { checked, showKey } = useRuntime()
  const result = useBlockResult(block)

  if (!checked) {
    return showKey && block.explanation ? (
      <div className="q-explain">💡 {block.explanation}</div>
    ) : null
  }

  const perOption = selectedOption?.feedback
  const byResult = result?.correct ? block.okFeedback : block.noFeedback
  const lines = [perOption, byResult, block.explanation].filter((t) => t && t.trim())
  if (lines.length === 0) return null

  return (
    <div className={'q-feedback ' + (result?.correct ? 'ok' : 'no')}>
      {lines.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
    </div>
  )
}

/** התוצאה של הרכיב הנוכחי מתוך תוצאת השלב */
function useBlockResult(block) {
  const { result } = useRuntime()
  return result?.details?.find((d) => d.blockId === block.id) ?? null
}

export const isGradable = (block) => !!BLOCK_TYPES[block.type]?.gradable
