import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { readDocx } from '../lib/docx'
import { parseUnit, summarize } from '../lib/importParser'
import { buildCourse } from '../lib/importBuilder'
import { processImageFile, ACCEPTED_TYPES } from '../lib/media'
import { addMedia, createCourseFrom } from '../lib/db'
import {
  BLOCK_SPEC,
  EXAMPLE,
  conversionPrompt,
  validateTemplate,
  templateToDoc,
} from '../lib/template'
import Layout from '../components/Layout'

const STEPS = ['העלאת המסמך', 'סקירת המבנה', 'החומרים החסרים', 'יצירת היחידה']

/**
 * אשף ההמרה: ממסמך פיתוח לסביבת למידה.
 * ארבעה שלבים, וכל שלב מציג בדיוק מה זוהה ומה עוד חסר.
 */
export default function Import() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [doc, setDoc] = useState(null)
  const [assets, setAssets] = useState({}) // assetId → {mediaId} | {url,start}
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [source, setSource] = useState('template')
  const [errors, setErrors] = useState([])
  const [copied, setCopied] = useState(false)
  const [showSpec, setShowSpec] = useState(false)
  const fileRef = useRef(null)
  const jsonRef = useRef(null)

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(conversionPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(EXAMPLE, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'תבנית-יחידה-לדוגמה.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /** העלאת קובץ תבנית: קוראים, בודקים תקינות, ורק אז ממירים */
  const onJson = async (file) => {
    setError('')
    setErrors([])
    setBusy('בודק את הקובץ…')
    try {
      const text = await file.text()
      let json
      try {
        json = JSON.parse(text)
      } catch (e) {
        setError(`הקובץ אינו JSON תקין: ${e.message}`)
        return
      }
      const problems = validateTemplate(json)
      if (problems.length) {
        setErrors(problems)
        return
      }
      setDoc(templateToDoc(json))
      setStep(1)
    } finally {
      setBusy('')
    }
  }

  const onFile = async (file) => {
    setError('')
    setBusy('קורא את המסמך…')
    try {
      const nodes = await readDocx(file)
      const parsed = parseUnit(nodes)
      if (parsed.screens.length === 0) {
        setError(parsed.warnings[0] ?? 'לא הצלחתי לזהות מבנה של מסכים במסמך.')
        setBusy('')
        return
      }
      setDoc(parsed)
      setStep(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  /** הוספת חומר שהמנתח לא זיהה — למשל תמונה שהמסמך רק מזכיר בטקסט */
  const addAsset = (screenId, kind) =>
    setDoc((d) => ({
      ...d,
      screens: d.screens.map((s) =>
        s.id !== screenId
          ? s
          : {
              ...s,
              assets: [
                ...s.assets,
                {
                  id: `${s.id}-manual${s.assets.length}-${Date.now()}`,
                  kind,
                  hint: 'נוסף ידנית',
                  manual: true,
                },
              ],
            },
      ),
    }))

  const allAssets = doc ? doc.screens.flatMap((s) => s.assets.map((a) => ({ ...a, screen: s }))) : []
  const stats = doc ? summarize(doc) : null

  const create = async () => {
    setBusy('בונה את היחידה…')
    setError('')
    try {
      const course = buildCourse(doc, assets)
      const id = await createCourseFrom(profile, course)
      navigate(`/edit/${id}`)
    } catch (e) {
      setError(e.message)
      setBusy('')
    }
  }

  return (
    <Layout>
      <div className="page-head">
        <h1>המרת מסמך פיתוח לסביבת למידה</h1>
      </div>

      <ol className="wizard-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <span className="wz-num">{i < step ? '✓' : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {error && <div className="alert error">{error}</div>}
      {busy && <div className="alert ok">{busy}</div>}

      {step === 0 && (
        <>
          <div className="source-tabs">
            <button
              className={'src-tab' + (source === 'template' ? ' active' : '')}
              onClick={() => setSource('template')}
            >
              📋 קובץ תבנית
              <span className="tiny">הדרך המומלצת — עובד עם כל פורמט מקור</span>
            </button>
            <button
              className={'src-tab' + (source === 'docx' ? ' active' : '')}
              onClick={() => setSource('docx')}
            >
              📄 מסמך Word
              <span className="tiny">ניתוח ישיר של מסמך פיתוח בתבנית מט״ח</span>
            </button>
          </div>

          {source === 'template' ? (
            <>
              <div className="how-to">
                <h3>איך זה עובד</h3>
                <ol>
                  <li>
                    <strong>מעתיקים את הפרומפט</strong> ומדביקים אותו במודל שפה כלשהו,
                    יחד עם היחידה שכתבתם — בכל פורמט: Word, מצגת, טקסט חופשי.
                  </li>
                  <li>
                    <strong>מקבלים קובץ JSON</strong> ושומרים אותו במחשב בסיומת
                    <code>.json</code>.
                  </li>
                  <li><strong>מעלים אותו כאן</strong> והמערכת בונה את היחידה.</li>
                </ol>
                <div className="how-to-actions">
                  <button className="btn" onClick={copyPrompt}>
                    {copied ? '✓ הועתק' : '📋 העתקת הפרומפט'}
                  </button>
                  <button className="btn subtle" onClick={downloadExample}>
                    ⬇ הורדת תבנית לדוגמה
                  </button>
                  <button className="btn ghost" onClick={() => setShowSpec((v) => !v)}>
                    {showSpec ? 'הסתר את מבנה התבנית' : 'הצג את מבנה התבנית'}
                  </button>
                </div>

                {showSpec && (
                  <table className="data spec-table">
                    <thead>
                      <tr><th>type</th><th>מה זה</th><th>שדות</th></tr>
                    </thead>
                    <tbody>
                      {BLOCK_SPEC.map((b) => (
                        <tr key={b.type}>
                          <td><code>{b.type}</code></td>
                          <td>{b.desc}</td>
                          <td className="tiny">{b.fields}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) onJson(e.dataTransfer.files[0])
                }}
              >
                <p style={{ fontSize: 38, margin: 0 }}>📋</p>
                <h3>גררו לכאן את קובץ התבנית שמילאתם</h3>
                <button className="btn" onClick={() => jsonRef.current?.click()}>
                  בחירת קובץ JSON
                </button>
                <input
                  ref={jsonRef}
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={(e) => e.target.files?.[0] && onJson(e.target.files[0])}
                />
              </div>
            </>
          ) : (
            <div
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0])
              }}
            >
              <p style={{ fontSize: 42, margin: 0 }}>📄</p>
              <h3>גררו לכאן מסמך פיתוח, או בחרו קובץ</h3>
              <p className="muted">
                קובץ Word ‏(.docx) שבנוי לפי התבנית: <strong>מסך 1</strong>,{' '}
                <strong>תוכן גלוי לתלמידים</strong>, <strong>פעילות</strong>,{' '}
                <strong>משוב</strong>.
              </p>
              <button className="btn" onClick={() => fileRef.current?.click()}>בחירת קובץ</button>
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                hidden
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>
          )}

          {errors.length > 0 && (
            <div className="validation-errors">
              <h3>הקובץ לא תקין — {errors.length} שגיאות</h3>
              <ul>
                {errors.slice(0, 25).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              {errors.length > 25 && (
                <p className="tiny muted">ועוד {errors.length - 25} שגיאות…</p>
              )}
              <p className="tiny muted">
                תקנו את הקובץ ונסו שוב. אפשר גם להחזיר את השגיאות האלה למודל השפה
                ולבקש ממנו לתקן.
              </p>
            </div>
          )}
        </>
      )}

      {step === 1 && doc && (
        <>
          <div className="stat-row">
            <Stat n={stats.screens} label="מסכים" />
            <Stat n={stats.items} label="רכיבי תוכן" />
            <Stat n={stats.questions} label="פעילויות" />
            <Stat n={allAssets.length} label="חומרים נדרשים" />
            <Stat n={stats.review} label="דורשים בדיקה" tone={stats.review ? 'warn' : 'ok'} />
          </div>

          <div className="screens-review">
            {doc.screens.map((s) => (
              <div className="screen-card" key={s.id}>
                <header>
                  <span className="screen-num">{s.number}</span>
                  <strong>{s.title || 'ללא כותרת'}</strong>
                  <span className="spacer" />
                  <span className="tiny muted">{s.items.length} רכיבים</span>
                </header>
                <ul className="item-list">
                  {s.items.map((it, i) => (
                    <li key={i} className={it.needsReview ? 'warn' : ''}>
                      <span className="item-kind">{kindLabel(it)}</span>
                      <span className="item-text">{itemPreview(it)}</span>
                    </li>
                  ))}
                  {s.assets.map((a) => (
                    <li key={a.id} className="asset">
                      <span className="item-kind">{assetLabel(a.kind)}</span>
                      <span className="item-text">{a.hint}</span>
                    </li>
                  ))}
                </ul>
                {s.warnings.map((w, i) => (
                  <div className="alert warn tiny" key={i}>{w}</div>
                ))}

                {/* לא כל מסמך מנסח את החומרים במפורש — כאן מוסיפים ידנית */}
                <div className="add-asset">
                  <span className="tiny muted">חסר חומר בשלב הזה?</span>
                  {[
                    ['image', '🖼 תמונה'],
                    ['video', '🎬 סרטון'],
                    ['audio', '🎧 שמע'],
                  ].map(([kind, label]) => (
                    <button
                      key={kind}
                      className="btn ghost sm"
                      onClick={() => addAsset(s.id, kind)}
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="wizard-actions">
            <button className="btn ghost" onClick={() => { setDoc(null); setErrors([]); setStep(0) }}>
              קובץ אחר
            </button>
            <button className="btn" onClick={() => setStep(2)}>
              {allAssets.length ? `המשך — ${allAssets.length} חומרים` : 'המשך'}
            </button>
          </div>
        </>
      )}

      {step === 2 && doc && (
        <>
          {allAssets.length === 0 ? (
            <div className="empty">
              <p>המסמך לא דורש חומרים חיצוניים. אפשר להמשיך.</p>
            </div>
          ) : (
            <div className="asset-list">
              {allAssets.map((a) => (
                <AssetRow
                  key={a.id}
                  asset={a}
                  value={assets[a.id]}
                  ownerUid={profile?.id}
                  onSet={(v) => setAssets((m) => ({ ...m, [a.id]: v }))}
                />
              ))}
            </div>
          )}

          <div className="wizard-actions">
            <button className="btn ghost" onClick={() => setStep(1)}>חזרה</button>
            <button className="btn" onClick={() => { setStep(3); create() }} disabled={!!busy}>
              צור את היחידה
            </button>
          </div>
          <p className="tiny muted">
            אפשר לדלג על חומרים ולהוסיף אותם אחר כך בעורך — הרכיב ייווצר ריק ויחכה.
          </p>
        </>
      )}

      {step === 3 && (
        <div className="empty">
          <p style={{ fontSize: 40, margin: 0 }}>🛠</p>
          <p>{busy || 'היחידה נוצרה, פותח את העורך…'}</p>
        </div>
      )}
    </Layout>
  )
}

function Stat({ n, label, tone }) {
  return (
    <div className={'stat' + (tone ? ' ' + tone : '')}>
      <strong className="mono">{n}</strong>
      <span>{label}</span>
    </div>
  )
}

/** שורת חומר: תמונה להעלאה, או קישור לסרטון/שמע */
function AssetRow({ asset, value, ownerUid, onSet }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const upload = async (file) => {
    setErr('')
    setBusy(true)
    try {
      const processed = await processImageFile(file)
      const saved = await addMedia(ownerUid, processed)
      onSet({ mediaId: saved.id, preview: saved.dataUrl })
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const done = asset.kind === 'image' ? !!value?.mediaId : !!value?.url

  return (
    <div className={'asset-row' + (done ? ' done' : '')}>
      <div className="asset-head">
        <span className="item-kind">{assetLabel(asset.kind)}</span>
        <span className="tiny muted">שלב {asset.screen.number}</span>
        {done && <span className="asset-ok">✓ הושלם</span>}
      </div>

      <p className="asset-hint">{asset.hint}</p>

      {asset.kind === 'image' ? (
        <div className="asset-input">
          {value?.preview && <img className="asset-preview" src={value.preview} alt="" />}
          <button className="btn subtle sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'מעלה…' : value?.mediaId ? 'החלפת התמונה' : '⬆ העלאת תמונה'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            hidden
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="asset-input">
          <input
            type="text"
            value={value?.url ?? asset.url ?? ''}
            placeholder={
              asset.kind === 'video'
                ? 'קישור ליוטיוב, ל-Vimeo, ל-Google Drive או לקובץ וידאו'
                : 'קישור לקובץ שמע או להסכת'
            }
            onChange={(e) => onSet({ ...value, url: e.target.value })}
          />
          {asset.kind === 'video' && (
            <label className="sp-mini">
              מתחיל בשנייה
              <input
                type="number"
                min="0"
                value={value?.start ?? 0}
                onChange={(e) => onSet({ ...value, start: Number(e.target.value) || 0 })}
              />
            </label>
          )}
        </div>
      )}

      {err && <div className="alert error tiny">{err}</div>}
    </div>
  )
}

const KIND_LABELS = {
  title: 'כותרת', subtitle: 'כותרת משנה', text: 'טקסט', callout: 'תיבה',
  tool: 'כרטיס כלי', source: 'כרטיס מקור',
}
const QTYPE_LABELS = {
  single: 'רב־ברירה', multi: 'בחירה מרובה', sort: 'מיון', match: 'התאמה',
  cloze: 'השלמה', dropdown: 'רשימה נפתחת', open: 'שאלה פתוחה', poll: 'סקר עמדה',
}
const assetLabel = (k) => (k === 'image' ? '🖼 תמונה' : k === 'video' ? '🎬 סרטון' : '🎧 שמע')

const kindLabel = (it) =>
  it.kind === 'activity' ? (QTYPE_LABELS[it.qtype] ?? 'פעילות') : (KIND_LABELS[it.kind] ?? it.kind)

function itemPreview(it) {
  if (it.kind === 'activity') {
    const n = it.options?.length ?? 0
    return `${it.prompt || '(ללא ניסוח)'}${n ? ` — ${n} אפשרויות` : ''}`
  }
  if (it.kind === 'tool') return it.name
  if (it.kind === 'source') return it.publisher || it.excerpt?.slice(0, 60)
  if (it.kind === 'callout') return `${it.label}: ${it.text?.slice(0, 70)}`
  return it.text?.slice(0, 90)
}
