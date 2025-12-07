import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassIconVariants = cva(
    "flex items-center justify-center rounded-[10px] text-base font-medium",
    {
        variants: {
            variant: {
                green: "bg-[rgba(34,197,94,0.1)] text-[#22c55e]",
                blue: "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]",
                gold: "bg-[rgba(245,198,134,0.1)] text-[#F5C686]",
                purple: "bg-[rgba(168,85,247,0.1)] text-[#a855f7]",
                orange: "bg-[rgba(249,115,22,0.1)] text-[#f97316]",
                neutral: "bg-white/5 text-white",
            },
            size: {
                default: "h-9 w-9",
                sm: "h-7 w-7 text-sm",
                lg: "h-11 w-11 text-lg",
            },
        },
        defaultVariants: {
            variant: "neutral",
            size: "default",
        },
    }
)

interface GlassIconProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassIconVariants> { }

function GlassIcon({ className, variant, size, ...props }: GlassIconProps) {
    return (
        <div
            data-slot="glass-icon"
            className={cn(glassIconVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { GlassIcon, glassIconVariants }
