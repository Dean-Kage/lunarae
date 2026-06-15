import { useEffect, useRef } from 'react'

export default function SectionReveal({ children, delay = 0, style = {}, className = '' }) {
  const ref = useRef()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = delay
            ? setTimeout(() => el.classList.add('revealed'), delay)
            : (el.classList.add('revealed'), null)
          observer.unobserve(el)
          return () => timer && clearTimeout(timer)
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal-base ${className}`} style={style}>
      {children}
    </div>
  )
}
