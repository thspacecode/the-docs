import { createContext } from "react"

/** Set this provider when viewer styles live outside document.body. */
export const ExcalidrawPortalContainer = createContext<HTMLElement | null>(null)
