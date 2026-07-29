import { useRef, useEffect } from 'react'
import { HANDLES, clampFrame, resizeFrame, frameStyle } from '../lib/canvas'
import { textCss, boxCss, normalizeTextBlock } from '../lib/typography'
import BlockRenderer from './BlockRenderer'

/**
 * רכיב על הבמה במצב עריכה: ניתן לגרירה, לשינוי גודל ולבחירה.
 *
 * הגרירה מתבצעת ביחידות הקנבס — כל תזוזה בפיקסלים של המסך
 * מחולקת ביחס ההקטנה, כך שהרכיב עוקב אחרי הסמן במדויק גם
 * כשהבמה מוצגת קטנה.
 */
export default function CanvasBlock({
  block,
  scale,
  selected,
  editing,
  onSelect,
  onChange,
  onStartEdit,
  onEndEdit,
}) {
  const drag = useRef(null)
  const taRef = useRef(null)

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus()
      taRef.current.select()
    }
  }, [editing])

  const beginDrag = (e, handle) => {
    if (editing) return
    e.stopPropagation()
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // מצביע שכבר שוחרר — הגרירה עדיין עובדת דרך אירועי המסמך
    }
    drag.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      frame: { ...block.frame },
      moved: false,
    }
    onSelect()
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.startX) / scale
    const dy = (e.clientY - d.startY) / scale
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) d.moved = true

    const next =
      d.handle === 'move'
        ? clampFrame({ ...d.frame, x: d.frame.x + dx, y: d.frame.y + dy })
        : resizeFrame(d.frame, d.handle, dx, dy)

    onChange({ ...block, frame: next })
  }

  const endDrag = (e) => {
    if (!drag.current) return
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // כבר שוחרר
    }
    drag.current = null
  }

  // אילו רכיבים נערכים בכתיבה ישירה על הבמה, ובאיזה שדה
  const inlineField = { text: 'content', callout: 'text' }[block.type] ?? null
  const isText = block.type === 'text'
  const tb = isText ? normalizeTextBlock(block) : block

  return (
    <div
      className={
        'cblock' + (selected ? ' selected' : '') + (editing ? ' editing' : '')
      }
      style={frameStyle(block.frame)}
      onPointerDown={(e) => beginDrag(e, 'move')}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (inlineField) onStartEdit()
      }}
    >
      <div className="cblock-inner" style={boxCss(tb.box)} dir="rtl">
        {inlineField && editing ? (
          <textarea
            ref={taRef}
            className="cblock-textarea"
            value={tb[inlineField] ?? ''}
            onChange={(e) => onChange({ ...tb, [inlineField]: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={onEndEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onEndEdit()
              e.stopPropagation()
            }}
            style={isText ? textCss(tb.style) : undefined}
          />
        ) : (
          <div className="cblock-content">
            <BlockRenderer block={block} />
          </div>
        )}
      </div>

      {selected && !editing && (
        <>
          <div className="cblock-outline" />
          {HANDLES.map((h) => (
            <div
              key={h.key}
              className="cblock-handle"
              style={{
                left: `${h.cx * 100}%`,
                top: `${h.cy * 100}%`,
                cursor: h.cursor,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
              }}
              onPointerDown={(e) => beginDrag(e, h.key)}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
          ))}
        </>
      )}
    </div>
  )
}
