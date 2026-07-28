import { INSERT_MENU } from '../lib/blocks'
import { VARIANTS } from '../lib/typography'

/**
 * רצועת הקטגוריות בקצה הימני של העורך. לחיצה על קטגוריה פותחת
 * לצידה פאנל עם הרכיבים שלה — משם מוסיפים בלחיצה או בגרירה.
 */
export const RAIL_TABS = [
  { key: 'text', icon: 'T', label: 'טקסט' },
  { key: 'images', icon: '🖼', label: 'תמונות' },
  { key: 'questions', icon: '❓', label: 'שאלות' },
  { key: 'slides', icon: '▦', label: 'שלבים' },
]

export function SideRail({ active, onSelect }) {
  return (
    <nav className="rail" aria-label="קטגוריות רכיבים">
      {RAIL_TABS.map((t) => (
        <button
          key={t.key}
          className={'rail-btn' + (active === t.key ? ' active' : '')}
          onClick={() => onSelect(active === t.key ? null : t.key)}
          aria-pressed={active === t.key}
        >
          <span className="rail-icon">{t.icon}</span>
          <span className="rail-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** פאנל הטקסט — לחיצה על רמה מוסיפה תיבה חדשה לשקופית */
export function TextPanel({ onAdd }) {
  const items = INSERT_MENU.filter((i) => i.key.startsWith('text:'))
  return (
    <>
      <div className="panel-head">
        <strong>טקסט</strong>
      </div>
      <div className="panel-body">
        {items.map((item) => {
          const variant = item.key.split(':')[1]
          return (
            <button key={item.key} className="text-preset" onClick={() => onAdd(item)}>
              <span style={{ fontSize: Math.min(VARIANTS[variant].fontSize, 26), fontWeight: VARIANTS[variant].bold ? 700 : 400 }}>
                {item.label}
              </span>
              <span className="ins-badge">{item.badge}</span>
            </button>
          )
        })}
      </div>
      <p className="panel-foot tiny muted">
        לחיצה מוסיפה תיבה לשקופית הנוכחית. אחר כך גוררים אותה למקום ומעצבים
        בסרגל העליון.
      </p>
    </>
  )
}

/** פאנל השאלות — כרגע סוג אחד, ייפתח לעוד סוגים בהמשך */
export function QuestionPanel({ onAdd }) {
  const item = INSERT_MENU.find((i) => i.key === 'question')
  return (
    <>
      <div className="panel-head">
        <strong>שאלות</strong>
      </div>
      <div className="panel-body">
        <button className="text-preset" onClick={() => onAdd(item)}>
          <span>❓ שאלה אמריקאית</span>
        </button>
      </div>
      <p className="panel-foot tiny muted">
        שאלות נכללות אוטומטית בציון ובתעודה שהלומד מקבל בסוף.
      </p>
    </>
  )
}

/** פאנל השלבים — סקירה, מעבר וסידור מחדש */
export function SlidesPanel({ slides, index, onGo, onAdd, onDuplicate, onDelete, onMove, onRename }) {
  return (
    <>
      <div className="panel-head">
        <strong>שלבים</strong>
        <span className="spacer" />
        <button className="btn sm" onClick={onAdd}>+ שלב</button>
      </div>

      <div className="panel-body">
        <ol className="slide-list">
          {slides.map((s, i) => (
            <li key={s.id ?? i}>
              <button
                className={'slide-item' + (i === index ? ' active' : '')}
                onClick={() => onGo(i)}
              >
                <span className="slide-num">{i + 1}</span>
                <span className="slide-name">{s.title || `שלב ${i + 1}`}</span>
                <span className="tiny muted">{s.blocks?.length ?? 0} רכיבים</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel-foot">
        <input
          type="text"
          value={slides[index]?.title ?? ''}
          onChange={(e) => onRename(e.target.value)}
          placeholder="שם השלב הנוכחי"
          title="שם השלב — לניווט שלך בלבד, הלומדים לא רואים אותו"
        />
        <div className="panel-foot-actions">
          <button className="btn ghost sm" onClick={() => onMove(-1)} disabled={index === 0} title="הקדם">▲</button>
          <button className="btn ghost sm" onClick={() => onMove(1)} disabled={index === slides.length - 1} title="אחר">▼</button>
          <button className="btn subtle sm" onClick={onDuplicate}>שכפל</button>
          <button className="btn danger sm" onClick={onDelete}>מחק</button>
        </div>
      </div>
    </>
  )
}
