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
  documentId,
  serverTimestamp,
} from 'firebase/firestore'
import { db, USERS_COL, COURSES_COL, MEDIA_COL } from './firebase'
import { createCourse } from './blocks'

const coursesRef = collection(db, COURSES_COL)

export async function listCourses(ownerUid) {
  // ממיינים בצד הלקוח כדי לא לחייב אינדקס מורכב ב-Firestore
  const snap = await getDocs(query(coursesRef, where('ownerUid', '==', ownerUid)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
}

export async function getCourse(id) {
  const snap = await getDoc(doc(db, COURSES_COL, id))
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
  await updateDoc(doc(db, COURSES_COL, id), {
    ...clean,
    updatedAt: serverTimestamp(),
  })
}

export const removeCourse = (id) => deleteDoc(doc(db, COURSES_COL, id))

// ───────────── מאגר התמונות ─────────────

const mediaRef = collection(db, MEDIA_COL)

export async function listMedia(ownerUid) {
  const snap = await getDocs(query(mediaRef, where('ownerUid', '==', ownerUid)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function addMedia(ownerUid, image) {
  const ref = await addDoc(mediaRef, {
    ownerUid,
    name: image.name,
    dataUrl: image.dataUrl,
    w: image.w,
    h: image.h,
    bytes: image.bytes,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, ownerUid, ...image }
}

export const removeMedia = (id) => deleteDoc(doc(db, MEDIA_COL, id))

/**
 * שולף תמונות לפי מזהים — עבור מצב לומד, שטוען רק את מה שבשימוש.
 * Firestore מגביל שאילתת documentId ל-30 ערכים, ולכן מפוצל למנות.
 */
export async function getMediaByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = {}
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30)
    const snap = await getDocs(query(mediaRef, where(documentId(), 'in', chunk)))
    snap.docs.forEach((d) => {
      map[d.id] = { id: d.id, ...d.data() }
    })
  }
  return map
}

// ───────────── ניהול משתמשים ─────────────

export async function listUsers() {
  const snap = await getDocs(query(collection(db, USERS_COL), orderBy('username')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, USERS_COL, uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const updateUserProfile = (uid, data) =>
  updateDoc(doc(db, USERS_COL, uid), data)

export const usernameTaken = async (username) => {
  const snap = await getDocs(
    query(collection(db, USERS_COL), where('username', '==', username.toLowerCase())),
  )
  return !snap.empty
}
