import { CANVAS_W, CANVAS_H } from '../lib/canvas'

const ZOOM_MIN = 0.3
const ZOOM_MAX = 2

/**
 * רצועת התמונות הממוזערות והסרגל התחתון של העורך, לפי המפרט:
 * ממוזערות ממורכזות מעל הסרגל, ומתחתן מונה עמודים, זום ועזרה.
 */
export default function BottomBar({
  slides,
  index,
  onGo,
  onAdd,
  onDuplicate,
  onDelete,
  onReorder,
  zoom,
  onZoom,
  fitScale = 1,
}) {
  // הזום מוצג כאחוז אמיתי מגודל העמוד, לא כיחס להתאמה למסך
  const shownPercent = Math.round(fitScale * zoom * 100)
  return (
    <div className="editor-bottom">
      <div className="thumbs" role="tablist" aria-label="עמודי היחידה">
        {slides.map((s, i) => (
          <div
            key={s.id ?? i}
            className={'thumb' + (i === index ? ' active' : '')}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/ll-slide', String(i))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const from = Number(e.dataTransfer.getData('text/ll-slide'))
              if (!Number.isNaN(from) && from !== i) onReorder(from, i)
            }}
            onClick={() => onGo(i)}
            title={s.title || `עמוד ${i + 1}`}
          >
            <div
              className="thumb-page"
              style={{ background: s.background?.color || '#fff' }}
              aria-hidden="true"
            >
              {/* תצוגה סכמטית של מיקומי הרכיבים בעמוד */}
              {(s.blocks ?? []).slice(0, 14).map((b) => (
                <span
                  key={b.id}
                  style={{
                    left: `${((b.frame?.x ?? 0) / CANVAS_W) * 100}%`,
                    top: `${((b.frame?.y ?? 0) / CANVAS_H) * 100}%`,
                    width: `${((b.frame?.w ?? 0) / CANVAS_W) * 100}%`,
                    height: `${((b.frame?.h ?? 0) / CANVAS_H) * 100}%`,
                  }}
                />
              ))}
            </div>
            <span className="thumb-num mono">{i + 1}</span>
          </div>
        ))}

        <button className="thumb-add" onClick={onAdd} title="הוספת עמוד">
          +
        </button>
      </div>

      <div className="bottom-bar">
        <button className="bb-btn" onClick={onDuplicate} title="שכפול העמוד הנוכחי">⧉ שכפל</button>
        <button className="bb-btn danger" onClick={onDelete} title="מחיקת העמוד הנוכחי">🗑 מחק</button>

        <span className="spacer" />

        <span className="bb-count mono">
          {index + 1}/{slides.length}
        </span>

        <span className="spacer" />

        <button
          className="bb-btn"
          onClick={() => onZoom(Math.max(ZOOM_MIN, Math.round((zoom - 0.1) * 10) / 10))}
          disabled={zoom <= ZOOM_MIN}
          title="הקטנה"
        >
          −
        </button>
        <input
          className="bb-zoom"
          type="range"
          min={ZOOM_MIN * 100}
          max={ZOOM_MAX * 100}
          value={Math.round(zoom * 100)}
          onChange={(e) => onZoom(Number(e.target.value) / 100)}
          aria-label="מרחק מתצוגה"
        />
        <button
          className="bb-btn"
          onClick={() => onZoom(Math.min(ZOOM_MAX, Math.round((zoom + 0.1) * 10) / 10))}
          disabled={zoom >= ZOOM_MAX}
          title="הגדלה"
        >
          +
        </button>
        <span className="bb-zoom-val mono">{shownPercent}%</span>
        <button className="bb-btn" onClick={() => onZoom(1)} title="התאמה למסך">
          התאם
        </button>
      </div>
    </div>
  )
}
