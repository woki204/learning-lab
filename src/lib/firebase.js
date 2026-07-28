import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
//  הגדרות Firebase
//  אנחנו חולקים את הפרויקט eduai-planner-1b6ac עם אתר הפורטפוליו.
//  המפתחות האלה ציבוריים מטבעם ומיועדים לרוץ בדפדפן — ההגנה
//  האמיתית היא כללי האבטחה בקובץ firestore.rules.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: 'AIzaSyDOpyzVs2XKi2QRxLnpEUu3rM7A0VO1N80',
  authDomain: 'eduai-planner-1b6ac.firebaseapp.com',
  projectId: 'eduai-planner-1b6ac',
  storageBucket: 'eduai-planner-1b6ac.firebasestorage.app',
  messagingSenderId: '821536586016',
  appId: '1:821536586016:web:fb0452985ba41563daff45',
}

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_')

// ─────────────────────────────────────────────────────────────
//  שמות הקולקציות.
//  הפרויקט משותף עם הפורטפוליו, שכבר תופס שם את הקולקציות
//  users / apps / clicks / favCounts. לכן כל מה ששייך למעבדת
//  הלמידה מקבל תחילית ll_ ואינו נוגע בנתונים של הפורטפוליו.
// ─────────────────────────────────────────────────────────────
export const USERS_COL = 'll_users'
export const COURSES_COL = 'll_courses'

const app = getApps()[0] ?? initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// המערכת מזדהה בשם משתמש ולא בדוא"ל. Firebase Auth דורש דוא"ל,
// לכן שם המשתמש ממופה לכתובת פנימית קבועה שאיש לא רואה.
export const USERNAME_DOMAIN = 'users.learning-lab.local'
export const usernameToEmail = (username) =>
  `${String(username).trim().toLowerCase()}@${USERNAME_DOMAIN}`
