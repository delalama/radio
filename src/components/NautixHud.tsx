import { Expand, Eye } from 'lucide-react'
import type { ScenarioVessel } from '../session'
import { NauticalChart } from './NauticalChart'

function rangeNm(observer: ScenarioVessel, target: ScenarioVessel) {
  const north = (target.latitude - observer.latitude) * 60
  const east = (target.longitude - observer.longitude) * 60 * Math.cos(observer.latitude * Math.PI / 180)
  return Math.hypot(north, east)
}

export function NautixHud({ mapId, vessel, vessels, expanded = false, onExpand, positionMode = false, onMoveVessel }: { mapId: string; vessel: ScenarioVessel; vessels: ScenarioVessel[]; expanded?: boolean; onExpand?: () => void; positionMode?: boolean; onMoveVessel?: (id: string, latitude: number, longitude: number) => void }) {
  const closest = vessels.filter(target => target.id !== vessel.id)
    .map(target => ({ target, range: rangeNm(vessel, target) }))
    .sort((a, b) => a.range - b.range)[0]
  const speed = vessel.gear === 'neutral' ? 0 : vessel.gear === 'astern' ? -vessel.speed : vessel.speed

  return <section className={`nautix-gadget ${expanded ? 'expanded' : ''}`} aria-label={`HUD Nautix de ${vessel.name}`}>
    <header><span><Eye size={13}/> NAUTIX <small>IN-VIEW</small></span><b><i/> GPS SIM</b>{onExpand && <button className="nautix-expand-button" onClick={onExpand}><Expand size={12}/> AMPLIAR</button>}</header>
    <div className="nautix-display"><NauticalChart mapId={mapId} vessels={vessels} ownVesselId={vessel.id} compact={!expanded} positionMode={positionMode} onMoveVessel={onMoveVessel}/></div>
    <footer><span><small>COG</small><b>{String(vessel.heading).padStart(3, '0')}°</b></span><span><small>SOG</small><b>{speed.toFixed(1)} kn</b></span><span className="hud-nearest"><small>CONTACTO</small><b>{closest ? `${closest.target.name} · ${closest.range.toFixed(1)} NM` : 'SIN CONTACTOS'}</b></span></footer>
  </section>
}
