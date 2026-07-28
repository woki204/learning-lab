import { newId, parseCloze } from '../lib/blocks'
import { useMedia } from '../lib/mediaContext'

/**
 * עורך התוכן של רכיב, לסוגים שהתוכן שלהם גדול מכדי לשבת בסרגל
 * הכלים. טקסט נערך ישירות על הבמה ולכן אינו כאן.
 */
export default function BlockEditor({ block, onChange }) {
  if (block.type === 'question') return <ChoiceEditor block={block} onChange={onChange} />
  if (block.type === 'multi') return <MultiEditor block={block} onChange={onChange} />
  if (block.type === 'cloze') return <ClozeEditor block={block} onChange={onChange} />
  return <p className="muted tiny">אין עורך תוכן נפרד לסוג הרכיב הזה.</p>
}

function Points({ block, set, label = 'ניקוד' }) {
  return (
    <label className="field" style={{ width: 110, marginBottom: 0 }}>
      <span>{label}</span>
      <input
        type="number"
        min="1"
        value={block.points}
        onChange={(e) => set({ points: Number(e.target.value) || 1 })}
      />
    </label>
  )
}

function Explanation({ block, set }) {
  return (
    <label className="field" style={{ flex: 1, marginBottom: 0 }}>
      <span>הסבר (מוצג ללומד אחרי הבדיקה)</span>
      <input
        type="text"
        value={block.explanation ?? ''}
        onChange={(e) => set({ explanation: e.target.value })}
      />
    </label>
  )
}

/** בוחר תמונה לכרטיס תשובה */
function OptionMediaPicker({ value, onPick }) {
  const media = useMedia()
  const list = Object.values(media)
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onPick(e.target.value || null)}
      style={{ width: 120 }}
      title="תמונה לכרטיס"
    >
      <option value="">ללא תמונה</option>
      {list.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )
}

function ChoiceEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const setOpt = (id, patch) =>
    set({ options: block.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })

  return (
    <>
      <label className="field">
        <span>נוסח השאלה</span>
        <input type="text" value={block.prompt} onChange={(e) => set({ prompt: e.target.value })} />
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
              onChange={(e) => setOpt(opt.id, { text: e.target.value })}
            />
            {block.display === 'cards' && (
              <OptionMediaPicker
                value={opt.mediaId}
                onPick={(mediaId) => setOpt(opt.id, { mediaId })}
              />
            )}
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
          onClick={() => set({ options: [...block.options, { id: newId(), text: '', mediaId: null }] })}
        >
          + הוסף תשובה
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Points block={block} set={set} />
        <Explanation block={block} set={set} />
      </div>
    </>
  )
}

function MultiEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const setOpt = (id, patch) =>
    set({ options: block.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  const correctCount = block.options.filter((o) => o.correct).length

  return (
    <>
      <label className="field">
        <span>נוסח המשימה</span>
        <input
          type="text"
          value={block.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder="למשל: בחרו את כל הפרטים החסרים"
        />
      </label>

      <div className="field">
        <span>אפשרויות — סמן את כל הנכונות ({correctCount})</span>
        {block.options.map((opt, i) => (
          <div className="opt-row" key={opt.id}>
            <input
              type="checkbox"
              checked={!!opt.correct}
              onChange={(e) => setOpt(opt.id, { correct: e.target.checked })}
              title="סמן כנכונה"
              style={{ width: 'auto', accentColor: 'var(--accent)' }}
            />
            <input
              type="text"
              value={opt.text}
              placeholder={`אפשרות ${i + 1}`}
              onChange={(e) => setOpt(opt.id, { text: e.target.value })}
            />
            <button
              className="icon-btn"
              disabled={block.options.length <= 2}
              onClick={() => set({ options: block.options.filter((o) => o.id !== opt.id) })}
              title="הסר"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn subtle sm"
          onClick={() => set({ options: [...block.options, { id: newId(), text: '', correct: false }] })}
        >
          + הוסף אפשרות
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Points block={block} set={set} />
        <Explanation block={block} set={set} />
      </div>

      {correctCount === 0 && (
        <div className="alert warn tiny" style={{ marginTop: 12, marginBottom: 0 }}>
          לא סימנת אף אפשרות נכונה — הלומד יקבל את מלוא הניקוד בלי לסמן דבר.
        </div>
      )}
    </>
  )
}

function ClozeEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const parts = parseCloze(block.template ?? '')
  const blanks = parts.filter((p) => p.kind === 'blank')

  return (
    <>
      <label className="field">
        <span>התבנית</span>
        <textarea
          rows={4}
          value={block.template}
          onChange={(e) => set({ template: e.target.value })}
          style={{ fontFamily: 'inherit' }}
        />
      </label>

      <div className="alert ok tiny">
        <strong>איך כותבים חסר:</strong> עוטפים בסוגריים כפולים.
        <br />
        <code>[[]]</code> — חסר פתוח, כל תשובה שאינה ריקה מתקבלת.
        <br />
        <code>[[מים|חיסכון]]</code> — מתקבלת אחת מהתשובות האלה בלבד.
      </div>

      <div className="field">
        <span>תצוגה מקדימה ({blanks.length} חסרים)</span>
        <div className="cloze-preview">
          {parts.map((p, i) =>
            p.kind === 'text' ? (
              <span key={i}>{p.text}</span>
            ) : (
              <span key={i} className="cloze-chip" title={p.answers.join(' / ') || 'חסר פתוח'}>
                {p.answers.length ? p.answers.join(' / ') : '—'}
              </span>
            ),
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Points block={block} set={set} label="ניקוד לכל החסרים" />
        <Explanation block={block} set={set} />
      </div>
    </>
  )
}
