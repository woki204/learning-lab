/**
 * תבנית היחידה — פורמט JSON יציב שאליו ממירים כל מסמך פיתוח.
 *
 * הרעיון: המשתמש כותב את היחידה איך שנוח לו, ממיר אותה לפורמט הזה
 * (ידנית או בעזרת מודל שפה חיצוני עם הפרומפט שכאן), ומעלה למערכת.
 * הפורמט מתועד, נבדק בקפדנות, וכל שגיאה מוצגת עם מיקום מדויק.
 */

export const TEMPLATE_VERSION = 1

/** אוצר המילים של הפורמט — מקור האמת לתיעוד, לפרומפט ולבדיקה */
export const BLOCK_SPEC = [
  { type: 'title', desc: 'כותרת ראשית', fields: 'text' },
  { type: 'subtitle', desc: 'כותרת משנה', fields: 'text' },
  { type: 'text', desc: 'פסקת טקסט', fields: 'text' },
  {
    type: 'callout',
    desc: 'תיבה מסומנת',
    fields: 'text, tone (info|tip|knowledge|tool|glossary|note), label',
  },
  { type: 'tool', desc: 'כרטיס כלי', fields: 'name, steps[]' },
  { type: 'source', desc: 'כרטיס מקור', fields: 'publisher, excerpt, url, translated' },
  { type: 'image', desc: 'תמונה', fields: 'ask (מה לבקש מהמשתמש), url' },
  { type: 'video', desc: 'סרטון', fields: 'url, start (שניות), ask' },
  { type: 'audio', desc: 'שמע / הסכת', fields: 'url, ask' },
  {
    type: 'choice',
    desc: 'שאלה אמריקאית — תשובה אחת',
    fields: 'prompt, options[], correct (מספר, החל מ-0), feedbackOk, feedbackNo, optionFeedback[], poll',
  },
  {
    type: 'multi',
    desc: 'בחירה מרובה',
    fields: 'prompt, options[], correct[] (מספרים), feedbackOk, feedbackNo',
  },
  {
    type: 'sort',
    desc: 'מיון לקבוצות',
    fields: 'prompt, groups[], cards[{text, group}], feedbackOk, feedbackNo',
  },
  { type: 'match', desc: 'התאמה בין טורים', fields: 'prompt, pairs[[ימין, שמאל]]' },
  { type: 'cloze', desc: 'השלמת מילים', fields: 'text — [[תשובה]] להקלדה, {{א|*ב}} לרשימה' },
  { type: 'open', desc: 'שאלה פתוחה', fields: 'prompt' },
  { type: 'reveal', desc: 'חשיפה בלחיצה', fields: 'front, title, body, mode (inline|popup)' },
  { type: 'tabs', desc: 'לשוניות', fields: 'items[{label, body}]' },
  { type: 'check', desc: 'כפתור בדיקה', fields: 'label' },
]

const VALID_TYPES = new Set(BLOCK_SPEC.map((b) => b.type))
const TONES = new Set(['info', 'tip', 'knowledge', 'tool', 'glossary', 'note'])

