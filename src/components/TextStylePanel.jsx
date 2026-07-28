import { Fragment } from 'react'
import {
  FONTS,
  BORDER_STYLES,
  ALIGNMENTS,
  VARIANTS,
  variantList,
  defaultStyle,
  defaultBox,
} from '../lib/typography'

/**
 * לוח העיצוב של תיבת טקסט — גופן, צבע, הדגשות, יישור, ועיצוב התיבה עצמה.
 */
export default function TextStylePanel({ block, onChange, inRibbon = false }) {
  const style = { ...defaultStyle(block.variant), ...block.style }
  const box = { ...defaultBox(), ...block.box }
  const Wrap = inRibbon ? Fragment : 'div'
  const wrapProps = inRibbon ? {} : { className: 'style-panel' }
  const row = inRibbon ? 'ribbon-row' : 'sp-row'

  const setStyle = (patch) => onChange({ ...block, style: { ...style, ...patch } })
  const setBox = (patch) => onChange({ ...block, box: { ...box, ...patch } })

  // החלפת רמה מעדכנת גודל ומשקל, ומשאירה את שאר ההתאמות האישיות
  const setVariant = (variant) =>
    onChange({
      ...block,
      variant,
      style: {
        ...style,
        fontSize: VARIANTS[variant].fontSize,
        bold: VARIANTS[variant].bold,
      },
    })

  return (
    <Wrap {...wrapProps}>
      <div className={row}>
        <span className="sp-label">רמה</span>
        <div className="chips">
          {variantList.map((v) => (
            <button
              key={v.key}
              type="button"
              className={'chip' + (block.variant === v.key ? ' active' : '')}
              onClick={() => setVariant(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={row}>
        <span className="sp-label">גופן</span>
        <select
          value={style.fontFamily}
          onChange={(e) => setStyle({ fontFamily: e.target.value })}
          style={{ fontFamily: style.fontFamily, maxWidth: 150 }}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        <label className="sp-mini">
          גודל
          <input
            type="number"
            min="8"
            max="120"
            value={style.fontSize}
            onChange={(e) => setStyle({ fontSize: Number(e.target.value) || 16 })}
          />
        </label>

        <label className="sp-mini">
          צבע
          <input
            type="color"
            className="color-input"
            value={style.color}
            onChange={(e) => setStyle({ color: e.target.value })}
          />
        </label>

        <div className="chips">
          <button
            type="button"
            className={'chip sq' + (style.bold ? ' active' : '')}
            onClick={() => setStyle({ bold: !style.bold })}
            title="מודגש"
            style={{ fontWeight: 800 }}
          >
            B
          </button>
          <button
            type="button"
            className={'chip sq' + (style.italic ? ' active' : '')}
            onClick={() => setStyle({ italic: !style.italic })}
            title="נטוי"
            style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}
          >
            I
          </button>
          <button
            type="button"
            className={'chip sq' + (style.underline ? ' active' : '')}
            onClick={() => setStyle({ underline: !style.underline })}
            title="קו תחתון"
            style={{ textDecoration: 'underline' }}
          >
            U
          </button>
        </div>

        <div className="chips">
          {ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={'chip sq' + (style.align === a.value ? ' active' : '')}
              onClick={() => setStyle({ align: a.value })}
              title={`יישור ל${a.label}`}
            >
              {a.icon}
            </button>
          ))}
        </div>
      </div>

      <div className={row}>
        <label className="sp-check">
          <input
            type="checkbox"
            checked={box.filled}
            onChange={(e) => setBox({ filled: e.target.checked })}
          />
          מילוי
        </label>
        {box.filled && (
          <input
            type="color"
            className="color-input"
            value={box.fill}
            onChange={(e) => setBox({ fill: e.target.value })}
            title="צבע המילוי"
          />
        )}

        <span className="sp-sep" />

        <label className="sp-check">
          <input
            type="checkbox"
            checked={box.bordered}
            onChange={(e) => setBox({ bordered: e.target.checked })}
          />
          מסגרת
        </label>
        {box.bordered && (
          <>
            <input
              type="color"
              className="color-input"
              value={box.borderColor}
              onChange={(e) => setBox({ borderColor: e.target.value })}
              title="צבע המסגרת"
            />
            <label className="sp-mini">
              עובי
              <input
                type="number"
                min="1"
                max="20"
                value={box.borderWidth}
                onChange={(e) => setBox({ borderWidth: Number(e.target.value) || 1 })}
              />
            </label>
            <select
              value={box.borderStyle}
              onChange={(e) => setBox({ borderStyle: e.target.value })}
              style={{ maxWidth: 110 }}
            >
              {BORDER_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </>
        )}

        {(box.filled || box.bordered) && (
          <>
            <span className="sp-sep" />
            <label className="sp-mini">
              פינות
              <input
                type="number"
                min="0"
                max="60"
                value={box.radius}
                onChange={(e) => setBox({ radius: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="sp-mini">
              ריפוד
              <input
                type="number"
                min="0"
                max="80"
                value={box.padding}
                onChange={(e) => setBox({ padding: Number(e.target.value) || 0 })}
              />
            </label>
          </>
        )}
      </div>
    </Wrap>
  )
}
