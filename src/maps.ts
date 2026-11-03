import mapCatalog from '../shared/mapCatalog.json'
import { chartScenes, type ChartPoint } from './chartData'

export const scenarioMaps = mapCatalog.maps
export const defaultMapId = mapCatalog.defaultMapId
export type ScenarioMapId = (typeof mapCatalog.maps)[number]['id']

export function getScenarioMap(mapId: string) {
  return scenarioMaps.find(map => map.id === mapId) ?? scenarioMaps.find(map => map.id === defaultMapId) ?? scenarioMaps[0]
}

function contains(point: ChartPoint, polygon: ChartPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.latitude > point.latitude) !== (b.latitude > point.latitude)
      && point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude || 1e-9) + a.longitude) inside = !inside
  }
  return inside
}

export function isWaterPosition(mapId: string, point: ChartPoint) {
  const map = getScenarioMap(mapId)
  const [south, west, north, east] = map.chartBounds
  if (point.latitude <= south || point.latitude >= north || point.longitude <= west || point.longitude >= east) return false
  const scene = chartScenes[mapId] ?? chartScenes.strait
  const northLand = [{ latitude: north, longitude: west }, { latitude: north, longitude: east }, ...scene.northCoast.slice().reverse()]
  const southLand = scene.southCoast ? [{ latitude: south, longitude: west }, { latitude: south, longitude: east }, ...scene.southCoast.slice().reverse()] : []
  return ![northLand, ...(southLand.length ? [southLand] : [])].some(polygon => contains(point, polygon))
}

export function getSpawnCoordinates(mapId: string, slot: number) {
  const map = getScenarioMap(mapId)
  const [latitude, longitude] = map.spawnCenter
  for (let offset = 0; offset < map.spawnOffsetsNm.length; offset++) {
    const [northNm, eastNm] = map.spawnOffsetsNm[(slot + offset) % map.spawnOffsetsNm.length]
    const position = { latitude: Number((latitude + northNm / 60).toFixed(7)), longitude: Number((longitude + eastNm / (60 * Math.cos(latitude * Math.PI / 180))).toFixed(7)) }
    if (isWaterPosition(mapId, position)) return position
  }
  return { latitude, longitude }
}

type MappableVessel = { latitude: number; longitude: number; speed: number; gear: 'ahead' | 'astern' | 'neutral' }

export function repositionFleet<T extends MappableVessel>(vessels: T[], mapId: string) {
  return vessels.map((vessel, index) => ({
    ...vessel,
    ...getSpawnCoordinates(mapId, index),
    speed: 0,
    gear: 'neutral' as const,
  }))
}
