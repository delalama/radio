# Maritime Radio Simulator

Prototipo del Cockpit Desk para practicar comunicaciones maritimas ROCA.

## Comandos útiles durante el desarrollo

```bash
npm install
npm run dev
```

`npm run dev` inicia la web en `http://localhost:5173` y el servidor de sesiones WebSocket en el puerto `3001`.

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia la web y el servidor de sesiones juntos. |
| `npm run dev:free-ports` | Detiene los procesos que estén escuchando en los puertos predeterminados `5173` y `3001`. Úsalo si aparece `EADDRINUSE`; después vuelve a ejecutar `npm run dev`. |
| `npm run dev:web` | Inicia solo Vite. |
| `npm run dev:session` | Inicia solo el servidor de sesiones. |
| `npm run build` | Comprueba TypeScript y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la versión de producción. |

El comando `dev:free-ports` termina los procesos que ocupan esos puertos, así que guarda antes cualquier trabajo que dependa de ellos. En Windows usa PowerShell; en macOS/Linux usa `lsof`.

El instructor puede seleccionar una zona en la carta. Al cambiarla, toda la flota recibe posiciones nuevas, en un grupo compacto dentro del alcance radar inicial. Hay zonas para el Estrecho, Ceuta/Algeciras, Trafalgar/Cádiz y Málaga. La carta es vectorial y esquemática: incluye costas, sondas e indicaciones de navegación simuladas y no necesita conexión a internet. No es una carta oficial para navegar.

Cada puesto de barco, incluido el del instructor, incluye un HUD compacto estilo Garmin Nautix. Muestra una mini carta centrada en la embarcación, rumbo, velocidad y el contacto más cercano.

### Lanzar comandos desde VS Code

En la barra lateral **Explorer**, abre la vista **NPM Scripts**. Cada comando de `package.json` aparece allí con un botón ▶ para lanzarlo con el ratón. Si no ves esa vista, abre el menú `…` de Explorer y actívala en **NPM Scripts**. El proyecto deja configurada esa vista en `.vscode/settings.json`.

También puedes usar las tareas de `.vscode/tasks.json` desde **Terminal → Run Task…**. Para el uso habitual, ejecuta **Radio: Liberar puertos 5173 y 3001** si hace falta y luego **Radio: Iniciar desarrollo**.

Si necesitas usar otros puertos, configura `SESSION_PORT` para WebSocket y elige el puerto de Vite con `npm run dev -- --port <puerto>`.

## Probar los roles en dos pestanas

1. Inicia la aplicacion con `npm run dev`.
2. Abre `http://localhost:5173/?role=instructor&session=MALAGA7` en una pestana.
3. Copia el enlace del alumno desde el centro de control y abrelo en otra pestana. Tambien puedes usar `http://localhost:5173/?role=student&session=MALAGA7`.
4. En el instructor, elige un barco en "Gobierno de embarcaciones" y controla rumbo, marcha y velocidad. El servidor mueve los barcos y comparte sus posiciones en vivo.
5. Pulsa "Ampliar" para abrir el radar del instructor. En el alumno, abre el instrumento Radar para ver los contactos y controlar su propio barco si el instructor no ha tomado el mando.
6. En el Cockpit Desk, abre `CURSO ROCA` para acceder a las 12 unidades y su registro de ejercicios.

La sincronizacion de escenario usa WebSocket y un estado temporal en memoria. Para conectar otros equipos, abre el panel del instructor usando la direccion `Network` que imprime Vite y comparte el enlace de alumno que aparece ahi. Cada navegador de alumno obtiene su propia embarcacion. Para probar dos alumnos en el mismo navegador, usa `&participant=alumno2` en el segundo enlace. El movimiento y las posiciones son simulados; no se lee el GPS real del dispositivo.

### Radio simulada

El instructor dispone de una radio VHF propia desde el boton **RADIO VHF** del centro de control. Escribe un mensaje y pulsa **TRANSMITIR** (o prepara el texto y pulsa el PTT del equipo). Las estaciones de la sesion reciben el mensaje en el canal sintonizado y lo reproducen con la voz espanola del navegador si su radio esta encendida y tiene volumen. Cada radio conserva sus propios ajustes; el instructor no puede cambiar los de los alumnos. **PROBAR AUDIO** comprueba el altavoz del navegador. Esta funcion usa voz sintetizada y no captura microfono ni transmite por radio real.
