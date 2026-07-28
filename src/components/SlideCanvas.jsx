import { useLayoutEffect, useRef, useState } from 'react'
import { CANVAS_W, CANVAS_H } from '../lib/canvas'

/**
 * עוטף את במת השקופית ומקטין אותה כך שתתמלא לרוחב הזמין.
 * הבמה עצמה תמיד במידות הקבועות של הקנבס, ולכן הכול בתוכה —
 * מיקומים, גדלים וגופנים — מתכווץ יחד ביחס אחיד.
 *
 * הבמה מוגדרת ltr בכוונה: כך left/top של הרכיבים מתנהגים באופן
 * זהה בלי קשר לכיוון הדף. הטקסט בתוך הרכיבים נשאר rtl.
 */
export default function SlideCanvas({
  children,
  onBackgroundPointerDown,
  onCanvasDrop,
  className = '',
}) {
  const outerRef = useRef(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setScale(w / CANVAS_W)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // גיבוי ל-ResizeObserver: שינוי גודל חלון נתפס גם ישירות
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className={'canvas-outer ' + className}
      style={{ height: scale ? CANVAS_H * scale : undefined }}
    >
      {scale > 0 && (
        <div
          className="canvas"
          dir="ltr"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
          }}
          onPointerDown={onBackgroundPointerDown}
          onDragOver={onCanvasDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } : undefined}
          onDrop={
            onCanvasDrop
              ? (e) => {
                  e.preventDefault()
                  // המרת נקודת השחרור מפיקסלים של המסך ליחידות הבמה
                  const r = e.currentTarget.getBoundingClientRect()
                  onCanvasDrop(e, (e.clientX - r.left) / scale, (e.clientY - r.top) / scale)
                }
              : undefined
          }
        >
          {typeof children === 'function' ? children(scale) : children}
        </div>
      )}
    </div>
  )
}
