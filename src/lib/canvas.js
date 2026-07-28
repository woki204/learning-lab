// ─────────────────────────────────────────────────────────────
//  במת השקופית
//
//  כל שקופית היא קנבס במידות קבועות ביחס 16:9, ומיקום כל רכיב
//  נשמר ביחידות הקנבס (ולא בפיקסלים של המסך). בתצוגה הקנבס כולו
//  מוקטן או מוגדל בבת אחת עם transform: scale().
//
//  היתרון: מה שהמרצה סידר נראה זהה בדיוק בכל מסך — מחשב, טאבלט
//  או טלפון — כולל גדלי הגופנים, שמתכווצים יחד עם הבמה.
// ─────────────────────────────────────────────────────────────

export const CANVAS_W = 1000
export const CANVAS_H = 562.5 // 16:9

export const MIN_W = 60
export const MIN_H = 36

// מסגרת פתיחה לכל סוג רכיב, ביחידות הקנבס
const FRAMES = {
  title: { x: 70, y: 60, w: 860, h: 86 },
  subtitle: { x: 70, y: 160, w: 860, h: 66 },
  body: { x: 70, y: 240, w: 860, h: 170 },
  caption: { x: 70, y: 430, w: 860, h: 56 },
  question: { x: 70, y: 120, w: 860, h: 330 },
  multi: { x: 70, y: 130, w: 860, h: 300 },
  cloze: { x: 70, y: 150, w: 860, h: 230 },
  check: { x: 70, y: 470, w: 860, h: 56 },
  video: { x: 200, y: 90, w: 600, h: 338 },
  image: { x: 300, y: 130, w: 400, h: 300 },
}

/**
 * מסגרת לתמונה שנגררה לבמה: ממורכזת על נקודת השחרור ושומרת על
 * יחס הצדדים המקורי, בלי לחרוג מגבולות השקופית.
 */
export function frameForImage(dropX, dropY, imgW, imgH) {
  const maxW = CANVAS_W * 0.5
  const maxH = CANVAS_H * 0.6
  const k = Math.min(maxW / imgW, maxH / imgH, 1)
  const w = Math.max(MIN_W, imgW * k)
  const h = Math.max(MIN_H, imgH * k)
  return clampFrame({ x: dropX - w / 2, y: dropY - h / 2, w, h })
}

/**
 * מסגרת ברירת מחדל לרכיב חדש. כל רכיב נוסף מוסט מעט מקודמו
 * כדי שלא ייערמו זה על זה במקום מדויק אחד.
 */
export function defaultFrame(kind, existingCount = 0) {
  const base = FRAMES[kind] ?? FRAMES.body
  const step = 22 * (existingCount % 6)
  return clampFrame({ ...base, x: base.x + step, y: base.y + step })
}

export function clampFrame(f) {
  const w = Math.max(MIN_W, Math.min(f.w, CANVAS_W))
  const h = Math.max(MIN_H, Math.min(f.h, CANVAS_H))
  return {
    x: Math.round(Math.max(0, Math.min(f.x, CANVAS_W - w))),
    y: Math.round(Math.max(0, Math.min(f.y, CANVAS_H - h))),
    w: Math.round(w),
    h: Math.round(h),
  }
}

// בלוקים שנוצרו לפני שהמיקום החופשי נוסף — מסדרים אותם בטור.
export function ensureFrame(block, index = 0) {
  if (block.frame) return block
  const kind = block.type === 'text' ? (block.variant ?? 'body') : block.type
  const base = FRAMES[kind] ?? FRAMES.body
  return { ...block, frame: clampFrame({ ...base, y: 50 + index * 110 }) }
}

export const frameStyle = (frame) => ({
  left: `${frame.x}px`,
  top: `${frame.y}px`,
  width: `${frame.w}px`,
  height: `${frame.h}px`,
})

// ידיות שינוי הגודל: הכיוון שכל אחת מושכת אליו
export const HANDLES = [
  { key: 'nw', cx: 0, cy: 0, cursor: 'nwse-resize' },
  { key: 'n', cx: 0.5, cy: 0, cursor: 'ns-resize' },
  { key: 'ne', cx: 1, cy: 0, cursor: 'nesw-resize' },
  { key: 'e', cx: 1, cy: 0.5, cursor: 'ew-resize' },
  { key: 'se', cx: 1, cy: 1, cursor: 'nwse-resize' },
  { key: 's', cx: 0.5, cy: 1, cursor: 'ns-resize' },
  { key: 'sw', cx: 0, cy: 1, cursor: 'nesw-resize' },
  { key: 'w', cx: 0, cy: 0.5, cursor: 'ew-resize' },
]

/** מחשב מסגרת חדשה בעת גרירת ידית. dx/dy כבר ביחידות הקנבס. */
export function resizeFrame(start, handle, dx, dy) {
  let { x, y, w, h } = start
  if (handle.includes('n')) {
    y = start.y + dy
    h = start.h - dy
  }
  if (handle.includes('s')) h = start.h + dy
  if (handle.includes('w')) {
    x = start.x + dx
    w = start.w - dx
  }
  if (handle.includes('e')) w = start.w + dx

  // מניעת היפוך המסגרת כשגוררים מעבר לצד הנגדי
  if (w < MIN_W) {
    if (handle.includes('w')) x = start.x + start.w - MIN_W
    w = MIN_W
  }
  if (h < MIN_H) {
    if (handle.includes('n')) y = start.y + start.h - MIN_H
    h = MIN_H
  }
  return clampFrame({ x, y, w, h })
}
