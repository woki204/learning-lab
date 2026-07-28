// בונה את הקישור המלא למצב לומד — זה מה שהמרצה משתף עם התלמידים.
// אנחנו משתמשים ב-HashRouter כדי ש-GitHub Pages יגיש את הדף גם בנתיב עמוק.
export function learnLink(courseId) {
  const { origin } = window.location
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${origin}${base}/#/learn/${courseId}`
}
