import {
  FONTS,
  BORDER_STYLES,
  ALIGNMENTS,
  VARIANTS,
  variantList,
  defaultStyle,
  defaultBox,
} from '../lib/typography'
import { AlignIcon, DirIcon } from './icons'
import Popover from './Popover'

/**
 * סרגל הכלים העליון — שורה אחת בגובה קבוע, בדיוק כמו בקנבה.
 * התוכן מתחלף לפי הרכיב הנבחר, אבל הגובה לעולם לא משתנה, כדי
 * שהבמה לא תקפוץ בכל בחירה. כלים משניים יושבים בתפריטים נפתחים.
 */
export function ElementRibbon({ block, onChange, onRestack, onDuplicate, onDelete, onEditContent }) {
  return (
    <div className="toolbar-row">
      {block.type === 'text' && <TextTools block={block} onChange={onChange} />}
      {block.type === 'image' && <ImageTools block={block} onChange={onChange} />}
      {block.type === 'question' && (
        <>
          <span className="tb-label">❓ שאלה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך שאלה ותשובות</button>
          <span className="tiny muted">
            {block.options?.length ?? 0} תשובות · {block.points ?? 1} נק'
          </span>
        </>
      )}

      <span className="tb-sep" />

      <Popover label="שכבה" title="סדר הערימה" width={150}>
        <button className="pop-item" onClick={() => onRestack('front')}>⬆ הבא לחזית</button>
        <button className="pop-item" onClick={() => onRestack('back')}>⬇ שלח לרקע</button>
      </Popover>
      <button className="tb-btn" onClick={onDuplicate} title="שכפל רכיב">⧉</button>
      <button className="tb-btn danger" onClick={onDelete} title="מחק רכיב">🗑</button>
    </div>
  )
}

/** מה שמופיע בסרגל כשלא נבחר רכיב — כדי שהשורה תישאר במקומה */
export function DefaultRibbon({ slide, index, total, onRename }) {
  return (
    <div className="toolbar-row">
      <span className="tb-label">שלב {index + 1} מתוך {total}</span>
      <input
        className="tb-input"
        style={{ width: 190 }}
        type="text"
        value={slide.title ?? ''}
        onChange={(e) => onRename(e.target.value)}
        placeholder="שם השלב"
        title="שם השלב — לניווט שלך בלבד, הלומדים לא רואים אותו"
      />
      <span className="tb-sep" />
      <span className="tiny muted">
        בחר רכיב בבמה כדי לעצב אותו · הוסף רכיבים מהרצועה שבצד ימין
      </span>
    </div>
  )
}

function TextTools({ block, onChange }) {
  const style = { ...defaultStyle(block.variant), ...block.style }
  const setStyle = (patch) => onChange({ ...block, style: { ...style, ...patch } })

  const setVariant = (variant) =>
    onChange({
      ...block,
      variant,
      style: { ...style, fontSize: VARIANTS[variant].fontSize, bold: VARIANTS[variant].bold },
    })

  const flipDirection = () => {
    const dir = style.direction === 'ltr' ? 'rtl' : 'ltr'
    setStyle({
      direction: dir,
      // היישור נגרר עם הכיוון, אלא אם נבחר מרכוז או יישור דו-צדדי
      align:
        style.align === 'center' || style.align === 'justify'
          ? style.align
          : dir === 'rtl'
            ? 'right'
            : 'left',
    })
  }

  const bump = (delta) =>
    setStyle({ fontSize: Math.min(120, Math.max(8, style.fontSize + delta)) })

  return (
    <>
      <select
        className="tb-select"
        style={{ width: 108 }}
        value={block.variant}
        onChange={(e) => setVariant(e.target.value)}
        title="רמת הטקסט"
      >
        {variantList.map((v) => (
          <option key={v.key} value={v.key}>{v.label}</option>
        ))}
      </select>

      <select
        className="tb-select"
        style={{ width: 116, fontFamily: style.fontFamily }}
        value={style.fontFamily}
        onChange={(e) => setStyle({ fontFamily: e.target.value })}
        title="גופן"
      >
        {FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
        ))}
      </select>

      <span className="tb-stepper">
        <button className="tb-btn tiny-btn" onClick={() => bump(-2)} title="הקטן">−</button>
        <input
          className="tb-input num"
          type="number"
          min="8"
          max="120"
          value={style.fontSize}
          onChange={(e) => setStyle({ fontSize: Number(e.target.value) || 16 })}
          title="גודל הגופן"
        />
        <button className="tb-btn tiny-btn" onClick={() => bump(2)} title="הגדל">+</button>
      </span>

      <input
        type="color"
        className="color-input"
        value={style.color}
        onChange={(e) => setStyle({ color: e.target.value })}
        title="צבע הטקסט"
      />

      <button
        className={'tb-btn' + (style.bold ? ' active' : '')}
        onClick={() => setStyle({ bold: !style.bold })}
        title="מודגש"
        style={{ fontWeight: 800 }}
      >
        B
      </button>
      <button
        className={'tb-btn' + (style.italic ? ' active' : '')}
        onClick={() => setStyle({ italic: !style.italic })}
        title="נטוי"
        style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}
      >
        I
      </button>
      <button
        className={'tb-btn' + (style.underline ? ' active' : '')}
        onClick={() => setStyle({ underline: !style.underline })}
        title="קו תחתון"
        style={{ textDecoration: 'underline' }}
      >
        U
      </button>

      <Popover label={<AlignIcon type={style.align} />} title="יישור" width={168}>
        {ALIGNMENTS.map((a) => (
          <button
            key={a.value}
            className={'pop-item' + (style.align === a.value ? ' active' : '')}
            onClick={() => setStyle({ align: a.value })}
          >
            <AlignIcon type={a.value} />
            {a.label}
          </button>
        ))}
      </Popover>

      <button
        className="tb-btn"
        onClick={flipDirection}
        title={
          style.direction === 'rtl'
            ? 'כיוון כתיבה: מימין לשמאל — לחץ להחלפה'
            : 'כיוון כתיבה: משמאל לימין — לחץ להחלפה'
        }
      >
        <DirIcon dir={style.direction ?? 'rtl'} />
      </button>

      <BoxPopover block={block} onChange={onChange} />
    </>
  )
}

