import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  Clock,
  Eye,
  Film,
  Grid2x2,
  Grid3x3,
  LayoutList,
  Play,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ShowcaseCourse {
  badge?: string
  title: string
  description: string
  author: {
    name: string
    title: string
    avatar: string
  }
  image: string
  lessons: number
  videos: number
  duration: string
  audience: string[]
  gradient: string
  price: number
  originalPrice?: number
  coursesInPackage: { id: string; title: string; duration: number }[]
  cta: {
    text: string
    url: string
  }
  isPurchased?: boolean
  onPreview?: () => void
  onBuy?: () => void
}

interface CourseShowcaseProps {
  courses: ShowcaseCourse[]
  className?: string
}

type LayoutMode = 'large' | 'grid' | 'list'

function formatPrice(price: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
  }).format(price)
}

function CourseCardActions({ course }: { course: ShowcaseCourse }) {
  if (course.isPurchased) {
    return (
      <Button size="sm" className="h-9 gap-1.5 rounded-lg px-4 text-xs" asChild>
        <Link to={course.cta.url}>
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          Pokracovat
        </Link>
      </Button>
    )
  }
  if (course.onBuy) {
    return (
      <Button
        size="sm"
        className="h-9 gap-1.5 rounded-lg px-4 text-xs"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          course.onBuy?.()
        }}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Koupit
      </Button>
    )
  }
  return (
    <Button size="sm" className="h-9 gap-1.5 rounded-lg px-4 text-xs" asChild>
      <Link to={course.cta.url}>{course.cta.text}</Link>
    </Button>
  )
}

function CourseGridCard({ course }: { course: ShowcaseCourse }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(course.cta.url)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(course.cta.url) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg cursor-pointer"
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          {course.badge && (
            <Badge className="border-0 bg-white/15 text-white backdrop-blur-md">
              {course.badge}
            </Badge>
          )}
          {course.isPurchased && (
            <Badge className="border-0 bg-emerald-500/90 text-white">
              Zakoupeno
            </Badge>
          )}
        </div>

        <AnimatePresence>
          {hovered && !course.isPurchased && course.onPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-2 rounded-full bg-white/95 text-black shadow-xl hover:bg-white relative z-10"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    course.onPreview?.()
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Nahled obsahu
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Film className="h-3 w-3" />
                {course.videos}
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Clock className="h-3 w-3" />
                {course.duration}
              </div>
            </div>
            {!course.isPurchased && course.price > 0 && (
              <span className="text-lg font-bold text-white">
                {formatPrice(course.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-3 w-3 fill-amber-400 text-amber-400"
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">5.0</span>
        </div>

        <h3 className="mb-1 text-lg font-bold leading-tight group-hover:underline">{course.title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
          {course.onPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-lg px-3 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                course.onPreview?.()
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Nahled
            </Button>
          )}
          <div className="flex-1" />
          <CourseCardActions course={course} />
        </div>
      </div>
    </div>
  )
}

function CourseLargeCard({ course }: { course: ShowcaseCourse }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(course.cta.url)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(course.cta.url) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer"
    >
      <div className="relative aspect-[2/1] shrink-0 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute left-5 top-5 flex items-center gap-2">
          {course.badge && (
            <Badge className="border-0 bg-white/15 px-3 py-1 text-sm text-white backdrop-blur-md">
              {course.badge}
            </Badge>
          )}
          {course.isPurchased && (
            <Badge className="border-0 bg-emerald-500/90 px-3 py-1 text-sm text-white">
              Zakoupeno
            </Badge>
          )}
        </div>

        <AnimatePresence>
          {hovered && !course.isPurchased && course.onPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-2 rounded-full bg-white/95 text-black shadow-xl hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    course.onPreview?.()
                  }}
                >
                  <Eye className="h-5 w-5" />
                  Nahled obsahu
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1 text-xs text-white/80">5.0</span>
          </div>
          <h3 className="text-2xl font-bold text-white leading-tight mb-2 group-hover:underline">{course.title}</h3>
          <p className="text-sm text-white/70 line-clamp-2 max-w-2xl">{course.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
            <Film className="h-3.5 w-3.5 text-muted-foreground" />
            {course.videos} videi
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            {course.lessons} lekci
          </div>
          {!course.isPurchased && course.price > 0 && (
            <div className="flex items-center gap-2">
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(course.originalPrice)}
                </span>
              )}
              <span className="text-lg font-bold">{formatPrice(course.price)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {course.onPreview && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-lg px-4"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                course.onPreview?.()
              }}
            >
              <Eye className="h-4 w-4" />
              Nahled
            </Button>
          )}
          <CourseCardActions course={course} />
        </div>
      </div>
    </div>
  )
}

