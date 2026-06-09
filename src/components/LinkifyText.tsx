export default function LinkifyText({ text, style }: { text: string; style?: React.CSSProperties }) {
  if (!text) return null

  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return (
    <span style={style}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer"
            style={{ color: '#6366F1', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}
