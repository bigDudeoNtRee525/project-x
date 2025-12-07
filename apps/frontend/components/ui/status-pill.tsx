import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusPillVariants = cva(
    "inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
    {
        variants: {
            variant: {
                success: "bg-[rgba(34,197,94,0.2)] text-[#4ade80]",
                info: "bg-[rgba(59,130,246,0.2)] text-[#60a5fa]",
                warning: "bg-[rgba(245,158,11,0.2)] text-[#fbbf24]",
                danger: "bg-[rgba(239,68,68,0.2)] text-[#f87171]",
                neutral: "bg-white/10 text-white/80",
                // Semantic aliases for common use cases
                customer: "bg-[rgba(34,197,94,0.2)] text-[#4ade80]",
                lead: "bg-[rgba(59,130,246,0.2)] text-[#60a5fa]",
                negotiation: "bg-[rgba(245,158,11,0.2)] text-[#fbbf24]",
                completed: "bg-[rgba(34,197,94,0.2)] text-[#4ade80]",
                pending: "bg-[rgba(168,85,247,0.2)] text-[#c084fc]",
                overdue: "bg-[rgba(239,68,68,0.2)] text-[#f87171]",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
)

interface StatusPillProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> { }

function StatusPill({ className, variant, ...props }: StatusPillProps) {
    return (
        <span
            data-slot="status-pill"
            className={cn(statusPillVariants({ variant, className }))}
            {...props}
        />
    )
}

export { StatusPill, statusPillVariants }
