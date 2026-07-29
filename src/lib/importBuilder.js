import { BLOCK_TYPES, newId, createSlide } from './blocks'
import { CANVAS_W, CANVAS_H } from './canvas'

/**
 * הופך את המסמך המנותח לשקופיות אמיתיות.
 *
 * הפריסה אוטומטית: הרכיבים נערמים לגובה בתוך שולי העמוד, וכשנגמר
 * המקום נפתחת שקופית המשך. אחר כך המשתמש גורר ומסדר כרצונו.
 */

const M = 60 // שוליים
const W = CANVAS_W - M * 2
const TOP = 44
const BOTTOM = CANVAS_H - 40
const GAP = 14

const lines = (text, perLine) => Math.max(1, Math.ceil(String(text ?? '').length / perLine))

/** גובה מוערך, אך לעולם לא גבוה מהעמוד עצמו */
function heightOf(item) {
  return Math.min(rawHeight(item), BOTTOM - TOP)
}

function rawHeight(item) {
  switch (item.kind) {
    case 'reveal': return item.mode === 'popup' ? 150 : 190
    case 'tabs': return 120 + (item.items?.length ? lines(item.items[0].body, 80) * 24 : 60)
    case 'check': return 48
    case 'title': return 58
    case 'subtitle': return 46
    case 'text': return lines(item.text, 95) * 27 + 16
    case 'callout': return lines(item.text, 85) * 26 + 58
    case 'tool': return 96 + (item.steps?.length ?? 0) * 30
    case 'source': return Math.min(300, 120 + lines(item.excerpt, 90) * 24)
    case 'media':
      return item.mediaKind === 'audio' ? 92 : item.mediaKind === 'video' ? 330 : 260
    case 'activity': {
      const head = item.prompt ? lines(item.prompt, 85) * 28 + 14 : 0
      switch (item.qtype) {
        case 'sort': return head + 300
        case 'match': return head + 250
        case 'open': return head + 170
        case 'cloze':
        case 'dropdown': return head + 130
        default: return head + (item.options?.length ?? 2) * 48 + 24
      }
    }
    default: return 60
  }
}

/** בונה את הרכיב עצמו לפי הפריט המנותח */
function makeBlock(item, assetMap) {
  const frame = { x: M, y: 0, w: W, h: heightOf(item) }

  if (item.kind === 'title' || item.kind === 'subtitle') {
    const b = BLOCK_TYPES.text.create(item.kind === 'title' ? 'title' : 'subtitle')
    b.content = item.text
    b.style = { ...b.style, align: 'center' }
    return { ...b, frame }
  }

  if (item.kind === 'text') {
    const b = BLOCK_TYPES.text.create('body')
    b.content = item.text
    return { ...b, frame }
  }

  if (item.kind === 'callout') {
    const b = BLOCK_TYPES.callout.create(item.tone)
    b.label = item.label
    b.text = item.text
    return { ...b, frame }
  }

  if (item.kind === 'tool') {
    const b = BLOCK_TYPES.tool.create()
    b.name = item.name
    b.intro = item.intro
    b.steps = item.steps?.length ? item.steps : ['']
    return { ...b, frame }
  }

  if (item.kind === 'source') {
    const b = BLOCK_TYPES.source.create()
    b.publisher = item.publisher
    b.excerpt = item.excerpt
    b.url = item.url
    b.translated = !!item.translated
    return { ...b, frame }
  }

  if (item.kind === 'media') {
    const resolved = assetMap?.[item.assetId]
    if (item.mediaKind === 'image') {
      const b = BLOCK_TYPES.image.create(resolved?.mediaId ?? null)
      b.alt = item.hint ?? ''
      return { ...b, frame: { ...frame, x: M + W / 4, w: W / 2, h: frame.h } }
    }
    if (item.mediaKind === 'video') {
      const b = BLOCK_TYPES.video.create()
      b.url = resolved?.url ?? item.url ?? ''
      b.start = resolved?.start ?? 0
      return { ...b, frame: { ...frame, x: M + W / 6, w: (W * 2) / 3, h: frame.h } }
    }
    const b = BLOCK_TYPES.audio.create()
    b.url = resolved?.url ?? item.url ?? ''
    b.title = item.hint ?? ''
    return { ...b, frame }
  }

  if (item.kind === 'reveal') {
    const b = BLOCK_TYPES.reveal.create(item.mode ?? 'inline')
    b.front = item.front ?? ''
    b.title = item.title ?? ''
    b.body = item.body ?? ''
    b.credit = item.credit ?? ''
    return { ...b, frame }
  }

  if (item.kind === 'tabs') {
    const b = BLOCK_TYPES.tabs.create()
    b.items = (item.items ?? []).map((t) => ({
      id: newId(), label: t.label ?? '', body: t.body ?? '',
    }))
    if (b.items.length === 0) b.items = [{ id: newId(), label: 'לשונית 1', body: '' }]
    return { ...b, frame }
  }

  if (item.kind === 'check') {
    const b = BLOCK_TYPES.check.create()
    b.label = item.label ?? 'בדיקה'
    return { ...b, frame: { ...frame, h: 48 } }
  }

  if (item.kind === 'activity') return makeActivity(item, frame)
  return null
}

