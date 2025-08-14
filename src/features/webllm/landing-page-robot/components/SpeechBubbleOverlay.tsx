import { useState, useEffect } from 'react';
import SpeechBubble from './SpeechBubble';
import { useLLMBubble } from '../hooks/useLLMBubble';
import { UserDataService } from '@/services/UserDataService';

const SpeechBubbleOverlay = () => {
    const { bubbleText, showButtons } = useLLMBubble();
    // null = not yet decided (loading), true = show, false = never show
    const [visible, setVisible] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const existing = await UserDataService.getUserData();
            if (cancelled) return;
            if (existing && typeof existing.isITField === 'boolean') {
                // Already answered -> never render
                setVisible(false);
            } else {
                setVisible(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const persistAndClose = async (val: boolean) => {
        setSaving(true);
        try {
            await UserDataService.saveIsITField(val);
        } finally {
            setSaving(false);
            setVisible(false);
        }
    };

    const handleYes = () => persistAndClose(true);
    const handleNo = () => persistAndClose(false);
    const handleDismiss = () => setVisible(false);

    // While deciding or if already set -> render nothing
    if (visible !== true) return null;

    return (
        <div className="absolute inset-0 -translate-x-[5%] translate-y-[4%] z-10">
            <SpeechBubble
                showButtons={showButtons && !saving}
                onYes={handleYes}
                onNo={handleNo}
                onDismiss={handleDismiss}
            >
                {saving ? 'Saving...' : bubbleText}
            </SpeechBubble>
        </div>
    );
};

export default SpeechBubbleOverlay;