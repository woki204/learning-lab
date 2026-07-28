import { useRef, useState } from 'react'
import { processImageFile, prettyBytes, ACCEPTED_TYPES } from '../lib/media'
import { addMedia, removeMedia } from '../lib/db'

/**
 * מאגר התמונות הצדי. תמונות מועלות פעם אחת ונשארות זמינות לכל
 * הסביבות של אותו מרצה — גוררים מכאן לכל שקופית שרוצים.
 */
export default function MediaLibrary({ ownerUid, media, setMedia, open, onToggle }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [progress, setProgress] = useState('')

  const upload = async (files) => {
    setErr('')
    setBusy(true)
    try {
      const list = [...files]
      for (let i = 0; i < list.length; i++) {
        setProgress(`מעבד ${i + 1} מתוך ${list.length}…`)
        const processed = await processImageFile(list[i])
        const saved = await addMedia(ownerUid, processed)
        setMedia((m) => [saved, ...m])
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
      setProgress('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const del = async (item) => {
    if (!confirm(`למחוק את "${item.name}" מהמאגר? רכיבים שמשתמשים בה יופיעו ריקים.`)) return
    await removeMedia(item.id)
    setMedia((m) => m.filter((x) => x.id !== item.id))
  }

  if (!open)
    return (
      <button className="media-tab" onClick={onToggle} title="פתח את מאגר התמונות">
        🖼<span>תמונות</span>
      </button>
    )

  return (
    <aside className="media-panel">
      <header>
        <strong>🖼 מאגר התמונות</strong>
        <span className="spacer" />
        <button className="icon-btn" onClick={onToggle} title="סגור">✕</button>
      </header>

      <div className="media-actions">
        <button className="btn sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? progress || 'מעלה…' : '+ העלה תמונות'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          hidden
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </div>

      {err && <div className="alert error tiny">{err}</div>}

      <div
        className="media-grid"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
        }}
      >
        {media.length === 0 && !busy && (
          <p className="tiny muted" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            עדיין אין תמונות.
            <br />
            העלה או גרור קבצים לכאן.
          </p>
        )}

        {media.map((item) => (
          <figure
            key={item.id}
            className="media-item"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/x-ll-media', item.id)
              e.dataTransfer.effectAllowed = 'copy'
            }}
            title={`${item.name} · ${item.w}×${item.h} · ${prettyBytes(item.bytes ?? 0)}`}
          >
            <img src={item.dataUrl} alt={item.name} draggable={false} />
            <button
              className="media-del"
              onClick={() => del(item)}
              title="מחק מהמאגר"
            >
              ✕
            </button>
          </figure>
        ))}
      </div>

      <p className="tiny muted media-hint">
        גרור תמונה אל השקופית כדי להוסיף אותה. אפשר לגרור את אותה תמונה לכמה
        שקופיות — היא נשמרת פעם אחת בלבד.
      </p>
    </aside>
  )
}
