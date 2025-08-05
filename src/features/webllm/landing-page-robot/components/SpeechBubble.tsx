import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface SpeechBubbleProps {
    children: ReactNode;
    showButtons?: boolean;
    onYes?: () => void;
    onNo?: () => void;
    onDismiss?: () => void;
}

const SpeechBubble = ({
    children,
    showButtons = false,
    onYes,
    onNo,
    onDismiss,
}: SpeechBubbleProps) => (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-20 bg-background dark:bg-zinc-500 rounded-2xl px-7 py-4 shadow-lg text-[1.15rem] text-foreground text-pretty min-w-[220px] max-w-[320px] border-2 border-border">
        {onDismiss && (
            <button
                onClick={onDismiss}
                className="absolute top-2 right-3 text-2xl text-muted-foreground hover:text-foreground hover:scale-140 focus:outline-none"
                aria-label="Close"
                type="button"
            >
                &times;
            </button>
        )}
        {children}
        {showButtons && (
            <div className="mt-4 flex justify-end">
                <div className="flex gap-2 w-3/4">
                    <Button className="flex-1" variant="default" onClick={onYes}>
                        Yes
                    </Button>
                    <Button className="flex-1" variant="outline" onClick={onNo}>
                        No
                    </Button>
                </div>
            </div>
        )}
        <div
            className="absolute left-1/2 bottom-[-22px] translate-x-[150%] w-0 h-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.07)]"
            style={{
                borderLeft: "18px solid transparent",
                borderRight: "18px solid transparent",
                borderTop: "22px solid var(--background)"
            }}
        />
    </div>
);

export default SpeechBubble;