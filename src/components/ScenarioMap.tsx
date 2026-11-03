import type { ScenarioVessel } from '../session'
import { NauticalChart } from './NauticalChart'

export function ScenarioMap({ mapId, vessels, positionMode, emergency, onMoveVessel }: { mapId: string; vessels: ScenarioVessel[]; positionMode: boolean; emergency: boolean; onMoveVessel: (id: string, latitude: number, longitude: number) => void }) {
  return <div className="scenario-chart-frame">
    <NauticalChart mapId={mapId} vessels={vessels} positionMode={positionMode} onMoveVessel={onMoveVessel}/>
    {emergency && <div className="scenario-map-emergency">ALERTA DE SOCORRO ACTIVA</div>}
  </div>
}
