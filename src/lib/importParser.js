import { findUrls } from './docx'

/**
 * ממיר מסמך פיתוח יחידה לרצף מסכים ורכיבים.
 *
 * המסמכים בנויים בתבנית קבועה: כותרת "מסך N", אחריה סעיפים
 * שמיועדים למפתח בלבד, ואז "תוכן גלוי לתלמידים" ובו מה שהתלמיד
 * באמת רואה. המנתח מסתמך על התבנית הזו.
 *
 * העיקרון: מה שמזוהה בביטחון מומר; מה שלא — מסומן לבדיקת המשתמש
 * במסך הסקירה. אין ניחושים שקטים.
 */

const SCREEN_RE = /^(מסך|שקופית|עמוד)\s+(\d+)\s*(.*)$/

// סעיפים שכתובים למפתח ואינם מוצגים לתלמיד
const AUTHOR_SECTIONS = [
  'מטרת השלב', 'מטרת היחידה', 'מה צריך להיות ברור', 'מה התלמידים עושים',
  'מה התלמידים מתרגלים', 'המסקנה שאליה', 'המסקנה שהתלמידים', 'למה השלב מופיע',
  'מה יתווסף בשלב הבא', 'מה נוסף בשלב', 'מה השלב מוסיף', 'מה נבנה כאן',
  'הערת דיוק', 'הדיוק החשוב', 'דגש תוכני', 'הערה כללית', 'הערה להטמעה',
  'הוראות להטמעה', 'הנחיות להטמעה', 'הוראות כלליות', 'סוג הפעילות',
  'דגשים עיצוביים', 'סדר הצגת המידע', 'מבנה כרטיס מקור', 'סדר הכרטיסים',
  'המעבר למסך הבא', 'המעבר בין', 'רצף הבניית הידע', 'פרטי היחידה',
  'קהל יעד', 'אופן הלמידה', 'עקרון פדגוגי', 'שפת עיצוב', 'תפקידם של',
  'התובנה שאמורה', 'מבנה המענה', 'סיום הפעילות', 'הוראות להצגת',
]

const STUDENT_MARKER = ['תוכן גלוי לתלמידים', 'תוכן גלוי']

const FEEDBACK_OK = [
  'משוב לאחר בחירה בתשובה הנכונה', 'משוב לתשובה נכונה', 'משוב לאחר מיון נכון',
  'משוב לאחר תשובה נכונה', 'משוב משותף לאחר הבדיקה', 'המשוב לאחר המיון',
]
const FEEDBACK_NO = [
  'משוב לאחר בחירה בתשובה שאינה נכונה', 'משוב לתשובה שאינה נכונה',
  'משוב לאחר מיון שאינו נכון', 'משוב במקרה של טעות', 'משוב במקרה של תשובה שאינה מלאה',
]

const ANSWER_KEY = ['מפתח תשובות', 'מפתח המיון', 'פתרון', 'הסבר התשובות', 'התשובה הנכונה']

const CALLOUTS = [
  { match: 'הידעת', tone: 'info', label: 'הידעת?!' },
  { match: 'טיפ לחוקר', tone: 'tip', label: 'טיפ לחוקר ולמבקר' },
  { match: 'גוף ידע', tone: 'knowledge', label: 'גוף ידע' },
  { match: 'כלי חדש', tone: 'tool', label: 'כלי חדש' },
  { match: 'מילון תפור', tone: 'glossary', label: 'מילה חמה' },
  { match: 'שימו לב', tone: 'note', label: 'שימו לב' },
]

const startsWithAny = (line, list) => list.some((s) => line.startsWith(s))
const includesAny = (line, list) => list.some((s) => line.includes(s))

/** מזהה את סוג הפעילות מתוך כותרת כמו "פעילות 2: מיון" */
function activityType(line) {
  const l = line.replace(/[־–—]/g, '-')
  if (l.includes('מיון')) return 'sort'
  if (l.includes('התאמה')) return 'match'
  if (l.includes('דרופ דאון') || l.includes('רשימה נפתחת')) return 'dropdown'
  if (l.includes('השלמת משפט') || l.includes('השלמה')) return 'cloze'
  if (l.includes('שאלה פתוחה') || l.includes('תשובה פתוחה')) return 'open'
  if (l.includes('בחירת עמדה')) return 'poll'
  if (l.includes('בחירה מרובה')) return 'multi'
  if (l.includes('רב-ברירה') || l.includes('רב ברירה')) return 'single'
  return null
}

const ACTIVITY_RE = /^(פעילות|שאלה|שאלת|תרגיל)\s*\d*[א-ת]?\s*[:־–—-]?\s*(.*)$/

/** שורה שנראית כמו אפשרות תשובה */
function optionText(line) {
  const m = line.match(/^\s*(?:[-–—•*]|[אבגדהו]\s*[.)]|\d+\s*[.)])\s*(.+)$/)
  return m ? m[1].trim() : null
}

const CORRECT_MARK = /\s*[—–-]\s*תשובה נכונה\.?$/

const IMAGE_HINTS = [
  /^הוראת הפקה/, /^הוראת המחשה/, /^יש להציג תמונה/, /^יש ליצור (שרטוט|איור|תמונה)/,
  /^קישור לתמונה/, /^המקור לתמונה/, /^מקור לתמונה/, /^בתמונה:/, /^תמונה של/,
]
const AUDIO_HINTS = [/נגן שמע/, /^הסכת\b/, /האזינו להסכת/, /^יש להציג נגן/]
const VIDEO_HINTS = [/^צפו בסרטון/, /^יש להציג סרטון/, /^בסרטון\b/, /נגן.*סרטון/, /^צפו ב/]

/** מחזיר בקשת חומר אם השורה מתארת תמונה, סרטון או שמע */
function detectAsset(line, screen) {
  const id = (k) => `${screen.id}-${k}${screen.assets.length}`
  const urls = findUrls(line)

  if (urls.length) {
    const u = urls[0]
    if (/youtube|youtu\.be|vimeo|\.mp4|\.webm/i.test(u))
      return { id: id('vid'), kind: 'video', url: u, consumesLine: true,
               hint: line.replace(u, '').trim().slice(0, 160) || 'סרטון מהמסמך' }
    if (/\.mp3|\.m4a|\.wav|\.ogg/i.test(u))
      return { id: id('aud'), kind: 'audio', url: u, consumesLine: true,
               hint: line.replace(u, '').trim().slice(0, 160) || 'קובץ שמע מהמסמך' }
  }

  const hint = line.replace(/^[^:]{0,40}:\s*/, '').slice(0, 220)
  if (IMAGE_HINTS.some((re) => re.test(line)))
    return { id: id('img'), kind: 'image', hint, consumesLine: true }
  if (AUDIO_HINTS.some((re) => re.test(line)))
    return { id: id('aud'), kind: 'audio', hint, consumesLine: false }
  if (VIDEO_HINTS.some((re) => re.test(line)))
    return { id: id('vid'), kind: 'video', hint, consumesLine: false }
  return null
}

export function parseUnit(nodes) {
  const doc = { title: '', screens: [], warnings: [] }

  // כותרת המסמך: הפסקה הראשונה שאינה סימון מסך
  const firstText = nodes.find((n) => n.kind === 'p' && !SCREEN_RE.test(n.text))
  doc.title = firstText?.text.slice(0, 90) ?? 'יחידה מיובאת'

  // חיתוך לפי מסכים
  const chunks = []
  let current = null
  for (const node of nodes) {
    if (node.kind === 'p') {
      const m = node.text.match(SCREEN_RE)
      if (m) {
        current = { number: Number(m[2]), title: m[3].trim(), nodes: [] }
        chunks.push(current)
        continue
      }
    }
    if (current) current.nodes.push(node)
  }

  if (chunks.length === 0) {
    doc.warnings.push(
      'לא נמצאו סימוני מסכים ("מסך 1", "שקופית 1" או "עמוד 1"). לא ניתן לחלק את המסמך לשלבים אוטומטית.',
    )
    return doc
  }

  chunks.forEach((chunk, i) => doc.screens.push(parseScreen(chunk, i)))
  return doc
}

function parseScreen(chunk, order) {
  const screen = {
    id: `s${order}`,
    number: chunk.number,
    title: chunk.title,
    items: [],
    assets: [],
    warnings: [],
  }

  // שורות טקסט בלבד; טבלאות מטופלות בנפרד
  const lines = []
  for (const n of chunk.nodes) {
    if (n.kind === 'p') lines.push(n.text)
    else if (n.kind === 'table') {
      n.rows.forEach((r) => lines.push(r.join(' | ')))
    }
  }

  // האם יש סימון "תוכן גלוי לתלמידים"
  const markerAt = lines.findIndex((l) => startsWithAny(l, STUDENT_MARKER))
  let inStudent = markerAt === -1 // בלי סימון — קוראים הכול ומסננים לפי סעיפים

  let pending = null // הפעילות שנבנית כרגע
  const flush = () => {
    if (pending) {
      finalizeActivity(pending, screen)
      screen.items.push(pending)
      pending = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) continue

    if (startsWithAny(line, STUDENT_MARKER)) {
      inStudent = true
      continue
    }

    // ── זיהוי חומרים נדרשים ──
    // נעשה לפני סינון סעיפי המפתח, כי הוראות ההפקה נכתבות דווקא שם.
    const asset = detectAsset(line, screen)
    if (asset) {
      // נמנעים מכפילות כשאותה בקשה מנוסחת פעמיים
      if (!screen.assets.some((a) => a.kind === asset.kind && a.hint === asset.hint))
        screen.assets.push(asset)
      if (asset.consumesLine) continue
    }

    // סעיף שמיועד למפתח.
    // כשיש סימון "תוכן גלוי לתלמידים" הוא הקובע; כשאין — מדלגים על
    // הפסקה הזו בלבד, אחרת סעיף אחד היה מבטל את שאר המסך.
    if (startsWithAny(line, AUTHOR_SECTIONS)) {
      if (markerAt !== -1) inStudent = false
      continue
    }

    if (!inStudent) continue

    // משוב
    if (startsWithAny(line, FEEDBACK_OK)) {
      const t = afterColon(line) || lines[++i]?.trim() || ''
      if (pending) pending.okFeedback = t
      continue
    }
    if (startsWithAny(line, FEEDBACK_NO)) {
      const t = afterColon(line) || lines[++i]?.trim() || ''
      if (pending) pending.noFeedback = t
      continue
    }

    // מפתח תשובות
    if (startsWithAny(line, ANSWER_KEY)) {
      if (pending) pending.keyLines = []
      continue
    }

    // כותרות מפורשות
    if (line.startsWith('כותרת ראשית')) {
      flush()
      screen.items.push({ kind: 'title', text: afterColon(line) })
      continue
    }
    if (line.startsWith('כותרת משנה')) {
      flush()
      screen.items.push({ kind: 'subtitle', text: afterColon(line) })
      continue
    }
    if (line.startsWith('כותרת')) {
      flush()
      const t = afterColon(line) || lines[++i]?.trim() || ''
      if (t) screen.items.push({ kind: 'title', text: t })
      continue
    }

    // תיבות מסומנות
    const callout = CALLOUTS.find((c) => line.startsWith(c.match))
    if (callout) {
      flush()
      const inline = line.slice(callout.match.length).replace(/^[\s:!?—–-]+/, '')
      const body = inline || lines[++i]?.trim() || ''
      screen.items.push({ kind: 'callout', tone: callout.tone, label: callout.label, text: body })
      continue
    }

    // כרטיס כלי
    if (line.startsWith('שם הכלי')) {
      flush()
      const name = afterColon(line)
      const steps = []
      let intro = 'מה עושים בעזרת הכלי?'
      let j = i + 1
      for (; j < lines.length; j++) {
        const s = lines[j].trim()
        if (!s) continue
        if (s.startsWith('מה עושים')) { intro = s; continue }
        if (SCREEN_RE.test(s) || startsWithAny(s, AUTHOR_SECTIONS)) break
        if (s.length > 160) break
        steps.push(s.replace(/^[-–—•*]\s*/, ''))
        if (steps.length >= 8) break
      }
      i = j - 1
      screen.items.push({ kind: 'tool', name, intro, steps })
      continue
    }

    // כרטיס מקור
    if (/^מקור\s*\d*$/.test(line) || line.startsWith('קטע מעובד מתוך')) {
      flush()
      const src = { kind: 'source', publisher: '', excerpt: '', url: '', translated: false }
      let j = /^מקור\s*\d*$/.test(line) ? i + 1 : i
      for (; j < lines.length; j++) {
        const s = lines[j].trim()
        if (!s) continue
        if (s.startsWith('קטע מעובד מתוך')) {
          src.publisher = s.replace(/^קטע מעובד (לשפה נגישה )?מתוך (פרסום של |דיווח על מחקר של |עמוד התמיכה של )?/, '')
            .replace(/[—–-]\s*מתורגם מאנגלית:?$/, '').replace(/:$/, '').trim()
          src.translated = /מתורגם מאנגלית/.test(s)
          continue
        }
        if (s.startsWith('למקור') || s.startsWith('קישור למאמר')) {
          src.url = findUrls(s)[0] ?? ''
          if (!src.publisher) src.publisher = afterColon(s).slice(0, 80)
          break
        }
        if (/^מקור\s*\d*$/.test(s) || SCREEN_RE.test(s)) { j--; break }
        src.excerpt += (src.excerpt ? '\n' : '') + s
        if (src.excerpt.length > 1200) break
      }
      i = j
      if (src.excerpt || src.publisher) screen.items.push(src)
      continue
    }

    // תחילת פעילות
    const act = line.match(ACTIVITY_RE)
    if (act && (activityType(line) || /^(פעילות|תרגיל)/.test(line))) {
      flush()
      pending = {
        kind: 'activity',
        qtype: activityType(line) ?? 'single',
        typeGuessed: !activityType(line),
        prompt: '',
        options: [],
        okFeedback: '',
        noFeedback: '',
        rawLines: [],
      }
      continue
    }

    // הוראה לתלמיד — הופכת לניסוח השאלה
    if (/^(הוראה|הנחיה|הוראת הפעילות)\b/.test(line)) {
      const t = afterColon(line) || lines[++i]?.trim() || ''
      if (pending) pending.prompt = pending.prompt || t
      else screen.items.push({ kind: 'text', text: t })
      continue
    }

    if (pending) {
      const opt = optionText(line)
      const isCorrect = CORRECT_MARK.test(line)
      const clean = line.replace(CORRECT_MARK, '').trim()

      // שורה עם מפרידי | היא רשימת אפשרויות בשורה אחת
      if (clean.includes('|') && clean.split('|').length >= 3) {
        clean.split('|').forEach((t) => pending.options.push({ text: t.trim(), correct: false }))
        continue
      }
      // מיון בכתיב "כרטיס ← קבוצה"
      if (clean.includes('←')) {
        const [card, group] = clean.split('←').map((s) => s.trim().replace(/^[„"']|["'"]\.?$/g, ''))
        pending.qtype = 'sort'
        pending.pairs = pending.pairs ?? []
        pending.pairs.push({ card, group })
        continue
      }
      if (opt || (!pending.prompt && clean.endsWith('?'))) {
        if (!pending.prompt && !opt) pending.prompt = clean
        else pending.options.push({ text: opt ?? clean, correct: isCorrect })
        continue
      }
      if (!pending.prompt) { pending.prompt = clean; continue }
      if (clean.length < 150) { pending.options.push({ text: clean, correct: isCorrect }); continue }
      pending.rawLines.push(clean)
      continue
    }

    // טקסט רגיל
    screen.items.push({ kind: 'text', text: line })
  }

  flush()

  if (screen.items.length === 0 && screen.assets.length === 0)
    screen.warnings.push('לא זוהה תוכן לתלמיד במסך הזה.')

  return screen
}

function finalizeActivity(a, screen) {
  if (a.qtype === 'sort' && a.pairs?.length) {
    const groups = [...new Set(a.pairs.map((p) => p.group))]
    a.groups = groups.map((label) => ({ label }))
    a.cards = a.pairs.map((p) => ({ text: p.card, group: p.group }))
    a.options = []
    return
  }

  if (a.qtype === 'single' || a.qtype === 'multi' || a.qtype === 'poll') {
    if (a.options.length < 2) {
      a.needsReview = true
      screen.warnings.push(
        `לפעילות "${(a.prompt || 'ללא ניסוח').slice(0, 40)}" לא זוהו מספיק אפשרויות תשובה.`,
      )
    } else if (a.qtype !== 'poll' && !a.options.some((o) => o.correct)) {
      a.needsReview = true
      screen.warnings.push(
        `לפעילות "${(a.prompt || 'ללא ניסוח').slice(0, 40)}" לא סומנה תשובה נכונה.`,
      )
    }
  }

  if ((a.qtype === 'cloze' || a.qtype === 'dropdown') && !a.template) {
    // בונים תבנית מהאפשרויות אם אפשר, אחרת משאירים לבדיקה
    a.template = a.prompt || ''
    a.needsReview = true
  }

  if (a.qtype === 'match' && !a.pairs?.length) {
    a.needsReview = true
    screen.warnings.push('פעילות התאמה זוהתה אך לא נמצאו זוגות.')
  }
}

const afterColon = (line) => {
  const i = line.indexOf(':')
  return i === -1 ? '' : line.slice(i + 1).trim()
}

/** סיכום למסך הסקירה */
export function summarize(doc) {
  let items = 0
  let questions = 0
  let review = 0
  const assets = { image: 0, video: 0, audio: 0 }
  doc.screens.forEach((s) => {
    items += s.items.length
    s.items.forEach((it) => {
      if (it.kind === 'activity') {
        questions += 1
        if (it.needsReview) review += 1
      }
    })
    s.assets.forEach((a) => (assets[a.kind] = (assets[a.kind] ?? 0) + 1))
  })
  return { screens: doc.screens.length, items, questions, review, assets }
}
