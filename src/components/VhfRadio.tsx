import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Mic, Power, Volume2 } from 'lucide-react'
import type { RadioMessage, ScenarioVessel } from '../session'

const channels = [16, 6, 8, 9, 10, 13, 67, 72]
const menus = ['DUAL WATCH', 'SCAN', 'HI / LO POWER', 'DSC MENU', 'CHANNEL NAME', 'SETUP']

export function VhfRadio({ vessel, messages = [], onTransmit }: { vessel: ScenarioVessel; messages?: RadioMessage[]; onTransmit: (channel: number, text: string) => boolean }) {
  const [powered, setPowered] = useState(true)
  const [channelIndex, setChannelIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuIndex, setMenuIndex] = useState(0)
  const [volume, setVolume] = useState(56)
  const [squelch, setSquelch] = useState(38)
  const [highPower, setHighPower] = useState(true)
  const [transmitting, setTransmitting] = useState(false)
  const [draft, setDraft] = useState('')
  const [radioNotice, setRadioNotice] = useState('EN ESCUCHA')
  const heardMessages = useRef(new Set<string>())
  const channel = channels[channelIndex]
  const changeChannel = (delta: number) => setChannelIndex(index => (index + delta + channels.length) % channels.length)
  const transmitDraft = () => {
    const text = draft.trim()
    if (!text) { setRadioNotice('ESCRIBE UN MENSAJE PARA TRANSMITIR'); return }
    if (!powered) { setRadioNotice('RADIO APAGADA'); return }
    if (onTransmit(channel, text)) {
      setDraft('')
      setRadioNotice(`TX · CH ${String(channel).padStart(2, '0')} · ${vessel.name}`)
    } else setRadioNotice('SIN CONEXIÓN CON LA SESIÓN')
  }

  useEffect(() => {
    if (!messages.length) return
    for (const message of messages) {
      if (heardMessages.current.has(message.id)) continue
      heardMessages.current.add(message.id)
      if (message.vesselId === vessel.id || !powered || volume === 0 || message.channel !== channel || !('speechSynthesis' in window)) continue
      const utterance = new SpeechSynthesisUtterance(`${message.vesselName}: ${message.text}`)
      utterance.lang = 'es-ES'
      utterance.volume = Math.max(0.1, Math.min(1, volume / 100))
      utterance.rate = 0.88
      const spanishVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith('es'))
      if (spanishVoice) utterance.voice = spanishVoice
      window.speechSynthesis.speak(utterance)
      setRadioNotice(`RX · CH ${String(channel).padStart(2, '0')} · ${message.vesselName}`)
    }
    if (heardMessages.current.size > 200) heardMessages.current = new Set(messages.slice(-50).map(message => message.id))
  }, [messages, channel, powered, vessel.id, volume])

  const channelMessages = messages.filter(message => message.channel === channel).slice(-6)
  const testAudio = () => {
    if (!('speechSynthesis' in window)) { setRadioNotice('AUDIO NO DISPONIBLE EN ESTE NAVEGADOR'); return }
    const utterance = new SpeechSynthesisUtterance('Prueba de audio de radio. Estación lista para recibir.')
    utterance.lang = 'es-ES'
    utterance.volume = Math.max(0.1, volume / 100)
    window.speechSynthesis.speak(utterance)
    setRadioNotice('PRUEBA DE AUDIO')
  }

  return <div className="vhf-workspace">
    <div className="expanded-title"><div><span className="eyebrow">NORTHLINE MARINE · NVR—5400 · {vessel.name} · MMSI {vessel.mmsi}</span><h2>Radio VHF / DSC</h2></div><span className="tx-indicator"><i className={transmitting ? 'red' : ''}/>{transmitting ? 'TRANSMITIENDO' : 'STANDBY'}</span></div>
    <div className="vhf-layout">
      <div className={`vhf-hardware ${!powered ? 'power-off' : ''}`}>
        <div className="vhf-hardware-top"><div className="hardware-logo">NORTHLINE <small>MARINE ELECTRONICS</small></div><div className="hardware-lights"><i/><span>POWER</span></div><span className="hardware-model">NVR—5400</span></div>
        <div className="vhf-main-row">
          <div className="vhf-screen"><div className="lcd-top"><span>{powered ? 'INT' : '— —'}</span><span>USA</span><span>{highPower ? '25W' : '1W'}</span><span>▰ ▰ ▰</span></div><div className="lcd-channel">{powered ? String(channel).padStart(2, '0') : '--'}<small>CH</small></div><div className="lcd-name">{channel === 16 ? 'DISTRESS · SAFETY' : channel === 72 ? 'SHIP-TO-SHIP' : 'MARITIME MOBILE'}</div><div className="lcd-bottom"><span>156.{channel === 16 ? '800' : '400'} MHz</span><span>GPS <b>▴</b></span></div></div>
          <div className="vhf-knob-column"><button className="hardware-knob power-knob" onClick={() => setPowered(!powered)} title="Encendido"><Power size={15}/></button><label>PWR / VOL</label><input aria-label="Volumen" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} /><span>{volume}%</span><button className="hardware-knob" onClick={() => setSquelch(value => value >= 90 ? 10 : value + 10)} title="Ajustar squelch">SQL</button><label>SQUELCH</label><span>{squelch}%</span></div>
        </div>
        <div className="hardware-controls"><button className="soft-key" onClick={() => changeChannel(-1)}><ChevronLeft size={17}/> CH</button><button className="soft-key" onClick={() => setMenuOpen(!menuOpen)}>MENU</button><button className="soft-key" onClick={() => setHighPower(!highPower)}>{highPower ? 'HI / 25W' : 'LO / 1W'}</button><button className="soft-key" onClick={() => setChannelIndex(0)}>16 / 9</button><button className="soft-key" onClick={() => changeChannel(1)}>CH <ChevronRight size={17}/></button></div>
        <div className="vhf-bottom-row"><button className="distress-button" onClick={() => { setMenuOpen(true); setMenuIndex(3) }}><span/>DISTRESS<small>HOLD 3 SEC</small></button><button className={`ptt-button ${transmitting ? 'pressed' : ''}`} onPointerDown={event => { event.preventDefault(); setTransmitting(true); transmitDraft() }} onPointerUp={() => setTransmitting(false)} onPointerLeave={() => setTransmitting(false)} onKeyDown={event => { if (event.key === ' ' && !event.repeat) { setTransmitting(true); transmitDraft() } }} onKeyUp={() => setTransmitting(false)}><Mic size={17}/><span>PRESS TO TALK</span></button><div className="speaker-grille" aria-label="Altavoz"><span/></div></div>
        {menuOpen && <div className="radio-menu"><div className="menu-head">MAIN MENU <button onClick={() => setMenuOpen(false)}>×</button></div>{menus.map((item, index) => <button key={item} className={menuIndex === index ? 'selected' : ''} onClick={() => { setMenuIndex(index); if (index === 2) setHighPower(!highPower) }}><span>{item}</span>{menuIndex === index && <ChevronRight size={14}/>}</button>)}<div className="menu-hint">CH ▲▼ SELECT · MENU ENTER</div></div>}
      </div>
      <aside className="vhf-side-panel"><div className="side-section"><span className="eyebrow">CONTROLES</span><div className="range-control"><span><Volume2 size={15}/> Volumen</span><b>{volume}%</b><input aria-label="Volumen de radio" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))}/></div><div className="range-control"><span><Volume2 size={15}/> Squelch</span><b>{squelch}%</b><input aria-label="Squelch" type="range" min="0" max="100" value={squelch} onChange={event => setSquelch(Number(event.target.value))}/></div></div><div className="side-section channel-section"><span className="eyebrow">SELECCIÓN DE CANAL</span><div className="channel-selector"><button onClick={() => changeChannel(-1)}><ChevronDown size={17}/></button><div><b>{String(channel).padStart(2, '0')}</b><small>{channel === 16 ? 'SOCORRO · LLAMADA' : 'CANAL MARÍTIMO'}</small></div><button onClick={() => changeChannel(1)}><ChevronDown size={17}/></button></div><div className="channel-presets">{channels.slice(0, 6).map((preset, index) => <button key={preset} className={index === channelIndex ? 'active' : ''} onClick={() => setChannelIndex(index)}>{String(preset).padStart(2, '0')}</button>)}</div></div>
        <div className="side-section radio-transmit"><span className="eyebrow">MENSAJE SIMULADO · CH {channel}</span><textarea aria-label="Mensaje de radio para transmitir" maxLength={280} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Escribe el mensaje que se escuchará en las radios…"/><button className="radio-send-button" disabled={!draft.trim() || !powered} onClick={transmitDraft}><Mic size={14}/> TRANSMITIR</button><div className="radio-notice" aria-live="polite">{radioNotice}</div></div>
        <div className="side-section radio-traffic"><div className="radio-traffic-heading"><span className="eyebrow">TRÁFICO EN CH {channel}</span><button onClick={testAudio} title="Probar altavoz"><Volume2 size={14}/> PROBAR AUDIO</button></div>{channelMessages.length ? channelMessages.map(message => <div className="radio-message" key={message.id}><b>{message.vesselName}</b><small>{new Date(message.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · {message.text}</small></div>) : <p>Sin tráfico reciente en este canal.</p>}</div>
        <div className="side-section side-status"><span className="eyebrow">ESTADO DEL EQUIPO</span><div><i className={powered ? 'green-dot' : 'off-dot'}/>{powered ? 'Radio encendida' : 'Radio apagada'}</div><div><i className="green-dot"/>GPS conectado</div><div><i className="green-dot"/>DSC disponible</div><button className="dsc-menu-button" onClick={() => { setMenuOpen(true); setMenuIndex(3) }}>ABRIR MENÚ DSC <ChevronRight size={14}/></button></div><div className="radio-note"><span>i</span><div>Equipo de simulación. Los procedimientos DSC se incorporarán en una fase posterior.</div></div></aside>
    </div>
  </div>
}
