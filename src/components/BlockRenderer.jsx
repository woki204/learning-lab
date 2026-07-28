import { textCss, boxCss, normalizeTextBlock } from '../lib/typography'

/**
 * מציג בלוק תוכן ללומד.
 * showKey=true מסמן את התשובה הנכונה — לשימוש המרצה בתצוגה מקדימה בלבד.
 */
export default function BlockRenderer({ block, answer, onAnswer, showKey = false }) {
  if (block.type === 'text') {
    const b = normalizeTextBlock(block)
    const Tag = b.variant === 'title' ? 'h2' : b.variant === 'subtitle' ? 'h3' : 'div'
    return (
      <div className="block" style={boxCss(b.box)}>
        <Tag className="text-content" style={{ ...textCss(b.style), margin: 0 }}>
          {b.content}
        </Tag>
      </div>
    )
  }

  if (block.type === 'question') {
    return (
      <div className="block">
        <div className="q-prompt">{block.prompt || '(שאלה ללא ניסוח)'}</div>
        <div className="q-options">
          {block.options.map((opt) => {
            const selected = answer === opt.id
            const isKey = showKey && block.correctId === opt.id
            return (
              <label
                key={opt.id}
                className={
                  'q-option' +
                  (selected ? ' selected' : '') +
                  (isKey ? ' key-correct' : '')
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
    <div className="block muted tiny">
      סוג בלוק לא מוכר: <code>{block.type}</code>
    </div>
  )
}
