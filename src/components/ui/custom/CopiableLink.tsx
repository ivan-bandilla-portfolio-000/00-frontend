import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";


interface CopiableLinkProps {
    href: string;
    children: React.ReactNode;
    type?: "email" | "tel" | "url";
}

const CopiableLink: React.FC<CopiableLinkProps> = ({
    href,
    children,
    type = "url",
}) => {
    const [copied, setCopied] = useState(false);

    const getLinkProps = () => {
        if (type === "email") {
            return { href: `mailto:${href}` };
        }
        if (type === "tel") {
            return { href: `tel:${href}` };
        }
        // Default: url
        return {
            href,
            target: "_blank",
            rel: "noopener noreferrer",
        };
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <span className="inline-flex items-center gap-2 text-[1.1em]">
            <a {...getLinkProps()} className="underline">
                {children}
            </a>
            <Toggle
                pressed={copied}
                onPressedChange={handleCopy}
                aria-label="Copy link"
                className="text-xs px-2 py-1 border rounded"
            >
                {copied ? "Copied!" : "Copy"}
            </Toggle>
        </span>
    );
};

export default CopiableLink;