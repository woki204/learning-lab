/**
 * אייקונים קטנים לסרגל. מצוירים כקווים כדי שיהיו קריאים בכל גודל,
 * במקום תווי יוניקוד שנראים שונה בכל מערכת.
 */
const line = (y, x1, x2) => (
  <line key={y} x1={x1} y1={y} x2={x2} y2={y} strokeWidth="1.6" strokeLinecap="round" />
)

const ALIGN_LINES = {
  right: [line(3.5, 3, 15), line(7.5, 6, 15), line(11.5, 3, 15), line(15.5, 8, 15)],
  center: [line(3.5, 2, 16), line(7.5, 4.5, 13.5), line(11.5, 2, 16), line(15.5, 5.5, 12.5)],
  left: [line(3.5, 3, 15), line(7.5, 3, 12), line(11.5, 3, 15), line(15.5, 3, 10)],
  justify: [line(3.5, 3, 15), line(7.5, 3, 15), line(11.5, 3, 15), line(15.5, 3, 15)],
}

export function AlignIcon({ type }) {
  return (
    <svg viewBox="0 0 18 19" width="16" height="16" stroke="currentColor" fill="none" aria-hidden="true">
      {ALIGN_LINES[type]}
    </svg>
  )
}

/** כיוון כתיבה — חץ עם קווי טקסט מתקצרים לכיוון הזרימה */
export function DirIcon({ dir }) {
  const flip = dir === 'ltr'
  return (
    <svg
      viewBox="0 0 18 19"
      width="16"
      height="16"
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {line(4, 4, 15)}
      {line(8, 7, 15)}
      <path d="M8 13.5 H15 M8 13.5 L10.5 11 M8 13.5 L10.5 16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
