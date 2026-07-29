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

/**
 * מפרק תבנית השלמה לקטעי טקסט ולחסרים. שני סוגי חסרים:
 *   [[תשובה|חלופה]]     – הלומד מקליד. כל אחת מהחלופות מתקבלת.
 *                          [[]] ריק = כל תשובה שאינה ריקה מתקבלת.
 *   {{דומה|*שונה}}      – הלומד בוחר מרשימה נפתחת. הכוכבית מסמנת
 *                          את הנכונה; בלי כוכבית הראשונה היא הנכונה.
 */
export function parseCloze(template = '') {
  const parts = []
  const re = /\[\[(.*?)\]\]|\{\{(.*?)\}\}/g
  let last = 0
  let m
  let blankIndex = 0
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', text: template.slice(last, m.index) })

    if (m[2] !== undefined) {
      const raw = m[2].split('|').map((s) => s.trim()).filter(Boolean)
      const starred = raw.findIndex((s) => s.startsWith('*'))
      const options = raw.map((s) => s.replace(/^\*/, ''))
      parts.push({
        kind: 'select',
        index: blankIndex++,
        options,
        correct: options[starred >= 0 ? starred : 0] ?? '',
      })
    } else {
      const answers = m[1].split('|').map((s) => s.trim()).filter(Boolean)
      parts.push({ kind: 'blank', index: blankIndex++, answers })
    }
    last = m.index + m[0].length
  }
  if (last < template.length) parts.push({ kind: 'text', text: template.slice(last) })
  return parts
}

export const clozeBlanks = (template) =>
  parseCloze(template).filter((p) => p.kind === 'blank' || p.kind === 'select')

/** האם החסר נענה נכון */
export function clozeBlankCorrect(part, given) {
  if (part.kind === 'select') return norm(given) === norm(part.correct) && String(given ?? '') !== ''
  if (part.answers.length === 0) return !!String(given ?? '').trim()
  return part.answers.some((a) => norm(a) === norm(given))
}

/** שדות המשוב המשותפים לכל רכיב שנבדק */
const feedbackFields = () => ({ okFeedback: '', noFeedback: '' })

/** גוני התיבות המסומנות שחוזרות ביחידות: הידעת, טיפ, גוף ידע וכו' */
export const CALLOUT_TONES = {
  info: { label: 'הידעת', defaultLabel: 'הידעת?!', color: '#0b7285' },
  tip: { label: 'טיפ', defaultLabel: 'טיפ לחוקר ולמבקר', color: '#b45309' },
  knowledge: { label: 'גוף ידע', defaultLabel: 'גוף ידע', color: '#3d5afe' },
  tool: { label: 'כלי חדש', defaultLabel: 'כלי חדש', color: '#7c3aed' },
  glossary: { label: 'מילה חמה', defaultLabel: 'מילה חמה', color: '#be185d' },
  note: { label: 'שימו לב', defaultLabel: 'שימו לב', color: '#0a8f72' },
}

