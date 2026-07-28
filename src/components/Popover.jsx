import { useEffect, useRef, useState } from 'react'

/**
 * כפתור שפותח לוח קטן מתחתיו.
 *
 * הלוח ממוקם ב-position: fixed לפי מיקום הכפתור, כדי שיוכל לחרוג
 * מסרגל הכלים בלי שייחתך — הסרגל עצמו נשאר בגובה קבוע.
 */
export default function Popover({ label, title, width = 250, children, className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
    setPos({ top: r.bottom + 6, left })
  }

  useEffect(() => {
    if (!open) return
    place()
    const close = (e) => {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={'tb-btn' + (open ? ' active' : '') + (className ? ' ' + className : '')}
        onClick={() => setOpen((v) => !v)}
        title={title}
        aria-expanded={open}
      >
        {label}
        <span className="tb-caret">▾</span>
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          className="popover"
          style={{ top: pos.top, left: pos.left, width }}
          role="dialog"
        >
          {children}
        </div>
      )}
    </>
  )
}
