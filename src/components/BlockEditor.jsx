import { newId } from '../lib/blocks'

/**
 * עורך התוכן של רכיב, לסוגים שהתוכן שלהם גדול מכדי לשבת בסרגל
 * הכלים. טקסט נערך ישירות על הבמה ולכן אינו כאן.
 */
export default function BlockEditor({ block, onChange }) {
  if (block.type === 'question') return <QuestionEditor block={block} onChange={onChange} />
  return <p className="muted tiny">אין עורך תוכן נפרד לסוג הרכיב הזה.</p>
}

function QuestionEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })

  return (
    <>
      <label className="field">
        <span>נוסח השאלה</span>
        <input
          type="text"
          value={block.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
        />
      </label>

      <div className="field">
        <span>תשובות — סמן את הנכונה</span>
        {block.options.map((opt, i) => (
          <div className="opt-row" key={opt.id}>
            <input
              type="radio"
              name={`key-${block.id}`}
              checked={block.correctId === opt.id}
              onChange={() => set({ correctId: opt.id })}
              title="סמן כתשובה הנכונה"
            />
            <input
              type="text"
              value={opt.text}
              placeholder={`תשובה ${i + 1}`}
              onChange={(e) =>
                set({
                  options: block.options.map((o) =>
                    o.id === opt.id ? { ...o, text: e.target.value } : o,
                  ),
                })
              }
            />
            <button
              className="icon-btn"
              disabled={block.options.length <= 2}
              onClick={() =>
                set({
                  options: block.options.filter((o) => o.id !== opt.id),
                  correctId: block.correctId === opt.id ? null : block.correctId,
                })
              }
              title="הסר תשובה"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn subtle sm"
          onClick={() => set({ options: [...block.options, { id: newId(), text: '' }] })}
        >
          + הוסף תשובה
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <label className="field" style={{ width: 120, marginBottom: 0 }}>
          <span>ניקוד</span>
          <input
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => set({ points: Number(e.target.value) || 1 })}
          />
        </label>
        <label className="field" style={{ flex: 1, marginBottom: 0 }}>
          <span>הסבר (מוצג למרצה בתצוגה מקדימה)</span>
          <input
            type="text"
            value={block.explanation}
            onChange={(e) => set({ explanation: e.target.value })}
          />
        </label>
      </div>
    </>
  )
}
