import { textCss, normalizeTextBlock } from '../lib/typography'
import { useMedia } from '../lib/mediaContext'

function ImageBlock({ block }) {
  const media = useMedia()
  const item = media[block.mediaId]
  if (!item)
    return (
      <div className="image-missing">
        <span>🖼</span>
        <span className="tiny">התמונה לא נמצאה</span>
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

/**
 * מציג את תוכן הרכיב בלבד — בלי מסגרת, מילוי או מיקום.
 * העטיפה (CanvasBlock בעריכה, StaticBlock בתצוגה) אחראית לעיצוב
 * התיבה ולמיקום שלה על הבמה.
 *
 * showKey=true מסמן את התשובה הנכונה — למרצה בתצוגה מקדימה בלבד.
 */
export default function BlockRenderer({ block, answer, onAnswer, showKey = false }) {
  if (block.type === 'text') {
    const b = normalizeTextBlock(block)
    const Tag = b.variant === 'title' ? 'h2' : b.variant === 'subtitle' ? 'h3' : 'div'
    return (
      <Tag className="text-content" style={{ ...textCss(b.style), margin: 0 }}>
        {b.content}
      </Tag>
    )
  }

  if (block.type === 'image') return <ImageBlock block={block} />

  if (block.type === 'question') {
    return (
      <div className="q-block">
        <div className="q-prompt">{block.prompt || '(שאלה ללא ניסוח)'}</div>
        <div className="q-options">
          {block.options.map((opt) => {
            const selected = answer === opt.id
            const isKey = showKey && block.correctId === opt.id
            return (
              <label
                key={opt.id}
                className={
                  'q-option' + (selected ? ' selected' : '') + (isKey ? ' key-correct' : '')
                }
              >
                <input
                  type="radio"
                  name={block.id}
                  checked={selected}
                  onChange={() => onAnswer?.(block.id, opt.id)}
                />
                <span>{opt.text || '(תשובה ריקה)'}</span>
                {isKey && <span className="tiny muted">✓ נכונה</span>}
              </label>
            )
          })}
        </div>
        {showKey && block.explanation && (
          <div className="q-explain">💡 {block.explanation}</div>
        )}
      </div>
    )
  }

  return (
    <div className="muted tiny">
      סוג רכיב לא מוכר: <code>{block.type}</code>
    </div>
  )
}
