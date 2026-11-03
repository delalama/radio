import { useId, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ScenarioVessel } from '../session'
import { chartScenes, type ChartPoint } from '../chartData'
import { getScenarioMap } from '../maps'

const WIDTH = 1000
const HEIGHT = 620

type Bounds = { south: number; west: number; north: number; east: number }

function makeLandPolygons(northCoast: ChartPoint[], southCoast: ChartPoint[] | undefined, bounds: Bounds) {
  const north = [{ latitude: bounds.north, longitude: bounds.west }, { latitude: bounds.north, longitude: bounds.east }, ...northCoast.slice().reverse()]
  const south = southCoast ? [{ latitude: bounds.south, longitude: bounds.west }, { latitude: bounds.south, longitude: bounds.east }, ...southCoast.slice().reverse()] : []
  return [north, ...(south.length ? [south] : [])]
}

function pathFor(points: ChartPoint[], project: (point: ChartPoint) => { x: number; y: number }) {
  return points.map((point, index) => {
    const { x, y } = project(point)
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function contains(point: ChartPoint, polygon: ChartPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = (a.latitude > point.latitude) !== (b.latitude > point.latitude)
      && point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude || 1e-9) + a.longitude
    if (crosses) inside = !inside
  }
  return inside
}

function vesselRange(a: ScenarioVessel, b: ScenarioVessel) {
  const north = (b.latitude - a.latitude) * 60
  const east = (b.longitude - a.longitude) * 60 * Math.cos(a.latitude * Math.PI / 180)
  return Math.hypot(north, east)
}

export function NauticalChart({ mapId, vessels, positionMode = false, compact = false, ownVesselId, onMoveVessel }: {
  mapId: string
  vessels: ScenarioVessel[]
  positionMode?: boolean
  compact?: boolean
  ownVesselId?: string
  onMoveVessel?: (id: string, latitude: number, longitude: number) => void
}) {
  const map = getScenarioMap(mapId)
  const scene = chartScenes[mapId] ?? chartScenes.strait
  const observer = vessels.find(vessel => vessel.id === ownVesselId) ?? vessels[0]
  const profileBounds = map.chartBounds as [number, number, number, number]
  const radiusNm = compact ? 3.2 : 0
  const bounds: Bounds = compact && observer
    ? { south: observer.latitude - radiusNm / 60, north: observer.latitude + radiusNm / 60, west: observer.longitude - radiusNm / (60 * Math.cos(observer.latitude * Math.PI / 180)), east: observer.longitude + radiusNm / (60 * Math.cos(observer.latitude * Math.PI / 180)) }
    : { south: profileBounds[0], west: profileBounds[1], north: profileBounds[2], east: profileBounds[3] }
  const id = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ vesselId: string; pointerId: number } | null>(null)
  const lastSentAt = useRef(0)
  const centerLatitude = (bounds.south + bounds.north) / 2
  const longitudeScale = Math.cos(centerLatitude * Math.PI / 180)
  const longitudeSpan = (bounds.east - bounds.west) * longitudeScale
  const latitudeSpan = bounds.north - bounds.south
  const pixelsPerDegree = Math.min((WIDTH - 54) / longitudeSpan, (HEIGHT - 54) / latitudeSpan)
  const offsetX = (WIDTH - longitudeSpan * pixelsPerDegree) / 2
  const offsetY = (HEIGHT - latitudeSpan * pixelsPerDegree) / 2
  const project = (point: ChartPoint) => ({
    x: offsetX + (point.longitude - bounds.west) * longitudeScale * pixelsPerDegree,
    y: offsetY + (bounds.north - point.latitude) * pixelsPerDegree,
  })
  const landPolygons = makeLandPolygons(scene.northCoast, scene.southCoast, bounds)
  const gridStep = compact ? 0.02 : mapId === 'strait' ? 0.2 : 0.1
  const firstLatitude = Math.ceil(bounds.south / gridStep) * gridStep
  const firstLongitude = Math.ceil(bounds.west / gridStep) * gridStep
  const latitudeLines = Array.from({ length: Math.ceil((bounds.north - firstLatitude) / gridStep) }, (_, i) => firstLatitude + i * gridStep)
    .filter(latitude => latitude > bounds.south && latitude < bounds.north)
  const longitudeLines = Array.from({ length: Math.ceil((bounds.east - firstLongitude) / gridStep) }, (_, i) => firstLongitude + i * gridStep)
    .filter(longitude => longitude > bounds.west && longitude < bounds.east)

  const readSvgPoint = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    return point.matrixTransform(matrix.inverse())
  }
  const pointToPosition = (point: DOMPoint) => ({
    latitude: bounds.north - (point.y - offsetY) / pixelsPerDegree,
    longitude: bounds.west + (point.x - offsetX) / (pixelsPerDegree * longitudeScale),
  })
  const isLand = (point: ChartPoint) => landPolygons.some(polygon => contains(point, polygon))
  const moveDraggedVessel = (event: ReactPointerEvent<SVGSVGElement>, force = false) => {
    const drag = dragRef.current
    if (!positionMode || !drag || !onMoveVessel || drag.pointerId !== event.pointerId) return
    const now = Date.now()
    if (!force && now - lastSentAt.current < 45) return
    const svgPoint = readSvgPoint(event)
    if (!svgPoint) return
    const position = pointToPosition(svgPoint)
    if (position.latitude < bounds.south || position.latitude > bounds.north || position.longitude < bounds.west || position.longitude > bounds.east || isLand(position)) return
    lastSentAt.current = now
    onMoveVessel(drag.vesselId, Number(position.latitude.toFixed(6)), Number(position.longitude.toFixed(6)))
  }

  const waterName = mapId === 'malaga' ? 'MAR DE ALBORÁN' : mapId === 'trafalgar' ? 'GOLFO DE CÁDIZ' : 'ESTRECHO DE GIBRALTAR'
  const scaleNm = compact ? 1 : mapId === 'malaga' ? 10 : 15
  const scaleWidth = (scaleNm / 60) * pixelsPerDegree

  return <div className={`nautical-chart ${compact ? 'compact' : ''} ${positionMode ? 'drag-enabled' : ''}`}>
    {!compact && <div className="chart-title-strip"><span>CARTA DE NAVEGACIÓN · {map.name.toUpperCase()}</span><span>PROYECCIÓN ESQUEMÁTICA · NO OFICIAL</span></div>}
    <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Carta náutica esquemática de ${map.name}`} onPointerMove={event => moveDraggedVessel(event)} onPointerUp={event => { moveDraggedVessel(event, true); dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }}>
      <defs>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d7e2d5"/><stop offset="1" stopColor="#b9d1ca"/></linearGradient>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8dfc2"/><stop offset="1" stopColor="#d5c9a6"/></linearGradient>
        <pattern id={`${id}-paper`} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12L12 0" stroke="#315f6060" strokeWidth=".35"/></pattern>
        <clipPath id={`${id}-clip`}><rect x="0" y="0" width={WIDTH} height={HEIGHT}/></clipPath>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-sea)`}/>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-paper)`} opacity=".2"/>
      <g clipPath={`url(#${id}-clip)`}>
        <g className="chart-grid-lines">
          {latitudeLines.map(latitude => { const y = project({ latitude, longitude: bounds.west }).y; return <g key={`lat-${latitude}`}><line x1={offsetX} y1={y} x2={WIDTH - offsetX} y2={y}/><text x={offsetX + 4} y={y - 3}>{Math.abs(latitude).toFixed(1)}° N</text></g> })}
          {longitudeLines.map(longitude => { const x = project({ latitude: bounds.north, longitude }).x; return <g key={`lon-${longitude}`}><line x1={x} y1={offsetY} x2={x} y2={HEIGHT - offsetY}/><text x={x + 3} y={HEIGHT - offsetY - 4}>{Math.abs(longitude).toFixed(1)}° W</text></g> })}
        </g>
        {scene.isobaths.map(contour => <g key={`depth-${contour.depth}`}><path d={pathFor(contour.points, project)} className="chart-isobath"/><text className="chart-isobath-label" x={project(contour.points[Math.floor(contour.points.length / 2)]).x + 5} y={project(contour.points[Math.floor(contour.points.length / 2)]).y - 4}>{contour.depth} m</text></g>)}
        {landPolygons.map((polygon, index) => <path key={`land-${index}`} d={`${pathFor(polygon, project)} Z`} className="chart-land" style={{ fill: `url(#${id}-land)` }}/>)}
        <path d={pathFor(scene.northCoast, project)} className="chart-coastline"/>
        {scene.southCoast && <path d={pathFor(scene.southCoast, project)} className="chart-coastline"/>}
        <text className="chart-water-name" x={project({ latitude: (bounds.south + bounds.north) / 2, longitude: (bounds.west + bounds.east) / 2 }).x} y={project({ latitude: (bounds.south + bounds.north) / 2, longitude: (bounds.west + bounds.east) / 2 }).y}>{compact ? waterName : mapId === 'strait' ? 'ATLÁNTICO  /  MEDITERRÁNEO' : waterName}</text>
        {scene.labels.map((label, index) => { const p = project(label); return <g key={`label-${index}`} className={`chart-label chart-label-${label.kind ?? 'place'}`} transform={`translate(${p.x + (label.dx ?? 0)} ${p.y + (label.dy ?? 0)})`}><text>{label.text}</text></g> })}
        {scene.soundings.map((sounding, index) => { const p = project(sounding); return <g key={`sounding-${index}`} className="chart-sounding"><circle cx={p.x} cy={p.y} r="1.7"/><text x={p.x + 4} y={p.y + 3}>{sounding.depth}</text></g> })}
        {scene.aids.map((aid, index) => { const p = project(aid); return <g key={`aid-${index}`} className={`chart-aid chart-aid-${aid.kind}`} transform={`translate(${p.x} ${p.y})`}><title>{aid.name}</title>{aid.kind === 'lighthouse' ? <><path d="M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z"/><circle r="1.4"/></> : aid.kind === 'port' ? <><rect x="-4" y="-4" width="8" height="8"/><path d="M-7 7L7 -7"/></> : <><circle r="4"/><path d="M0 -8V-4"/></>}</g> })}
        <g className="chart-scale" transform={`translate(${offsetX + 18} ${HEIGHT - offsetY - 18})`}><path d={`M0 0H${scaleWidth}`} /><path d={`M0 -5V5M${scaleWidth} -5V5`}/><text x={scaleWidth / 2} y="-7" textAnchor="middle">{scaleNm} NM</text></g>
        <g className="chart-compass" transform={`translate(${WIDTH - offsetX - 38} ${offsetY + 38})`}><circle r="22"/><path d="M0 -17L5 6L0 2L-5 6Z"/><text x="0" y="-27" textAnchor="middle">N</text></g>
        {vessels.map(vessel => { const p = project(vessel); const isOwn = vessel.id === ownVesselId || (!ownVesselId && vessel.role === 'instructor'); return <g key={vessel.id} className={`chart-vessel ${isOwn ? 'own-vessel' : ''} ${positionMode && !compact ? 'draggable' : ''}`} transform={`translate(${p.x} ${p.y})`} onPointerDown={event => { if (compact || !positionMode || !onMoveVessel) return; event.preventDefault(); event.stopPropagation(); dragRef.current = { vesselId: vessel.id, pointerId: event.pointerId }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerUp={event => { if (dragRef.current?.vesselId === vessel.id) { moveDraggedVessel(event as unknown as ReactPointerEvent<SVGSVGElement>, true); dragRef.current = null } }}>
          <title>{vessel.name} · {vessel.heading}° · {vesselRange(observer ?? vessel, vessel).toFixed(1)} NM</title>
          <circle className="chart-vessel-halo" r={isOwn ? 13 : 11}/><path className="chart-vessel-symbol" d="M0 -10L6 8L0 5L-6 8Z" transform={`rotate(${vessel.heading})`}/>
          {!compact && <text className="chart-vessel-name" x="10" y="-6">{vessel.name}</text>}
          {!compact && <text className="chart-vessel-speed" x="10" y="5">{vessel.heading}° · {vessel.gear === 'neutral' ? '0' : vessel.speed} kn</text>}
        </g> })}
        {compact && observer && <g className="hud-heading-bug" transform={`translate(${WIDTH - 54} 54)`}><circle r="21"/><path d="M0 -16L4 5L0 2L-4 5Z" transform={`rotate(${observer.heading})`}/><text y="31" textAnchor="middle">{observer.heading}°</text></g>}
      </g>
    </svg>
    {positionMode && !compact && <div className="chart-drag-hint">ARRASTRA CUALQUIER BARCO PARA CAMBIAR SU POSICIÓN, INCLUIDO EL INSTRUCTOR</div>}
    {compact ? <div className="chart-hud-readout"><span>{observer?.latitude.toFixed(3)}° N</span><span>{Math.abs(observer?.longitude ?? 0).toFixed(3)}° W</span><span>{observer?.speed.toFixed(1)} kn</span></div> : <div className="chart-legend"><span><i className="chart-legend-own"/> EMBARCACIÓN</span><span><i className="chart-legend-other"/> CONTACTO</span><span>SONDAS Y CURVAS SIMULADAS</span></div>}
  </div>
}
