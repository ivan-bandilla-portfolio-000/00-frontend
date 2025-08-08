import { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface LLMContextValue {
  llm: any | null;
  llmReady: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';
  ensureLLM: () => Promise<void>;
}

export const LLMContext = createContext<LLMContextValue | null>(null);

export const useLLM = () => {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error('useLLM must be used within LLMProvider');
  return ctx;
};

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [llm, setLlm] = useState<any | null>(null);
  const [llmReady, setLlmReady] = useState(false);
  const [status, setStatus] = useState<LLMContextValue['status']>('idle');
  const loadingRef = useRef<Promise<void> | null>(null);

  const ensureLLM = useCallback(async () => {
    if (llmReady || status === 'unsupported') return;
    if (loadingRef.current) return loadingRef.current;

    const load = async () => {
      try {
        setStatus('loading');
        const { LLMService } = await import('@/features/webllm/services/LLMService');
        const service = new LLMService("You are a helpful assistant.");
        setLlm(service);
        if (!service.requirementsMet) {
          setStatus('unsupported');
          return;
        }
        await service.init();
        setLlmReady(service.requirementsMet && service.initialized);
        setStatus(service.initialized ? 'ready' : 'error');
      } catch (e) {
        console.warn('LLM load failed', e);
        setStatus('error');
      } finally {
        loadingRef.current = null;
      }
    };

    loadingRef.current = load();
    return loadingRef.current;
  }, [llmReady, status]);

  return (
    <LLMContext.Provider value={{ llm, llmReady, status, ensureLLM }}>
      {children}
    </LLMContext.Provider>
  );
};