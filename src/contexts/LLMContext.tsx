import { createContext, useCallback, useRef, useContext, useState } from 'react';
import { LLMService } from '@/features/webllm/services/LLMService';
import { defaultModel } from '@/features/webllm/constants/webLLM';

export interface LLMContextValue {
  llm: LLMService | null;
  llmReady: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';
  progress: number;
  ensureLLM: () => Promise<void>;
}

export function useLLM() {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error("useLLM must be used inside LLMProvider");
  return ctx;
}

export const LLMContext = createContext<LLMContextValue | null>(null);

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [llm, setLlm] = useState<LLMService | null>(null);
  const [llmReady, setLlmReady] = useState(false);
  const [status, setStatus] = useState<LLMContextValue['status']>('idle');
  const [progress, setProgress] = useState(0);
  const loadingRef = useRef<Promise<void> | null>(null);

  const ensureLLM = useCallback(async () => {
    if (llmReady || status === 'unsupported') return;
    if (loadingRef.current) return loadingRef.current;

    const load = async () => {
      try {
        setStatus('loading');
        const service = new LLMService({
          modelId: defaultModel.model_id,
          smallModelId: defaultModel.model_id,
          useWorker: true,
          systemPrompt: 'You are a helpful assistant.'
        });
        service.onProgress(p => setProgress(p.progress));
        setLlm(service);
        if (!service.requirementsMet) {
          setStatus('unsupported');
          return;
        }
        await service.init();
        if (service.isReady()) {
          setLlmReady(true);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      } finally {
        loadingRef.current = null;
      }
    };
    loadingRef.current = load();
    return loadingRef.current;
  }, [llmReady, status]);

  return (
    <LLMContext.Provider value={{ llm, llmReady, status, progress, ensureLLM }}>
      {children}
    </LLMContext.Provider>
  );
};