import { useRef, useEffect } from 'react'

const DotGrid = ({
    dotSize = 4,
    gap = 20,
    baseColor = '#271E37',
    activeColor = '#ffbb29',
    proximity = 100,
    shockRadius = 200,
    shockStrength = 5,
}) => {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const dotsRef = useRef([])
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const rafRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const container = containerRef.current

        let width = 0
        let height = 0
        const dpr = window.devicePixelRatio || 1

        const lerp = (a, b, t) => a + (b - a) * t

        const resize = () => {
            width = container.offsetWidth
            height = container.offsetHeight

            canvas.width = width * dpr
            canvas.height = height * dpr
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            initDots()
        }

        const initDots = () => {
            dotsRef.current = []
            const cols = Math.ceil(width / gap)
            const rows = Math.ceil(height / gap)

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const px = x * gap + gap / 2
                    const py = y * gap + gap / 2

                    dotsRef.current.push({
                        x: px,
                        y: py,
                        ox: px,
                        oy: py,
                        color: baseColor
                    })
                }
            }
        }

        const onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect()
            mouseRef.current.x = e.clientX - rect.left
            mouseRef.current.y = e.clientY - rect.top
        }

        const onMouseLeave = () => {
            mouseRef.current.x = -1000
            mouseRef.current.y = -1000
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            for (const dot of dotsRef.current) {
                const dx = mouseRef.current.x - dot.x
                const dy = mouseRef.current.y - dot.y
                const distSq = dx * dx + dy * dy

                let tx = dot.ox
                let ty = dot.oy
                let color = baseColor

                if (distSq < proximity * proximity) {
                    color = activeColor
                }

                if (distSq < shockRadius * shockRadius) {
                    const dist = Math.sqrt(distSq) || 1
                    const force = (shockRadius - dist) / shockRadius
                    tx -= (dx / dist) * force * shockStrength * 10
                    ty -= (dy / dist) * force * shockStrength * 10
                }

                dot.x = lerp(dot.x, tx, 0.1)
                dot.y = lerp(dot.y, ty, 0.1)
                dot.color = color

                ctx.fillStyle = dot.color
                ctx.beginPath()
                ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2)
                ctx.fill()
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        resize()
        animate()

        window.addEventListener('resize', resize)
        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('mouseleave', onMouseLeave)

        return () => {
            window.removeEventListener('resize', resize)
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mouseleave', onMouseLeave)
            cancelAnimationFrame(rafRef.current)
        }
    }, [gap, baseColor, activeColor, proximity, shockRadius, shockStrength, dotSize])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        >
            <canvas ref={canvasRef} />
        </div>
    )
}

export default DotGrid
