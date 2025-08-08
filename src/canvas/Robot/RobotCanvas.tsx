import { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { useInView } from 'react-intersection-observer';
import { useIsMobile } from '@/hooks/useIsMobile';
import CanvasLoader from '@/components/CanvasLoader';
import Robot from './Robot';
import { useLLM } from '@/contexts/LLMContext';


const RobotCanvas = () => {
    const isMobile = useIsMobile();
    const { ref, inView } = useInView({ threshold: 0.1 });
    const [robotLoaded, setRobotLoaded] = useState(false);
    const [SpeechBubbleOverlay, setSpeechBubbleOverlay] = useState<React.ComponentType | null>(null);
    const { ensureLLM } = useLLM(); // optional: status if you want to check

    useEffect(() => {
        if (inView) {
            ensureLLM();
        }
    }, [inView, ensureLLM]);

    const handleRobotLoaded = useCallback(() => {
        setRobotLoaded(true);
        import('../../features/webllm/landing-page-robot/components/SpeechBubbleOverlay').then(module => {
            setSpeechBubbleOverlay(() => module.default);
        });
    }, []);

    return (
        <div ref={ref}
            className='relative w-full h-[100cqh]'
        >
            {robotLoaded && SpeechBubbleOverlay && <SpeechBubbleOverlay />}

            <Canvas
                frameloop="always"
                shadows
                camera={{ position: [20, 3, 5], fov: 25 }}
                gl={{ preserveDrawingBuffer: true }}
                style={{ height: "100%", transform: 'inherit' }}
            >
                <Suspense fallback={<CanvasLoader />}>
                    <OrbitControls
                        enableZoom={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 2}
                    />
                    <Robot isMobile={isMobile} isVisible={inView} onLoaded={handleRobotLoaded} />
                </Suspense>
                <Preload all />
            </Canvas>
        </div>
    );
};

export default RobotCanvas;