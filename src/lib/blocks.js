// ─────────────────────────────────────────────────────────────
//  רישום סוגי הרכיבים (הכלים) של סביבת הלמידה.
//
//  כל כלי נרשם כאן פעם אחת, ואז הוא זמין אוטומטית בתפריט ההוספה,
//  בתצוגה (BlockRenderer), בעריכה (BlockEditor / Ribbon) ובציון.
//
//  שדות:
//    label      – שם הכלי
//    icon       – אימוג'י לתפריט
//    create()   – רכיב ריק חדש
//    gradable   – האם הכלי נכלל בציון ובתעודה
//    grade(b,a) – מחזיר { correct, points, max, question, answerText }
// ─────────────────────────────────────────────────────────────

import { defaultStyle, defaultBox } from './typography'
import { defaultFrame } from './canvas'

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const norm = (s) =>
  String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"'׳״]/g, '')
    .toLowerCase()

/** מפרק תבנית השלמה לקטעי טקסט ולחסרים. חסר נכתב כ-[[תשובה|חלופה]] */
export function parseCloze(template = '') {
  const parts = []
  const re = /\[\[(.*?)\]\]/g
  let last = 0
  let m
  let blankIndex = 0
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', text: template.slice(last, m.index) })
    const answers = m[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    parts.push({ kind: 'blank', index: blankIndex++, answers })
    last = m.index + m[0].length
  }
  if (last < template.length) parts.push({ kind: 'text', text: template.slice(last) })
  return parts
}

export const BLOCK_TYPES = {
  text: {
    label: 'תיבת טקסט',
    icon: '📝',
    gradable: false,
    create: (variant = 'body') => ({
      id: newId(),
      type: 'text',
      variant,
      content: '',
      style: defaultStyle(variant),
      box: defaultBox(),
    }),
  },

  image: {
    label: 'תמונה',
    icon: '🖼',
    gradable: false,
    create: (mediaId = null) => ({
      id: newId(),
      type: 'image',
      mediaId,
      fit: 'contain', // contain = נכנסת שלמה, cover = ממלאת וחותכת
      box: { ...defaultBox(), radius: 8 },
      alt: '',
    }),
  },

  video: {
    label: 'וידאו',
    icon: '🎬',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'video',
      url: '',
      box: { ...defaultBox(), radius: 10 },
    }),
  },

  question: {
    label: 'שאלה אמריקאית',
    icon: '❓',
    gradable: true,
    create: () => ({
      id: newId(),
      type: 'question',
      prompt: '',
      display: 'list', // list = רשימה, cards = כרטיסים עם תמונות
      columns: 2, // רלוונטי לתצוגת כרטיסים
      options: [
        { id: newId(), text: '', mediaId: null },
        { id: newId(), text: '', mediaId: null },
      ],
      correctId: null,
      points: 1,
      explanation: '',
    }),
    grade: (block, answer) => {
      const chosen = block.options.find((o) => o.id === answer)
      const correct = answer != null && answer === block.correctId
      return {
        correct,
        points: correct ? block.points || 1 : 0,
        max: block.points || 1,
        question: block.prompt,
        answerText: chosen ? chosen.text : '— לא נענה —',
        correctText: block.options.find((o) => o.id === block.correctId)?.text ?? '',
      }
    },
  },

  multi: {
    label: 'בחירה מרובה',
    icon: '☑️',
    gradable: true,
    create: () => ({
      id: newId(),
      type: 'multi',
      prompt: '',
      columns: 1,
      options: [
        { id: newId(), text: '', correct: false },
        { id: newId(), text: '', correct: false },
      ],
      points: 2,
      partial: true, // ניקוד חלקי לפי כמה סומנו נכון
      explanation: '',
    }),
    grade: (block, answer) => {
      const picked = Array.isArray(answer) ? answer : []
      const right = block.options.filter((o) => o.correct)
      const hits = right.filter((o) => picked.includes(o.id)).length
      const misses = picked.filter((id) => !right.some((o) => o.id === id)).length
      const max = block.points || 1
      const allCorrect = hits === right.length && misses === 0

      let points = 0
      if (allCorrect) points = max
      else if (block.partial && right.length > 0)
        // כל סימון שגוי מקזז סימון נכון, כדי שלא ישתלם לסמן הכול
        points = Math.max(0, ((hits - misses) / right.length) * max)

      return {
        correct: allCorrect,
        points: Math.round(points * 100) / 100,
        max,
        question: block.prompt,
        answerText:
          picked
            .map((id) => block.options.find((o) => o.id === id)?.text)
            .filter(Boolean)
            .join(' · ') || '— לא נענה —',
        correctText: right.map((o) => o.text).join(' · '),
      }
    },
  },

  cloze: {
    label: 'השלמת מילים',
    icon: '✍️',
    gradable: true,
    create: () => ({
      id: newId(),
      type: 'cloze',
      template: 'אני צריך/ה עזרה ב[[]] על [[]].',
      points: 2,
      explanation: '',
    }),
    grade: (block, answer) => {
      const filled = answer ?? {}
      const blanks = parseCloze(block.template).filter((p) => p.kind === 'blank')
      const max = block.points || 1
      if (blanks.length === 0)
        return { correct: true, points: max, max, question: block.template, answerText: '' }

      let hits = 0
      blanks.forEach((b) => {
        const given = filled[b.index]
        // חסר בלי תשובות מוגדרות נבדק רק על כך שמולא
        if (b.answers.length === 0) {
          if (String(given ?? '').trim()) hits += 1
        } else if (b.answers.some((a) => norm(a) === norm(given))) hits += 1
      })

      const points = (hits / blanks.length) * max
      return {
        correct: hits === blanks.length,
        points: Math.round(points * 100) / 100,
        max,
        question: block.template.replace(/\[\[(.*?)\]\]/g, '____'),
        answerText:
          blanks.map((b) => filled[b.index] || '—').join(' | ') || '— לא נענה —',
        correctText: blanks
          .map((b) => (b.answers.length ? b.answers[0] : 'תשובה חופשית'))
          .join(' | '),
      }
    },
  },

  check: {
    label: 'כפתור בדיקה',
    icon: '✅',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'check',
      label: 'בדיקה',
      showScore: true,
      allowRetry: true,
    }),
  },
}