export const calloutToneList = Object.entries(CALLOUT_TONES).map(([key, t]) => ({ key, ...t }))

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
      zoomable: true, // לחיצה פותחת את התמונה במסך מלא
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
      start: 0, // שנייה שממנה מתחילה ההפעלה
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
        { id: newId(), text: '', mediaId: null, feedback: '' },
        { id: newId(), text: '', mediaId: null, feedback: '' },
      ],
      correctId: null,
      shuffle: false,
      points: 1,
      explanation: '',
      poll: false, // סקר עמדה: כל בחירה מתקבלת, בלי נכון ושגוי
      ...feedbackFields(),
    }),
    // סקר עמדה אינו מנוקד כלל — הבחירה נאספת לתעודה בלבד
    collectAnswer: (block, answer) => ({
      question: block.prompt,
      answerText: block.options.find((o) => o.id === answer)?.text ?? '— לא נענה —',
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
      shuffle: false,
      points: 2,
      partial: true, // ניקוד חלקי לפי כמה סומנו נכון
      explanation: '',
      ...feedbackFields(),
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
      ...feedbackFields(),
    }),
    grade: (block, answer) => {
      const filled = answer ?? {}
      const blanks = clozeBlanks(block.template)
      const max = block.points || 1
      if (blanks.length === 0)
        return { correct: true, points: max, max, question: block.template, answerText: '' }

      const hits = blanks.filter((b) => clozeBlankCorrect(b, filled[b.index])).length
      const points = (hits / blanks.length) * max

      return {
        correct: hits === blanks.length,
        points: Math.round(points * 100) / 100,
        max,
        question: block.template.replace(/\[\[(.*?)\]\]|\{\{(.*?)\}\}/g, '____'),
        answerText: blanks.map((b) => filled[b.index] || '—').join(' | ') || '— לא נענה —',
        correctText: blanks
          .map((b) => (b.kind === 'select' ? b.correct : b.answers.length ? b.answers[0] : 'תשובה חופשית'))
          .join(' | '),
      }
    },
  },

  sort: {
    label: 'מיון לקבוצות',
    icon: '🗂',
    gradable: true,
    create: () => ({
      id: newId(),
      type: 'sort',
      prompt: '',
      groups: [
        { id: newId(), label: 'קבוצה א', description: '' },
        { id: newId(), label: 'קבוצה ב', description: '' },
      ],
      cards: [],
      mode: 'board', // board = כל הכרטיסים יחד, sequence = אחד בכל פעם
      shuffle: true,
      points: 4,
      explanation: '',
      ...feedbackFields(),
    }),
    grade: (block, answer) => {
      const placed = answer ?? {}
      const cards = block.cards ?? []
      const max = block.points || 1
      if (cards.length === 0)
        return { correct: true, points: max, max, question: block.prompt, answerText: '' }

      const hits = cards.filter((c) => placed[c.id] && placed[c.id] === c.groupId).length
      const points = (hits / cards.length) * max
      const groupLabel = (gid) => block.groups.find((g) => g.id === gid)?.label ?? '—'

      return {
        correct: hits === cards.length,
        points: Math.round(points * 100) / 100,
        max,
        question: block.prompt,
        answerText:
          cards
            .filter((c) => placed[c.id])
            .map((c) => `${c.text} ← ${groupLabel(placed[c.id])}`)
            .join(' · ') || '— לא מוין —',
        correctText: cards.map((c) => `${c.text} ← ${groupLabel(c.groupId)}`).join(' · '),
      }
    },
  },

  open: {
    label: 'שאלה פתוחה',
    icon: '🖊',
    gradable: false,
    collect: true, // לא מנוקד, אך התשובה נכנסת לתעודה
    create: () => ({
      id: newId(),
      type: 'open',
      prompt: '',
      placeholder: 'כתבו כאן את התשובה שלכם…',
      rows: 4,
      afterText: '',
    }),
    collectAnswer: (block, answer) => ({
      question: block.prompt,
      answerText: String(answer ?? '').trim() || '— לא נענה —',
    }),
  },

  callout: {
    label: 'תיבה מסומנת',
    icon: '💬',
    gradable: false,
    create: (tone = 'info') => ({
      id: newId(),
      type: 'callout',
      tone,
      label: CALLOUT_TONES[tone]?.defaultLabel ?? '',
      text: '',
    }),
  },

  tool: {
    label: 'כרטיס כלי',
    icon: '🧭',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'tool',
      name: '',
      intro: 'מה עושים בעזרת הכלי?',
      steps: ['', ''],
    }),
  },

  source: {
    label: 'כרטיס מקור',
    icon: '📰',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'source',
      publisher: '',
      translated: false,
      adapted: false,
      excerpt: '',
      url: '',
      linkText: 'למקור המלא',
    }),
  },

  match: {
    label: 'התאמה בין טורים',
    icon: '🔗',
    gradable: true,
    create: () => ({
      id: newId(),
      type: 'match',
      prompt: '',
      pairs: [
        { id: newId(), left: '', right: '' },
        { id: newId(), left: '', right: '' },
      ],
      points: 3,
      shuffle: true,
      explanation: '',
      ...feedbackFields(),
    }),
    grade: (block, answer) => {
      const linked = answer ?? {} // { pairId: rightPairId }
      const pairs = block.pairs ?? []
      const max = block.points || 1
      if (pairs.length === 0)
        return { correct: true, points: max, max, question: block.prompt, answerText: '' }

      const hits = pairs.filter((p) => linked[p.id] === p.id).length
      const points = (hits / pairs.length) * max
      const rightOf = (id) => pairs.find((p) => p.id === id)?.right ?? '—'

      return {
        correct: hits === pairs.length,
        points: Math.round(points * 100) / 100,
        max,
        question: block.prompt,
        answerText:
          pairs
            .filter((p) => linked[p.id])
            .map((p) => `${p.left} ← ${rightOf(linked[p.id])}`)
            .join(' · ') || '— לא הותאם —',
        correctText: pairs.map((p) => `${p.left} ← ${p.right}`).join(' · '),
      }
    },
  },

  audio: {
    label: 'שמע / הסכת',
    icon: '🎧',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'audio',
      url: '',
      title: '',
      box: { ...defaultBox(), radius: 10 },
    }),
  },

  gallery: {
    label: 'גלריית תמונות',
    icon: '🖼️',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'gallery',
      items: [], // { id, mediaId, caption }
      mode: 'sequence', // sequence = אחת אחרי השנייה, strip = כולן יחד
      box: { ...defaultBox(), radius: 8 },
    }),
  },

  reveal: {
    label: 'חשיפה בלחיצה',
    icon: '🎴',
    gradable: false,
    create: (mode = 'inline') => ({
      id: newId(),
      type: 'reveal',
      mode, // inline = נפתח במקום, popup = נפתח בחלון
      front: '',
      title: '',
      body: '',
      mediaId: null,
      credit: '',
      buttonLabel: 'גלו את התשובה',
    }),
  },

  tabs: {
    label: 'לשוניות',
    icon: '🗄',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'tabs',
      items: [
        { id: newId(), label: 'לשונית 1', body: '' },
        { id: newId(), label: 'לשונית 2', body: '' },
      ],
      box: { ...defaultBox(), bordered: true, radius: 10 },
    }),
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
  insert('sort', '🗂', 'מיון לקבוצות', () => BLOCK_TYPES.sort.create()),
  insert('match', '🔗', 'התאמה בין טורים', () => BLOCK_TYPES.match.create()),
  insert('open', '🖊', 'שאלה פתוחה', () => BLOCK_TYPES.open.create()),
  insert('check', '✅', 'כפתור בדיקה', () => BLOCK_TYPES.check.create()),
]

