/**
 * סימון "מילה חמה" בתוך טקסט רגיל.
 *
 * כותבים ((מרפסת|גזוזטרה היא מרפסת)) והמילה הראשונה מוצגת מודגשת;
 * בלחיצה עליה נפתח ההסבר. אם אין קו מפריד, המילה עצמה היא גם ההסבר.
 */
export function parseGlossary(text = '') {
  const parts = []
  const re = /\(\((.*?)\)\)/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', text: text.slice(last, m.index) })
    const [term, ...rest] = m[1].split('|')
    parts.push({
      kind: 'term',
      term: term.trim(),
      definition: rest.join('|').trim() || term.trim(),
    })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) })
  return parts
}

export const hasGlossary = (text) => /\(\(.*?\)\)/.test(String(text ?? ''))

/**
 * ערבוב יציב: אותו מפתח מחזיר תמיד את אותו סדר, כדי שהרשימה לא
 * תקפוץ בכל הקלדה. הסדר משתנה בין רכיבים ובין ניסיונות.
 */
export function stableShuffle(items, key) {
  let seed = 0
  const s = String(key)
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
