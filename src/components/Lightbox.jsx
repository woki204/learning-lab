import { useEffect } from 'react'

/** הגדלת תמונה למסך מלא. נסגרת בלחיצה, ב-Escape או בכפתור. */
export default function Lightbox({ src, alt, caption, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="תמונה מוגדלת">
      <button className="lightbox-close" onClick={onClose} title="סגירה">✕</button>
      <img src={src} alt={alt ?? ''} onClick={(e) => e.stopPropagation()} />
      {caption && <div className="lightbox-caption">{caption}</div>}
    </div>
  )
}
