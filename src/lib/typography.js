// ─────────────────────────────────────────────────────────────
//  טיפוגרפיה ועיצוב תיבות טקסט
//
//  כל תיבת טקסט בנויה משלוש שכבות:
//    variant – הרמה (כותרת / כותרת משנה / טקסט / טקסט משני).
//              קובעת את ברירות המחדל של הגודל והמשקל.
//    style   – עיצוב הגופן: סוג, גודל, צבע, הדגשה, הטיה, קו תחתון, יישור.
//    box     – עיצוב התיבה: מילוי, מסגרת (צבע/עובי/סוג), פינות, ריפוד.
//
//  כל שדה ב-style/box שלא הוגדר יורש מברירת המחדל של ה-variant,
//  כך שאפשר לשנות רמה בלי לאבד התאמות אישיות.
// ─────────────────────────────────────────────────────────────

export const VARIANTS = {
  title: { label: 'כותרת ראשית', fontSize: 34, bold: true, sample: 'כותרת' },
  subtitle: { label: 'כותרת משנה', fontSize: 24, bold: true, sample: 'כותרת משנה' },
  body: { label: 'טקסט', fontSize: 17, bold: false, sample: 'טקסט רגיל' },
  caption: { label: 'טקסט משני', fontSize: 14, bold: false, sample: 'טקסט משני' },
}

export const variantList = Object.entries(VARIANTS).map(([key, v]) => ({ key, ...v }))

// גופנים עבריים הנטענים ב-index.html
export const FONTS = [
  { value: "'Assistant', sans-serif", label: 'אסיסטנט' },
  { value: "'Heebo', sans-serif", label: 'חיבו' },
  { value: "'Rubik', sans-serif", label: 'רוביק' },
  { value: "'Alef', sans-serif", label: 'אלף' },
  { value: "'Varela Round', sans-serif", label: 'ורלה עגול' },
  { value: "'Miriam Libre', sans-serif", label: 'מרים' },
  { value: "'Frank Ruhl Libre', serif", label: 'פרנק-רוהל' },
  { value: "'David Libre', serif", label: 'דוד' },
  { value: "'Secular One', sans-serif", label: 'סקולר' },
  { value: "'Suez One', serif", label: 'סואץ' },
]

export const BORDER_STYLES = [
  { value: 'solid', label: 'קו מלא' },
  { value: 'dashed', label: 'מקווקו' },
  { value: 'dotted', label: 'נקודות' },
  { value: 'double', label: 'קו כפול' },
]

export const ALIGNMENTS = [
  { value: 'right', label: 'ימין', icon: '⯈' },
  { value: 'center', label: 'מרכז', icon: '≡' },
  { value: 'left', label: 'שמאל', icon: '⯇' },
  { value: 'justify', label: 'מיושר', icon: '☰' },
]

export const defaultStyle = (variant = 'body') => ({
  fontFamily: FONTS[0].value,
  fontSize: VARIANTS[variant].fontSize,
  color: '#1c2434',
  bold: VARIANTS[variant].bold,
  italic: false,
  underline: false,
  align: 'right',
  lineHeight: 1.6,
})

export const defaultBox = () => ({
  filled: false,
  fill: '#eef1f8',
  bordered: false,
  borderColor: '#3d5afe',
  borderWidth: 2,
  borderStyle: 'solid',
  radius: 12,
  padding: 16,
})

// ממיר את הגדרות הבלוק לאובייקט סגנון של React
export function textCss(style = {}) {
  const s = { ...defaultStyle(), ...style }
  return {
    fontFamily: s.fontFamily,
    fontSize: `${s.fontSize}px`,
    color: s.color,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : 'normal',
    textDecoration: s.underline ? 'underline' : 'none',
    textAlign: s.align,
    lineHeight: s.lineHeight,
  }
}

export function boxCss(box = {}) {
  const b = { ...defaultBox(), ...box }
  if (!b.filled && !b.bordered) return {}
  return {
    background: b.filled ? b.fill : 'transparent',
    border: b.bordered ? `${b.borderWidth}px ${b.borderStyle} ${b.borderColor}` : 'none',
    borderRadius: `${b.radius}px`,
    padding: `${b.padding}px`,
  }
}

// בלוקים ישנים נשמרו עם heading/body. מיישר אותם למבנה החדש.
export function normalizeTextBlock(block) {
  if (block.content != null) return block
  const legacy = [block.heading, block.body].filter(Boolean).join('\n')
  return {
    ...block,
    variant: block.heading ? 'subtitle' : 'body',
    content: legacy,
    style: defaultStyle(block.heading ? 'subtitle' : 'body'),
    box: defaultBox(),
  }
}
