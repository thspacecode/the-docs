import { useCallback, useEffect, useRef, useState } from "react"

interface CardInfo {
  title: string
  description?: string
  context?: string
}
export function useGraphHoverCard() {
  const [card, setCard] = useState<(CardInfo & { anchor: Element }) | null>(
    null
  )
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const keepOpen = useCallback(() => {
    clearTimeout(timer.current)
  }, [])
  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setCard(null)
  }, [])
  const closeSoon = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCard(null), 180)
  }, [])
  const bind = useCallback(
    (target: Element, info: CardInfo, keyboard = true) => {
      const show = () => {
        clearTimeout(timer.current)
        timer.current = setTimeout(
          () => setCard({ ...info, anchor: target }),
          250
        )
      }
      target.addEventListener("pointerenter", show)
      target.addEventListener("pointerleave", closeSoon)
      target.addEventListener("pointerdown", dismiss)
      if (keyboard) {
        target.setAttribute("tabindex", "0")
        target.setAttribute(
          "aria-label",
          [info.title, info.description].filter(Boolean).join(": ")
        )
        target.addEventListener("focus", show)
        target.addEventListener("blur", closeSoon)
        target.addEventListener("keydown", (event) => {
          if ((event as KeyboardEvent).key === "Escape") dismiss()
        })
      }
    },
    [closeSoon, dismiss]
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  return { card, bind, dismiss, keepOpen, closeSoon }
}
