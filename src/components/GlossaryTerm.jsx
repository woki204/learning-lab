import { useEffect, useRef, useState } from 'react'

/**
 * "מילה חמה" — מילה מודגשת בתוך טקסט שבלחיצה עליה נפתח הסבר קצר.
 * ההסבר ממוקם ב-fixed לפי מיקום המילה, כדי שלא ייחתך בגבול הרכיב.
 */
export default function GlossaryTerm({ term, definition }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const place = () => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const width = 260
      setPos({
        top: r.bottom + 8,
        left: Math.max(8, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 8)),
        width,
      })
    }
    place()
    const close = (e) => {
      if (ref.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={'glossary-term' + (open ? ' open' : '')}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="לחצו להסבר"
      >
        {term}
      </button>
      {open && pos && (
        <span className="glossary-pop" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <strong>{term}</strong>
          <span>{definition}</span>
        </span>
      )}
    </>
  )
}
