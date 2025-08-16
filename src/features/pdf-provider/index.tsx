import React from "react";
import CloudPdf from "@/features/pdf-provider/services/CloudPdf";
// shadcn UI imports (adjust paths if your project places them elsewhere)
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Iframe from "./services/Iframe";
import personalInfo from "@/constants/personalInfo";

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

            <DialogContent className="w-[90svw] h-[90svh] !max-w-none pointer-events-auto grid-rows-[auto_1fr]">
                <DialogHeader className="">
                    <DialogTitle>PDF Viewer</DialogTitle>
                </DialogHeader>

                {/* Full page PDF viewer */}
                {/* @ts-ignore */}
                <CloudPdf docID={personalInfo.resume.cloudPdfDocID} />
                {/* <Iframe name="pdf-iframe" title="PDF Viewer" /> */}
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
