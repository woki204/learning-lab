// ─────────────────────────────────────────────────────────────
//  מאגר התמונות
//
//  התמונות נשמרות כמסמכים ב-Firestore ולא ב-Firebase Storage,
//  כדי שלא יידרש שום שלב הגדרה בקונסול. מסמך ב-Firestore מוגבל
//  לכמגה-בייט, ולכן כל תמונה מוקטנת ונדחסת בדפדפן לפני השמירה.
// ─────────────────────────────────────────────────────────────

export const MAX_DIMENSION = 1600 // הצלע הארוכה, בפיקסלים
const MAX_DATAURL_CHARS = 700_000 // מתחת למגבלת המסמך, עם מרווח ביטחון
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45]

export const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('קריאת הקובץ נכשלה.'))
    r.readAsDataURL(file)
  })

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('הקובץ אינו תמונה תקינה.'))
    img.src = src
  })

/**
 * מקטין ודוחס קובץ תמונה עד שהוא נכנס למגבלת המסמך.
 * מחזיר { dataUrl, w, h, name, bytes }.
 */
export async function processImageFile(file) {
  const original = await readAsDataUrl(file)

  // SVG הוא טקסט — אין מה לדחוס, רק לוודא שהוא לא ענק
  if (file.type === 'image/svg+xml') {
    if (original.length > MAX_DATAURL_CHARS)
      throw new Error('קובץ ה-SVG גדול מדי. נסה קובץ פשוט יותר.')
    const img = await loadImage(original)
    return {
      dataUrl: original,
      w: img.naturalWidth || 600,
      h: img.naturalHeight || 400,
      name: file.name,
      bytes: original.length,
    }
  }

  const img = await loadImage(original)
  const { naturalWidth: ow, naturalHeight: oh } = img

  let scale = Math.min(1, MAX_DIMENSION / Math.max(ow, oh))
  let attempt = 0

  while (attempt < 4) {
    const w = Math.max(1, Math.round(ow * scale))
    const h = Math.max(1, Math.round(oh * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    for (const q of QUALITY_STEPS) {
      // WebP שומר שקיפות ודוחס טוב יותר; אם אינו נתמך נופלים ל-JPEG
      let out = canvas.toDataURL('image/webp', q)
      if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', q)
      if (out.length <= MAX_DATAURL_CHARS)
        return { dataUrl: out, w, h, name: file.name, bytes: out.length }
    }

    scale *= 0.7 // עדיין גדול מדי — מקטינים עוד ומנסים שוב
    attempt += 1
  }

  throw new Error('לא הצלחתי לדחוס את התמונה מספיק. נסה תמונה קטנה יותר.')
}

export const prettyBytes = (n) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`
