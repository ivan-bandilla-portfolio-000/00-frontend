import React, { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
const TextAreaEditor = lazy(() => import('@/features/text-editor/components'));
import { getRequestStatusById, type RequestStatus } from '@/constants/requestStatuses'

// @ts-ignore
import { Filter } from "bad-words";
import { NonceManager } from '@/features/nonce/client/services/NonceManager';
import { FormService } from '@/services/FormService';
import { useContactFormValidation } from './hooks/useContactFormValidation'
import { useContactFormSubmission, type MessageInputs } from './hooks/useContactFormSubmission'
import { emailRule } from "@/features/validations/constants/emailRule";
import ErrorBoundary from '@/components/errors/ErrorBoundary';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { environment } from '@/app/helpers/config';

const CHARACTER_LIMIT = 1000;
const MIN_LENGTH = 5;

type EditorSwitchProps = {
    enableRichEditor: boolean;
    editorFailed: boolean;
    isEditorReady: boolean;
    status: RequestStatus;
    setEnableRichEditor: (v: boolean) => void;
    setEditorFailed: (v: boolean) => void;
    setIsEditorReady: (v: boolean) => void;
    setFallbackContent: (v: string) => void;
    editorRef: React.RefObject<any>;
};

const EditorSwitch: React.FC<EditorSwitchProps> = ({
    enableRichEditor,
    editorFailed,
    isEditorReady,
    status,
    setEnableRichEditor,
    setEditorFailed,
    setIsEditorReady,
    setFallbackContent,
    editorRef,
}) => (
    <div className="flex items-center justify-between gap-3 text-xs rounded border border-border/60 px-3 py-2 mb-2 "
        onMouseEnter={() => { import('@/features/text-editor/components'); }}
    >
        <div className="flex flex-col">
            <span className="font-medium">Rich Text Editor</span>
            <span className="text-[10px] opacity-70">
                {editorFailed
                    ? "Failed to better text editor — using plain text."
                    : enableRichEditor
                        ? (isEditorReady ? "Text editor ready." : "Loading your text editor...")
                        : "Off — using plain text input."}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <Switch
                className=''
                checked={enableRichEditor && !editorFailed}
                disabled={status.id !== getRequestStatusById("ready")!.id}
                aria-label="Toggle rich text editor between plain text input"
                onCheckedChange={(checked) => {
                    if (checked) {
                        setEditorFailed(false);
                        setEnableRichEditor(true);
                    } else {
                        try {
                            if (editorRef.current?.getText) {
                                const txt = editorRef.current.getText();
                                if (txt !== undefined) {
                                    setFallbackContent(txt);
                                }
                            }
                        } catch { /* ignore */ }
                        setIsEditorReady(false);
                        setEnableRichEditor(false);
                    }
                }}
            />
        </div>
    </div>
);

type PlainTextareaProps = {
    fallbackContent: string;
    setFallbackContent: (v: string) => void;
    status: RequestStatus;
    formErrors: any;
    CHARACTER_LIMIT: number;
    editorFailed: boolean;
    enableRichEditor: boolean;
    isEditorReady: boolean;
};

const PlainTextarea: React.FC<PlainTextareaProps> = ({
    fallbackContent,
    setFallbackContent,
    status,
    formErrors,
    CHARACTER_LIMIT,
    editorFailed,
    enableRichEditor,
    isEditorReady,
}) => (
    <div className="space-y-1">
        <Label htmlFor="fallback-message">Your Message</Label>
        <Textarea
            id="fallback-message"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-[14rem] max-h-[30cqh] 2xl:max-h-dvh w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
            placeholder="Do you want to write something?"
            value={fallbackContent}
            onChange={(e) => setFallbackContent(e.target.value)}
            disabled={status.id !== getRequestStatusById("ready")!.id}
            maxLength={CHARACTER_LIMIT}
        />
        <div className={`text-xs text-right flex justify-between ${(fallbackContent.length > CHARACTER_LIMIT || formErrors.emailContent?.message?.trim())
            ? "text-red-500" : "text-gray-500"
            }`}>
            <span>
                {fallbackContent.length > CHARACTER_LIMIT
                    ? "Character limit exceeded!"
                    : formErrors.emailContent?.message ||
                    (editorFailed
                        ? "Rich editor failed to load."
                        : enableRichEditor
                            ? (isEditorReady ? "Editor ready." : "Loading rich editor…")
                            : "Plain text mode.")}
            </span>
            <span className={fallbackContent.length > CHARACTER_LIMIT ? "text-red-500" : "text-gray-500"}>
                {fallbackContent.length} / {CHARACTER_LIMIT}
            </span>
        </div>
    </div>
);

type RichEditorProps = {
    enableRichEditor: boolean;
    editorFailed: boolean;
    isEditorReady: boolean;
    setEditorFailed: (v: boolean) => void;
    setIsEditorReady: (v: boolean) => void;
    mountedRef: React.MutableRefObject<boolean>;
    editorRef: React.RefObject<any>;
    fallbackContent: string;
    CHARACTER_LIMIT: number;
    formErrors: any;
};

const RichEditor: React.FC<RichEditorProps> = ({
    enableRichEditor,
    editorFailed,
    isEditorReady,
    setEditorFailed,
    setIsEditorReady,
    mountedRef,
    editorRef,
    fallbackContent,
    CHARACTER_LIMIT,
    formErrors,
}) => (
    enableRichEditor && !editorFailed && (
        <Suspense fallback={null}>
            <ErrorBoundary
                fallback={null}
                onError={() => {
                    setEditorFailed(true);
                }}
            >
                <div style={!isEditorReady ? { display: 'none' } : { display: 'block' }}>
                    <TextAreaEditor
                        editorRef={editorRef}
                        onEditorReady={() => {
                            if (!mountedRef.current) return;
                            setIsEditorReady(true);
                        }}
                        opt={{
                            characterLimit: CHARACTER_LIMIT,
                            content: fallbackContent,
                            // @ts-ignore this error is set manually
                            error: formErrors.emailContent,
                            classNames: "min-h-[14rem] max-h-[30cqh] 2xl:max-h-dvh",
                        }}
                    />
                </div>
            </ErrorBoundary>
        </Suspense>
    )
);

type DebugInfoProps = {
    isLocalAppEnv: boolean;
    enableRichEditor: boolean;
    isEditorReady: boolean;
    editorFailed: boolean;
    editorLoadTimeout: number;
    timeoutActive: boolean;
};

const DebugInfo: React.FC<DebugInfoProps> = ({
    isLocalAppEnv,
    enableRichEditor,
    isEditorReady,
    editorFailed,
    editorLoadTimeout,
    timeoutActive,
}) => isLocalAppEnv ? (
    <div className="text-xs text-gray-500 mt-2">
        enableRichEditor: {enableRichEditor ? '✅' : '❌'} |
        isEditorReady: {isEditorReady ? '✅' : '❌'} |
        editorFailed: {editorFailed ? '❌' : '✅'} |
        timeout(ms): {editorLoadTimeout} |
        timeoutActive: {timeoutActive ? '⏰' : '—'}
    </div>
) : null;

type ContactFormProps = {
    formRef: React.RefObject<HTMLFormElement>;
    callbacks?: {
        onSubmitting?: () => void;
        onStop?: () => void;
    };
    status: RequestStatus;
    setStatus: React.Dispatch<React.SetStateAction<RequestStatus>>;
    formService?: typeof FormService;
    nonceManager?: typeof NonceManager;
};

const ContactForm = ({
    formRef,
    callbacks,
    status,
    setStatus,
    formService = FormService,
    nonceManager = NonceManager,
}: ContactFormProps) => {
    const [nonce, setNonce] = useState<string | null>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [fallbackContent, setFallbackContent] = useState("");
    const [editorFailed, setEditorFailed] = useState(false);
    const [enableRichEditor, setEnableRichEditor] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    const isLocalAppEnv = environment('local');

    const editorLoadTimeoutRef = useRef<number>(0);
    if (editorLoadTimeoutRef.current === 0) {
        const getEditorLoadTimeout = () => {
            try {
                const conn: any = (navigator as any).connection;
                if (conn?.effectiveType && /(slow-2g|2g|3g)/i.test(conn.effectiveType)) {
                    return 15000; // slower networks: 15s
                }
            } catch { /* ignore */ }
            return 10000; // default 10s
        };
        editorLoadTimeoutRef.current = getEditorLoadTimeout();
    }

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        nonceManager.create().then(setNonce);
    }, []);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('contactForm.richEditor');
            if (stored === '1') {
                setEnableRichEditor(true);
            }
        } catch { /* ignore */ }
    }, []);

    // Persist preference
    useEffect(() => {
        try {
            if (enableRichEditor) {
                localStorage.setItem('contactForm.richEditor', '1');
            } else {
                localStorage.removeItem('contactForm.richEditor');
            }
        } catch { /* ignore */ }
    }, [enableRichEditor]);

    useEffect(() => {
        if (!enableRichEditor) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }
        if (isEditorReady || editorFailed) return;

        timeoutRef.current = setTimeout(() => {
            if (!isEditorReady && enableRichEditor && mountedRef.current) {
                setEditorFailed(true);
            }
        }, editorLoadTimeoutRef.current);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enableRichEditor, isEditorReady, editorFailed]);

    // Clear timeout when loaded
    useEffect(() => {
        if (isEditorReady && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            if (editorFailed) setEditorFailed(false);
        }
    }, [isEditorReady, editorFailed]);

    const { register, handleSubmit, setError, clearErrors, formState: { errors: formErrors } } = useContactFormValidation(sessionStorage.getItem("contactFormEmail") || "");

    const editorRef = useRef<any>(null);

    const onValid = useContactFormSubmission({
        formService,
        nonceManager,
        setNonce,
        setStatus,
        callbacks,
        formRef,
        editorRef,
        setError,
        clearErrors,
        CHARACTER_LIMIT,
        MIN_LENGTH,
        isEditorReady,
        fallbackContent,
        setFallbackContent,
    });

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors("emailContent");
        await handleSubmit((data) => onValid(data as MessageInputs, nonce))(e);
        setStatus(getRequestStatusById("ready")!);
    }, [isEditorReady, fallbackContent, clearErrors, handleSubmit, onValid, nonce, setError, setStatus]);

    return (
        <form ref={formRef} id='contact-form' className='space-y-8' onSubmit={handleFormSubmit}>
            <div className='space-y-1'>
                <Label htmlFor="sender-email">Your email address</Label>
                <Input
                    type="text"
                    id='sender-email'
                    autoComplete='email'
                    autoCapitalize='off'
                    autoFocus={true}
                    placeholder="Email"
                    {...register("email", emailRule)}
                    disabled={status.id !== getRequestStatusById("ready")!.id}
                />
                <span className='text-red-500'>{formErrors.email && <span>{formErrors.email.message}</span>}</span>
            </div>

            <EditorSwitch
                enableRichEditor={enableRichEditor}
                editorFailed={editorFailed}
                isEditorReady={isEditorReady}
                status={status}
                setEnableRichEditor={setEnableRichEditor}
                setEditorFailed={setEditorFailed}
                setIsEditorReady={setIsEditorReady}
                setFallbackContent={setFallbackContent}
                editorRef={editorRef}
            />

            {(!enableRichEditor || !isEditorReady || editorFailed) && (
                <PlainTextarea
                    fallbackContent={fallbackContent}
                    setFallbackContent={setFallbackContent}
                    status={status}
                    formErrors={formErrors}
                    CHARACTER_LIMIT={CHARACTER_LIMIT}
                    editorFailed={editorFailed}
                    enableRichEditor={enableRichEditor}
                    isEditorReady={isEditorReady}
                />
            )}

            <RichEditor
                enableRichEditor={enableRichEditor}
                editorFailed={editorFailed}
                isEditorReady={isEditorReady}
                setEditorFailed={setEditorFailed}
                setIsEditorReady={setIsEditorReady}
                mountedRef={mountedRef}
                editorRef={editorRef}
                fallbackContent={fallbackContent}
                CHARACTER_LIMIT={CHARACTER_LIMIT}
                formErrors={formErrors}
                key={enableRichEditor ? fallbackContent : undefined}
            />

            <DebugInfo
                isLocalAppEnv={isLocalAppEnv}
                enableRichEditor={enableRichEditor}
                isEditorReady={isEditorReady}
                editorFailed={editorFailed}
                editorLoadTimeout={editorLoadTimeoutRef.current}
                timeoutActive={!!timeoutRef.current}
            />

        </form>
    )
}

export default ContactForm