import { useRef, useState } from 'react'
import { processImageFile, prettyBytes, ACCEPTED_TYPES } from '../lib/media'
import { addMedia, removeMedia } from '../lib/db'

/**
 * תוכן פאנל התמונות. התמונות מועלות פעם אחת ונשארות זמינות לכל
 * הסביבות של אותו מרצה — גוררים מכאן לכל שקופית שרוצים.
 */
export default function MediaLibrary({ ownerUid, media, setMedia }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [progress, setProgress] = useState('')
  const [dropping, setDropping] = useState(false)

  const upload = async (files) => {
    setErr('')
    setBusy(true)
    try {
      const list = [...files]
      for (let i = 0; i < list.length; i++) {
        setProgress(list.length > 1 ? `מעבד ${i + 1} מתוך ${list.length}…` : 'מעבד…')
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

  return (
    <>
      <div className="panel-head">
        <strong>תמונות</strong>
      </div>

      <div className="panel-body">
        <button className="btn" style={{ width: '100%' }} onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? progress || 'מעלה…' : '⬆ העלה תמונות'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          hidden
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />

        {err && <div className="alert error tiny" style={{ marginTop: 10 }}>{err}</div>}

        <div
          className={'media-grid' + (dropping ? ' dropping' : '')}
          onDragOver={(e) => { e.preventDefault(); setDropping(true) }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDropping(false)
            if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
          }}
        >
          {media.length === 0 && !busy && (
            <p className="tiny muted panel-empty">
              עדיין אין תמונות.
              <br />
              העלה, או גרור קבצים לכאן.
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
              <button className="media-del" onClick={() => del(item)} title="מחק מהמאגר">✕</button>
            </figure>
          ))}
        </div>
      </div>

      <p className="panel-foot tiny muted">
        גרור תמונה אל השקופית כדי להוסיף אותה. אותה תמונה יכולה לשמש בכמה
        שקופיות ונשמרת פעם אחת בלבד.
      </p>
    </>
  )
}
