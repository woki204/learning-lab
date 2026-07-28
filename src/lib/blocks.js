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

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const BLOCK_TYPES = {
  text: {
    label: 'טקסט',
    icon: '📝',
    gradable: false,
    create: () => ({
      id: newId(),
      type: 'text',
      heading: '',
      body: '',
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
