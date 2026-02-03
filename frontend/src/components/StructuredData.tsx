import Script from 'next/script';

interface StructuredDataProps {
    data: object | object[];
}

/**
 * Component to inject structured data (JSON-LD) into the page
 * This helps search engines understand your content better
 */
export default function StructuredData({ data }: StructuredDataProps) {
    const jsonLd = Array.isArray(data) ? data : [data];

    return (
        <>
            {jsonLd.map((item, index) => (
                <Script
                    key={index}
                    id={`structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}
        </>
    );
}
