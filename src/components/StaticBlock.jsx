import { frameStyle } from '../lib/canvas'
import { boxCss, normalizeTextBlock } from '../lib/typography'
import BlockRenderer from './BlockRenderer'

/**
 * רכיב על הבמה במצב תצוגה או לומד — ממוקם בדיוק כפי שהמרצה סידר,
 * בלי ידיות ובלי גרירה. התוכן עדיין אינטראקטיבי (בחירת תשובה,
 * מילוי חסר, לחיצה על בדיקה).
 */
export default function StaticBlock({ block }) {
  const tb = block.type === 'text' ? normalizeTextBlock(block) : block
  return (
    <div className="cblock static" style={frameStyle(block.frame)}>
      <div className="cblock-inner" style={boxCss(tb.box)} dir="rtl">
        <div className="cblock-content">
          <BlockRenderer block={block} />
        </div>
      </div>
    </div>
  )
}