export const MEDIA_INSERTS = [
  insert('video', '🎬', 'וידאו', () => BLOCK_TYPES.video.create()),
  insert('audio', '🎧', 'שמע / הסכת', () => BLOCK_TYPES.audio.create()),
  insert('gallery', '🖼️', 'גלריית תמונות', () => BLOCK_TYPES.gallery.create()),
]

export const CARD_INSERTS = [
  ...calloutToneList.map((t) =>
    insert(`callout:${t.key}`, '💬', t.defaultLabel, () => BLOCK_TYPES.callout.create(t.key)),
  ),
  insert('tool', '🧭', 'כרטיס כלי', () => BLOCK_TYPES.tool.create()),
  insert('source', '📰', 'כרטיס מקור', () => BLOCK_TYPES.source.create()),
  insert('reveal', '🎴', 'חשיפה בלחיצה', () => BLOCK_TYPES.reveal.create('inline')),
  insert('reveal:popup', '🪟', 'כרטיס נפתח בחלון', () => BLOCK_TYPES.reveal.create('popup')),
  insert('tabs', '🗄', 'לשוניות', () => BLOCK_TYPES.tabs.create()),
]

export const INSERT_MENU = [
  ...TEXT_INSERTS,
  ...QUESTION_INSERTS,
  ...MEDIA_INSERTS,
  ...CARD_INSERTS,
]

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

/**
 * מחשב ציון לרשימת רכיבים אחת — משמש גם שלב בודד וגם את כל הסביבה.
 * responses אוסף תשובות שאינן מנוקדות (שאלה פתוחה) עבור התעודה.
 */
export function gradeBlocks(blocks = [], answers = {}) {
  const details = []
  const responses = []
  let earned = 0
  let max = 0

  blocks.forEach((block) => {
    const def = BLOCK_TYPES[block.type]
    if (!def) return
    // סקר עמדה מוגדר כשאלה, אך אין לו תשובה נכונה ולכן אינו מנוקד
    const graded = def.gradable && !block.poll
    if (graded) {
      const result = def.grade(block, answers[block.id])
      earned += result.points
      max += result.max
      details.push({ ...result, blockId: block.id })
    } else if (def.collectAnswer) {
      responses.push({ ...def.collectAnswer(block, answers[block.id]), blockId: block.id })
    }
  })

  return {
    details,
    responses,
    earned,
    max,
    score: max > 0 ? Math.round((earned / max) * 100) : 100,
  }
}

// עובר על כל השקופיות, מחשב ציון ומחזיר פירוט לתעודה
export function gradeCourse(course, answers) {
  const details = []
  const responses = []
  let earned = 0
  let max = 0

  course.slides?.forEach((slide, si) => {
    const r = gradeBlocks(slide.blocks, answers)
    earned += r.earned
    max += r.max
    r.details.forEach((d) => details.push({ ...d, slideIndex: si, slideTitle: slide.title }))
    r.responses.forEach((d) => responses.push({ ...d, slideIndex: si, slideTitle: slide.title }))
  })

  const score = max > 0 ? Math.round((earned / max) * 100) : 100
  return { details, responses, earned, max, score, passed: score >= (course.passScore ?? 60) }
}
