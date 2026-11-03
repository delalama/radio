import { execFileSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const ports = [5173, 3001]

function windowsListeners() {
  const command = [
    "$ports = @(5173, 3001)",
    '$pids = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique',
    'foreach ($processId in $pids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue; Write-Output $processId }',
  ].join('; ')
  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' })
  return output.split(/\s+/).map(Number).filter(pid => Number.isInteger(pid) && pid > 0)
}

function unixListeners() {
  const pids = new Set()
  for (const port of ports) {
    try {
      const output = execFileSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
      for (const value of output.split(/\s+/)) {
        const pid = Number(value)
        if (Number.isInteger(pid) && pid > 0) pids.add(pid)
      }
    } catch (error) {
      if (error.status !== 1 && error.code !== 'ENOENT') throw error
    }
  }
  return [...pids]
}

const pids = process.platform === 'win32' ? windowsListeners() : unixListeners()
if (!pids.length) {
  console.log(`No hay procesos escuchando en los puertos ${ports.join(' y ')}.`)
  process.exit(0)
}

if (process.platform !== 'win32') {
  for (const pid of pids) {
    try { process.kill(pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  await delay(800)
  for (const pid of pids) {
    try { process.kill(pid, 0); process.kill(pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
}

console.log(`Procesos detenidos en los puertos ${ports.join(' y ')}: ${pids.join(', ')}`)
