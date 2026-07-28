// ─────────────────────────────────────────────────────────────
//  רישום סוגי הבלוקים (הכלים) של סביבת הלמידה.
//
//  כל כלי עתידי נרשם כאן פעם אחת, ואז הוא זמין אוטומטית:
//  בעורך (BlockEditor), בתצוגה (BlockRenderer) ובחישוב הציון.
//
//  שדות:
//    label      – שם הכלי בתפריט "הוסף"
//    icon       – אימוג'י לתפריט
//    create()   – בלוק ריק חדש
//    gradable   – האם הכלי נכלל בציון ובתעודה
//    grade(b,a) – מחזיר { correct, points, max, answerText } לפי תשובת הלומד
// ─────────────────────────────────────────────────────────────

import { defaultStyle, defaultBox } from './typography'
import { defaultFrame } from './canvas'

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

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
      fit: 'contain', // contain = התמונה נכנסת שלמה, cover = ממלאת וחותכת
      box: { ...defaultBox(), radius: 8 },
      alt: '',
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
      options: [
        { id: newId(), text: '' },
        { id: newId(), text: '' },
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
        correctText:
          block.options.find((o) => o.id === block.correctId)?.text ?? '',
      }
    },
  },
}

export const blockTypeList = Object.entries(BLOCK_TYPES).map(([key, def]) => ({
  key,
  ...def,
}))

// תפריט ה"הוסף" בעורך. ארבע רמות הטקסט הן אותו סוג בלוק בווריאנטים
// שונים, ולכן הן מופיעות כאן כארבע כניסות נפרדות ונוחות.
const insert = (kind, badge, label, build) => ({
  key: kind,
  badge,
  label,
  // n = כמה רכיבים כבר יש בשקופית, כדי להסיט את החדש ולא לערום
  make: (n = 0) => ({ ...build(), frame: defaultFrame(kind.split(':').pop(), n) }),
})

export const INSERT_MENU = [
  insert('text:title', 'H1', 'כותרת ראשית', () => BLOCK_TYPES.text.create('title')),
  insert('text:subtitle', 'H2', 'כותרת משנה', () => BLOCK_TYPES.text.create('subtitle')),
  insert('text:body', 'T', 'טקסט', () => BLOCK_TYPES.text.create('body')),
  insert('text:caption', 't', 'טקסט משני', () => BLOCK_TYPES.text.create('caption')),
  insert('question', '❓', 'שאלה אמריקאית', () => BLOCK_TYPES.question.create()),
]

export const createSlide = (index = 0) => ({
  id: newId(),
  title: `שלב ${index + 1}`,
  blocks: [],
})

export const createCourse = () => ({
  title: 'סביבת למידה חדשה',
  description: '',
  passScore: 60,
  published: false,
  slides: [createSlide(0)],
})

// עובר על כל השקופיות, מחשב ציון ומחזיר פירוט לתעודה
export function gradeCourse(course, answers) {
  const details = []
  let earned = 0
  let max = 0

  course.slides?.forEach((slide, si) => {
    slide.blocks?.forEach((block) => {
      const def = BLOCK_TYPES[block.type]
      if (!def?.gradable) return
      const result = def.grade(block, answers[block.id])
      earned += result.points
      max += result.max
      details.push({ ...result, slideIndex: si, slideTitle: slide.title })
    })
  })

  const score = max > 0 ? Math.round((earned / max) * 100) : 100
  return { details, earned, max, score, passed: score >= (course.passScore ?? 60) }
}
