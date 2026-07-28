import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { createCourse } from './blocks'

const coursesRef = collection(db, 'courses')

export async function listCourses(ownerUid) {
  // ממיינים בצד הלקוח כדי לא לחייב אינדקס מורכב ב-Firestore
  const snap = await getDocs(query(coursesRef, where('ownerUid', '==', ownerUid)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
}

export async function getCourse(id) {
  const snap = await getDoc(doc(db, 'courses', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function newCourse(profile) {
  const ref = await addDoc(coursesRef, {
    ...createCourse(),
    ownerUid: profile.id,
    ownerName: profile.displayName || profile.username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveCourse(id, data) {
  const { id: _drop, createdAt: _drop2, ...clean } = data
  await updateDoc(doc(db, 'courses', id), {
    ...clean,
    updatedAt: serverTimestamp(),
  })
}

export const removeCourse = (id) => deleteDoc(doc(db, 'courses', id))

// ───────────── ניהול משתמשים ─────────────

export async function listUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('username')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const updateUserProfile = (uid, data) =>
  updateDoc(doc(db, 'users', uid), data)

export const usernameTaken = async (username) => {
  const snap = await getDocs(
    query(collection(db, 'users'), where('username', '==', username.toLowerCase())),
  )
  return !snap.empty
}
