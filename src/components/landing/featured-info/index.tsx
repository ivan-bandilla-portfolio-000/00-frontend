import { useEffect, useRef, useState, lazy, Suspense } from 'react'
// import BentoGrid1 from '@/components/mvpblocks/bento-grid-1'
import BentoGrid2 from '@/components/mvpblocks/bento-grid-2'
import items from "./info"
import { SectionWrapper } from '@/hoc'
import WrapButton from '@/components/ui/wrap-button'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
const Threads = lazy(() => import('@/components/blocks/backgrounds/Threads/Threads'))

const background = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [showThreads, setShowThreads] = useState(false)
  const [perfOK, setPerfOK] = useState<boolean | null>(null)

  // Cheap static capability / hint based heuristic (runs once per render)
  const shouldAllowThreads = (() => {
    if (typeof window === 'undefined') return false

    // 1. User & accessibility preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

    // 2. Mobile / narrow layout (hide effect on small devices)
    const MIN_WIDTH = 640 // Tailwind sm breakpoint; tweak if you like
    const uaDataMobile = (navigator as any).userAgentData?.mobile
    const coarsePointer = window.matchMedia('(pointer:coarse)').matches
    const narrowViewport = window.innerWidth < MIN_WIDTH
    const isMaybeMobile = uaDataMobile || (coarsePointer && narrowViewport)
    if (isMaybeMobile) return false

    // 3. Hardware / network hints
    const nav: any = navigator
    const hc = navigator.hardwareConcurrency || 8
    const ram = nav.deviceMemory || 8 // deviceMemory only on Chromium; assume 8 if unknown
    const dpr = window.devicePixelRatio || 1
    const eff = nav?.connection?.effectiveType
    const saveData = nav?.connection?.saveData

    if (saveData) return false
    if (eff && ['slow-2g', '2g'].includes(eff)) return false
    if (hc <= 4) return false
    if (ram <= 8) return false
    // High DPR + few cores is costly
    if (dpr > 2 && hc <= 6) return false

    return true
  })()

  // Micro performance probe (optional)
  useEffect(() => {
    if (!shouldAllowThreads) {
      setPerfOK(false)
      return
    }
    let frames = 0
    let start = performance.now()
    let id = 0
    const sampleDuration = 500
    const loop = () => {
      frames++
      if (performance.now() - start < sampleDuration) {
        id = requestAnimationFrame(loop)
      } else {
        const fps = (frames * 1000) / (performance.now() - start)
        setPerfOK(fps > 45)
      }
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [shouldAllowThreads])

  useEffect(() => {
    if (!shouldAllowThreads) return
    if (!('IntersectionObserver' in window)) {
      setShowThreads(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowThreads(true)
          io.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [shouldAllowThreads])

  const enableThreads = showThreads && perfOK === true && shouldAllowThreads
  const reducedAmplitude = enableThreads && navigator.hardwareConcurrency <= 6

  return (
    <>
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Base gradient (light / dark) */}
        <div className="
          absolute inset-0
          bg-gradient-to-b
          from-orange-50 via-orange-100 to-white
          dark:from-[#1a1205] dark:via-[#261303] dark:to-[#0d0d0d]
        " />
        {/* Radial glow */}
        <div className="
          absolute left-1/2 top-0 -translate-x-1/2
          w-[120rem] aspect-[2/1]
          bg-[radial-gradient(circle_at_center,theme(colors.orange.400)/35%,transparent 70%)]
          dark:bg-[radial-gradient(circle_at_center,theme(colors.orange.500)/12%,transparent 65%)]
          blur-3xl
        " />
        {/* Subtle thread / pattern (reuse existing) */}
        <div className="absolute inset-0 opacity-40 dark:opacity-25">
          <Suspense fallback={null}>
            {enableThreads && (
              <Threads
                amplitude={reducedAmplitude ? 0.2 : 0.8}
                distance={0}
                enableMouseInteraction={false}
              />
            )}
          </Suspense>
        </div>
        {/* Faint grid (mask so it's very subtle) */}
        <div className="
          absolute inset-0 opacity-[0.07] dark:opacity-[0.09]
          [background-image:linear-gradient(to_right,rgba(0,0,0,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.6)_1px,transparent_1px)]
          [background-size:48px_48px]
          dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)]
        " />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background/80 to-transparent dark:from-neutral-950/80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/80 to-transparent dark:from-neutral-950/80" />
    </>


  )
}


const FeaturedInfo = () => {


  return (
    <>
      <div className='-mt-12'>
        <BentoGrid2 items={items} />
      </div>
      {/* <BentoGrid1 items={items} />
      <BentoGrid2 items={items} /> */}
      <div className='pointer-events-auto mt-4 mb-12'>
        <div className="w-full flex justify-center-safe gap-4">
          <Button asChild variant={'outline'} className='h-[64px] flex items-center p-[11px] hover:!bg-primary cursor-pointer px-6 rounded-full'>
            <a href="#projects">See My Work</a>
          </Button>
          <WrapButton className="mr-2 hover:mr-0 ease-in-out transition-all" href="/contact" arrowRotation="up">
            <Globe className="animate-spin " />
            Contact Me
          </WrapButton>
        </div>
      </div>

    </>
  )
}

export default SectionWrapper(
  FeaturedInfo,
  'featured-info',
  {
    className: `
    transition-will-change contain-paint
      relative isolate overflow-hidden
      /* Base vertical gradient (light/dark) */
      bg-gradient-to-b from-orange-50 via-orange-100 to-white
      dark:from-[#0b0b0b] dark:via-[#0d0906] dark:to-[#060606]
      /* Radial glow */
      before:content-[''] before:absolute before:inset-0 before:-z-10
      before:bg-[radial-gradient(circle_at_50%_30%,rgba(255,140,0,0.28),transparent_70%)]
      dark:before:bg-[radial-gradient(circle_at_50%_35%,rgba(255,120,0,0.12),transparent_70%)]
      /* Subtle grid */
      after:content-[''] after:absolute after:inset-0 after:-z-10
      after:opacity-[0.07] dark:after:opacity-[0.09]
      after:[background-image:linear-gradient(to_right,rgba(0,0,0,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.45)_1px,transparent_1px)]
      after:[background-size:46px_46px]
      dark:after:[background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)]
    `, background
  }
)