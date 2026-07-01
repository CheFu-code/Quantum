export function MessageSkeletonList() {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
            <div className="flex justify-end">
                <div className="w-[72%] max-w-lg space-y-2 rounded-2xl rounded-tr-sm border border-primary/10 bg-primary/5 px-4 py-3">
                    <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
                </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
                <div className="mt-0.5 size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-10/12 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-7/12 animate-pulse rounded-full bg-muted" />
                </div>
            </div>

            <div className="flex justify-end">
                <div className="w-[58%] max-w-md space-y-2 rounded-2xl rounded-tr-sm border border-primary/10 bg-primary/5 px-4 py-3">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
                <div className="mt-0.5 size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-5/12 animate-pulse rounded-full bg-muted" />
                </div>
            </div>
        </div>
    );
}
