import { useState } from 'react';
import SpeechBubble from './SpeechBubble';
import { useLLMBubble } from '../hooks/useLLMBubble';

const SpeechBubbleOverlay = () => {
    const { bubbleText, showButtons } = useLLMBubble();
    const [visible, setVisible] = useState(true);

    const handleYes = () => {
        // TODO: Implement Yes action
        setVisible(false);
    };

    const handleNo = () => {
        // TODO: Implement No action
        setVisible(false);
    };

    const handleDismiss = () => {
        // TODO: Implement dismiss action
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="absolute inset-0 -translate-x-[5%] translate-y-[4%] z-10">
            <SpeechBubble showButtons={showButtons} onYes={handleYes} onNo={handleNo} onDismiss={handleDismiss}>
                {bubbleText}
            </SpeechBubble>
        </div>
    );
};

export default SpeechBubbleOverlay;