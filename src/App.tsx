import { useEffect, useState } from 'react'
import { Anchor, ChevronDown, Expand, Headphones, LifeBuoy, Map, Menu, Ship, Signal, X } from 'lucide-react'
import { VhfRadio } from './components/VhfRadio'
import { Radar } from './components/Radar'
import { InstructorConsole } from './components/InstructorConsole'
import { CourseRoom } from './components/CourseRoom'
import { NavigationControls } from './components/NavigationControls'
import { RadarRangeSelector } from './components/RadarRangeSelector'
import { formatRadarRange, useRadarRange } from './components/useRadarRange'
import { NautixHud } from './components/NautixHud'
import { radarContacts, useScenario } from './session'

type Instrument = 'vhf' | 'radar' | 'nautix' | 'ais' | 'safety'

const names: Record<Instrument, string> = { vhf: 'VHF / DSC', radar: 'Radar', nautix: 'Nautix HUD', ais: 'AIS', safety: 'Seguridad' }

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const role = params.get('role') === 'instructor' ? 'instructor' : 'student'
  const sessionCode = (params.get('session') || 'MALAGA7').toUpperCase()
  const instructorPreview = params.get('preview') === 'instructor'
  const [scenario, updateScenario, connectionStatus, ownVesselId, radioMessages, transmitRadio] = useScenario(sessionCode, role)
  const [radarRange, changeRadarRange] = useRadarRange(sessionCode, ownVesselId)
  const initialInstrument = params.get('open')
  const [active, setActive] = useState<Instrument | null>(() => initialInstrument === 'vhf' || initialInstrument === 'radar' || initialInstrument === 'nautix' || initialInstrument === 'ais' || initialInstrument === 'safety' ? initialInstrument : null)
  const [utc, setUtc] = useState(() => new Date().toISOString().slice(11, 16))
  useEffect(() => {
    const timer = window.setInterval(() => setUtc(new Date().toISOString().slice(11, 16)), 30000)
    return () => window.clearInterval(timer)
  }, [])

  if (role === 'instructor') return <InstructorConsole code={sessionCode} scenario={scenario} update={updateScenario} connectionStatus={connectionStatus} radarRange={radarRange} changeRadarRange={changeRadarRange} radioMessages={radioMessages} transmitRadio={transmitRadio} />
  if (params.get('view') === 'course') return <CourseRoom code={sessionCode} />

  const ownShip = scenario.vessels.find(vessel => vessel.id === ownVesselId) ?? scenario.vessels.find(vessel => vessel.role === 'student') ?? scenario.vessels[1]
  const participantCount = scenario.vessels.filter(vessel => vessel.role !== 'traffic').length
  const contacts = radarContacts(ownShip, scenario.vessels, radarRange)
  const actualSpeed = ownShip.gear === 'neutral' ? 0 : ownShip.gear === 'astern' ? -ownShip.speed : ownShip.speed
  const updateOwnShip = (change: Partial<typeof ownShip>) => updateScenario(current => ({ ...current, vessels: current.vessels.map(vessel => vessel.id === ownShip.id ? { ...vessel, ...change } : vessel) }))
  const latitude = `${Math.abs(ownShip.latitude).toFixed(2)}° ${ownShip.latitude >= 0 ? 'N' : 'S'}`
  const longitude = `${Math.abs(ownShip.longitude).toFixed(2)}° ${ownShip.longitude >= 0 ? 'E' : 'W'}`

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Anchor size={19}/></span><span>NORTHLINE <small>MARITIME TRAINING</small></span></div>
      <div className="session-label"><span className="live-dot"/> SESIÓN {sessionCode} <b>·</b> ROCA — COMUNICACIONES</div>
      <div className="top-actions">{instructorPreview && <a className="role-switch" href={`?role=instructor&session=${sessionCode}`}><Ship size={14}/> VISTA INSTRUCTOR</a>}<span className="utc"><span>UTC</span> {utc}</span><a className="role-switch" href={`?role=student&session=${sessionCode}&view=course`}>CURSO ROCA</a><button className="icon-button menu-button" aria-label="Menú"><Menu size={19}/></button><div className="avatar">AL</div></div>
    </header>

    <section className="desk-wrap">
      <div className="desk-heading"><div><div className="eyebrow">PUESTO DE NAVEGACIÓN <span> / </span> ALUMNO</div><h1>Cockpit desk</h1></div><div className="vessel-pill"><span className="vessel-icon"><Anchor size={16}/></span><span><b>{ownShip.name}</b><small>MMSI {ownShip.mmsi}</small></span><ChevronDown size={15}/></div></div>
      <div className="desk-meta"><span><span className="status-square"/> SISTEMAS OPERATIVOS</span><span>POSICIÓN <b>{latitude}&nbsp;&nbsp; {longitude}</b></span><span>RUMBO <b>{ownShip.heading}°</b></span><span>VELOCIDAD <b>{actualSpeed.toFixed(1)} kn</b></span><span>SESIÓN <b>{connectionStatus === 'connected' ? 'EN VIVO' : connectionStatus === 'connecting' ? 'CONECTANDO' : 'SIN CONEXIÓN'}</b></span></div>

      {scenario.emergency && <div className="student-alert"><LifeBuoy size={17}/><span><b>ALERTA DE SOCORRO EN EL ESCENARIO</b><small>El instructor ha activado una situación de emergencia.</small></span><span className="alert-live"><i/> EN CURSO</span></div>}

      <div className="cockpit" aria-label="Instrumentos de navegación">
        <div className="console-top"><span>ESTACIÓN DE RADIOCOMUNICACIONES</span><span>BRIDGE 01 <i/> TRAINING MODE</span></div>
        <div className="instrument-grid">
          <button className="instrument radio-card" onClick={() => setActive('vhf')} aria-label="Abrir radio VHF DSC">
            <div className="device-top"><span className="device-brand">NORTHLINE <small>MARINE</small></span><span className="device-led"/></div>
            <div className="radio-body"><div className="radio-screen"><div className="screen-top"><span>INT</span><span>USA</span><span>▲</span></div><div className="screen-channel">16 <small>CH</small></div><div className="screen-bottom"><span>156.800 MHz</span><Signal size={13}/></div></div><div className="radio-controls"><span className="control-knob">PWR</span><span className="control-knob">VOL</span><span className="control-knob">SQL</span></div></div>
            <div className="device-buttons"><span>16 / 9</span><span>SCAN</span><span>MENU</span><span className="distress-mini">DISTRESS</span></div>
            <div className="instrument-foot"><span><i className="green-dot"/> ENCENDIDA</span><span>CH 16</span></div><span className="expand-hint"><Expand size={14}/></span>
          </button>

          <div className="instrument radar-card" role="button" tabIndex={0} onClick={() => setActive('radar')} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive('radar') } }} aria-label="Abrir radar">
            <div className="radar-header"><span><span className="radar-led"/> RADAR</span><RadarRangeSelector compact rangeNm={radarRange} onChange={changeRadarRange}/></div><div className="radar-preview"><Radar compact targets={contacts} rangeNm={radarRange}/></div><div className="radar-foot"><span><i className="green-dot"/> {contacts.length} CONTACTOS</span><span>HEAD UP</span><span>SEA AUTO</span></div><span className="expand-hint"><Expand size={14}/></span>
          </div>



          <button className="instrument ais-card" onClick={() => setActive('ais')} aria-label="Abrir AIS">
            <div className="module-header"><span className="module-icon"><Map size={17}/></span><span>AIS <small>AUTOMATIC IDENTIFICATION</small></span><span className="module-state">ACTIVE</span></div>
            <div className="ais-map"><div className="map-grid"/><div className="ownship"><span/><i/></div><div className="target t1"><span/><b>PELAGIA</b><small>1.2 NM · 315°</small></div><div className="target t2"><span/><b>ISLA SUR</b><small>2.8 NM · 082°</small></div><div className="range-circle r1"/><div className="range-circle r2"/></div>
            <div className="module-footer"><span><i className="green-dot"/> 2 OBJETIVOS</span><span>CPA MÁS CERCANO <b>0.8 NM</b></span></div><span className="expand-hint"><Expand size={14}/></span>
          </button>

          <button className="instrument safety-card" onClick={() => setActive('safety')} aria-label="Abrir equipos de seguridad">
            <div className="module-header"><span className="module-icon amber"><LifeBuoy size={17}/></span><span>SEGURIDAD <small>SAFETY EQUIPMENT</small></span><span className="module-state muted">STANDBY</span></div>
            <div className="safety-units"><div className="safety-unit"><div className="epirb-icon"><span>EPIRB</span><i/></div><span>EPIRB <small>406 MHz</small></span><b><i className="green-dot"/> LISTO</b></div><div className="safety-divider"/><div className="safety-unit"><div className="sart-icon"><span>SART</span><i/></div><span>SART <small>X-BAND</small></span><b><i className="green-dot"/> LISTO</b></div></div>
            <div className="module-footer"><span>ÚLTIMA COMPROBACIÓN</span><b>HOY · 09:42 UTC</b></div><span className="expand-hint"><Expand size={14}/></span>
          </button>
          <div className="instrument nautix-instrument" role="button" tabIndex={0} onClick={() => setActive('nautix')} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive('nautix') } }} aria-label="Abrir Nautix HUD">
            <NautixHud mapId={scenario.mapId} vessel={ownShip} vessels={scenario.vessels}/><span className="expand-hint"><Expand size={14}/></span>
          </div>
        </div>
        <div className="console-bottom"><span><span className="console-light"/> DC POWER 13.8 V</span><span>BRIDGE CONSOLE <b>NL—01</b></span><span>SIMULADOR VHF / DSC <b>v0.1</b></span></div>
      </div>
      <footer className="desk-footer"><span><Headphones size={15}/> ¿Necesitas ayuda? <button>Guía de instrumentos</button></span><span>ESCENARIO <b>COSTA DE MÁLAGA</b><i className="footer-separator"/> SESIÓN <b>{sessionCode}</b><i className="footer-separator"/> PARTICIPANTES <b>{participantCount} / 08</b></span></footer>
    </section>

    <div className={`instrument-overlay ${active ? 'is-open' : ''}`} aria-hidden={!active}>
      <div className="overlay-scrim" onClick={() => setActive(null)}/>
      <section className="instrument-stage" role="dialog" aria-modal="true" aria-label={active ? names[active] : undefined}>
        <div className="stage-toolbar"><div><span className="stage-dot"/> MAR AZUL <span className="slash">/</span> {active ? names[active] : ''}</div><button onClick={() => setActive(null)} aria-label="Volver al Cockpit Desk" className="close-button"><X size={19}/><span>CERRAR</span></button></div>
        <div className="stage-content">
          <div className={`instrument-view ${active === 'vhf' ? 'shown' : ''}`}><VhfRadio vessel={ownShip} messages={radioMessages} onTransmit={transmitRadio}/></div>
          <div className={`instrument-view ${active === 'radar' ? 'shown' : ''}`}><div className="expanded-radar"><div className="expanded-title"><div><span className="eyebrow">NORTHLINE MARINE</span><h2>Radar de navegación</h2></div><div className="radar-title-controls"><span className="tx-indicator"><i/> TRANSMITIENDO</span><RadarRangeSelector rangeNm={radarRange} onChange={changeRadarRange}/></div></div><div className="student-radar-layout"><Radar targets={contacts} rangeNm={radarRange}/><div className="radar-contacts-panel"><span className="eyebrow">CONTACTOS EN ALCANCE · {formatRadarRange(radarRange)} NM</span>{contacts.map(contact => <div className="radar-contact-row" key={contact.name}><span className="green-dot"/><b>{contact.name}</b><span>{contact.rangeNm.toFixed(1)} NM</span><span>{contact.relativeBearing.toFixed(0)}° REL</span></div>)}</div><NavigationControls vessel={ownShip} disabled={ownShip.controller === 'instructor'} onChange={updateOwnShip}/></div></div></div>
          <div className={`instrument-view ${active === 'nautix' ? 'shown' : ''}`}><NautixHud expanded mapId={scenario.mapId} vessel={ownShip} vessels={scenario.vessels}/></div>
          <div className={`instrument-view ${active === 'ais' ? 'shown' : ''}`}><div className="placeholder-panel"><Map size={30}/><span className="eyebrow">SISTEMA AIS</span><h2>Identificación automática</h2><p>Seguimiento de embarcaciones dentro del escenario compartido.</p><div className="placeholder-row"><span>PELAGIA</span><b>MMSI 224 018 221</b><span>1.2 NM · 315°</span></div><div className="placeholder-row"><span>ISLA SUR</span><b>MMSI 224 018 309</b><span>2.8 NM · 082°</span></div></div></div>
          <div className={`instrument-view ${active === 'safety' ? 'shown' : ''}`}><div className="placeholder-panel"><LifeBuoy size={30}/><span className="eyebrow">EQUIPOS DE EMERGENCIA</span><h2>Seguridad a bordo</h2><p>Equipos disponibles en esta embarcación.</p><div className="placeholder-row"><span>EPIRB</span><b>406 MHz · REGISTRADA</b><span>EN ESPERA</span></div><div className="placeholder-row"><span>SART</span><b>9 GHz X-BAND</b><span>EN ESPERA</span></div></div></div>
        </div>
      </section>
    </div>
  </main>
}
