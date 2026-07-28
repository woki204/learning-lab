import { textCss, normalizeTextBlock } from '../lib/typography'
import { useMedia } from '../lib/mediaContext'
import { useRuntime } from '../lib/runtime'
import { parseCloze, BLOCK_TYPES } from '../lib/blocks'
import { videoEmbed } from '../lib/video'

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
      {block.content}
    </Tag>
  )
}

function ImageView({ block }) {
  const media = useMedia()
  const item = media[block.mediaId]
  if (!item)
    return (
      <div className="media-placeholder">
        <span>🖼</span>
        <span className="tiny">גרור תמונה מהמאגר</span>
      </div>
    )
  return (
    <img
      className="image-block"
      src={item.dataUrl}
      alt={block.alt || item.name || ''}
      style={{ objectFit: block.fit ?? 'contain' }}
      draggable={false}
    />
  )
}

function VideoView({ block }) {
  const embed = videoEmbed(block.url)
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

  return (
    <div className="q-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}
      <div
        className={cards ? 'q-cards' : 'q-options'}
        style={cards ? { gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` } : undefined}
      >
        {block.options.map((opt) => {
          const selected = answer === opt.id
          const isKey = block.correctId === opt.id
          const state = checked ? (isKey ? 'right' : selected ? 'wrong' : null) : null
          return (
            <label
              key={opt.id}
              className={
                (cards ? 'q-card' : 'q-option') +
                (selected ? ' selected' : '') +
                (showKey && isKey ? ' key-correct' : '') +
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
      <Explanation block={block} />
    </div>
  )
}

function MultiView({ block }) {
  const { answers, setAnswer, checked, showKey, interactive } = useRuntime()
  const picked = Array.isArray(answers[block.id]) ? answers[block.id] : []

  const toggle = (id) =>
    setAnswer(block.id, picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])

  return (
    <div className="q-block">
      {block.prompt && <div className="q-prompt">{block.prompt}</div>}
      <div
        className="q-options"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns || 1}, 1fr)` }}
      >
        {block.options.map((opt) => {
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
      <Explanation block={block} />
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
        {parts.map((p, i) =>
          p.kind === 'text' ? (
            <span key={i}>{p.text}</span>
          ) : (
            <span key={i} className="cloze-slot">
              <input
                type="text"
                value={filled[p.index] ?? ''}
                disabled={!interactive || checked}
                onChange={(e) => set(p.index, e.target.value)}
                aria-label={`חסר ${p.index + 1}`}
              />
              {checked && (
                <Mark
                  state={
                    p.answers.length === 0
                      ? String(filled[p.index] ?? '').trim()
                        ? 'right'
                        : 'wrong'
                      : p.answers.some(
                            (a) =>
                              a.trim().toLowerCase() ===
                              String(filled[p.index] ?? '').trim().toLowerCase(),
                          )
                        ? 'right'
                        : 'wrong'
                  }
                />
              )}
            </span>
          ),
        )}
      </div>
      <Explanation block={block} />
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

function OptionImage({ mediaId }) {
  const media = useMedia()
  const item = media[mediaId]
  if (!item) return <span className="q-card-img empty">🖼</span>
  return <img className="q-card-img" src={item.dataUrl} alt="" draggable={false} />
}

/** ההסבר נחשף אחרי בדיקה, ולמרצה גם בתצוגה מקדימה */
function Explanation({ block }) {
  const { checked, showKey } = useRuntime()
  if (!block.explanation) return null
  if (!checked && !showKey) return null
  return <div className="q-explain">💡 {block.explanation}</div>
}

export const isGradable = (block) => !!BLOCK_TYPES[block.type]?.gradable
