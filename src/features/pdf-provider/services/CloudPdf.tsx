import React, { useRef, useEffect, lazy } from "react";
import CloudPdfViewer from "@cloudpdf/viewer";

const CloudPdf = ({ docID, darkMode = false }: { docID: string, darkMode?: boolean }) => {
    const viewer = useRef(null);

    useEffect(() => {
        (async () => {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--primary')
                .trim() || undefined;

            // normalize to an sRGB hex string when possible (fallback to raw)
            let themeColor: string | undefined = raw;
            if (raw) {
                try {
                    const culori = await import('culori');
                    const parsed = (culori as any).parse(raw);
                    themeColor = parsed ? (culori as any).formatHex(parsed) : raw;
                } catch {
                    themeColor = raw;
                }
            }


            CloudPdfViewer(
                {
                    documentId: docID,
                    darkMode,
                    themeColor,
                    defaultScale: 'AUTOMATIC',
                    appBarColored: true,
                },
                viewer.current
            ).then(() => { });
        })();
    }, [docID, darkMode]);


    return (
        <>
            <div className="viewer w-full h-full print:hidden" ref={viewer}></div>
        </>
    )
}

export default CloudPdf