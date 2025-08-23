"use client"

import { useRef, useEffect } from "react";
import CloudPdfViewer from "@cloudpdf/viewer";
import { useTheme } from "@/features/theming/components/theme-provider";

const CloudPdf = ({ docID, darkMode }: { docID: string; darkMode?: boolean }) => {
    const viewer = useRef<HTMLDivElement | null>(null);
    const { resolvedTheme } = useTheme()
    const effectiveDark = darkMode ?? (resolvedTheme === "dark")

    useEffect(() => {
        (async () => {
            const container = viewer.current;
            if (!container) return;

            // Clear previous instance if theme/doc changes
            container.innerHTML = "";

            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--primary')
                .trim() || undefined;

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
                    darkMode: effectiveDark,
                    themeColor,
                    defaultScale: 'AUTOMATIC',
                    appBarColored: true,
                    disableElements: ['download']
                },
                container
            ).then(() => { /* no-op */ });
        })();
    }, [docID, effectiveDark]);

    return <div className="viewer w-full h-full print:hidden" ref={viewer} />;
}

export default CloudPdf