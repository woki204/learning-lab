import { useEffect, useState } from 'react'

const WINDOW = 10 // כמה מספרי שלבים מוצגים בו-זמנית

/**
 * סרגל הניווט התחתון.
 * מבנה (RTL): [◄ הקודם]  [ 1 2 3 … 10 ]  [► הבא]
 * ה-DOM מסודר קודם→הבא, וב-dir=rtl זה מציב את "הקודם" בימין ואת "הבא" בשמאל.
 */
export default function SlideNav({ total, current, onGo, visited = new Set() }) {
  const [start, setStart] = useState(0)

  // גלגול חלון המספרים כך שהשלב הפעיל תמיד גלוי
  useEffect(() => {
    setStart((s) => {
      const max = Math.max(0, total - WINDOW)
      let next = s
      if (current < s) next = current
      else if (current > s + WINDOW - 1) next = current - WINDOW + 1
      return Math.min(Math.max(0, next), max)
    })
  }, [current, total])

  const end = Math.min(total, start + WINDOW)
  const steps = Array.from({ length: end - start }, (_, i) => start + i)

  return (
    <div className="slidenav-wrap">
      <div className="slidenav" role="navigation" aria-label="ניווט בין שלבים">
        <button
          className="arrow"
          onClick={() => onGo(current - 1)}
          disabled={current === 0}
          title="לשלב הקודם"
          aria-label="לשלב הקודם"
        >
          ›
        </button>

        {start > 0 && <span className="ellipsis">…</span>}

        <div className="steps">
          {steps.map((i) => (
            <button
              key={i}
              className={
                'step' +
                (i === current ? ' active' : '') +
                (i !== current && visited.has(i) ? ' done' : '')
              }
              onClick={() => onGo(i)}
              aria-current={i === current ? 'step' : undefined}
              aria-label={`שלב ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {end < total && <span className="ellipsis">…</span>}

        <button
          className="arrow"
          onClick={() => onGo(current + 1)}
          disabled={current >= total - 1}
          title="לשלב הבא"
          aria-label="לשלב הבא"
        >
          ‹
        </button>
      </div>
    </div>
  )
}
