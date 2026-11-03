import { Minus, Plus } from 'lucide-react'
import { formatRadarRange } from './useRadarRange'

export function RadarRangeSelector({ rangeNm, onChange, compact = false }: { rangeNm: number; onChange: (direction: -1 | 1) => void; compact?: boolean }) {
  return <div className={`radar-range-selector ${compact ? 'compact' : ''}`} aria-label="Alcance del radar" onClick={event => event.stopPropagation()}>
    <button aria-label="Disminuir alcance del radar" title="Disminuir alcance" disabled={rangeNm <= 0.25} onClick={() => onChange(-1)}><Minus size={compact ? 11 : 14}/></button>
    <span><b>{formatRadarRange(rangeNm)}</b><small>NM</small></span>
    <button aria-label="Aumentar alcance del radar" title="Aumentar alcance" disabled={rangeNm >= 48} onClick={() => onChange(1)}><Plus size={compact ? 11 : 14}/></button>
  </div>
}
