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

/** אוסף את כל מזהי התמונות שבשימוש בסביבה */
export function collectMediaIds(course) {
  const ids = []
  course?.slides?.forEach((s) =>
    s.blocks?.forEach((b) => {
      if (b.type === 'image' && b.mediaId) ids.push(b.mediaId)
    }),
  )
  return ids
}
