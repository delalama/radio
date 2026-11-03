import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultMapId, getScenarioMap, getSpawnCoordinates, isWaterPosition } from './maps'

export type Gear = 'ahead' | 'astern' | 'neutral'

export interface ScenarioVessel {
  id: string
  role: 'student' | 'instructor' | 'traffic'
  name: string
  mmsi: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  gear: Gear
  controller: 'student' | 'instructor'
}

export interface ScenarioState {
  emergency: boolean
  mapId: string
  vessels: ScenarioVessel[]
}

export interface RadioMessage {
  id: string
  vesselId: string
  vesselName: string
  mmsi: string
  channel: number
  text: string
  sentAt: number
}

const starterFleet: ScenarioVessel[] = [
  { id: 'instructor', role: 'instructor', name: 'INSTRUCTOR', mmsi: '224 018 401', latitude: 0, longitude: 0, heading: 245, speed: 0, gear: 'neutral', controller: 'instructor' },
  { id: 'student', role: 'student', name: 'MAR AZUL', mmsi: '224 018 420', latitude: 0, longitude: 0, heading: 245, speed: 0, gear: 'neutral', controller: 'student' },
  { id: 'pelagia', role: 'traffic', name: 'PELAGIA', mmsi: '224 018 221', latitude: 0, longitude: 0, heading: 315, speed: 0, gear: 'neutral', controller: 'instructor' },
  { id: 'isla-sur', role: 'traffic', name: 'ISLA SUR', mmsi: '224 018 309', latitude: 0, longitude: 0, heading: 82, speed: 0, gear: 'neutral', controller: 'instructor' },
]

export const defaultScenario: ScenarioState = {
  emergency: false,
  mapId: defaultMapId,
  vessels: starterFleet.map((vessel, index) => ({ ...vessel, ...getSpawnCoordinates(defaultMapId, index) })),
}

export interface RadarContact {
  x: number
  y: number
  label: string
  name: string
  rangeNm: number
  bearing: number
  relativeBearing: number
}

export function radarContacts(observer: ScenarioVessel, vessels: ScenarioVessel[], rangeNm = 3): RadarContact[] {
  return vessels.filter(vessel => vessel.id !== observer.id).flatMap(vessel => {
    const northNm = (vessel.latitude - observer.latitude) * 60
    const eastNm = (vessel.longitude - observer.longitude) * 60 * Math.cos(observer.latitude * Math.PI / 180)
    const distance = Math.hypot(northNm, eastNm)
    if (distance < 0.03 || distance > rangeNm) return []
    const bearing = (Math.atan2(eastNm, northNm) * 180 / Math.PI + 360) % 360
    const relativeBearing = (bearing - observer.heading + 360) % 360
    const radius = Math.min(distance / rangeNm, 0.96) * 180
    return [{
      x: 200 + Math.sin(relativeBearing * Math.PI / 180) * radius,
      y: 200 - Math.cos(relativeBearing * Math.PI / 180) * radius,
      label: vessel.name.length > 7 ? vessel.name.slice(0, 7) : vessel.name,
      name: vessel.name,
      rangeNm: distance,
      bearing,
      relativeBearing,
    }]
  })
}

function hydrateScenario(value: unknown): ScenarioState {
  const saved = value && typeof value === 'object' ? value as Partial<ScenarioState> & { studentShip?: Partial<ScenarioVessel> } : {}
  if (Array.isArray(saved.vessels)) {
    const savedVessels = saved.vessels
    const mapId = typeof saved.mapId === 'string' && scenarioMapsContain(saved.mapId) ? saved.mapId : 'malaga'
    const defaults = defaultScenario.vessels.flatMap(base => {
      const savedVessel = savedVessels.find(vessel => vessel.id === base.id)
      if (!savedVessel) return base.id === 'student' && savedVessels.some(vessel => vessel.role === 'student') ? [] : [base]
      const vessel = { ...base, ...savedVessel }
      if (!isWaterPosition(mapId, vessel)) Object.assign(vessel, getSpawnCoordinates(mapId, defaultScenario.vessels.findIndex(item => item.id === base.id)))
      return [savedVessel.gear ? vessel : { ...vessel, gear: 'neutral' as const, speed: 0 }]
    })
    const defaultIds = new Set(defaultScenario.vessels.map(vessel => vessel.id))
    const additionalVessels = savedVessels.filter(vessel => !defaultIds.has(vessel.id)).map((vessel, index) => isWaterPosition(mapId, vessel) ? vessel : { ...vessel, ...getSpawnCoordinates(mapId, defaultScenario.vessels.length + index), speed: 0, gear: 'neutral' as const })
    return { emergency: Boolean(saved.emergency), mapId, vessels: [...defaults, ...additionalVessels] }
  }
  // Migrate the earlier demo's single student vessel into the shared fleet.
  return {
    emergency: Boolean(saved.emergency),
    mapId: typeof saved.mapId === 'string' && scenarioMapsContain(saved.mapId) ? saved.mapId : defaultMapId,
    vessels: defaultScenario.vessels.map(vessel => vessel.id === 'student' ? { ...vessel, ...saved.studentShip, gear: 'neutral', speed: 0 } : vessel),
  }
}

