import { createContext, useCallback, useRef, useContext, useState, type FC } from 'react';
import { getOrCreateSharedLLM, ensureSharedLLMInitialized } from '@/features/webllm/services/LLMService';
import { defaultModel } from '@/features/webllm/constants/webLLM';
import type { LLMService } from '@/features/webllm/services/LLMService';

type LLMStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';

export interface LLMContextValue {
  llm: LLMService | null;
  llmReady: boolean;
  status: LLMStatus;
  progress: number;
  ensureLLM: () => Promise<void>;
}

export const LLMContext = createContext<LLMContextValue | null>(null);

export function useLLM() {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error("useLLM must be used inside LLMProvider");
  return ctx;
}

export const LLMProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [llm, setLlm] = useState<LLMService | null>(null);
  const [llmReady, setLlmReady] = useState(false);
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [progress, setProgress] = useState(0);
  const loadingRef = useRef<Promise<void> | null>(null);
  const progressHookedRef = useRef(false);

  const ensureLLM = useCallback(async () => {
    const capturedStatus = status;

    if (llmReady || status === 'unsupported') return;
    if (loadingRef.current) return loadingRef.current;


    const service = getOrCreateSharedLLM({
      modelId: defaultModel.model_id,
      smallModelId: defaultModel.model_id,
      useWorker: true,
      systemPrompt: 'You are a helpful assistant.'
    });

    if (!progressHookedRef.current) {
      service.onProgress(p => setProgress(p.progress));
      progressHookedRef.current = true;
    }
    setLlm(service);

    if (!service.requirementsMet) {
      setStatus('unsupported');
      return;
    }

    if (!service.isReady()) setStatus('loading');

    const initPromise = ensureSharedLLMInitialized(async () => {
      await service.init();
    }).then(() => {
      if (service.isReady()) {
        setLlmReady(true);
        setStatus('ready');
      } else if (capturedStatus !== 'unsupported') {
        setStatus('error');
      }
    }).catch(() => setStatus('error'));

    loadingRef.current = initPromise;
    await initPromise;
  }, [llmReady, status]);

  return (
    <LLMContext.Provider value={{ llm, llmReady, status, progress, ensureLLM }}>
      {children}
    </LLMContext.Provider>
  );
};