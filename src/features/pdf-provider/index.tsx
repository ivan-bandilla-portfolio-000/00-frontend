import React from "react";
import CloudPdf from "@/features/pdf-provider/services/CloudPdf";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Iframe from "./services/Iframe";

class PdfErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: unknown, info: unknown) {
        console.error("PDF viewer error:", error, info);
    }
    render() {
        if (this.state.hasError) return this.props.fallback ?? null;
        return this.props.children;
    }
}

export interface PdfViewerProps {
    docID: string;
    trigger?: {
        label: React.ReactNode;
        props?: React.ComponentProps<typeof Button>;
    };
    title?: string;
    description?: React.ReactNode;
    fallbackSrc?: string;
    darkMode?: boolean;
}

export const PdfViewerDialog: React.FC<PdfViewerProps> = ({
    docID,
    trigger = {
        label: "Open PDF",
        props: { className: "flex min-h-full" },
    },
    title = "PDF Viewer",
    description = "Displays the selected PDF.",
    fallbackSrc = "",

}) => {
    return (
        <Dialog>
            <DialogTrigger asChild className="pointer-events-auto">
                <Button {...trigger.props}>
                    {trigger.label}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90svw] h-[90svh] p-0 !max-w-none pointer-events-auto overflow-clip grid-rows-[auto_1fr]">
                <DialogHeader className="p-4">
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <PdfErrorBoundary
                    fallback={
                        fallbackSrc ? (
                            <Iframe name="pdf-iframe" title={title} src={fallbackSrc} />
                        ) : null
                    }
                >
                    {/* @ts-ignore */}
                    <CloudPdf docID={docID} />
                </PdfErrorBoundary>
            </DialogContent>
        </Dialog>
    );
};

export const FullPagePdf: React.FC<{
    docID: string;
    fallbackSrc?: string;
    title?: string;
}> = ({ docID, fallbackSrc, title = "PDF Viewer" }) => {
    return (
        <PdfErrorBoundary
            fallback={
                fallbackSrc ? (
                    <Iframe name="pdf-iframe" title={title} src={fallbackSrc} />
                ) : null
            }
        >
            {/* @ts-ignore */}
            <CloudPdf docID={docID} />
        </PdfErrorBoundary>
    );
};

export interface PdfProviderProps {
    docID: string;
    triggerLabel?: React.ReactNode;
    trigger?: {
        label: React.ReactNode;
        props?: React.ComponentProps<typeof Button>;
    };
    title?: string;
    description?: React.ReactNode;
    fallbackSrc?: string;
}

const PdfProvider: React.FC<PdfProviderProps> = (props) => (
    <PdfViewerDialog {...props} />
);

export default PdfProvider;