function scenarioMapsContain(mapId: string) {
  return Boolean(getScenarioMap(mapId)?.id === mapId)
}

function scenarioCommand(before: ScenarioState, after: ScenarioState) {
  const vessels: Array<{ id: string; vessel?: ScenarioVessel; changes?: Partial<ScenarioVessel> }> = []
  after.vessels.forEach(vessel => {
    const previous = before.vessels.find(item => item.id === vessel.id)
    if (!previous) { vessels.push({ id: vessel.id, vessel }); return }
    const changes: Partial<ScenarioVessel> = {}
    for (const field of ['name', 'mmsi', 'latitude', 'longitude', 'heading', 'speed', 'gear', 'controller'] as const) {
      if (previous[field] !== vessel[field]) changes[field] = vessel[field] as never
    }
    if (Object.keys(changes).length) vessels.push({ id: vessel.id, changes })
  })
  return { ...(before.emergency !== after.emergency ? { emergency: after.emergency } : {}), ...(before.mapId !== after.mapId ? { mapId: after.mapId } : {}), vessels }
}

export function useScenario(sessionCode: string, role: 'student' | 'instructor') {
  const key = `northline-session-${sessionCode.toUpperCase()}`
  const participantKey = `northline-participant-${sessionCode.toUpperCase()}`
  const channelRef = useRef<BroadcastChannel | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const [participantId] = useState(() => {
    if (role === 'instructor') return 'instructor'
    const requestedId = new URLSearchParams(window.location.search).get('participant')
    if (requestedId) return `student-${requestedId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32)}`
    const existing = localStorage.getItem(participantKey)
    if (existing) return existing
    const token = crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16)).join('')
    const generated = `student-${token}`
    localStorage.setItem(participantKey, generated)
    return generated
  })
  const [ownVesselId, setOwnVesselId] = useState(role === 'instructor' ? 'instructor' : 'student')
  const [scenario, setScenario] = useState<ScenarioState>(() => {
    try { return hydrateScenario(JSON.parse(localStorage.getItem(key) ?? 'null')) }
    catch { return defaultScenario }
  })
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [radioMessages, setRadioMessages] = useState<RadioMessage[]>([])
  const scenarioRef = useRef(scenario)
  scenarioRef.current = scenario

  useEffect(() => {
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(key) : null
    channelRef.current = channel
    let stopped = false
    let retryTimer: number | undefined
    let socket: WebSocket | null = null
    const receive = (value: unknown, persist = false, vesselId?: string) => {
      const next = hydrateScenario(value)
      scenarioRef.current = next
      setScenario(next)
      if (vesselId) setOwnVesselId(vesselId)
      if (persist) localStorage.setItem(key, JSON.stringify(next))
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try { receive(JSON.parse(event.newValue)) } catch { /* Ignore incomplete storage writes. */ }
      }
    }
    if (channel) channel.onmessage = event => receive(event.data)
    window.addEventListener('storage', onStorage)
    const connect = () => {
      if (stopped) return
      setConnectionStatus('connecting')
      const endpoint = new URL('/session', window.location.href)
      endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:'
      endpoint.searchParams.set('code', sessionCode.toUpperCase())
      socket = new WebSocket(endpoint)
      socketRef.current = socket
      socket.onopen = () => {
        setConnectionStatus('connected')
        socket?.send(JSON.stringify({ type: 'join', role, participantId, scenario: scenarioRef.current }))
      }
      socket.onmessage = event => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string; scenario?: unknown; vesselId?: string; radioMessage?: RadioMessage }
          if (message.type === 'scenario' && message.scenario) receive(message.scenario, true, message.vesselId)
          if (message.type === 'radio' && message.radioMessage) setRadioMessages(current => [...current.slice(-49), message.radioMessage!])
        } catch { /* Ignore malformed session messages. */ }
      }
      socket.onclose = () => {
        setConnectionStatus('offline')
        if (!stopped) retryTimer = window.setTimeout(connect, 1000)
      }
      socket.onerror = () => socket?.close()
    }
    connect()
    return () => {
      stopped = true
      if (retryTimer) window.clearTimeout(retryTimer)
      socket?.close()
      socketRef.current = null
      channel?.close()
      channelRef.current = null
      window.removeEventListener('storage', onStorage)
    }
  }, [key, participantId, role, sessionCode])

  const update = useCallback((change: Partial<ScenarioState> | ((current: ScenarioState) => ScenarioState)) => {
    setScenario(current => {
      const next = hydrateScenario(typeof change === 'function' ? change(current) : { ...current, ...change })
      localStorage.setItem(key, JSON.stringify(next))
      channelRef.current?.postMessage(next)
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'update', command: scenarioCommand(current, next) }))
      scenarioRef.current = next
      return next
    })
  }, [key])

  const transmitRadio = useCallback((channel: number, text: string) => {
    const vessel = scenarioRef.current.vessels.find(item => item.id === ownVesselId)
    if (!vessel || socketRef.current?.readyState !== WebSocket.OPEN) return false
    socketRef.current.send(JSON.stringify({ type: 'radio', channel, text }))
    return true
  }, [ownVesselId])

  return [scenario, update, connectionStatus, ownVesselId, radioMessages, transmitRadio] as const
}
