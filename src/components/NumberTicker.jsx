import { useEffect, useRef, useState } from 'react'

export default function StatCounter({ value, suffix = '', duration = 1800 }) {
  const isInt = Number.isInteger(value)
  const [display, setDisplay] = useState(isInt ? 0 : value)
  const ref = useRef()
  const fired = useRef(false)

  useEffect(() => {
    if (!isInt) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true
          const start = performance.now()
          const tick = (now) => {
            const elapsed  = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased    = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.floor(eased * value))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration, isInt])

  return (
    <span ref={ref}>
      {isInt ? display : value}{suffix}
    </span>
  )
}
