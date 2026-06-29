import type { Metadata } from "next";

export const siteName = "Quantum";
export const siteUrl = (
    process.env.NEXT_PUBLIC_QUANTUM_APP_URL || "https://quantum.chefuinc.com"
).replace(/\/$/, "");
export const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefuinc.com"
).replace(/\/$/, "");
export const accountUrl = (
    process.env.NEXT_PUBLIC_CHEFU_ACCOUNT_URL || "https://myaccount.chefuinc.com"
).replace(/\/$/, "");

export const siteDescription =
    "Quantum is a fast, professional AI chat workspace from CheFu for focused research, coding, writing, analysis, and image-assisted work.";

type PageMetadataInput = {
    title: string;
    description: string;
    path?: string;
};

export function pageMetadata({
    title,
    description,
    path = "/",
}: PageMetadataInput): Metadata {
    const url = new URL(path, siteUrl).toString();

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            siteName,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}
