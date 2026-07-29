import {
  FONTS,
  BORDER_STYLES,
  ALIGNMENTS,
  VARIANTS,
  variantList,
  defaultStyle,
  defaultBox,
} from '../lib/typography'
import { CALLOUT_TONES, calloutToneList } from '../lib/blocks'
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
      {block.type === 'video' && <VideoTools block={block} onChange={onChange} />}
      {block.type === 'check' && <CheckTools block={block} onChange={onChange} />}

      {block.type === 'question' && (
        <>
          <span className="tb-label">❓ שאלה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <select
            className="tb-select"
            style={{ width: 116 }}
            value={block.display ?? 'list'}
            onChange={(e) => onChange({ ...block, display: e.target.value })}
            title="צורת התצוגה"
          >
            <option value="list">רשימה</option>
            <option value="cards">כרטיסים</option>
          </select>
          {block.display === 'cards' && (
            <label className="tb-inline">
              עמודות
              <input
                className="tb-input num"
                type="number"
                min="1"
                max="4"
                value={block.columns ?? 2}
                onChange={(e) => onChange({ ...block, columns: Number(e.target.value) || 2 })}
              />
            </label>
          )}
          <label className="tb-inline">
            <input
              type="checkbox"
              checked={!!block.shuffle}
              onChange={(e) => onChange({ ...block, shuffle: e.target.checked })}
            />
            ערבב
          </label>
          <span className="tiny muted">{block.options?.length ?? 0} תשובות · {block.points ?? 1} נק'</span>
        </>
      )}

      {block.type === 'multi' && (
        <>
          <span className="tb-label">☑️ בחירה מרובה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <label className="tb-inline">
            עמודות
            <input
              className="tb-input num"
              type="number"
              min="1"
              max="3"
              value={block.columns ?? 1}
              onChange={(e) => onChange({ ...block, columns: Number(e.target.value) || 1 })}
            />
          </label>
          <label className="tb-inline">
            <input
              type="checkbox"
              checked={block.partial !== false}
              onChange={(e) => onChange({ ...block, partial: e.target.checked })}
            />
            ניקוד חלקי
          </label>
          <label className="tb-inline">
            <input
              type="checkbox"
              checked={!!block.shuffle}
              onChange={(e) => onChange({ ...block, shuffle: e.target.checked })}
            />
            ערבב
          </label>
          <span className="tiny muted">
            {block.options?.filter((o) => o.correct).length ?? 0} נכונות · {block.points ?? 1} נק'
          </span>
        </>
      )}

      {block.type === 'cloze' && (
        <>
          <span className="tb-label">✍️ השלמת מילים</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תבנית</button>
          <span className="tiny muted">{block.points ?? 1} נק'</span>
        </>
      )}

      {block.type === 'sort' && (
        <>
          <span className="tb-label">🗂 מיון</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <select
            className="tb-select"
            style={{ width: 140 }}
            value={block.mode ?? 'board'}
            onChange={(e) => onChange({ ...block, mode: e.target.value })}
            title="איך הכרטיסים מוגשים"
          >
            <option value="board">כל הכרטיסים יחד</option>
            <option value="sequence">אחד בכל פעם</option>
          </select>
          <ShuffleToggle block={block} onChange={onChange} />
          <span className="tiny muted">
            {block.groups?.length ?? 0} קבוצות · {block.cards?.length ?? 0} כרטיסים
          </span>
        </>
      )}

      {block.type === 'match' && (
        <>
          <span className="tb-label">🔗 התאמה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך זוגות</button>
          <ShuffleToggle block={block} onChange={onChange} />
          <span className="tiny muted">{block.pairs?.length ?? 0} זוגות · {block.points ?? 1} נק'</span>
        </>
      )}

      {block.type === 'audio' && (
        <>
          <span className="tb-label">🎧 שמע</span>
          <input
            className="tb-input"
            style={{ width: 280 }}
            type="text"
            value={block.url ?? ''}
            placeholder="קישור לקובץ שמע (mp3, m4a…)"
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <input
            className="tb-input"
            style={{ width: 150 }}
            type="text"
            value={block.title ?? ''}
            placeholder="כותרת (לא חובה)"
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
        </>
      )}

      {block.type === 'gallery' && (
        <>
          <span className="tb-label">🖼️ גלריה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תמונות</button>
          <select
            className="tb-select"
            style={{ width: 150 }}
            value={block.mode ?? 'sequence'}
            onChange={(e) => onChange({ ...block, mode: e.target.value })}
          >
            <option value="sequence">אחת אחרי השנייה</option>
            <option value="strip">כולן יחד</option>
          </select>
          <span className="tiny muted">{block.items?.length ?? 0} תמונות</span>
        </>
      )}

      {block.type === 'reveal' && (
        <>
          <span className="tb-label">🎴 חשיפה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <select
            className="tb-select"
            style={{ width: 130 }}
            value={block.mode ?? 'inline'}
            onChange={(e) => onChange({ ...block, mode: e.target.value })}
          >
            <option value="inline">נפתח במקום</option>
            <option value="popup">נפתח בחלון</option>
          </select>
        </>
      )}

      {block.type === 'tabs' && (
        <>
          <span className="tb-label">🗄 לשוניות</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך לשוניות</button>
          <BoxPopover block={block} onChange={onChange} />
          <span className="tiny muted">{block.items?.length ?? 0} לשוניות</span>
        </>
      )}

      {block.type === 'open' && (
        <>
          <span className="tb-label">🖊 שאלה פתוחה</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <span className="tiny muted">לא מנוקדת · נכנסת לתעודה</span>
        </>
      )}

      {block.type === 'callout' && <CalloutTools block={block} onChange={onChange} />}

      {block.type === 'tool' && (
        <>
          <span className="tb-label">🧭 כרטיס כלי</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <span className="tiny muted">{block.steps?.filter((s) => s.trim()).length ?? 0} צעדים</span>
        </>
      )}

      {block.type === 'source' && (
        <>
          <span className="tb-label">📰 כרטיס מקור</span>
          <button className="btn sm" onClick={onEditContent}>✏️ ערוך תוכן</button>
          <span className="tiny muted">{block.publisher || 'ללא גוף מפרסם'}</span>
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

      <Popover label="מילה חמה" title="הוספת הסבר למילה בתוך הטקסט" width={280}>
        <div className="pop-note">
          כתבו בתוך הטקסט:
          <code>((מרפסת|גזוזטרה היא מרפסת))</code>
          המילה תוצג מודגשת, ובלחיצה עליה ייפתח ההסבר.
        </div>
      </Popover>
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
      <label className="tb-inline" title="לחיצה על התמונה תפתח אותה במסך מלא">
        <input
          type="checkbox"
          checked={block.zoomable !== false}
          onChange={(e) => onChange({ ...block, zoomable: e.target.checked })}
        />
        ניתנת להגדלה
      </label>
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

function VideoTools({ block, onChange }) {
  return (
    <>
      <span className="tb-label">🎬 וידאו</span>
      <input
        className="tb-input"
        style={{ width: 320 }}
        type="text"
        value={block.url ?? ''}
        placeholder="הדבק קישור: יוטיוב, Vimeo או קובץ וידאו"
        onChange={(e) => onChange({ ...block, url: e.target.value })}
      />
      <label className="tb-inline" title="השנייה שממנה יתחיל הסרטון">
        מתחיל בשנייה
        <input
          className="tb-input num"
          type="number"
          min="0"
          value={block.start ?? 0}
          onChange={(e) => onChange({ ...block, start: Number(e.target.value) || 0 })}
        />
      </label>
      <BoxPopover block={block} onChange={onChange} />
    </>
  )
}

function ShuffleToggle({ block, onChange }) {
  return (
    <label className="tb-inline" title="סדר אקראי, כדי שלא יזוהה דפוס קבוע">
      <input
        type="checkbox"
        checked={block.shuffle !== false}
        onChange={(e) => onChange({ ...block, shuffle: e.target.checked })}
      />
      ערבב סדר
    </label>
  )
}

function CalloutTools({ block, onChange }) {
  return (
    <>
      <span className="tb-label">💬 תיבה</span>
      <select
        className="tb-select"
        style={{ width: 128 }}
        value={block.tone ?? 'info'}
        onChange={(e) =>
          onChange({
            ...block,
            tone: e.target.value,
            // אם הכיתוב עדיין ברירת המחדל של הגוון הקודם, מעדכנים אותו
            label:
              calloutToneList.some((t) => t.defaultLabel === block.label) || !block.label
                ? CALLOUT_TONES[e.target.value].defaultLabel
                : block.label,
          })
        }
        title="סוג התיבה"
      >
        {calloutToneList.map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>
      <input
        className="tb-input"
        style={{ width: 170 }}
        type="text"
        value={block.label ?? ''}
        placeholder="הכיתוב על התג"
        onChange={(e) => onChange({ ...block, label: e.target.value })}
      />
      <span className="tiny muted">את הטקסט כותבים בלחיצה כפולה על התיבה</span>
    </>
  )
}

function CheckTools({ block, onChange }) {
  return (
    <>
      <span className="tb-label">✅ כפתור בדיקה</span>
      <input
        className="tb-input"
        style={{ width: 130 }}
        type="text"
        value={block.label ?? ''}
        placeholder="בדיקה"
        onChange={(e) => onChange({ ...block, label: e.target.value })}
        title="הכיתוב על הכפתור"
      />
      <label className="tb-inline">
        <input
          type="checkbox"
          checked={block.showScore !== false}
          onChange={(e) => onChange({ ...block, showScore: e.target.checked })}
        />
        הצג ניקוד
      </label>
      <label className="tb-inline">
        <input
          type="checkbox"
          checked={block.allowRetry !== false}
          onChange={(e) => onChange({ ...block, allowRetry: e.target.checked })}
        />
        אפשר ניסיון נוסף
      </label>
      <span className="tiny muted">בודק את כל השאלות שבשלב הזה</span>
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
