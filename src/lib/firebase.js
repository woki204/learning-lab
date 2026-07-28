import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
//  הגדרות Firebase
//  החלף את הערכים כאן בערכים מהפרויקט שלך:
//  console.firebase.google.com → הגדרות פרויקט → האפליקציות שלך → Web
//  המפתחות האלה ציבוריים מטבעם ומיועדים לרוץ בדפדפן — ההגנה
//  האמיתית היא כללי האבטחה בקובץ firestore.rules.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT.appspot.com',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
}

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_')

const app = getApps()[0] ?? initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// המערכת מזדהה בשם משתמש ולא בדוא"ל. Firebase Auth דורש דוא"ל,
// לכן שם המשתמש ממופה לכתובת פנימית קבועה שאיש לא רואה.
export const USERNAME_DOMAIN = 'users.learning-lab.local'
export const usernameToEmail = (username) =>
  `${String(username).trim().toLowerCase()}@${USERNAME_DOMAIN}`
