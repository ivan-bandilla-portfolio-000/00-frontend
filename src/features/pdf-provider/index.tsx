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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    showProviderTabs?: boolean; // new: enable switching between providers
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
    showProviderTabs = true,
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

                {showProviderTabs ? (
                    <Tabs defaultValue="cloud-pdf" className="h-full">
                        <TabsList className="mx-auto">
                            <TabsTrigger value="cloud-pdf" className="cursor-pointer">Cloud PDF</TabsTrigger>
                            <TabsTrigger value="iframe" className="cursor-pointer">Iframe</TabsTrigger>
                        </TabsList>

                        <TabsContent value="cloud-pdf" className="h-full">
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
                        </TabsContent>

                        <TabsContent value="iframe" className="h-full">
                            {fallbackSrc ? (
                                <Iframe name="pdf-iframe" title={title} src={fallbackSrc} />
                            ) : (
                                <div className="p-4 text-center">No iframe source provided.</div>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export const FullPagePdf: React.FC<{
    docID: string;
    fallbackSrc?: string;
    title?: string;
    showProviderTabs?: boolean;
}> = ({ docID, fallbackSrc, title = "PDF Viewer", showProviderTabs = true }) => {
    if (!showProviderTabs) {
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
    }

    return (
        <Tabs defaultValue="cloud-pdf" className="h-full">
            <TabsList className="p-2">
                <TabsTrigger value="cloud-pdf" className="cursor-pointer">Cloud PDF</TabsTrigger>
                <TabsTrigger value="iframe" className="cursor-pointer">Iframe</TabsTrigger>
            </TabsList>

            <TabsContent value="cloud-pdf" className="h-full">
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
            </TabsContent>

            <TabsContent value="iframe" className="h-full">
                {fallbackSrc ? (
                    <Iframe name="pdf-iframe" title={title} src={fallbackSrc} />
                ) : (
                    <div className="p-4 text-center">No iframe source provided.</div>
                )}
            </TabsContent>
        </Tabs>
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
    showProviderTabs?: boolean;
}

const PdfProvider: React.FC<PdfProviderProps> = (props) => (
    <PdfViewerDialog {...props} />
);

export default PdfProvider;