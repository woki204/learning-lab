/**
 * תעודת סיום. נוצרת בזיכרון בלבד — שום נתון של הלומד אינו נשמר בשרת.
 */
export default function Certificate({ course, learnerName, result, onRestart }) {
  const today = new Date().toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const serial = `${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`

  return (
    <div className="cert-wrap">
      <div className="certificate">
        <div className="cert-head">
          <div className="kicker">תעודת סיום</div>
          <h1>{course.title}</h1>
          {course.ownerName && <div className="muted">מנחה: {course.ownerName}</div>}
        </div>

        <div className="muted" style={{ textAlign: 'center' }}>
          ניתנת בזאת ל־
        </div>
        <div className="cert-name">{learnerName || 'לומד/ת'}</div>

        <div className="cert-score">
          <div
            className={'score-ring ' + (result.passed ? 'pass' : 'fail')}
            aria-label={`ציון ${result.score}`}
          >
            {result.score}
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>
              {result.passed ? 'עמד/ה בהצלחה בדרישות' : 'טרם עמד/ה בציון העובר'}
            </div>
            <div className="muted">
              {result.earned} מתוך {result.max} נקודות · ציון עובר:{' '}
              {course.passScore ?? 60}
            </div>
          </div>
        </div>

        {result.details.length > 0 && (
          <div className="cert-answers">
            <h3>פירוט התשובות</h3>
            {result.details.map((d, i) => (
              <div
                key={i}
                className={'cert-answer ' + (d.correct ? 'right' : 'wrong')}
              >
                <div className="q">
                  {i + 1}. {d.question || '(שאלה)'}
                </div>
                <div className="a">
                  {d.correct ? '✓' : '✗'} תשובתך: {d.answerText}
                  {!d.correct && d.correctText && (
                    <> · התשובה הנכונה: {d.correctText}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {result.responses?.length > 0 && (
          <div className="cert-answers">
            <h3>התשובות הפתוחות שלך</h3>
            {result.responses.map((r, i) => (
              <div key={i} className="cert-answer open">
                <div className="q">{r.question || '(שאלה)'}</div>
                <div className="a open-text">{r.answerText}</div>
              </div>
            ))}
          </div>
        )}

        <div className="cert-foot">
          <span>תאריך: {today}</span>
          <span>מס' תעודה: {serial}</span>
        </div>
      </div>

      <div
        className="no-print"
        style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}
      >
        <button className="btn" onClick={() => window.print()}>
          🖨 הדפסה / שמירה כ-PDF
        </button>
        {onRestart && (
          <button className="btn ghost" onClick={onRestart}>
            התחל מחדש
          </button>
        )}
      </div>
      <p className="tiny muted no-print" style={{ textAlign: 'center', marginTop: 14 }}>
        התעודה נוצרה במכשיר שלך בלבד. המערכת אינה שומרת את שמך או את תשובותיך —
        הדפס או שמור אותה כעת.
      </p>
    </div>
  )
}