export const blockTypeList = Object.entries(BLOCK_TYPES).map(([key, def]) => ({
  key,
  ...def,
}))

// ארבע רמות הטקסט הן אותו סוג רכיב בווריאנטים שונים, ולכן הן
// מופיעות בתפריט ההוספה כארבע כניסות נפרדות ונוחות.
const insert = (kind, badge, label, build) => ({
  key: kind,
  badge,
  label,
  // n = כמה רכיבים כבר יש בשקופית, כדי להסיט את החדש ולא לערום
  make: (n = 0) => ({ ...build(), frame: defaultFrame(kind.split(':').pop(), n) }),
})

export const TEXT_INSERTS = [
  insert('text:title', 'H1', 'כותרת ראשית', () => BLOCK_TYPES.text.create('title')),
  insert('text:subtitle', 'H2', 'כותרת משנה', () => BLOCK_TYPES.text.create('subtitle')),
  insert('text:body', 'T', 'טקסט', () => BLOCK_TYPES.text.create('body')),
  insert('text:caption', 't', 'טקסט משני', () => BLOCK_TYPES.text.create('caption')),
]

export const QUESTION_INSERTS = [
  insert('question', '❓', 'שאלה אמריקאית', () => BLOCK_TYPES.question.create()),
  insert('multi', '☑️', 'בחירה מרובה', () => BLOCK_TYPES.multi.create()),
  insert('cloze', '✍️', 'השלמת מילים', () => BLOCK_TYPES.cloze.create()),
  insert('check', '✅', 'כפתור בדיקה', () => BLOCK_TYPES.check.create()),
]

export const MEDIA_INSERTS = [
  insert('video', '🎬', 'וידאו', () => BLOCK_TYPES.video.create()),
]

export const INSERT_MENU = [...TEXT_INSERTS, ...QUESTION_INSERTS, ...MEDIA_INSERTS]

export const createSlide = (index = 0) => ({
  id: newId(),
  title: `שלב ${index + 1}`,
  background: { color: '#ffffff', mediaId: null, fit: 'cover' },
  blocks: [],
})

export const createCourse = () => ({
  title: 'סביבת למידה חדשה',
  description: '',
  passScore: 60,
  published: false,
  slides: [createSlide(0)],
})

/** מחשב ציון לרשימת רכיבים אחת — משמש גם שלב בודד וגם את כל הסביבה */
export function gradeBlocks(blocks = [], answers = {}) {
  const details = []
  let earned = 0
  let max = 0
  blocks.forEach((block) => {
    const def = BLOCK_TYPES[block.type]
    if (!def?.gradable) return
    const result = def.grade(block, answers[block.id])
    earned += result.points
    max += result.max
    details.push({ ...result, blockId: block.id })
  })
  return { details, earned, max, score: max > 0 ? Math.round((earned / max) * 100) : 100 }
}

// עובר על כל השקופיות, מחשב ציון ומחזיר פירוט לתעודה
export function gradeCourse(course, answers) {
  const details = []
  let earned = 0
  let max = 0

  course.slides?.forEach((slide, si) => {
    const r = gradeBlocks(slide.blocks, answers)
    earned += r.earned
    max += r.max
    r.details.forEach((d) => details.push({ ...d, slideIndex: si, slideTitle: slide.title }))
  })

  const score = max > 0 ? Math.round((earned / max) * 100) : 100
  return { details, earned, max, score, passed: score >= (course.passScore ?? 60) }
}
