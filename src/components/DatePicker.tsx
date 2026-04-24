import { useMemo, useState } from 'react'
import { Icon } from './Icon'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  minDate?: string
  label?: string
  placeholder?: string
  ctaLabel?: string
  variant?: 'default' | 'inline'
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

function toIso(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(iso: string, amount: number) {
  const base = parseIso(iso)
  base.setDate(base.getDate() + amount)
  return toIso(base.getFullYear(), base.getMonth(), base.getDate())
}

function nextWeekdayIso(weekday: number) {
  const now = startOfDay(new Date())
  const delta = (weekday - now.getDay() + 7) % 7 || 7
  const next = new Date(now)
  next.setDate(now.getDate() + delta)
  return toIso(next.getFullYear(), next.getMonth(), next.getDate())
}

function formatCompactDate(iso: string) {
  if (!iso) return 'Escolher data'
  const date = parseIso(iso)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatLongDate(iso: string) {
  if (!iso) return 'Escolher data'
  const date = parseIso(iso)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function toMonthView(iso: string) {
  const date = parseIso(iso)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function DatePicker({
  value,
  onChange,
  minDate,
  label = 'Data do rolê',
  placeholder = 'Escolher data',
  ctaLabel = 'Abrir',
  variant = 'default',
}: DatePickerProps) {
  const todayIso = useMemo(() => {
    const today = new Date()
    return toIso(today.getFullYear(), today.getMonth(), today.getDate())
  }, [])

  const fallbackIso = value || minDate || todayIso
  const [{ year: viewYear, month: viewMonth }, setMonthView] = useState(() =>
    toMonthView(fallbackIso),
  )
  const [isOpen, setIsOpen] = useState(false)

  const minTs = useMemo(
    () => (minDate ? startOfDay(parseIso(minDate)).getTime() : -Infinity),
    [minDate],
  )

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const startDow = firstOfMonth.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()
    const output: Array<{ iso: string; day: number; muted: boolean }> = []

    for (let index = startDow - 1; index >= 0; index -= 1) {
      const day = daysInPrev - index
      const year = viewMonth === 0 ? viewYear - 1 : viewYear
      const month = viewMonth === 0 ? 11 : viewMonth - 1
      output.push({ iso: toIso(year, month, day), day, muted: true })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      output.push({ iso: toIso(viewYear, viewMonth, day), day, muted: false })
    }

    while (output.length % 7 !== 0) {
      const last = parseIso(output[output.length - 1].iso)
      last.setDate(last.getDate() + 1)
      output.push({
        iso: toIso(last.getFullYear(), last.getMonth(), last.getDate()),
        day: last.getDate(),
        muted: true,
      })
    }

    while (output.length < 42) {
      const last = parseIso(output[output.length - 1].iso)
      last.setDate(last.getDate() + 1)
      output.push({
        iso: toIso(last.getFullYear(), last.getMonth(), last.getDate()),
        day: last.getDate(),
        muted: true,
      })
    }

    return output
  }, [viewMonth, viewYear])

  const canGoPrev = useMemo(() => {
    if (!Number.isFinite(minTs)) return true
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0)
    return prevMonthLastDay.getTime() >= minTs
  }, [minTs, viewMonth, viewYear])

  function openPicker() {
    setMonthView(toMonthView(fallbackIso))
    setIsOpen(true)
  }

  function closePicker() {
    setIsOpen(false)
  }

  function goPrev() {
    if (!canGoPrev) return
    const month = viewMonth - 1
    if (month < 0) {
      setMonthView({ year: viewYear - 1, month: 11 })
      return
    }
    setMonthView({ year: viewYear, month })
  }

  function goNext() {
    const month = viewMonth + 1
    if (month > 11) {
      setMonthView({ year: viewYear + 1, month: 0 })
      return
    }
    setMonthView({ year: viewYear, month })
  }

  function apply(iso: string) {
    const ts = startOfDay(parseIso(iso)).getTime()
    if (ts < minTs) return
    onChange(iso)
    closePicker()
  }

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`
  const isInline = variant === 'inline'
  const triggerClassName = [
    'date-trigger',
    isInline ? 'date-trigger--inline' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={openPicker}
        aria-label="Escolher data"
      >
        <span className="date-trigger__icon" aria-hidden="true">
          <Icon name="calendar" size={18} />
        </span>
        <span className="date-trigger__body">
          {!isInline ? (
            <span className="date-trigger__label">{label}</span>
          ) : null}
          <strong>{value ? formatCompactDate(value) : placeholder}</strong>
          {!isInline ? (
            <span className="date-trigger__hint">
              Toque para abrir um calendário melhor no celular.
            </span>
          ) : null}
        </span>
        <span className="date-trigger__cta">
          {isInline ? <Icon name="chevron-right" size={18} /> : ctaLabel}
        </span>
      </button>

      {isOpen ? (
        <>
          <div className="sheet-backdrop" onClick={closePicker} />
          <div
            className="sheet date-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar data"
          >
            <div className="sheet__handle" aria-hidden="true" />

            <div className="date-sheet__header">
              <div>
                <span className="sheet__eyebrow">Selecionar data</span>
                <h2 className="date-sheet__title">{formatLongDate(value || fallbackIso)}</h2>
                <p className="date-sheet__sub">
                  Toque em um dia para usar essa data na sugestão.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closePicker}
                aria-label="Fechar"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="date-sheet__quick">
              <button type="button" onClick={() => apply(todayIso)}>
                Hoje
              </button>
              <button type="button" onClick={() => apply(addDays(todayIso, 1))}>
                Amanhã
              </button>
              <button type="button" onClick={() => apply(nextWeekdayIso(5))}>
                Sexta
              </button>
              <button type="button" onClick={() => apply(nextWeekdayIso(6))}>
                Sábado
              </button>
            </div>

            <div className="date-sheet__monthbar">
              <button
                type="button"
                className="date-sheet__nav"
                onClick={goPrev}
                disabled={!canGoPrev}
                aria-label="Mês anterior"
              >
                ‹
              </button>
              <span className="date-sheet__month">{monthLabel}</span>
              <button
                type="button"
                className="date-sheet__nav"
                onClick={goNext}
                aria-label="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="date-sheet__weekdays" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="date-sheet__grid" role="grid">
              {cells.map((cell) => {
                const ts = startOfDay(parseIso(cell.iso)).getTime()
                const isDisabled = ts < minTs
                const isSelected = cell.iso === value
                const isToday = cell.iso === todayIso
                const className = [
                  'date-sheet__day',
                  cell.muted ? 'date-sheet__day--muted' : '',
                  isSelected ? 'date-sheet__day--selected' : '',
                  isToday && !isSelected ? 'date-sheet__day--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    type="button"
                    key={cell.iso}
                    className={className}
                    onClick={() => apply(cell.iso)}
                    disabled={isDisabled}
                    aria-label={cell.iso}
                    aria-selected={isSelected}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
