/**
 * ממיר קישור לסרטון לכתובת שניתן להטמיע.
 * תומך ביוטיוב, ב-Vimeo ובקובץ וידאו ישיר.
 * מחזיר null אם אין קישור תקין — ואז מוצג מציין מקום.
 */
export function videoEmbed(url, start = 0) {
  const raw = String(url ?? '').trim()
  if (!raw) return null
  const at = Math.max(0, Math.floor(Number(start) || 0))
  const withStart = (u, param = 'start') => {
    if (!at) return u
    const sep = u.includes('?') ? '&' : '?'
    return `${u}${sep}${param}=${at}`
  }

  let u
  try {
    u = new URL(raw)
  } catch {
    return null
  }

  const host = u.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1)
    return id ? { kind: 'embed', src: withStart(`https://www.youtube.com/embed/${id}`) } : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname.startsWith('/embed/')) return { kind: 'embed', src: withStart(u.href) }
    if (u.pathname.startsWith('/shorts/'))
      return {
        kind: 'embed',
        src: withStart(`https://www.youtube.com/embed/${u.pathname.split('/')[2]}`),
      }
    const id = u.searchParams.get('v')
    return id ? { kind: 'embed', src: withStart(`https://www.youtube.com/embed/${id}`) } : null
  }

  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0]
    // ב-Vimeo נקודת ההתחלה נמסרת כעוגן #t=
    return id
      ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}${at ? `#t=${at}s` : ''}` }
      : null
  }

  if (host === 'player.vimeo.com') return { kind: 'embed', src: u.href }

  // קובץ וידאו ישיר — הדפדפן קופץ לשנייה המבוקשת עם #t=
  if (/\.(mp4|webm|ogg|ogv|mov)$/i.test(u.pathname))
    return { kind: 'file', src: at ? `${u.href}#t=${at}` : u.href }

  // כתובת אחרת — מנסים להטמיע כמות שהיא
  return { kind: 'embed', src: u.href }
}
