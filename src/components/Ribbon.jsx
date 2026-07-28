import { INSERT_MENU } from '../lib/blocks'
import { CANVAS_W, CANVAS_H, clampFrame } from '../lib/canvas'
import { VARIANTS, BORDER_STYLES, defaultBox } from '../lib/typography'
import TextStylePanel from './TextStylePanel'

/**
 * סרגל הכלים העליון. הוא הקשרי: כשאין בחירה הוא מציע להוסיף רכיבים,
 * וברגע שנבחר רכיב הוא מתחלף לכלי העריכה שלו.
 */
export function InsertRibbon({ onAdd }) {
  return (
    <div className="ribbon-row">
      <span className="sp-label">הוסף רכיב</span>
      {INSERT_MENU.map((t) => (
        <button key={t.key} className="btn subtle sm" onClick={() => onAdd(t)}>
          <span className="ins-badge">{t.badge}</span> {t.label}
        </button>
      ))}
      <span className="spacer" />
      <span className="tiny muted">לחץ על רכיב בבמה כדי לעצב אותו</span>
    </div>
  )
}

export function ElementRibbon({ block, onChange, onRestack, onDuplicate, onDelete, onEditContent }) {
  const isText = block.type === 'text'

  return (
    <>
      {isText ? (
        <TextStylePanel block={block} onChange={onChange} inRibbon />
      ) : block.type === 'image' ? (
        <ImageRow block={block} onChange={onChange} />
      ) : (
        <div className="ribbon-row">
          <span className="sp-label">❓ שאלה אמריקאית</span>
          <button className="btn sm" onClick={onEditContent}>
            ✏️ ערוך את השאלה והתשובות
          </button>
          <span className="tiny muted">
            {block.options?.length ?? 0} תשובות · {block.points ?? 1} נק'
          </span>
        </div>
      )}

      <div className="ribbon-row">
        <span className="sp-label">מיקום וגודל</span>
        <FrameFields frame={block.frame} onChange={(f) => onChange({ ...block, frame: clampFrame(f) })} />
        <span className="tiny muted">מתוך {CANVAS_W}×{Math.round(CANVAS_H)}</span>

        <span className="sp-sep" />

        <button className="btn ghost sm" onClick={() => onRestack('front')} title="הבא לחזית">⬆ לחזית</button>
        <button className="btn ghost sm" onClick={() => onRestack('back')} title="שלח לרקע">⬇ לרקע</button>
        <button className="btn subtle sm" onClick={onDuplicate}>שכפל</button>
        <button className="btn danger sm" onClick={onDelete}>מחק</button>

        <span className="spacer" />
        <span className="tiny muted">
          {isText
            ? VARIANTS[block.variant ?? 'body'].label
            : block.type === 'image'
              ? 'תמונה'
              : 'שאלה'}{' '}
          · לחיצה על רקע הבמה מבטלת בחירה
        </span>
      </div>
    </>
  )
}

function ImageRow({ block, onChange }) {
  const box = { ...defaultBox(), ...block.box }
  const setBox = (patch) => onChange({ ...block, box: { ...box, ...patch } })

  return (
    <div className="ribbon-row">
      <span className="sp-label">🖼 תמונה</span>

      <div className="chips">
        {[
          { v: 'contain', t: 'שלמה' },
          { v: 'cover', t: 'ממלאת' },
          { v: 'fill', t: 'נמתחת' },
        ].map((o) => (
          <button
            key={o.v}
            className={'chip' + ((block.fit ?? 'contain') === o.v ? ' active' : '')}
            onClick={() => onChange({ ...block, fit: o.v })}
            title={
              o.v === 'contain'
                ? 'התמונה נכנסת שלמה בתוך המסגרת'
                : o.v === 'cover'
                  ? 'התמונה ממלאת את המסגרת והשוליים נחתכים'
                  : 'התמונה נמתחת למידות המסגרת'
            }
          >
            {o.t}
          </button>
        ))}
      </div>

      <span className="sp-sep" />

      <label className="sp-check">
        <input
          type="checkbox"
          checked={box.bordered}
          onChange={(e) => setBox({ bordered: e.target.checked })}
        />
        מסגרת
      </label>
      {box.bordered && (
        <>
          <input
            type="color"
            className="color-input"
            value={box.borderColor}
            onChange={(e) => setBox({ borderColor: e.target.value })}
          />
          <label className="sp-mini">
            עובי
            <input
              type="number"
              min="1"
              max="20"
              value={box.borderWidth}
              onChange={(e) => setBox({ borderWidth: Number(e.target.value) || 1 })}
            />
          </label>
          <select value={box.borderStyle} onChange={(e) => setBox({ borderStyle: e.target.value })}>
            {BORDER_STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </>
      )}

      <label className="sp-mini">
        פינות
        <input
          type="number"
          min="0"
          max="200"
          value={box.radius}
          onChange={(e) => setBox({ radius: Number(e.target.value) || 0 })}
        />
      </label>

      <label className="sp-mini" style={{ flex: 1, minWidth: 160 }}>
        תיאור
        <input
          type="text"
          value={block.alt ?? ''}
          placeholder="תיאור לקוראי מסך"
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
        />
      </label>
    </div>
  )
}

/**
 * הבמה מיושרת משמאל לימין כדי שמיקומים יתנהגו זהה בכל שפה,
 * ולכן "אופקי" נמדד מהקצה השמאלי של השקופית.
 */
function FrameFields({ frame, onChange }) {
  const f = (key, label, title) => (
    <label className="sp-mini" key={key} title={title}>
      {label}
      <input
        type="number"
        value={frame[key]}
        onChange={(e) => onChange({ ...frame, [key]: Number(e.target.value) || 0 })}
      />
    </label>
  )
  return (
    <>
      {f('x', 'אופקי', 'מרחק מהקצה השמאלי של השקופית')}
      {f('y', 'אנכי', 'מרחק מהקצה העליון של השקופית')}
      {f('w', 'רוחב')}
      {f('h', 'גובה')}
    </>
  )
}
