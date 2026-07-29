import { newId, parseCloze } from '../lib/blocks'
import { useMedia } from '../lib/mediaContext'

/**
 * עורך התוכן של רכיב, לסוגים שהתוכן שלהם גדול מכדי לשבת בסרגל
 * הכלים. טקסט נערך ישירות על הבמה ולכן אינו כאן.
 */
export default function BlockEditor({ block, onChange }) {
  if (block.type === 'question') return <ChoiceEditor block={block} onChange={onChange} />
  if (block.type === 'multi') return <MultiEditor block={block} onChange={onChange} />
  if (block.type === 'cloze') return <ClozeEditor block={block} onChange={onChange} />
  if (block.type === 'sort') return <SortEditor block={block} onChange={onChange} />
  if (block.type === 'open') return <OpenEditor block={block} onChange={onChange} />
  if (block.type === 'tool') return <ToolEditor block={block} onChange={onChange} />
  if (block.type === 'source') return <SourceEditor block={block} onChange={onChange} />
  return <p className="muted tiny">אין עורך תוכן נפרד לסוג הרכיב הזה.</p>
}

/** שדות המשוב שנחשפים ללומד אחרי הבדיקה */
function FeedbackFields({ block, set }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <label className="field" style={{ flex: 1, marginBottom: 0 }}>
          <span>✓ משוב כשהתשובה נכונה</span>
          <input
            type="text"
            value={block.okFeedback ?? ''}
            placeholder="נכון. …"
            onChange={(e) => set({ okFeedback: e.target.value })}
          />
        </label>
        <label className="field" style={{ flex: 1, marginBottom: 0 }}>
          <span>✗ משוב כשהתשובה שגויה</span>
          <input
            type="text"
            value={block.noFeedback ?? ''}
            placeholder="לא בדיוק. …"
            onChange={(e) => set({ noFeedback: e.target.value })}
          />
        </label>
      </div>
      <label className="field" style={{ marginTop: 12, marginBottom: 0 }}>
        <span>הסבר כללי (מוצג תמיד אחרי הבדיקה)</span>
        <input
          type="text"
          value={block.explanation ?? ''}
          onChange={(e) => set({ explanation: e.target.value })}
        />
      </label>
    </>
  )
}

function Points({ block, set, label = 'ניקוד' }) {
  return (
    <label className="field" style={{ width: 110, marginBottom: 0 }}>
      <span>{label}</span>
      <input
        type="number"
        min="1"
        value={block.points}
        onChange={(e) => set({ points: Number(e.target.value) || 1 })}
      />
    </label>
  )
}


/** בוחר תמונה לכרטיס תשובה */
function OptionMediaPicker({ value, onPick }) {
  const media = useMedia()
  const list = Object.values(media)
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onPick(e.target.value || null)}
      style={{ width: 120 }}
      title="תמונה לכרטיס"
    >
      <option value="">ללא תמונה</option>
      {list.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )
}

function ChoiceEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const setOpt = (id, patch) =>
    set({ options: block.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })

  return (
    <>
      <label className="field">
        <span>נוסח השאלה</span>
        <input type="text" value={block.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      </label>

      <label className="sp-check" style={{ marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={!!block.poll}
          onChange={(e) => set({ poll: e.target.checked })}
        />
        סקר עמדה — אין תשובה נכונה, כל בחירה מתקבלת
      </label>

      <div className="field">
        <span>{block.poll ? 'האפשרויות' : 'תשובות — סמן את הנכונה'}</span>
        {block.options.map((opt, i) => (
          <div className="opt-block" key={opt.id}>
            <div className="opt-row">
              {!block.poll && (
                <input
                  type="radio"
                  name={`key-${block.id}`}
                  checked={block.correctId === opt.id}
                  onChange={() => set({ correctId: opt.id })}
                  title="סמן כתשובה הנכונה"
                />
              )}
              <input
                type="text"
                value={opt.text}
                placeholder={`תשובה ${i + 1}`}
                onChange={(e) => setOpt(opt.id, { text: e.target.value })}
              />
              {block.display === 'cards' && (
                <OptionMediaPicker
                  value={opt.mediaId}
                  onPick={(mediaId) => setOpt(opt.id, { mediaId })}
                />
              )}
              <button
                className="icon-btn"
                disabled={block.options.length <= 2}
                onClick={() =>
                  set({
                    options: block.options.filter((o) => o.id !== opt.id),
                    correctId: block.correctId === opt.id ? null : block.correctId,
                  })
                }
                title="הסר תשובה"
              >
                ✕
              </button>
            </div>
            <input
              className="opt-feedback"
              type="text"
              value={opt.feedback ?? ''}
              placeholder="משוב שיוצג למי שבחר דווקא בתשובה הזו (לא חובה)"
              onChange={(e) => setOpt(opt.id, { feedback: e.target.value })}
            />
          </div>
        ))}
        <button
          className="btn subtle sm"
          onClick={() =>
            set({ options: [...block.options, { id: newId(), text: '', mediaId: null, feedback: '' }] })
          }
        >
          + הוסף תשובה
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Points block={block} set={set} />
      </div>
      <FeedbackFields block={block} set={set} />
    </>
  )
}

function MultiEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const setOpt = (id, patch) =>
    set({ options: block.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  const correctCount = block.options.filter((o) => o.correct).length

  return (
    <>
      <label className="field">
        <span>נוסח המשימה</span>
        <input
          type="text"
          value={block.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder="למשל: בחרו את כל הפרטים החסרים"
        />
      </label>

      <div className="field">
        <span>אפשרויות — סמן את כל הנכונות ({correctCount})</span>
        {block.options.map((opt, i) => (
          <div className="opt-row" key={opt.id}>
            <input
              type="checkbox"
              checked={!!opt.correct}
              onChange={(e) => setOpt(opt.id, { correct: e.target.checked })}
              title="סמן כנכונה"
              style={{ width: 'auto', accentColor: 'var(--accent)' }}
            />
            <input
              type="text"
              value={opt.text}
              placeholder={`אפשרות ${i + 1}`}
              onChange={(e) => setOpt(opt.id, { text: e.target.value })}
            />
            <button
              className="icon-btn"
              disabled={block.options.length <= 2}
              onClick={() => set({ options: block.options.filter((o) => o.id !== opt.id) })}
              title="הסר"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn subtle sm"
          onClick={() => set({ options: [...block.options, { id: newId(), text: '', correct: false }] })}
        >
          + הוסף אפשרות
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Points block={block} set={set} />
      </div>
      <FeedbackFields block={block} set={set} />

      {correctCount === 0 && (
        <div className="alert warn tiny" style={{ marginTop: 12, marginBottom: 0 }}>
          לא סימנת אף אפשרות נכונה — הלומד יקבל את מלוא הניקוד בלי לסמן דבר.
        </div>
      )}
    </>
  )
}

function ClozeEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const parts = parseCloze(block.template ?? '')
  const blanks = parts.filter((p) => p.kind === 'blank')

  return (
    <>
      <label className="field">
        <span>התבנית</span>
        <textarea
          rows={4}
          value={block.template}
          onChange={(e) => set({ template: e.target.value })}
          style={{ fontFamily: 'inherit' }}
        />
      </label>

      <div className="alert ok tiny">
        <strong>שני סוגי חסרים:</strong>
        <br />
        <code>[[]]</code> — הלומד מקליד. כל תשובה שאינה ריקה מתקבלת.
        <br />
        <code>[[מים|חיסכון]]</code> — הלומד מקליד, ומתקבלת אחת מהתשובות האלה.
        <br />
        <code>{'{{דומה|*שונה}}'}</code> — הלומד בוחר מרשימה נפתחת. הכוכבית מסמנת את
        הנכונה; בלי כוכבית הראשונה היא הנכונה.
      </div>

      <div className="field">
        <span>תצוגה מקדימה ({blanks.length} חסרים)</span>
        <div className="cloze-preview">
          {parts.map((p, i) => {
            if (p.kind === 'text') return <span key={i}>{p.text}</span>
            if (p.kind === 'select')
              return (
                <span key={i} className="cloze-chip select" title={`רשימה נפתחת · נכונה: ${p.correct}`}>
                  ▾ {p.correct}
                </span>
              )
            return (
              <span key={i} className="cloze-chip" title={p.answers.join(' / ') || 'חסר פתוח'}>
                {p.answers.length ? p.answers.join(' / ') : '—'}
              </span>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Points block={block} set={set} label="ניקוד לכל החסרים" />
      </div>
      <FeedbackFields block={block} set={set} />
    </>
  )
}

function SortEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const groups = block.groups ?? []
  const cards = block.cards ?? []

  const setGroup = (id, patch) =>
    set({ groups: groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  const setCard = (id, patch) =>
    set({ cards: cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const unassigned = cards.filter((c) => !groups.some((g) => g.id === c.groupId)).length

  return (
    <>
      <label className="field">
        <span>הוראת המיון</span>
        <input
          type="text"
          value={block.prompt}
          placeholder="למשל: מיינו כל טענה לקבוצה המתאימה"
          onChange={(e) => set({ prompt: e.target.value })}
        />
      </label>

      <div className="field">
        <span>הקבוצות ({groups.length})</span>
        {groups.map((g, i) => (
          <div className="opt-block" key={g.id}>
            <div className="opt-row">
              <span className="group-num">{i + 1}</span>
              <input
                type="text"
                value={g.label}
                placeholder="שם הקבוצה"
                onChange={(e) => setGroup(g.id, { label: e.target.value })}
              />
              <button
                className="icon-btn"
                disabled={groups.length <= 2}
                onClick={() =>
                  set({
                    groups: groups.filter((x) => x.id !== g.id),
                    cards: cards.map((c) => (c.groupId === g.id ? { ...c, groupId: null } : c)),
                  })
                }
                title="הסר קבוצה"
              >
                ✕
              </button>
            </div>
            <input
              className="opt-feedback"
              type="text"
              value={g.description ?? ''}
              placeholder="הסבר קצר שיופיע מתחת לשם הקבוצה (לא חובה)"
              onChange={(e) => setGroup(g.id, { description: e.target.value })}
            />
          </div>
        ))}
        <button
          className="btn subtle sm"
          disabled={groups.length >= 5}
          onClick={() => set({ groups: [...groups, { id: newId(), label: '', description: '' }] })}
        >
          + הוסף קבוצה
        </button>
      </div>

      <div className="field">
        <span>הכרטיסים למיון ({cards.length})</span>
        {cards.map((c) => (
          <div className="opt-row" key={c.id}>
            <input
              type="text"
              value={c.text}
              placeholder="תוכן הכרטיס"
              onChange={(e) => setCard(c.id, { text: e.target.value })}
            />
            <select
              value={c.groupId ?? ''}
              onChange={(e) => setCard(c.id, { groupId: e.target.value || null })}
              style={{ width: 150 }}
              title="לאיזו קבוצה הכרטיס שייך"
            >
              <option value="">— בחר קבוצה —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.label || 'ללא שם'}</option>
              ))}
            </select>
            <button
              className="icon-btn"
              onClick={() => set({ cards: cards.filter((x) => x.id !== c.id) })}
              title="הסר כרטיס"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn subtle sm"
          onClick={() =>
            set({ cards: [...cards, { id: newId(), text: '', groupId: groups[0]?.id ?? null }] })
          }
        >
          + הוסף כרטיס
        </button>
      </div>

      {unassigned > 0 && (
        <div className="alert warn tiny">
          {unassigned} כרטיסים ללא קבוצה. הם יוצגו ללומד אבל לעולם לא ייחשבו נכונים.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Points block={block} set={set} label="ניקוד לכל המיון" />
      </div>
      <FeedbackFields block={block} set={set} />
    </>
  )
}

function OpenEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  return (
    <>
      <label className="field">
        <span>השאלה</span>
        <input
          type="text"
          value={block.prompt}
          placeholder="למשל: מה אצלכם הופך את ערב שבת למיוחד?"
          onChange={(e) => set({ prompt: e.target.value })}
        />
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <label className="field" style={{ flex: 1 }}>
          <span>טקסט מנחה בתוך התיבה</span>
          <input
            type="text"
            value={block.placeholder ?? ''}
            onChange={(e) => set({ placeholder: e.target.value })}
          />
        </label>
        <label className="field" style={{ width: 110 }}>
          <span>שורות</span>
          <input
            type="number"
            min="2"
            max="14"
            value={block.rows ?? 4}
            onChange={(e) => set({ rows: Number(e.target.value) || 4 })}
          />
        </label>
      </div>

      <label className="field" style={{ marginBottom: 0 }}>
        <span>טקסט שיוצג אחרי הבדיקה (לא חובה)</span>
        <input
          type="text"
          value={block.afterText ?? ''}
          placeholder="למשל: אין תשובה אחת נכונה — כל משפחה שונה."
          onChange={(e) => set({ afterText: e.target.value })}
        />
      </label>

      <div className="alert ok tiny" style={{ marginTop: 12 }}>
        שאלה פתוחה אינה מנוקדת, אבל התשובה של הלומד תופיע בתעודה בסיום.
      </div>
    </>
  )
}

function ToolEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const steps = block.steps ?? []
  return (
    <>
      <label className="field">
        <span>שם הכלי</span>
        <input
          type="text"
          value={block.name}
          placeholder="למשל: מצפן המקור"
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      <label className="field">
        <span>שורת פתיחה</span>
        <input
          type="text"
          value={block.intro ?? ''}
          onChange={(e) => set({ intro: e.target.value })}
        />
      </label>
      <div className="field" style={{ marginBottom: 0 }}>
        <span>הצעדים</span>
        {steps.map((s, i) => (
          <div className="opt-row" key={i}>
            <span className="group-num">{i + 1}</span>
            <input
              type="text"
              value={s}
              onChange={(e) => set({ steps: steps.map((x, j) => (j === i ? e.target.value : x)) })}
            />
            <button
              className="icon-btn"
              disabled={steps.length <= 1}
              onClick={() => set({ steps: steps.filter((_, j) => j !== i) })}
              title="הסר צעד"
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn subtle sm" onClick={() => set({ steps: [...steps, ''] })}>
          + הוסף צעד
        </button>
      </div>
    </>
  )
}

function SourceEditor({ block, onChange }) {
  const set = (patch) => onChange({ ...block, ...patch })
  return (
    <>
      <label className="field">
        <span>שם הגוף המפרסם</span>
        <input
          type="text"
          value={block.publisher}
          placeholder="למשל: ספריית הקונגרס של ארצות הברית"
          onChange={(e) => set({ publisher: e.target.value })}
        />
      </label>

      <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
        <label className="sp-check">
          <input
            type="checkbox"
            checked={!!block.translated}
            onChange={(e) => set({ translated: e.target.checked })}
          />
          מתורגם מאנגלית
        </label>
        <label className="sp-check">
          <input
            type="checkbox"
            checked={!!block.adapted}
            onChange={(e) => set({ adapted: e.target.checked })}
          />
          מעובד לשפה נגישה
        </label>
      </div>

      <label className="field">
        <span>קטע המקור</span>
        <textarea rows={6} value={block.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <label className="field" style={{ flex: 1, marginBottom: 0 }}>
          <span>קישור למקור המלא</span>
          <input
            type="text"
            value={block.url ?? ''}
            placeholder="https://…"
            onChange={(e) => set({ url: e.target.value })}
          />
        </label>
        <label className="field" style={{ width: 150, marginBottom: 0 }}>
          <span>כיתוב הקישור</span>
          <input
            type="text"
            value={block.linkText ?? ''}
            onChange={(e) => set({ linkText: e.target.value })}
          />
        </label>
      </div>
    </>
  )
}