function CourseListCard({ course }: { course: ShowcaseCourse }) {
  const navigate = useNavigate()

  return (
    <div role="link" tabIndex={0} onClick={() => navigate(course.cta.url)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(course.cta.url) }} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md sm:flex-row cursor-pointer">
      <div className="relative w-full shrink-0 overflow-hidden sm:w-56 md:w-64">
        <div className="aspect-[16/10] sm:aspect-auto sm:h-full">
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 sm:bg-gradient-to-r" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {course.badge && (
            <Badge className="border-0 bg-white/15 text-xs text-white backdrop-blur-md">
              {course.badge}
            </Badge>
          )}
          {course.isPurchased && (
            <Badge className="border-0 bg-emerald-500/90 text-xs text-white">
              Zakoupeno
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="mb-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">5.0</span>
          </div>
          <h3 className="text-base font-bold leading-snug mb-1 group-hover:underline">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Film className="h-3 w-3" />
              {course.videos}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </span>
            {!course.isPurchased && course.price > 0 && (
              <span className="text-sm font-bold text-foreground">
                {formatPrice(course.price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {course.onPreview && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  course.onPreview?.()
                }}
              >
                <Eye className="h-3 w-3" />
                Nahled
              </Button>
            )}
            <CourseCardActions course={course} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RenderCourseCard({ course, layout }: { course: ShowcaseCourse; layout: LayoutMode }) {
  switch (layout) {
    case 'large':
      return <CourseLargeCard course={course} />
    case 'list':
      return <CourseListCard course={course} />
    default:
      return <CourseGridCard course={course} />
  }
}

const LAYOUT_OPTIONS: { value: LayoutMode; icon: typeof Grid2x2; label: string }[] = [
  { value: 'large', icon: Grid2x2, label: 'Velke karty' },
  { value: 'grid', icon: Grid3x3, label: 'Mrizka' },
  { value: 'list', icon: LayoutList, label: 'Seznam' },
]

const INITIAL_VISIBLE = 3

const CourseShowcase = ({ className, courses }: CourseShowcaseProps) => {
  const [expanded, setExpanded] = useState(false)
  const [layout, setLayout] = useState<LayoutMode>('grid')
  const hasMore = courses.length > INITIAL_VISIBLE

  const gridClass = {
    large: 'grid-cols-1 md:grid-cols-2',
    grid: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    list: 'grid-cols-1',
  }[layout]

  const gapClass = layout === 'list' ? 'gap-3' : 'gap-6'

  const handleToggle = useCallback(() => {
    setExpanded(v => !v)
  }, [])

  return (
    <section className={cn('py-4', className)} style={{ overflowAnchor: 'none' }}>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 gap-1.5 text-xs uppercase">
            <BookOpen className="h-3 w-3" />
            Katalog balicku
          </Badge>
          <h2 className="text-3xl font-bold">
            Vyberte si balicek
          </h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Kazdy balicek obsahuje sadu videi. Zakupte jednorazove a ziskejte pristup ke vsem videim.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            <Film className="h-4 w-4 text-primary" />
            {courses.reduce((sum, c) => sum + c.videos, 0)} videi
          </span>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {LAYOUT_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setLayout(option.value)}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    layout === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={option.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={layout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <motion.div
            className={cn('grid', gapClass, gridClass)}
            layout
            transition={{ layout: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }}
          >
            {courses.slice(0, INITIAL_VISIBLE).map((course, idx) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: 'easeOut' }}
                layout
                className="h-full"
              >
                <RenderCourseCard course={course} layout={layout} />
              </motion.div>
            ))}
            <AnimatePresence initial={false}>
              {expanded && courses.slice(INITIAL_VISIBLE).map((course, idx) => (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  layout
                  className="h-full"
                >
                  <RenderCourseCard course={course} layout={layout} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleToggle}
            className="gap-2"
          >
            {expanded ? 'Zobrazit mene' : `Zobrazit vse (${courses.length - INITIAL_VISIBLE} dalsich)`}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </Button>
        </div>
      )}
    </section>
  )
}

export { CourseShowcase }