function ImageTools({ block, onChange }) {
  return (
    <>
      <span className="tb-label">🖼 תמונה</span>
      <select
        className="tb-select"
        style={{ width: 116 }}
        value={block.fit ?? 'contain'}
        onChange={(e) => onChange({ ...block, fit: e.target.value })}
        title="איך התמונה ממלאת את המסגרת"
      >
        <option value="contain">נכנסת שלמה</option>
        <option value="cover">ממלאת וחותכת</option>
        <option value="fill">נמתחת</option>
      </select>
      <BoxPopover block={block} onChange={onChange} />
      <input
        className="tb-input"
        style={{ width: 150 }}
        type="text"
        value={block.alt ?? ''}
        placeholder="תיאור לקוראי מסך"
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        title="תיאור התמונה לקוראי מסך"
      />
    </>
  )
}

/** מילוי, מסגרת, פינות וריפוד — כלים משניים, ולכן בתפריט נפתח */
function BoxPopover({ block, onChange }) {
  const box = { ...defaultBox(), ...block.box }
  const setBox = (patch) => onChange({ ...block, box: { ...box, ...patch } })
  const on = box.filled || box.bordered

  return (
    <Popover label="תיבה" title="מילוי, מסגרת ופינות" width={258} className={on ? 'active' : ''}>
      <label className="pop-row">
        <input type="checkbox" checked={box.filled} onChange={(e) => setBox({ filled: e.target.checked })} />
        <span>מילוי</span>
        {box.filled && (
          <input type="color" className="color-input" value={box.fill} onChange={(e) => setBox({ fill: e.target.value })} />
        )}
      </label>

      <label className="pop-row">
        <input type="checkbox" checked={box.bordered} onChange={(e) => setBox({ bordered: e.target.checked })} />
        <span>מסגרת</span>
        {box.bordered && (
          <input type="color" className="color-input" value={box.borderColor} onChange={(e) => setBox({ borderColor: e.target.value })} />
        )}
      </label>

      {box.bordered && (
        <>
          <label className="pop-row">
            <span>עובי</span>
            <input type="number" min="1" max="20" value={box.borderWidth} onChange={(e) => setBox({ borderWidth: Number(e.target.value) || 1 })} />
          </label>
          <label className="pop-row">
            <span>סוג</span>
            <select value={box.borderStyle} onChange={(e) => setBox({ borderStyle: e.target.value })}>
              {BORDER_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </>
      )}

      <label className="pop-row">
        <span>עיגול פינות</span>
        <input type="number" min="0" max="200" value={box.radius} onChange={(e) => setBox({ radius: Number(e.target.value) || 0 })} />
      </label>

      {block.type === 'text' && (
        <label className="pop-row">
          <span>ריפוד פנימי</span>
          <input type="number" min="0" max="80" value={box.padding} onChange={(e) => setBox({ padding: Number(e.target.value) || 0 })} />
        </label>
      )}
    </Popover>
  )
}
