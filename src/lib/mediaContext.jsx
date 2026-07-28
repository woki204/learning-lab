import { createContext, useContext } from 'react'

/**
 * מפה של מזהה תמונה → מסמך התמונה.
 * הרכיבים על הבמה שומרים רק mediaId, והתוכן עצמו נטען פעם אחת
 * ברמת העמוד — כך שאותה תמונה שמופיעה בכמה שקופיות נטענת פעם אחת.
 */
const MediaContext = createContext({})

export const MediaProvider = ({ value, children }) => (
  <MediaContext.Provider value={value ?? {}}>{children}</MediaContext.Provider>
)

export const useMedia = () => useContext(MediaContext)

/**
 * אוסף את כל מזהי התמונות שבשימוש בסביבה — רכיבי תמונה, רקעי
 * שקופיות וכרטיסי תשובה. כל מזהה שנשכח כאן יופיע ריק אצל הלומד.
 */
export function collectMediaIds(course) {
  const ids = []
  course?.slides?.forEach((s) => {
    if (s.background?.mediaId) ids.push(s.background.mediaId)
    s.blocks?.forEach((b) => {
      if (b.mediaId) ids.push(b.mediaId)
      b.options?.forEach((o) => o.mediaId && ids.push(o.mediaId))
    })
  })
  return ids
}
