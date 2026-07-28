import { TEXT_INSERTS, QUESTION_INSERTS, MEDIA_INSERTS } from '../lib/blocks'
import { VARIANTS } from '../lib/typography'

/**
 * רצועת הקטגוריות בקצה הימני של העורך. לחיצה על קטגוריה פותחת
 * לצידה פאנל עם הרכיבים שלה — משם מוסיפים בלחיצה או בגרירה.
 */
export const RAIL_TABS = [
  { key: 'text', icon: 'T', label: 'טקסט' },
  { key: 'images', icon: '🖼', label: 'תמונות' },
  { key: 'video', icon: '🎬', label: 'וידאו' },
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
  const items = TEXT_INSERTS
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

/** פאנל השאלות — סוגי המשימות וכפתור הבדיקה */
export function QuestionPanel({ onAdd }) {
  return (
    <>
      <div className="panel-head">
        <strong>שאלות ומשימות</strong>
      </div>
      <div className="panel-body">
        {QUESTION_INSERTS.map((item) => (
          <button key={item.key} className="text-preset" onClick={() => onAdd(item)}>
            <span>{item.label}</span>
            <span className="ins-badge">{item.badge}</span>
          </button>
        ))}
      </div>
      <p className="panel-foot tiny muted">
        השאלות נכללות אוטומטית בציון ובתעודה. הוסף <strong>כפתור בדיקה</strong> לשלב
        כדי שהלומד יוכל לבדוק את עצמו כבר שם.
      </p>
    </>
  )
}

/** פאנל המדיה שאינה תמונה */
export function MediaPanel({ onAdd }) {
  return (
    <>
      <div className="panel-head">
        <strong>וידאו</strong>
      </div>
      <div className="panel-body">
        {MEDIA_INSERTS.map((item) => (
          <button key={item.key} className="text-preset" onClick={() => onAdd(item)}>
            <span>{item.label}</span>
            <span className="ins-badge">{item.badge}</span>
          </button>
        ))}
      </div>
      <p className="panel-foot tiny muted">
        הוסף רכיב וידאו והדבק בסרגל קישור מיוטיוב, מ-Vimeo או לקובץ וידאו.
      </p>
    </>
  )
}

/** פאנל השלבים — סקירה, מעבר וסידור מחדש */
export function SlidesPanel({
  slides,
  index,
  onGo,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onRename,
  onBackground,
  media = [],
}) {
  const bg = slides[index]?.background ?? {}

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

        {/* רקע השלב הנוכחי */}
        <div className="bg-section">
          <strong className="tiny">רקע השלב</strong>

          <label className="pop-row" style={{ padding: '6px 0' }}>
            <span>צבע</span>
            <input
              type="color"
              className="color-input"
              value={bg.color ?? '#ffffff'}
              onChange={(e) => onBackground({ ...bg, color: e.target.value })}
            />
          </label>

          <div className="bg-grid">
            <button
              className={'bg-thumb none' + (!bg.mediaId ? ' active' : '')}
              onClick={() => onBackground({ ...bg, mediaId: null })}
              title="ללא תמונת רקע"
            >
              ✕
            </button>
            {media.map((m) => (
              <button
                key={m.id}
                className={'bg-thumb' + (bg.mediaId === m.id ? ' active' : '')}
                onClick={() => onBackground({ ...bg, mediaId: m.id })}
                title={m.name}
              >
                <img src={m.dataUrl} alt="" />
              </button>
            ))}
          </div>

          {bg.mediaId && (
            <label className="pop-row" style={{ padding: '6px 0' }}>
              <span>התאמה</span>
              <select
                value={bg.fit ?? 'cover'}
                onChange={(e) => onBackground({ ...bg, fit: e.target.value })}
              >
                <option value="cover">ממלאת</option>
                <option value="contain">שלמה</option>
                <option value="fill">נמתחת</option>
              </select>
            </label>
          )}
        </div>
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
