export function MessageSkeletonList() {
    return (
        <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-6 pt-2 sm:space-y-6 sm:px-6 sm:pb-8 sm:pt-4">
            {/* Assistant bubble skeleton */}
            <div className="flex gap-2 sm:gap-3">
                <div className="mt-0.5 size-6 shrink-0 animate-pulse rounded-full sm:size-7 bg-muted/40" />
                <div className="flex-1 min-w-0">
                    <div className="rounded-3xl border border-border bg-card px-4 py-3">
                        <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
                        <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-muted" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                    </div>
                </div>
            </div>

            {/* User bubble skeleton (right aligned) */}
            <div className="flex justify-end">
                <div className="min-w-0 space-y-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground max-w-[72%] px-3 py-2 sm:max-w-[68%]">
                    <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
                    <div className="mt-2 h-3 w-2/5 animate-pulse rounded-full bg-muted" />
                </div>
            </div>

            {/* Assistant bubble skeleton */}
            <div className="flex gap-2 sm:gap-3">
                <div className="mt-0.5 size-6 shrink-0 animate-pulse rounded-full sm:size-7 bg-muted/40" />
                <div className="flex-1 min-w-0">
                    <div className="rounded-3xl border border-border bg-card px-4 py-3">
                        <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
                        <div className="mt-2 h-3 w-10/12 animate-pulse rounded-full bg-muted" />
                    </div>
                </div>
            </div>

            {/* User bubble skeleton */}
            <div className="flex justify-end">
                <div className="min-w-0 space-y-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-foreground max-w-[58%] px-3 py-2 sm:max-w-[48%]">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                </div>
            </div>
        </div>
    );
}
