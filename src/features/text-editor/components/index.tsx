import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji'
import Youtube from '@tiptap/extension-youtube'
import { Placeholder, CharacterCount } from '@tiptap/extensions'
import MenuBar from '@/features/text-editor/components/MenuBar'
import '@/features/text-editor/styles/index.scss'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils';
import { environment } from '@/app/helpers/config';

const lowlight = createLowlight(all)

const CHARACTER_LIMIT = 1000;

const isLocalAppEnv = environment('local');

interface TextEditorOptions {
    content?: string;
    characterLimit?: number;
    classNames?: string;
    error?: { message?: string };
}

const TextEditor = ({
    editorRef,
    opt,
    onEditorReady,
}: {
    editorRef?: React.MutableRefObject<any>;
    opt?: Readonly<TextEditorOptions>;
    onEditorReady?: () => void;
}) => {
    const $opt = Object.freeze(opt);
    const maxLength = $opt?.characterLimit ?? CHARACTER_LIMIT;

    const extensions = [
        StarterKit.configure({
            codeBlock: false,
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Highlight,
        Typography,
        CodeBlockLowlight.configure({ lowlight }),
        Emoji.configure({
            emojis: gitHubEmojis,
            enableEmoticons: true,
        }),
        Youtube.configure({
            controls: false,
            nocookie: true,
        }),
        Placeholder.configure({
            placeholder: 'Do you want to write something?',
        }),
        CharacterCount.configure({
            limit: maxLength,
            mode: 'nodeSize',
        }),
    ]

    const editorProps = {
        attributes: {
            class: cn(
                'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm wrap-break-word break-all',
                $opt?.classNames || ''
            )
        }
    }

    const editor = useEditor({
        extensions,
        content: $opt?.content || '',
        editorProps,
        enableContentCheck: true,
    });

    useEffect(() => {
        if (editorRef && editor) {
            editorRef.current = editor;
        }
    }, [editor, editorRef]);

    const [editorReady, setEditorReady] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const signaledRef = useRef(false);

    // Simplified and more aggressive readiness detection
    useEffect(() => {
        if (!editor) return;

        const checkReadiness = () => {
            try {
                // More defensive checks - wrap each property access
                let hasView = false;
                let hasDom = false;
                let hasStorage = false;
                let hasCharacterCount = false;

                try {
                    hasView = editor.view !== null && editor.view !== undefined;
                } catch (e) {
                    isLocalAppEnv && console.warn('Error checking editor.view:', e);
                }

                try {
                    if (hasView) {
                        hasDom = editor.view.dom !== null && editor.view.dom !== undefined;
                    }
                } catch (e) {
                    isLocalAppEnv && console.warn('Error checking editor.view.dom:', e);
                }

                try {
                    hasStorage = editor.storage !== null && editor.storage !== undefined;
                } catch (e) {
                    isLocalAppEnv && console.warn('Error checking editor.storage:', e);
                }

                try {
                    if (hasStorage) {
                        hasCharacterCount = editor.storage.characterCount !== null && editor.storage.characterCount !== undefined;
                    }
                } catch (e) {
                    isLocalAppEnv && console.warn('Error checking editor.storage.characterCount:', e);
                }

                console.log('Readiness check:', {
                    hasView,
                    hasDom,
                    hasStorage,
                    hasCharacterCount,
                    isDestroyed: editor.isDestroyed,
                    signaled: signaledRef.current
                });

                return hasView && hasDom && hasStorage && hasCharacterCount && !editor.isDestroyed;
            } catch (error) {
                isLocalAppEnv && console.warn('Editor readiness check failed:', error);
                return false;
            }
        };

        const signalReady = () => {
            if (signaledRef.current) return;

            isLocalAppEnv && console.log('Attempting to signal ready...');
            try {
                if (checkReadiness()) {
                    isLocalAppEnv && console.log('✅ Editor is ready! Signaling...');
                    signaledRef.current = true;
                    setEditorReady(true);
                    onEditorReady?.();
                } else {
                    console.log('❌ Editor not ready yet');
                }
            } catch (error) {
                isLocalAppEnv && console.warn('Error in signalReady:', error);
            }
        };

        // More conservative event handling
        const handleCreate = () => {
            isLocalAppEnv && console.log('Editor create event fired');
            // Use setTimeout to ensure the DOM is ready
            setTimeout(() => {
                signalReady();
            }, 10);

            setTimeout(() => {
                signalReady();
            }, 100);
        };

        const handleTransaction = () => {
            if (!signaledRef.current) {
                isLocalAppEnv && console.log('Transaction event - attempting to signal ready');
                setTimeout(() => {
                    signalReady();
                }, 0);
            }
        };

        try {
            // Listen to events with error handling
            editor.on('create', handleCreate);
            editor.on('transaction', handleTransaction);

            // Immediate check with delay
            setTimeout(() => {
                isLocalAppEnv && console.log('Immediate readiness check after mount');
                signalReady();
            }, 50);

            // Fallback timeout
            const fallbackTimeout = setTimeout(() => {
                if (!signaledRef.current) {
                    isLocalAppEnv && console.log('🚨 Fallback timeout - forcing ready state');
                    signaledRef.current = true;
                    setEditorReady(true);
                    onEditorReady?.();
                }
            }, 2000);

            return () => {
                clearTimeout(fallbackTimeout);
                try {
                    if (editor && !editor.isDestroyed) {
                        editor.off('create', handleCreate);
                        editor.off('transaction', handleTransaction);
                    }
                } catch (error) {
                    isLocalAppEnv && console.warn('Error cleaning up editor events:', error);
                }
            };
        } catch (error) {
            isLocalAppEnv && console.warn('Error setting up editor events:', error);
            // If we can't set up events, use a simple timeout
            const simpleTimeout = setTimeout(() => {
                console.log('Simple timeout fallback');
                if (!signaledRef.current) {
                    signaledRef.current = true;
                    setEditorReady(true);
                    onEditorReady?.();
                }
            }, 1000);

            return () => {
                clearTimeout(simpleTimeout);
            };
        }
    }, [editor, onEditorReady]);

    // Character count effect
    useEffect(() => {
        if (!editor || !editorReady) return;

        const updateCount = () => {
            try {
                let chars = 0;

                // Try to get character count safely
                try {
                    if (editor.storage && editor.storage.characterCount && typeof editor.storage.characterCount.characters === 'function') {
                        chars = editor.storage.characterCount.characters({ mode: 'nodeSize' }) ?? 0;
                    }
                } catch (countError) {
                    isLocalAppEnv && console.warn('Character count failed:', countError);
                }

                setCharCount(chars);
            } catch (error) {
                isLocalAppEnv && console.warn('Character count update failed:', error);
            }
        };

        // Initial update with delay
        setTimeout(updateCount, 100);

        try {
            editor.on('update', updateCount);
        } catch (error) {
            isLocalAppEnv && console.warn('Failed to attach update listener:', error);
        }

        return () => {
            try {
                if (editor && !editor.isDestroyed) {
                    editor.off('update', updateCount);
                }
            } catch (error) {
                isLocalAppEnv && console.warn('Failed to remove update listener:', error);
            }
        };
    }, [editor, editorReady]);

    function isInvalid(count: number) {
        return count > maxLength;
    }

    // Show editor state in UI for debugging
    return (
        <fieldset className='space-y-1'>
            <legend><Label htmlFor="sender-email-message">Your Message</Label></legend>
            {/* Debug info - remove this later */}
            {isLocalAppEnv && (
                <div className="text-xs text-gray-500 mb-2">
                    Editor ready: {editorReady ? '✅' : '❌'} |
                    Editor exists: {editor ? '✅' : '❌'} |
                    View exists: {editor?.view ? '✅' : '❌'}
                </div>
            )}

            <MenuBar editor={editor} disabled={!editorReady} />
            <EditorContent
                id='sender-email-message'
                className='border border-t-0 overflow-y-auto -mt-1'
                editor={editor}
                aria-invalid={isInvalid(charCount) ? "true" : "false"}
            />
            <div
                className={`text-xs text-right flex justify-between ${(isInvalid(charCount) || (opt?.error?.message?.trim()))
                    ? "text-red-500" : "text-gray-500"
                    }`}
            >
                <span>
                    {isInvalid(charCount)
                        ? "Character limit exceeded!"
                        : opt?.error?.message || ""}
                </span>
                <span className={isInvalid(charCount) ? "text-red-500" : "text-gray-500"}>
                    {charCount} / {maxLength}
                </span>
            </div>
        </fieldset>
    );
}

export default TextEditor;