function makeActivity(item, frame) {
  const fb = { okFeedback: item.okFeedback ?? '', noFeedback: item.noFeedback ?? '' }

  if (item.qtype === 'sort') {
    const b = BLOCK_TYPES.sort.create()
    b.prompt = item.prompt
    const groupIds = {}
    b.groups = (item.groups ?? []).map((g) => {
      const id = newId()
      groupIds[g.label] = id
      return { id, label: g.label, description: g.description ?? '' }
    })
    b.cards = (item.cards ?? []).map((c) => ({
      id: newId(),
      text: c.text,
      groupId: groupIds[c.group] ?? null,
    }))
    b.points = Math.max(1, b.cards.length)
    return { ...b, ...fb, frame }
  }

  if (item.qtype === 'match') {
    const b = BLOCK_TYPES.match.create()
    b.prompt = item.prompt
    b.pairs = (item.pairs ?? []).map((p) => ({ id: newId(), left: p.left ?? '', right: p.right ?? '' }))
    if (b.pairs.length < 2) b.pairs = [{ id: newId(), left: '', right: '' }, { id: newId(), left: '', right: '' }]
    b.points = b.pairs.length
    return { ...b, ...fb, frame }
  }

  if (item.qtype === 'open') {
    const b = BLOCK_TYPES.open.create()
    b.prompt = item.prompt
    return { ...b, frame }
  }

  if (item.qtype === 'cloze' || item.qtype === 'dropdown') {
    const b = BLOCK_TYPES.cloze.create()
    b.template = item.template || item.prompt || ''
    return { ...b, ...fb, frame }
  }

  if (item.qtype === 'multi') {
    const b = BLOCK_TYPES.multi.create()
    b.prompt = item.prompt
    b.options = (item.options ?? []).map((o) => ({ id: newId(), text: o.text, correct: !!o.correct }))
    if (b.options.length < 2) b.options = [{ id: newId(), text: '', correct: false }, { id: newId(), text: '', correct: false }]
    b.points = Math.max(1, b.options.filter((o) => o.correct).length)
    return { ...b, ...fb, frame }
  }

  // רב-ברירה או סקר עמדה
  const b = BLOCK_TYPES.question.create()
  b.prompt = item.prompt
  b.poll = item.qtype === 'poll'
  b.options = (item.options ?? []).map((o) => ({
    id: newId(), text: o.text, mediaId: null, feedback: '',
  }))
  if (b.options.length < 2)
    b.options = [{ id: newId(), text: '', mediaId: null, feedback: '' }, { id: newId(), text: '', mediaId: null, feedback: '' }]
  const correctIdx = (item.options ?? []).findIndex((o) => o.correct)
  b.correctId = correctIdx >= 0 ? b.options[correctIdx].id : null
  return { ...b, ...fb, frame }
}

const GRADABLE = new Set(['single', 'multi', 'sort', 'match', 'cloze', 'dropdown'])

/**
 * ממיר מסך מנותח לשקופית אחת או יותר.
 * assetMap: assetId → { mediaId } לתמונות או { url, start } למדיה.
 */
export function buildCourse(doc, assetMap = {}) {
  const slides = []

  doc.screens.forEach((screen, si) => {
    // נכסים שכבר יושבים ברצף התוכן (מסלול התבנית) נשארים במקומם;
    // רק נכסים שזוהו בנפרד (מסלול Word) נוספים בסוף.
    const items = [...screen.items]
    const placed = new Set(items.filter((i) => i.assetId).map((i) => i.assetId))
    screen.assets.forEach((a) => {
      if (placed.has(a.id)) return
      items.push({ kind: 'media', mediaKind: a.kind, hint: a.hint, url: a.url, assetId: a.id })
    })

    let slide = createSlide(slides.length)
    slide.title = screen.title || `שלב ${screen.number ?? si + 1}`
    let y = TOP
    let hasQuestion = false
    let hasCheck = false

    const push = () => {
      // כפתור בדיקה נוסף רק אם יש שאלות ואין כבר כפתור מהתבנית
      if (hasQuestion && !hasCheck) {
        const chk = BLOCK_TYPES.check.create()
        slides.push({
          ...slide,
          blocks: [...slide.blocks, { ...chk, frame: { x: M, y: Math.min(y, BOTTOM - 50), w: W, h: 48 } }],
        })
      } else slides.push(slide)
    }

    items.forEach((item) => {
      const block = makeBlock(item, assetMap)
      if (!block) return
      const h = block.frame.h
      // שומרים מקום לכפתור בדיקה שיתווסף בסוף — אבל לא כשמניחים
      // את הכפתור עצמו, אחרת הוא נדחף לשקופית ריקה משלו.
      const reserve =
        item.kind === 'check' ? 0 : GRADABLE.has(item.qtype) || hasQuestion ? 62 : 0

      if (y + h > BOTTOM - reserve && slide.blocks.length > 0) {
        push()
        slide = createSlide(slides.length)
        slide.title = `${screen.title || `שלב ${screen.number ?? si + 1}`} (המשך)`
        y = TOP
        hasQuestion = false
        hasCheck = false
      }

      slide.blocks.push({ ...block, frame: { ...block.frame, y } })
      y += h + GAP
      if (item.kind === 'activity' && GRADABLE.has(item.qtype)) hasQuestion = true
      if (item.kind === 'check') hasCheck = true
    })

    if (slide.blocks.length > 0) push()
  })

  return {
    title: doc.title,
    description: 'יובא ממסמך פיתוח',
    passScore: 60,
    published: false,
    slides: slides.length ? slides : [createSlide(0)],
  }
}
