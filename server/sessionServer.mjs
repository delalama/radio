import { WebSocketServer, WebSocket } from 'ws'
import { readFileSync } from 'node:fs'

const host = process.env.SESSION_HOST || '0.0.0.0'
const port = Number(process.env.SESSION_PORT || 3001)
const sessions = new Map()
const mapCatalog = JSON.parse(readFileSync(new URL('../shared/mapCatalog.json', import.meta.url), 'utf8'))
const mapById = new Map(mapCatalog.maps.map(map => [map.id, map]))
const coastlines = JSON.parse(readFileSync(new URL('../shared/coastlines.json', import.meta.url), 'utf8'))

function contains(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a.latitude > point.latitude) !== (b.latitude > point.latitude)
      && point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude || 1e-9) + a.longitude) inside = !inside
  }
  return inside
}

function isWater(mapId, point) {
  const map = mapById.get(mapId) || mapById.get(mapCatalog.defaultMapId)
  const [south, west, north, east] = map.chartBounds
  if (point.latitude <= south || point.latitude >= north || point.longitude <= west || point.longitude >= east) return false
  const coast = coastlines[map.id]
  const northLand = [{ latitude: north, longitude: west }, { latitude: north, longitude: east }, ...coast.northCoast.slice().reverse()]
  const southLand = coast.southCoast ? [{ latitude: south, longitude: west }, { latitude: south, longitude: east }, ...coast.southCoast.slice().reverse()] : []
  return ![northLand, ...(southLand.length ? [southLand] : [])].some(polygon => contains(point, polygon))
}

function spawnMapPosition(mapId, slot) {
  const map = mapById.get(mapId) || mapById.get(mapCatalog.defaultMapId)
  const [latitude, longitude] = map.spawnCenter
  for (let offset = 0; offset < map.spawnOffsetsNm.length; offset++) {
    const [northNm, eastNm] = map.spawnOffsetsNm[(slot + offset) % map.spawnOffsetsNm.length]
    const position = {
      latitude: Number((latitude + northNm / 60).toFixed(7)),
      longitude: Number((longitude + eastNm / (60 * Math.cos(latitude * Math.PI / 180))).toFixed(7)),
    }
    if (isWater(map.id, position)) return position
  }
  return { latitude, longitude }
}

const defaultScenario = {
  emergency: false,
  mapId: mapCatalog.defaultMapId,
  vessels: [
    { id: 'instructor', role: 'instructor', name: 'INSTRUCTOR', mmsi: '224 018 401', ...spawnMapPosition(mapCatalog.defaultMapId, 0), heading: 245, speed: 0, gear: 'neutral', controller: 'instructor' },
    { id: 'student', role: 'student', name: 'MAR AZUL', mmsi: '224 018 420', ...spawnMapPosition(mapCatalog.defaultMapId, 1), heading: 245, speed: 0, gear: 'neutral', controller: 'student' },
    { id: 'pelagia', role: 'traffic', name: 'PELAGIA', mmsi: '224 018 221', ...spawnMapPosition(mapCatalog.defaultMapId, 2), heading: 315, speed: 0, gear: 'neutral', controller: 'instructor' },
    { id: 'isla-sur', role: 'traffic', name: 'ISLA SUR', mmsi: '224 018 309', ...spawnMapPosition(mapCatalog.defaultMapId, 3), heading: 82, speed: 0, gear: 'neutral', controller: 'instructor' },
  ],
}

function send(socket, type, scenario) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, scenario, vesselId: socket.vesselId }))
}

function broadcast(session) {
  for (const client of session.clients) send(client, 'scenario', session.scenario)
}

function broadcastRadio(session, radioMessage) {
  for (const client of session.clients) {
    if (client.readyState === WebSocket.OPEN && client.role) client.send(JSON.stringify({ type: 'radio', radioMessage }))
  }
}

function registerParticipant(session, role, participantId) {
  if (!session.scenario) return
  if (role === 'instructor') {
    session.scenario.vessels = session.scenario.vessels.filter(vessel => vessel.id !== 'student')
    return
  }
  const existing = session.scenario.vessels.find(vessel => vessel.id === participantId)
  if (existing) return
  const placeholder = session.scenario.vessels.find(vessel => vessel.id === 'student')
  if (placeholder) {
    placeholder.id = participantId
    return
  }
  const studentCount = session.scenario.vessels.filter(vessel => vessel.role === 'student').length
  const position = spawnMapPosition(session.scenario.mapId, studentCount + 1)
  session.scenario.vessels.push({
    id: participantId,
    role: 'student',
    name: `ALUMNO ${String(studentCount + 1).padStart(2, '0')}`,
    mmsi: `224018${String(420 + studentCount).padStart(3, '0')}`,
    ...position,
    heading: 245,
    speed: 0,
    gear: 'neutral',
    controller: 'student',
  })
}

const server = new WebSocketServer({ host, port, path: '/session' })

