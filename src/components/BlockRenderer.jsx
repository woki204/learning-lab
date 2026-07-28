/**
 * מציג בלוק תוכן ללומד.
 * showKey=true מסמן את התשובה הנכונה — לשימוש המרצה בתצוגה מקדימה בלבד.
 */
export default function BlockRenderer({ block, answer, onAnswer, showKey = false }) {
  if (block.type === 'text') {
    return (
      <div className="block block-text">
        {block.heading && <h3>{block.heading}</h3>}
        {block.body && <div className="body">{block.body}</div>}
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
