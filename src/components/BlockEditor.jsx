import { BLOCK_TYPES, newId } from '../lib/blocks'
import { VARIANTS, textCss, boxCss, normalizeTextBlock } from '../lib/typography'
import TextStylePanel from './TextStylePanel'

/**
 * עריכת תיבת טקסט. שדה הכתיבה עצמו נצבע בעיצוב שנבחר, כך שמה
 * שנראה בעורך הוא מה שהלומד יראה.
 */
function TextBlockEditor({ block, onChange }) {
  return (
    <>
      <TextStylePanel block={block} onChange={onChange} />
      <div className="text-preview-wrap" style={boxCss(block.box)}>
        <textarea
          className="text-preview"
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder={`הקלד ${VARIANTS[block.variant].label}…`}
          rows={block.variant === 'title' || block.variant === 'subtitle' ? 2 : 5}
          style={textCss(block.style)}
        />
      </div>
    </>
  )
}

export default function BlockEditor({ block, onChange, onDelete, onMove, isFirst, isLast }) {
  const def = BLOCK_TYPES[block.type]
  const set = (patch) => onChange({ ...block, ...patch })

  return (
    <div className="editor-block">
      <header>
        <span>{def?.icon}</span>
        <strong>
          {block.type === 'text'
            ? VARIANTS[block.variant ?? 'body'].label
            : (def?.label ?? block.type)}
        </strong>
        <span className="spacer" />
        <button className="icon-btn" onClick={() => onMove(-1)} disabled={isFirst} title="העלה">
          ▲
        </button>
        <button className="icon-btn" onClick={() => onMove(1)} disabled={isLast} title="הורד">
          ▼
        </button>
        <button className="icon-btn" onClick={onDelete} title="מחק בלוק">
          🗑
        </button>
      </header>

      {block.type === 'text' && (
        <TextBlockEditor block={normalizeTextBlock(block)} onChange={onChange} />
      )}

      {block.type === 'question' && (
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
                  onChange={(e) => {
                    const options = block.options.map((o) =>
                      o.id === opt.id ? { ...o, text: e.target.value } : o,
                    )
                    set({ options })
                  }}
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
              onClick={() =>
                set({ options: [...block.options, { id: newId(), text: '' }] })
              }
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
      )}
    </div>
  )
}
