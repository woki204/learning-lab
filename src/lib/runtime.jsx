import { createContext, useContext } from 'react'

/**
 * מצב ההרצה של השלב הנוכחי בעיני הלומד.
 *
 * זה מה שמאפשר "בדיקה" בתוך השלב ולא רק בסוף: רכיב כפתור הבדיקה
 * קורא ל-onCheck, וכל רכיבי השאלות שבאותו שלב עוברים למצב checked
 * ומציגים מה נכון ומה לא.
 *
 * שום דבר מכאן לא נשמר בשרת — הכול חי בזיכרון הדפדפן של הלומד.
 */
const RuntimeContext = createContext({
  answers: {},
  setAnswer: () => {},
  checked: false,
  result: null,
  onCheck: () => {},
  onReset: () => {},
  showKey: false, // מצב תצוגה של המרצה — מסמן תשובות נכונות מראש
  interactive: true,
})

export const RuntimeProvider = ({ value, children }) => (
  <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
)

export const useRuntime = () => useContext(RuntimeContext)
