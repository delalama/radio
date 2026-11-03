export interface ChartPoint { latitude: number; longitude: number }
export interface ChartLabel extends ChartPoint { text: string; kind?: 'place' | 'water' | 'feature'; dx?: number; dy?: number }
export interface ChartAid extends ChartPoint { name: string; kind: 'lighthouse' | 'buoy' | 'port' }
export interface ChartSounding extends ChartPoint { depth: number }

export interface ChartScene {
  northCoast: ChartPoint[]
  southCoast?: ChartPoint[]
  labels: ChartLabel[]
  aids: ChartAid[]
  soundings: ChartSounding[]
  isobaths: Array<{ depth: number; points: ChartPoint[] }>
}

export const chartScenes: Record<string, ChartScene> = {
  strait: {
    northCoast: [
      { latitude: 36.49, longitude: -6.55 }, { latitude: 36.43, longitude: -6.37 },
      { latitude: 36.34, longitude: -6.21 }, { latitude: 36.24, longitude: -6.11 },
      { latitude: 36.18, longitude: -6.04 }, { latitude: 36.20, longitude: -5.94 },
      { latitude: 36.14, longitude: -5.83 }, { latitude: 36.08, longitude: -5.73 },
      { latitude: 36.04, longitude: -5.65 }, { latitude: 36.01, longitude: -5.61 },
      { latitude: 36.04, longitude: -5.56 }, { latitude: 36.09, longitude: -5.49 },
      { latitude: 36.12, longitude: -5.45 }, { latitude: 36.13, longitude: -5.42 },
      { latitude: 36.17, longitude: -5.41 }, { latitude: 36.19, longitude: -5.39 },
      { latitude: 36.18, longitude: -5.36 }, { latitude: 36.14, longitude: -5.34 },
      { latitude: 36.17, longitude: -5.28 }, { latitude: 36.23, longitude: -5.14 },
      { latitude: 36.32, longitude: -4.96 }, { latitude: 36.43, longitude: -4.78 },
    ],
    southCoast: [
      { latitude: 35.58, longitude: -6.55 }, { latitude: 35.66, longitude: -6.34 },
      { latitude: 35.72, longitude: -6.18 }, { latitude: 35.76, longitude: -6.03 },
      { latitude: 35.78, longitude: -5.92 }, { latitude: 35.79, longitude: -5.81 },
      { latitude: 35.82, longitude: -5.70 }, { latitude: 35.85, longitude: -5.60 },
      { latitude: 35.87, longitude: -5.49 }, { latitude: 35.89, longitude: -5.34 },
      { latitude: 35.91, longitude: -5.19 }, { latitude: 35.92, longitude: -4.78 },
    ],
    labels: [
      { latitude: 36.18, longitude: -6.04, text: 'CABO TRAFALGAR', kind: 'feature', dx: -12, dy: -11 },
      { latitude: 36.20, longitude: -5.94, text: 'BARBATE', kind: 'place', dx: 3, dy: -8 },
      { latitude: 36.01, longitude: -5.61, text: 'TARIFA', kind: 'place', dx: -22, dy: -9 },
      { latitude: 36.13, longitude: -5.45, text: 'ALGECIRAS', kind: 'place', dx: -44, dy: -11 },
      { latitude: 36.14, longitude: -5.34, text: 'GIBRALTAR', kind: 'place', dx: 7, dy: -7 },
      { latitude: 36.18, longitude: -5.31, text: 'PUNTA EUROPA', kind: 'feature', dx: 8, dy: -12 },
      { latitude: 35.89, longitude: -5.34, text: 'CEUTA', kind: 'place', dx: 7, dy: 12 },
      { latitude: 35.79, longitude: -5.81, text: 'TÁNGER', kind: 'place', dx: -10, dy: 14 },
      { latitude: 36.16, longitude: -6.34, text: 'OCÉANO ATLÁNTICO', kind: 'water' },
      { latitude: 36.32, longitude: -5.05, text: 'MAR MEDITERRÁNEO', kind: 'water' },
      { latitude: 35.98, longitude: -5.79, text: 'ESQUEMA DE SEPARACIÓN DE TRÁFICO', kind: 'feature', dy: 10 },
    ],
    aids: [
      { latitude: 36.18, longitude: -6.04, name: 'Faro de Trafalgar', kind: 'lighthouse' },
      { latitude: 36.01, longitude: -5.61, name: 'Faro de Tarifa', kind: 'lighthouse' },
      { latitude: 36.18, longitude: -5.31, name: 'Punta Europa', kind: 'lighthouse' },
      { latitude: 35.89, longitude: -5.34, name: 'Ceuta', kind: 'port' },
      { latitude: 36.105, longitude: -5.55, name: 'Boya lateral', kind: 'buoy' },
      { latitude: 35.93, longitude: -5.55, name: 'Boya lateral', kind: 'buoy' },
    ],
    soundings: [
      { latitude: 36.08, longitude: -6.28, depth: 42 }, { latitude: 36.01, longitude: -6.06, depth: 76 },
      { latitude: 35.97, longitude: -5.87, depth: 118 }, { latitude: 35.95, longitude: -5.67, depth: 186 },
      { latitude: 35.95, longitude: -5.48, depth: 264 }, { latitude: 36.00, longitude: -5.29, depth: 338 },
      { latitude: 36.08, longitude: -5.08, depth: 492 }, { latitude: 35.84, longitude: -6.20, depth: 31 },
      { latitude: 36.28, longitude: -5.83, depth: 54 }, { latitude: 35.82, longitude: -5.77, depth: 67 },
    ],
    isobaths: [
      { depth: 50, points: [{ latitude: 36.07, longitude: -6.48 }, { latitude: 36.05, longitude: -6.20 }, { latitude: 35.96, longitude: -5.95 }, { latitude: 35.93, longitude: -5.69 }, { latitude: 35.91, longitude: -5.42 }, { latitude: 35.97, longitude: -5.12 }] },
      { depth: 100, points: [{ latitude: 35.92, longitude: -6.45 }, { latitude: 35.90, longitude: -6.13 }, { latitude: 35.88, longitude: -5.88 }, { latitude: 35.88, longitude: -5.62 }, { latitude: 35.91, longitude: -5.35 }, { latitude: 36.00, longitude: -5.08 }] },
      { depth: 200, points: [{ latitude: 35.78, longitude: -6.39 }, { latitude: 35.80, longitude: -6.12 }, { latitude: 35.82, longitude: -5.85 }, { latitude: 35.83, longitude: -5.60 }, { latitude: 35.86, longitude: -5.34 }, { latitude: 35.95, longitude: -5.02 }] },
    ],
  },
  ceuta: {
    northCoast: [
      { latitude: 36.43, longitude: -5.95 }, { latitude: 36.31, longitude: -5.78 },
      { latitude: 36.20, longitude: -5.61 }, { latitude: 36.10, longitude: -5.49 },
      { latitude: 36.12, longitude: -5.44 }, { latitude: 36.14, longitude: -5.38 },
      { latitude: 36.18, longitude: -5.34 }, { latitude: 36.17, longitude: -5.28 },
      { latitude: 36.27, longitude: -5.10 }, { latitude: 36.43, longitude: -4.95 },
    ],
    southCoast: [
      { latitude: 35.68, longitude: -5.95 }, { latitude: 35.73, longitude: -5.79 },
      { latitude: 35.78, longitude: -5.62 }, { latitude: 35.84, longitude: -5.48 },
      { latitude: 35.89, longitude: -5.34 }, { latitude: 35.91, longitude: -5.16 },
      { latitude: 35.92, longitude: -4.95 },
    ],
    labels: [
      { latitude: 36.13, longitude: -5.44, text: 'BAHÍA DE ALGECIRAS', kind: 'feature', dx: -34, dy: 10 },
      { latitude: 36.15, longitude: -5.34, text: 'GIBRALTAR', kind: 'place', dx: 7, dy: -6 },
      { latitude: 35.89, longitude: -5.34, text: 'CEUTA', kind: 'place', dx: 8, dy: 12 },
      { latitude: 35.79, longitude: -5.81, text: 'TÁNGER', kind: 'place', dx: -9, dy: 13 },
      { latitude: 36.28, longitude: -5.11, text: 'COSTA DEL SOL', kind: 'feature', dx: 8, dy: -8 },
      { latitude: 36.04, longitude: -5.7, text: 'ESTRECHO DE GIBRALTAR', kind: 'water' },
      { latitude: 35.79, longitude: -5.18, text: 'MAR DE ALBORÁN', kind: 'water' },
    ],
    aids: [
      { latitude: 36.15, longitude: -5.34, name: 'Punta Europa', kind: 'lighthouse' },
      { latitude: 35.89, longitude: -5.34, name: 'Puerto de Ceuta', kind: 'port' },
      { latitude: 36.12, longitude: -5.44, name: 'Puerto de Algeciras', kind: 'port' },
      { latitude: 35.99, longitude: -5.43, name: 'Boya de recalada', kind: 'buoy' },
    ],
    soundings: [
      { latitude: 36.06, longitude: -5.72, depth: 45 }, { latitude: 36.03, longitude: -5.57, depth: 86 },
      { latitude: 36.02, longitude: -5.43, depth: 142 }, { latitude: 36.04, longitude: -5.24, depth: 230 },
      { latitude: 35.97, longitude: -5.68, depth: 72 }, { latitude: 35.94, longitude: -5.49, depth: 118 },
      { latitude: 35.92, longitude: -5.16, depth: 310 },
    ],
    isobaths: [
      { depth: 50, points: [{ latitude: 36.06, longitude: -5.88 }, { latitude: 36.03, longitude: -5.68 }, { latitude: 35.99, longitude: -5.48 }, { latitude: 36.01, longitude: -5.26 }, { latitude: 36.08, longitude: -5.04 }] },
      { depth: 100, points: [{ latitude: 35.96, longitude: -5.89 }, { latitude: 35.94, longitude: -5.68 }, { latitude: 35.93, longitude: -5.48 }, { latitude: 35.96, longitude: -5.26 }, { latitude: 36.04, longitude: -5.04 }] },
      { depth: 200, points: [{ latitude: 35.84, longitude: -5.84 }, { latitude: 35.84, longitude: -5.64 }, { latitude: 35.84, longitude: -5.44 }, { latitude: 35.87, longitude: -5.23 }, { latitude: 35.97, longitude: -5.04 }] },
    ],
  },
  trafalgar: {
    northCoast: [
      { latitude: 36.55, longitude: -6.70 }, { latitude: 36.50, longitude: -6.47 },
      { latitude: 36.45, longitude: -6.27 }, { latitude: 36.39, longitude: -6.13 },
      { latitude: 36.31, longitude: -6.11 }, { latitude: 36.24, longitude: -6.10 },
      { latitude: 36.18, longitude: -6.04 }, { latitude: 36.20, longitude: -5.94 },
      { latitude: 36.14, longitude: -5.83 }, { latitude: 36.08, longitude: -5.73 },
      { latitude: 36.00, longitude: -5.60 }, { latitude: 36.05, longitude: -5.45 },
      { latitude: 36.15, longitude: -5.45 }, { latitude: 36.27, longitude: -5.45 },
      { latitude: 36.42, longitude: -5.45 }, { latitude: 36.55, longitude: -5.45 },
    ],
    southCoast: [
      { latitude: 35.72, longitude: -6.70 }, { latitude: 35.73, longitude: -6.45 },
      { latitude: 35.75, longitude: -6.22 }, { latitude: 35.77, longitude: -6.02 },
      { latitude: 35.79, longitude: -5.81 }, { latitude: 35.82, longitude: -5.62 },
      { latitude: 35.86, longitude: -5.45 },
    ],
    labels: [
      { latitude: 36.18, longitude: -6.04, text: 'CABO TRAFALGAR', kind: 'feature', dy: -10 },
      { latitude: 36.20, longitude: -5.94, text: 'BARBATE', kind: 'place', dx: 4, dy: -8 },
      { latitude: 36.49, longitude: -6.29, text: 'CÁDIZ', kind: 'place', dx: 5, dy: -8 },
      { latitude: 36.04, longitude: -5.61, text: 'TARIFA', kind: 'place', dx: -22, dy: -8 },
      { latitude: 36.32, longitude: -6.36, text: 'GOLFO DE CÁDIZ', kind: 'water' },
      { latitude: 35.97, longitude: -6.33, text: 'ATLÁNTICO', kind: 'water' },
    ],
    aids: [
      { latitude: 36.18, longitude: -6.04, name: 'Faro de Trafalgar', kind: 'lighthouse' },
      { latitude: 36.49, longitude: -6.29, name: 'Puerto de Cádiz', kind: 'port' },
      { latitude: 36.20, longitude: -5.94, name: 'Puerto de Barbate', kind: 'port' },
      { latitude: 36.07, longitude: -6.13, name: 'Boya de recalada', kind: 'buoy' },
    ],
    soundings: [
      { latitude: 36.06, longitude: -6.45, depth: 38 }, { latitude: 36.12, longitude: -6.25, depth: 62 },
      { latitude: 36.03, longitude: -6.05, depth: 84 }, { latitude: 35.98, longitude: -5.83, depth: 128 },
      { latitude: 36.26, longitude: -6.04, depth: 24 }, { latitude: 35.88, longitude: -6.35, depth: 47 },
    ],
    isobaths: [
      { depth: 20, points: [{ latitude: 36.30, longitude: -6.59 }, { latitude: 36.27, longitude: -6.34 }, { latitude: 36.22, longitude: -6.12 }, { latitude: 36.13, longitude: -5.89 }, { latitude: 36.06, longitude: -5.65 }] },
      { depth: 50, points: [{ latitude: 36.15, longitude: -6.60 }, { latitude: 36.13, longitude: -6.37 }, { latitude: 36.10, longitude: -6.14 }, { latitude: 36.02, longitude: -5.91 }, { latitude: 35.96, longitude: -5.67 }] },
      { depth: 100, points: [{ latitude: 35.98, longitude: -6.60 }, { latitude: 35.99, longitude: -6.35 }, { latitude: 35.98, longitude: -6.11 }, { latitude: 35.91, longitude: -5.88 }, { latitude: 35.88, longitude: -5.64 }] },
    ],
  },
  malaga: {
    northCoast: [
      { latitude: 37.02, longitude: -5.05 }, { latitude: 36.91, longitude: -4.88 },
      { latitude: 36.83, longitude: -4.70 }, { latitude: 36.77, longitude: -4.54 },
      { latitude: 36.72, longitude: -4.42 }, { latitude: 36.70, longitude: -4.25 },
      { latitude: 36.73, longitude: -4.08 }, { latitude: 36.82, longitude: -3.88 },
      { latitude: 36.94, longitude: -3.65 },
    ],
    labels: [
      { latitude: 36.72, longitude: -4.42, text: 'MÁLAGA', kind: 'place', dx: 8, dy: -8 },
      { latitude: 36.77, longitude: -4.54, text: 'TORREMOLINOS', kind: 'place', dx: -52, dy: -9 },
      { latitude: 36.69, longitude: -4.25, text: 'RINCÓN DE LA VICTORIA', kind: 'place', dx: 7, dy: -8 },
      { latitude: 36.52, longitude: -4.63, text: 'MAR DE ALBORÁN', kind: 'water' },
    ],
    aids: [
      { latitude: 36.72, longitude: -4.42, name: 'Puerto de Málaga', kind: 'port' },
      { latitude: 36.51, longitude: -4.63, name: 'Faro de Calaburras', kind: 'lighthouse' },
      { latitude: 36.70, longitude: -4.27, name: 'Boya de recalada', kind: 'buoy' },
    ],
    soundings: [
      { latitude: 36.62, longitude: -4.80, depth: 45 }, { latitude: 36.59, longitude: -4.56, depth: 82 },
      { latitude: 36.57, longitude: -4.31, depth: 136 }, { latitude: 36.55, longitude: -4.04, depth: 224 },
      { latitude: 36.48, longitude: -4.39, depth: 310 },
    ],
    isobaths: [
      { depth: 20, points: [{ latitude: 36.69, longitude: -4.99 }, { latitude: 36.67, longitude: -4.75 }, { latitude: 36.64, longitude: -4.52 }, { latitude: 36.62, longitude: -4.28 }, { latitude: 36.65, longitude: -4.01 }] },
      { depth: 50, points: [{ latitude: 36.58, longitude: -5.00 }, { latitude: 36.56, longitude: -4.75 }, { latitude: 36.53, longitude: -4.51 }, { latitude: 36.52, longitude: -4.27 }, { latitude: 36.55, longitude: -4.01 }] },
      { depth: 100, points: [{ latitude: 36.45, longitude: -4.98 }, { latitude: 36.44, longitude: -4.74 }, { latitude: 36.42, longitude: -4.5 }, { latitude: 36.41, longitude: -4.26 }, { latitude: 36.43, longitude: -4.01 }] },
    ],
  },
}
