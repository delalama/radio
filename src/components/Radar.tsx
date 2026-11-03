import { useEffect, useState } from 'react'
import { formatRadarRange } from './useRadarRange'

export interface RadarTarget { x: number; y: number; label: string }

export function Radar({ compact = false, targets, rangeNm = 3 }: { compact?: boolean; targets?: RadarTarget[]; rangeNm?: number }) {
  const [angle, setAngle] = useState(18)
  const contacts = targets ?? [{ x: 116, y: 125, label: 'T1' }, { x: 286, y: 257, label: 'T2' }]
  useEffect(() => {
    const timer = window.setInterval(() => setAngle(value => (value + 2) % 360), 90)
    return () => window.clearInterval(timer)
  }, [])
  return <div className={`radar-scope ${compact ? 'compact' : ''}`}>
    <svg viewBox="0 0 400 400" role="img" aria-label={`Radar marítimo, alcance ${formatRadarRange(rangeNm)} millas náuticas`}>
      <defs><radialGradient id="radarGlow"><stop offset="0" stopColor="#0d382d"/><stop offset="1" stopColor="#071812"/></radialGradient><linearGradient id="sweepFade" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#56e5a0" stopOpacity="0"/><stop offset="1" stopColor="#56e5a0" stopOpacity=".28"/></linearGradient></defs>
      <circle cx="200" cy="200" r="190" fill="url(#radarGlow)" stroke="#315044" strokeWidth="1"/>
      {[47,95,142,190].map(r => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#315044" strokeWidth=".8"/>)}
      <path d="M10 200H390M200 10V390M66 66L334 334M334 66L66 334" stroke="#294739" strokeWidth=".7"/>
      <path d="M200 200 L200 10 A190 190 0 0 1 330 62 Z" fill="url(#sweepFade)" transform={`rotate(${angle} 200 200)`}/>
      <line x1="200" y1="200" x2="200" y2="10" stroke="#63e5a8" strokeWidth="1.5" opacity=".85" transform={`rotate(${angle} 200 200)`}/>
      <circle cx="200" cy="200" r="4" fill="#f2f4df"/><path d="M200 188l-6 14h12z" fill="#e9f3df"/>
      {contacts.map((target, index) => <g key={`${target.label}-${index}`}><circle cx={target.x} cy={target.y} r="3.5" fill="#b7f0c3"/><circle cx={target.x} cy={target.y} r="11" fill="none" stroke="#71d895" strokeOpacity=".35"/><text x={target.x + 9} y={target.y - 6} fill="#c5e9cb" fontFamily="monospace" fontSize="9">{target.label}</text></g>)}
      {!compact && <g fill="#9cb6a5" fontFamily="monospace" fontSize="9"><text x="207" y="29">0°</text><text x="355" y="197">090°</text><text x="194" y="380">180°</text><text x="20" y="197">270°</text>{[47,95,142,190].map(radius => <text key={radius} x="207" y={200 - radius + 3}>{formatRadarRange(rangeNm * radius / 190)} NM</text>)}</g>}
    </svg>
  </div>
}
