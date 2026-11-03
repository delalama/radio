import { useCallback, useEffect, useState } from 'react'

const radarScales = [0.25, 0.5, 0.75, 1.5, 3, 6, 12, 24, 48]

export function formatRadarRange(rangeNm: number) {
  return Number.isInteger(rangeNm) ? String(rangeNm) : String(rangeNm).replace('.', ',')
}

export function useRadarRange(sessionCode: string, vesselId: string) {
  const storageKey = `northline-radar-range-${sessionCode.toUpperCase()}-${vesselId}`
  const [rangeNm, setRangeNm] = useState(3)
  const [loadedKey, setLoadedKey] = useState('')

  useEffect(() => {
    const saved = Number(localStorage.getItem(storageKey))
    setRangeNm(radarScales.includes(saved) ? saved : 3)
    setLoadedKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (loadedKey === storageKey) localStorage.setItem(storageKey, String(rangeNm))
  }, [loadedKey, rangeNm, storageKey])

  const changeRange = useCallback((direction: -1 | 1) => {
    setRangeNm(current => {
      const index = radarScales.indexOf(current)
      return radarScales[Math.max(0, Math.min(radarScales.length - 1, index + direction))]
    })
  }, [])

  return [rangeNm, changeRange] as const
}
