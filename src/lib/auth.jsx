import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, usernameToEmail } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // אובייקט Firebase Auth
  const [profile, setProfile] = useState(null) // המסמך שלנו ב-users/{uid}
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      const snap = await getDoc(doc(db, 'users', fbUser.uid))
      setUser(fbUser)
      setProfile(snap.exists() ? { id: fbUser.uid, ...snap.data() } : null)
      setLoading(false)
    })
  }, [])

  const login = async (username, password) => {
    const cred = await signInWithEmailAndPassword(
      auth,
      usernameToEmail(username),
      password,
    )
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (snap.exists() && snap.data().disabled) {
      await signOut(auth)
      throw new Error('החשבון הזה הושעה. פנה למנהל המערכת.')
    }
    return cred.user
  }

  const logout = () => signOut(auth)

  // שינוי סיסמה עצמאי — דורש אימות מחדש עם הסיסמה הנוכחית
  const changePassword = async (currentPassword, newPassword) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, cred)
    await updatePassword(auth.currentUser, newPassword)
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      { mustChangePassword: false, passwordChangedAt: serverTimestamp() },
      { merge: true },
    )
    setProfile((p) => (p ? { ...p, mustChangePassword: false } : p))
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    changePassword,
    isAdmin: profile?.role === 'admin',
    isCreator: profile?.role === 'admin' || profile?.role === 'creator',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