/** דוגמה מלאה — גם קובץ ההורדה וגם ההדגמה בפרומפט */
export const EXAMPLE = {
  version: 1,
  title: 'לא מאמינים מיד',
  description: 'בודקים מידע ותשובות של בינה מלאכותית',
  passScore: 60,
  slides: [
    {
      title: 'פתיחה',
      blocks: [
        { type: 'title', text: 'לא מאמינים מיד' },
        { type: 'subtitle', text: 'בודקים מידע ותשובות של בינה מלאכותית' },
        {
          type: 'text',
          text: 'תשובה יכולה להישמע בטוחה, ובכל זאת לכלול מידע שגוי. ביחידה נלמד מה לבדוק.',
        },
        { type: 'image', ask: 'איור של עמדת בדיקה עם זכוכית מגדלת' },
      ],
    },
    {
      title: 'זה נשמע משכנע',
      blocks: [
        { type: 'title', text: 'זה נשמע משכנע. האם זה גם נכון?' },
        {
          type: 'callout',
          tone: 'info',
          label: 'הידעת?!',
          text: 'המחקר משנת 2024 והנתון של 80% הומצאו לצורך הפעילות.',
        },
        {
          type: 'choice',
          prompt: 'מה אפשר ללמוד מכך?',
          options: [
            'ניסוח נחרץ אינו מוכיח שהמידע נכון.',
            'מספר מדויק מוכיח שהמידע נבדק.',
            'טקסט ארוך אמין יותר מטקסט קצר.',
          ],
          correct: 0,
          feedbackOk: 'נכון. התשובה נשמעה מסודרת, אבל חלק מהמידע הומצא.',
          feedbackNo: 'לא בדיוק. ניסוח בטוח ומספרים מדויקים אינם הוכחה.',
          optionFeedback: ['', 'מספר יכול להיות מומצא בדיוק כמו משפט.', ''],
        },
        { type: 'check', label: 'בדיקה' },
      ],
    },
    {
      title: 'מיון טענות',
      blocks: [
        {
          type: 'sort',
          prompt: 'מיינו כל טענה: האם המחקר תומך בה?',
          groups: ['המקור תומך', 'המקור אינו תומך'],
          cards: [
            { text: 'מוזיקה עשויה לסייע לזכור מילים', group: 'המקור תומך' },
            { text: 'במחקר השתתפו 1,200 תלמידים', group: 'המקור אינו תומך' },
            { text: 'המחקר נערך בשנת 2024', group: 'המקור אינו תומך' },
          ],
          feedbackOk: 'מצוין. הפרדתם בין הרעיון הכללי לבין הפרטים שהומצאו.',
          feedbackNo: 'בדקו שוב אילו פרטים באמת מופיעים במקור.',
        },
        {
          type: 'cloze',
          text: 'המחקר האמיתי נערך בשנת [[2018]], והשתתפו בו {{32|*1200}} ילדים.',
        },
        { type: 'open', prompt: 'מה למדתם על בדיקת מידע?' },
        { type: 'check', label: 'בדיקה' },
      ],
    },
  ],
}

/** הפרומפט שהמשתמש מעתיק למודל שפה חיצוני יחד עם המסמך שלו */
export function conversionPrompt() {
  const list = BLOCK_SPEC.map((b) => `- "${b.type}" — ${b.desc}. שדות: ${b.fields}`).join('\n')
  return `אתה ממיר מסמך פיתוח של יחידת הוראה לפורמט JSON.

החזר JSON תקין בלבד. בלי טקסט לפני או אחרי, בלי הסברים, בלי גדרות קוד.

מבנה עליון:
{
  "version": 1,
  "title": "שם היחידה",
  "description": "תיאור קצר",
  "passScore": 60,
  "slides": [ { "title": "שם השלב", "blocks": [ ... ] } ]
}

סוגי הרכיבים המותרים בתוך blocks:
${list}

כללים:
1. כל "מסך", "שקופית" או "עמוד" במסמך המקור הופך ל-slide אחד.
2. תוכן שמיועד למפתח בלבד — מטרת השלב, הנחיות הטמעה, נימוקים
   פדגוגיים, הערות דיוק — לא נכלל. רק מה שהתלמיד רואה.
3. ב-choice השדה correct הוא מספר המתחיל מ-0. ב-multi הוא מערך מספרים.
4. אם במסמך יש משוב לתשובה נכונה ולשגויה — העבר אותם ל-feedbackOk
   ול-feedbackNo. משוב שצמוד לתשובה מסוימת נכנס ל-optionFeedback
   באותו מיקום כמו האפשרות.
5. בשלב שיש בו שאלות, הוסף בסופו רכיב { "type": "check" }.
6. תמונה, סרטון או שמע שהמסמך מבקש אך אין לו כתובת — צור את הרכיב
   עם שדה "ask" שמתאר במילים מה צריך להשיג. אל תמציא כתובות.
   אם יש במסמך קישור אמיתי — שים אותו ב-url.
7. ב-cloze: [[תשובה]] הוא שדה הקלדה, [[מים|חיסכון]] מקבל כמה תשובות,
   ו-{{דומה|*שונה}} הוא רשימה נפתחת שהכוכבית מסמנת בה את הנכונה.
8. שמור על העברית כלשונה. אל תקצר, אל תנסח מחדש ואל תמציא תוכן
   שאינו במסמך.

המסמך להמרה:
---
[הדביקו כאן את המסמך שלכם]
---`
}

// ─────────── בדיקת תקינות ───────────

const isStr = (v) => typeof v === 'string'
const isArr = Array.isArray

