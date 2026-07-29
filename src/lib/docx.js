import { unzipSync, strFromU8 } from 'fflate'

/**
 * קורא קובץ .docx בדפדפן ומחזיר את תוכנו כרצף פסקאות.
 *
 * .docx הוא ארכיון ZIP; התוכן יושב ב-word/document.xml. אנחנו
 * מוציאים משם טקסט בלבד — כותרות, פסקאות, רשימות וטבלאות —
 * ומשמרים את הסדר, כי המנתח מסתמך עליו לזיהוי מבנה היחידה.
 */

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export async function readDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer())

  let files
  try {
    files = unzipSync(buf)
  } catch {
    throw new Error('הקובץ אינו קובץ Word תקין (.docx).')
  }

  const entry = files['word/document.xml']
  if (!entry) throw new Error('לא נמצא תוכן במסמך. ודא שזהו קובץ .docx ולא .doc ישן.')

  const xml = new DOMParser().parseFromString(strFromU8(entry), 'application/xml')
  if (xml.querySelector('parsererror')) throw new Error('קריאת המסמך נכשלה.')

  const body = xml.getElementsByTagNameNS(W, 'body')[0]
  if (!body) throw new Error('המסמך ריק.')

  const out = []
  for (const node of body.children) {
    const name = node.localName
    if (name === 'p') {
      const text = paraText(node)
      if (text.trim()) out.push({ kind: 'p', text: text.trim(), style: paraStyle(node) })
    } else if (name === 'tbl') {
      out.push({ kind: 'table', rows: tableRows(node) })
    }
  }
  return out
}

function paraText(p) {
  let s = ''
  for (const n of p.getElementsByTagNameNS(W, '*')) {
    if (n.localName === 't') s += n.textContent
    else if (n.localName === 'tab') s += '\t'
    else if (n.localName === 'br') s += '\n'
  }
  return s
}

function paraStyle(p) {
  const pStyle = p.getElementsByTagNameNS(W, 'pStyle')[0]
  return pStyle?.getAttributeNS(W, 'val') ?? ''
}

function tableRows(tbl) {
  const rows = []
  for (const tr of tbl.getElementsByTagNameNS(W, 'tr')) {
    // רק תאים של השורה הזו, לא של טבלאות מקוננות
    const cells = []
    for (const tc of tr.children) {
      if (tc.localName !== 'tc') continue
      const parts = []
      for (const p of tc.getElementsByTagNameNS(W, 'p')) {
        const t = paraText(p).trim()
        if (t) parts.push(t)
      }
      cells.push(parts.join('\n'))
    }
    if (cells.length) rows.push(cells)
  }
  return rows
}

/** מזהה קישורים בתוך טקסט — לסרטונים, להסכתים ולמקורות */
export const findUrls = (text) =>
  (String(text ?? '').match(/https?:\/\/[^\s<>"')]+/g) ?? []).map((u) =>
    u.replace(/[.,;]+$/, ''),
  )
