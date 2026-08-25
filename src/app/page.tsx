import App from "./App";

const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quantum",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
    },
    publisher: {
        "@type": "Organization",
        name: "CHEFU Technologies",
        url: "https://chefu.co.za",
    },
};

export default function Page() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <App />
        </>
    );
}
