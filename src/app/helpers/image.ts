export type ImageHandlerOptions = {
    size?: string;
    text?: string;
    fallbackOnFetchError?: boolean;
    retryOn429?: boolean;
    maxRetries?: number;
    timeoutMs?: number;
    onBeforeFetch?: (url: string) => void;
    onReplace?: (img: HTMLImageElement, placeholderUrl: string, reason: string) => void;
    onNoop?: (img: HTMLImageElement) => void;
};

export const getPlaceholderUrl = (size = "600x400", text = "No Preview Available"): string => {
    const encoded = encodeURIComponent(text);
    return `https://placehold.co/${size}.avif?font=Poppins&text=${encoded}`;
};

export const getImageUrl = (img?: string | null, size = "600x400", text = "No Preview Available"): string => {
    const placeholder = getPlaceholderUrl(size, text);
    if (typeof img !== "string") return placeholder;
    const cleaned = img.trim();
    if (!cleaned) return placeholder;
    const lower = cleaned.toLowerCase();
    if (lower === "null" || lower === "undefined") return placeholder;
    return cleaned;
};

const isReplaceableStatus = (statusCode: number) =>
    statusCode === 403 || statusCode === 404 || statusCode === 410 || statusCode === 429 || statusCode >= 500;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const handleImageError = async (
    imageElement: HTMLImageElement,
    options: ImageHandlerOptions = {}
): Promise<void> => {
    const {
        size = "600x400",
        text = "No Preview Available",
        fallbackOnFetchError = false,
        retryOn429 = true,
        maxRetries = 1,
        timeoutMs = 5000,
        onBeforeFetch,
        onReplace,
        onNoop,
    } = options;

    const placeholderUrl = getPlaceholderUrl(size, text);
    const originalUrl = imageElement.src;

    if (!originalUrl) {
        imageElement.src = placeholderUrl;
        onReplace?.(imageElement, placeholderUrl, "no-src");
        return;
    }

    // If the browser is offline, do not replace — let browser show alt text
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        onNoop?.(imageElement);
        return;
    }

    let attempt = 0;
    let lastStatus: number | null = null;

    while (attempt <= maxRetries) {
        const abortController = new AbortController();
        let timeoutHandle: number | undefined;

        try {
            onBeforeFetch?.(originalUrl);

            if (timeoutMs > 0) {
                timeoutHandle = window.setTimeout(() => abortController.abort(), timeoutMs);
            }

            const response = await fetch(originalUrl, {
                method: "HEAD",
                cache: "no-store",
                signal: abortController.signal,
            });
            lastStatus = response.status;

            // Opaque responses can't be inspected; fallback only if caller requested it
            if (response.type === "opaque") {
                if (fallbackOnFetchError) {
                    imageElement.src = placeholderUrl;
                    onReplace?.(imageElement, placeholderUrl, "opaque-response");
                } else {
                    onNoop?.(imageElement);
                }
                return;
            }

            // Rate-limited: optionally retry using Retry-After or exponential backoff
            if (response.status === 429 && retryOn429 && attempt < maxRetries) {
                const retryAfter = response.headers.get("retry-after");
                let waitMs = 1000 * Math.pow(2, attempt);
                if (retryAfter) {
                    const parsedSeconds = parseInt(retryAfter, 10);
                    if (!Number.isNaN(parsedSeconds)) {
                        waitMs = parsedSeconds * 1000;
                    } else {
                        const parsedDate = Date.parse(retryAfter);
                        if (!Number.isNaN(parsedDate)) {
                            waitMs = Math.max(0, parsedDate - Date.now());
                        }
                    }
                }
                attempt++;
                await sleep(waitMs);
                continue;
            }

            // Replace for explicit error statuses (excluding 429 already handled)
            if (isReplaceableStatus(response.status) && response.status !== 429) {
                imageElement.src = placeholderUrl;
                onReplace?.(imageElement, placeholderUrl, `status-${response.status}`);
                return;
            }

            // Non-OK: optionally fallback
            if (!response.ok && fallbackOnFetchError) {
                imageElement.src = placeholderUrl;
                onReplace?.(imageElement, placeholderUrl, `not-ok-${response.status}`);
                return;
            }

            // Validate that resource is an image and not empty
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
                imageElement.src = placeholderUrl;
                onReplace?.(imageElement, placeholderUrl, `bad-content-type:${contentType}`);
                return;
            }
            const contentLengthHeader = response.headers.get("content-length");
            if (contentLengthHeader !== null && Number(contentLengthHeader) === 0) {
                imageElement.src = placeholderUrl;
                onReplace?.(imageElement, placeholderUrl, "empty-content");
                return;
            }

            onNoop?.(imageElement);
            return;
        } catch (error) {
            const isAbort = (error instanceof DOMException && error.name === "AbortError") || (error && (error as any).name === "AbortError");

            // For timeouts/abort treat as fetch error; only replace if caller asks
            if (isAbort || !error) {
                if (fallbackOnFetchError) {
                    imageElement.src = placeholderUrl;
                    onReplace?.(imageElement, placeholderUrl, isAbort ? "timeout" : "fetch-error");
                } else {
                    onNoop?.(imageElement);
                }
                return;
            }

            // Other network/CORS errors: do not replace unless requested
            if (fallbackOnFetchError) {
                imageElement.src = placeholderUrl;
                onReplace?.(imageElement, placeholderUrl, "fetch-error");
            } else {
                onNoop?.(imageElement);
            }
            return;
        } finally {
            if (typeof timeoutHandle !== "undefined") {
                clearTimeout(timeoutHandle);
            }
        }
    }

    // exhausted retries
    imageElement.src = placeholderUrl;
    onReplace?.(imageElement, placeholderUrl, `exhausted-retries-status-${lastStatus ?? "unknown"}`);
};

export const createImageErrorHandler = (options: ImageHandlerOptions = {}) => {
    return (event: Event): void => {
        const targetElement = event.currentTarget as HTMLImageElement | null;
        if (!targetElement) return;
        void handleImageError(targetElement, options);
    };
};