server.on('connection', (socket, request) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const code = (url.searchParams.get('code') || 'MALAGA7').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24)
  let session = sessions.get(code)
  if (!session) {
    session = { scenario: null, clients: new Set() }
    sessions.set(code, session)
  }
  session.clients.add(socket)
  socket.sessionCode = code

  socket.on('message', raw => {
    let message
    try { message = JSON.parse(raw.toString()) } catch { return }
    if (!message || typeof message !== 'object') return

    if (message.type === 'join') {
      if (!session.scenario && message.scenario && Array.isArray(message.scenario.vessels)) {
        session.scenario = structuredClone(message.scenario)
      }
      if (session.scenario) {
        session.scenario.mapId = mapById.has(session.scenario.mapId) ? session.scenario.mapId : mapCatalog.defaultMapId
        session.scenario.vessels = session.scenario.vessels.map((vessel, index) => isWater(session.scenario.mapId, vessel) ? vessel : { ...vessel, ...spawnMapPosition(session.scenario.mapId, index), speed: 0, gear: 'neutral' })
      }
      socket.role = message.role === 'instructor' ? 'instructor' : 'student'
      socket.vesselId = socket.role === 'instructor' ? 'instructor' : String(message.participantId || 'student')
      registerParticipant(session, socket.role, socket.vesselId)
      broadcast(session)
      send(socket, 'scenario', session.scenario || defaultScenario)
      return
    }

    if (message.type === 'update' && message.command && session.scenario) {
      const command = message.command
      const vessels = session.scenario.vessels.map(vessel => {
        const patch = command.vessels?.find(item => item.id === vessel.id)
        if (!patch) return vessel
        if (socket.role !== 'instructor' && (vessel.id !== socket.vesselId || vessel.controller === 'instructor')) return vessel
        if (socket.role !== 'instructor' && patch.changes?.controller) delete patch.changes.controller
        return { ...vessel, ...(patch.vessel || patch.changes || {}) }
      })
      const incomingIds = new Set(session.scenario.vessels.map(vessel => vessel.id))
      for (const patch of command.vessels || []) {
        if (patch.vessel && !incomingIds.has(patch.id)) vessels.push(patch.vessel)
      }
      const mapId = socket.role === 'instructor' && mapById.has(command.mapId) ? command.mapId : session.scenario.mapId
      const safeVessels = vessels.map((vessel, index) => isWater(mapId, vessel) ? vessel : { ...vessel, ...spawnMapPosition(mapId, index), speed: 0, gear: 'neutral' })
      session.scenario = { ...session.scenario, mapId, ...(socket.role === 'instructor' && typeof command.emergency === 'boolean' ? { emergency: command.emergency } : {}), vessels: safeVessels }
      broadcast(session)
    }

    if (message.type === 'radio' && session.scenario && socket.role) {
      const channel = Number(message.channel)
      const text = typeof message.text === 'string' ? message.text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 280) : ''
      const vessel = session.scenario.vessels.find(item => item.id === socket.vesselId)
      if (!vessel || !Number.isInteger(channel) || channel < 1 || channel > 88 || channel === 70 || !text) return
      broadcastRadio(session, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        vesselId: vessel.id,
        vesselName: vessel.name,
        mmsi: vessel.mmsi,
        channel,
        text,
        sentAt: Date.now(),
      })
    }
  })

  socket.on('close', () => {
    session.clients.delete(socket)
    if (session.clients.size === 0) session.lastDisconnectedAt = Date.now()
  })
})

function advance(vessel, elapsedSeconds, mapId) {
  const sign = vessel.gear === 'ahead' ? 1 : vessel.gear === 'astern' ? -1 : 0
  const distanceNm = sign * Math.max(0, Number(vessel.speed) || 0) * elapsedSeconds / 3600
  if (!distanceNm) return vessel
  const heading = (Number(vessel.heading) || 0) * Math.PI / 180
  const latitude = Number(vessel.latitude) + Math.cos(heading) * distanceNm / 60
  const longitude = Number(vessel.longitude) + Math.sin(heading) * distanceNm / (60 * Math.max(.1, Math.cos(latitude * Math.PI / 180)))
  const position = { latitude: Number(latitude.toFixed(7)), longitude: Number(longitude.toFixed(7)) }
  return isWater(mapId, position) ? { ...vessel, ...position } : { ...vessel, speed: 0, gear: 'neutral' }
}

let lastTick = Date.now()
setInterval(() => {
  const now = Date.now()
  const elapsed = Math.min((now - lastTick) / 1000, 2)
  lastTick = now
  for (const session of sessions.values()) {
    if (session.clients.size === 0 || !session.scenario) continue
    const vessels = session.scenario.vessels.map(vessel => advance(vessel, elapsed, session.scenario.mapId || mapCatalog.defaultMapId))
    if (vessels.some((vessel, index) => vessel !== session.scenario.vessels[index])) {
      session.scenario = { ...session.scenario, vessels }
      broadcast(session)
    }
  }
}, 500)

setInterval(() => {
  const expiry = Date.now() - 30 * 60 * 1000
  for (const [code, session] of sessions) {
    if (session.clients.size === 0 && session.lastDisconnectedAt && session.lastDisconnectedAt < expiry) sessions.delete(code)
  }
}, 60 * 1000)

console.log(`Maritime session server listening on ws://${host}:${port}/session`)