/** מחזיר רשימת שגיאות בעברית עם מיקום מדויק. ריק = תקין. */
export function validateTemplate(json) {
  const errors = []
  const E = (where, msg) => errors.push(`${where}: ${msg}`)

  if (!json || typeof json !== 'object' || isArr(json)) {
    return ['הקובץ אינו אובייקט JSON תקין.']
  }
  if (!isStr(json.title) || !json.title.trim()) E('כללי', 'חסר שדה "title" עם שם היחידה.')
  if (!isArr(json.slides) || json.slides.length === 0)
    return [...errors, 'כללי: חסר מערך "slides" עם לפחות שלב אחד.']

  json.slides.forEach((slide, si) => {
    const S = `שלב ${si + 1}`
    if (!slide || typeof slide !== 'object') return E(S, 'אינו אובייקט.')
    if (!isArr(slide.blocks)) return E(S, 'חסר מערך "blocks".')

    slide.blocks.forEach((b, bi) => {
      const B = `${S} · רכיב ${bi + 1}`
      if (!b || typeof b !== 'object') return E(B, 'אינו אובייקט.')
      if (!isStr(b.type)) return E(B, 'חסר שדה "type".')
      if (!VALID_TYPES.has(b.type))
        return E(B, `סוג לא מוכר "${b.type}". הסוגים הקיימים: ${[...VALID_TYPES].join(', ')}`)

      switch (b.type) {
        case 'title':
        case 'subtitle':
        case 'text':
          if (!isStr(b.text)) E(B, 'חסר שדה "text".')
          break
        case 'callout':
          if (!isStr(b.text)) E(B, 'חסר שדה "text".')
          if (b.tone && !TONES.has(b.tone))
            E(B, `"tone" לא מוכר. אפשרויות: ${[...TONES].join(', ')}`)
          break
        case 'tool':
          if (!isStr(b.name)) E(B, 'חסר שדה "name".')
          if (!isArr(b.steps) || b.steps.length === 0) E(B, 'חסר מערך "steps".')
          break
        case 'source':
          if (!isStr(b.excerpt) || !b.excerpt.trim()) E(B, 'חסר שדה "excerpt".')
          break
        case 'choice': {
          if (!isStr(b.prompt)) E(B, 'חסר שדה "prompt".')
          if (!isArr(b.options) || b.options.length < 2) { E(B, 'צריך לפחות שתי אפשרויות ב-"options".'); break }
          if (!b.poll) {
            if (typeof b.correct !== 'number') E(B, 'חסר "correct" — מספר האפשרות הנכונה, החל מ-0.')
            else if (b.correct < 0 || b.correct >= b.options.length)
              E(B, `"correct" הוא ${b.correct} אבל יש רק ${b.options.length} אפשרויות.`)
          }
          if (b.optionFeedback && b.optionFeedback.length !== b.options.length)
            E(B, '"optionFeedback" חייב להיות באותו אורך כמו "options".')
          break
        }
        case 'multi': {
          if (!isStr(b.prompt)) E(B, 'חסר שדה "prompt".')
          if (!isArr(b.options) || b.options.length < 2) { E(B, 'צריך לפחות שתי אפשרויות.'); break }
          if (!isArr(b.correct) || b.correct.length === 0) E(B, 'חסר מערך "correct" עם מספרי התשובות הנכונות.')
          else b.correct.forEach((c) => {
            if (typeof c !== 'number' || c < 0 || c >= b.options.length)
              E(B, `"correct" מכיל ${c}, מחוץ לטווח האפשרויות.`)
          })
          break
        }
        case 'sort': {
          if (!isArr(b.groups) || b.groups.length < 2) { E(B, 'צריך לפחות שתי קבוצות ב-"groups".'); break }
          if (!isArr(b.cards) || b.cards.length === 0) { E(B, 'חסר מערך "cards".'); break }
          b.cards.forEach((c, ci) => {
            if (!c || !isStr(c.text)) E(`${B} · כרטיס ${ci + 1}`, 'חסר "text".')
            else if (!b.groups.includes(c.group))
              E(`${B} · כרטיס ${ci + 1}`, `הקבוצה "${c.group}" אינה ברשימת הקבוצות.`)
          })
          break
        }
        case 'match':
          if (!isArr(b.pairs) || b.pairs.length < 2) E(B, 'צריך לפחות שני זוגות ב-"pairs".')
          else b.pairs.forEach((p, pi) => {
            if (!isArr(p) || p.length !== 2 || !isStr(p[0]) || !isStr(p[1]))
              E(`${B} · זוג ${pi + 1}`, 'כל זוג הוא מערך של שני טקסטים.')
          })
          break
        case 'cloze':
          if (!isStr(b.text)) E(B, 'חסר שדה "text".')
          else if (!/\[\[|\{\{/.test(b.text))
            E(B, 'אין חסרים בטקסט. השתמשו ב-[[תשובה]] או ב-{{א|*ב}}.')
          break
        case 'open':
          if (!isStr(b.prompt)) E(B, 'חסר שדה "prompt".')
          break
        case 'reveal':
          if (!isStr(b.body)) E(B, 'חסר שדה "body" עם התוכן שנחשף.')
          break
        case 'tabs':
          if (!isArr(b.items) || b.items.length === 0) E(B, 'חסר מערך "items".')
          break
        default:
          break
      }
    })
  })

  return errors
}

// ─────────── המרה למבנה הפנימי ───────────

const MEDIA = { image: 'image', video: 'video', audio: 'audio' }

/**
 * הופך את התבנית למבנה שהבנאי כבר יודע לפרוס — אותו מבנה שמייצר
 * גם ייבוא מ-Word, כך ששני המסלולים מתלכדים.
 */
export function templateToDoc(json) {
  const doc = { title: json.title, description: json.description ?? '', screens: [], warnings: [] }

  json.slides.forEach((slide, si) => {
    const screen = {
      id: `t${si}`,
      number: si + 1,
      title: slide.title || `שלב ${si + 1}`,
      items: [],
      assets: [],
      warnings: [],
    }

    slide.blocks.forEach((b, bi) => {
      if (MEDIA[b.type]) {
        const id = `${screen.id}-a${bi}`
        // כל מדיה בלי כתובת הופכת לבקשת חומר מהמשתמש
        screen.assets.push({
          id,
          kind: MEDIA[b.type],
          hint: b.ask || b.caption || 'חומר מהתבנית',
          url: b.url || '',
        })
        screen.items.push({
          kind: 'media',
          mediaKind: MEDIA[b.type],
          hint: b.ask ?? '',
          url: b.url ?? '',
          assetId: id,
        })
        return
      }
      const item = toItem(b)
      if (item) screen.items.push(item)
    })

    doc.screens.push(screen)
  })

  return doc
}

function toItem(b) {
  const fb = { okFeedback: b.feedbackOk ?? '', noFeedback: b.feedbackNo ?? '' }

  switch (b.type) {
    case 'title': return { kind: 'title', text: b.text }
    case 'subtitle': return { kind: 'subtitle', text: b.text }
    case 'text': return { kind: 'text', text: b.text }
    case 'callout':
      return { kind: 'callout', tone: b.tone ?? 'info', label: b.label ?? '', text: b.text }
    case 'tool':
      return { kind: 'tool', name: b.name, intro: b.intro ?? 'מה עושים בעזרת הכלי?', steps: b.steps }
    case 'source':
      return {
        kind: 'source', publisher: b.publisher ?? '', excerpt: b.excerpt,
        url: b.url ?? '', translated: !!b.translated,
      }
    case 'reveal':
      return {
        kind: 'reveal', mode: b.mode ?? 'inline', front: b.front ?? '',
        title: b.title ?? '', body: b.body, credit: b.credit ?? '',
      }
    case 'tabs':
      return { kind: 'tabs', items: b.items }
    case 'check':
      return { kind: 'check', label: b.label ?? 'בדיקה' }

    case 'choice':
      return {
        kind: 'activity', qtype: b.poll ? 'poll' : 'single', prompt: b.prompt,
        options: b.options.map((t, i) => ({
          text: t, correct: i === b.correct, feedback: b.optionFeedback?.[i] ?? '',
        })),
        ...fb,
      }
    case 'multi':
      return {
        kind: 'activity', qtype: 'multi', prompt: b.prompt,
        options: b.options.map((t, i) => ({ text: t, correct: b.correct.includes(i) })),
        ...fb,
      }
    case 'sort':
      return {
        kind: 'activity', qtype: 'sort', prompt: b.prompt ?? '',
        groups: b.groups.map((label) => ({ label })),
        cards: b.cards.map((c) => ({ text: c.text, group: c.group })),
        options: [], ...fb,
      }
    case 'match':
      return {
        kind: 'activity', qtype: 'match', prompt: b.prompt ?? '',
        pairs: b.pairs.map(([left, right]) => ({ left, right })),
        options: [], ...fb,
      }
    case 'cloze':
      return { kind: 'activity', qtype: 'cloze', template: b.text, prompt: '', options: [], ...fb }
    case 'open':
      return { kind: 'activity', qtype: 'open', prompt: b.prompt, options: [] }
    default:
      return null
  }
}
