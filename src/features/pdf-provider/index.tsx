import React from "react";
import CloudPdf from "@/features/pdf-provider/services/CloudPdf";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Iframe from "./services/Iframe";
import personalInfo from "@/constants/personalInfo";

class PdfErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, info: unknown) {
        console.error("PDF viewer error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

export const FullPagePdf: React.FC = () => {
    return (
        <>
            <PdfErrorBoundary fallback={<Iframe name="pdf-iframe" title="PDF Viewer" />}>
                {/* @ts-ignore */}
                <CloudPdf docID={personalInfo.resume.cloudPdfDocID} />
            </PdfErrorBoundary>
        </>
    );
};

/**
 * PdfDialog
 * Exposes a shadcn Dialog with a Button trigger to open a full-page PDF viewer.
 * - Button: provided by shadcn Button component
 * - Dialog / DialogContent: provided by shadcn Dialog components
 */
export const PdfDialog: React.FC<{
    triggerLabel?: React.ReactNode;
}> = ({ triggerLabel = "Open PDF" }) => {
    return (
        <Dialog>
            <DialogTrigger asChild className="pointer-events-auto">
                <Button>{triggerLabel}</Button>
            </DialogTrigger>

            <DialogContent className="w-[90svw] h-[90svh] p-0 !max-w-none pointer-events-auto overflow-clip grid-rows-[auto_1fr]">
                <DialogHeader className="p-4">
                    <DialogTitle>PDF Viewer</DialogTitle>
                </DialogHeader>

                <PdfErrorBoundary fallback={<Iframe name="pdf-iframe" title="PDF Viewer" />}>
                    {/* @ts-ignore */}
                    <CloudPdf docID={personalInfo.resume.cloudPdfDocID} />
                </PdfErrorBoundary>

            </DialogContent>
        </Dialog>
    );
};

/**
 * Default export kept for backwards compatibility with existing imports.
 * It renders the dialog (button trigger + dialog content).
 */
const PdfProvider = ({ triggerLabel }: { triggerLabel?: React.ReactNode }) => <PdfDialog triggerLabel={triggerLabel} />;

export default PdfProvider;
