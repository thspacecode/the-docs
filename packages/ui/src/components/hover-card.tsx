import { PreviewCard as HoverCardPrimitive } from "@base-ui/react/preview-card"
import { cn } from "@the-docs/ui/lib/utils"

const HoverCard = HoverCardPrimitive.Root
const HoverCardTrigger = HoverCardPrimitive.Trigger

function HoverCardContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 8,
  anchor,
  ...props
}: HoverCardPrimitive.Popup.Props &
  Pick<
    HoverCardPrimitive.Positioner.Props,
    "align" | "side" | "sideOffset" | "anchor"
  >) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Positioner
        anchor={anchor}
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="z-50 outline-none"
      >
        <HoverCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-md outline-none",
            className
          )}
          {...props}
        />
      </HoverCardPrimitive.Positioner>
    </HoverCardPrimitive.Portal>
  )
}
export { HoverCard, HoverCardTrigger, HoverCardContent }
