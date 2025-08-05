import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji'
import Youtube from '@tiptap/extension-youtube'
import Blockquote from '@tiptap/extension-blockquote'
import { Placeholder, CharacterCount } from '@tiptap/extensions'
import MenuBar from '@/features/text-editor/components/MenuBar'
import '@/features/text-editor/styles/index.scss'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const lowlight = createLowlight(all)


const CHARACTER_LIMIT = 1000;

interface TextEditorOptions {
    content?: string;
    characterLimit?: number;
    classNames?: string;
    error?: { message?: string };
}

const TextEditor = ({
    editorRef,
    opt,
}: {
    editorRef?: React.MutableRefObject<any>;
    opt?: Readonly<TextEditorOptions>;
}) => {
    const $opt = Object.freeze(opt);
    const maxLength = $opt?.characterLimit ?? CHARACTER_LIMIT;

    const extensions = [
        StarterKit,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Highlight,
        Typography,
        CodeBlockLowlight.configure({ lowlight }),
        Emoji.configure({
            emojis: gitHubEmojis,
            enableEmoticons: true,
            // suggestion,
        }),
        Youtube.configure({
            controls: false,
            nocookie: true,
        }),
        Blockquote,
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
        editorProps: editorProps,
        enableContentCheck: true,
    })

    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        if (editorRef) {
            editorRef.current = editor;
        }
        if (!editor) return;

        const updateCount = () => {
            setCharCount(editor.storage.characterCount.characters({ mode: 'nodeSize' }));
            // Dynamically update aria-invalid attribute on contenteditable div
            editor.view.dom.setAttribute(
                'aria-invalid',
                isInvalid(charCount) ? 'true' : 'false'
            );
        };

        editor.on('update', updateCount);
        updateCount();

        return () => {
            editor.off('update', updateCount);
        };
    }, [editor, editorRef]);

    editor.on('contentError', () => {
        toast.error("An error occurred. Please refresh the application.")
    })

    function isInvalid(charCount: number) {
        return charCount > maxLength;
    }

    return (
        <>
            <fieldset className='space-y-1'>
                <legend className=''><Label htmlFor="sender-email-message">Your Message</Label></legend>
                <MenuBar editor={editor} />
                <EditorContent
                    id='sender-email-message'
                    className={`border border-t-0 overflow-y-auto -mt-1 `}
                    editor={editor}
                    aria-invalid={isInvalid(charCount) ? "true" : "false"}
                />
                <div
                    className={`text-xs text-right flex justify-between text-gray-500 ${charCount > maxLength || (opt?.error?.message?.trim())
                        ? "text-red-500"
                        : ""
                        }`}
                >
                    <span>{charCount > maxLength ? "Character limit exceeded! " : opt?.error?.message || ""}</span>
                    <span className={`${charCount > maxLength ? "text-red-500" : "text-gray-500"}`}>{charCount} / {maxLength}</span>
                </div>
            </fieldset>
        </>
    )
}

export default TextEditor