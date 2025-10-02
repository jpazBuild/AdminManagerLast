// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip"

// import { ReactNode } from "react";

// interface TooltipLocationProps {
//   children: ReactNode;
//   text: string;
//   position?: "top" | "right" | "bottom" | "left";
// }

// const TooltipLocation = ({ children, text,position }: TooltipLocationProps) => {
//   return (
//     <Tooltip>
//       <TooltipTrigger asChild>
//         {children}
//       </TooltipTrigger>
//       <TooltipContent side={position} className="bg-primary text-white/80 w-48 p-2 font-semibold text-sm">
//         <p>{text}</p>
//       </TooltipContent>
//     </Tooltip>
//   );
// }


// export default TooltipLocation;


// TooltipLocation.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type TooltipLocationProps = {
  children: React.ReactNode
  text: string
  position?: "top" | "right" | "bottom" | "left"
  active?: boolean
  sideOffset?: number
}

const TooltipLocation: React.FC<TooltipLocationProps> = ({
  children,
  text,
  position = "right",
  active = false,
  sideOffset = 8,
}) => {
  if (!active) {
    return <>{children}</>
  }

  return (
    <Tooltip delayDuration={100}>
      <span className="relative block">
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute inset-0 z-10 cursor-not-allowed",
              "pointer-events-auto"
            )}
            aria-hidden
          />
        </TooltipTrigger>

        <div className="pointer-events-none">
          {children}
        </div>
      </span>

      <TooltipContent side={position} sideOffset={sideOffset} className="bg-primary text-white/80 w-48 p-2 font-semibold text-sm">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipLocation
