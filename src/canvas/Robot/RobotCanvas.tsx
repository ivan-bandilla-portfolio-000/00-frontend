import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from "framer-motion"
import { OrbitControls, Preload } from '@react-three/drei';
import { useInView } from 'react-intersection-observer';
import { useIsMobile } from '@/hooks/useIsMobile';
import CanvasLoader from '@/components/Loader';
import Robot from './Robot';
// import SpeechBubbleOverlay from './SpeechBubbleOverlay'; // Remove direct import

type RobotCanvasProps = {
    translateY?: number;
};

const RobotCanvas = ({ translateY = 0 }: RobotCanvasProps) => {
    const isMobile = useIsMobile();
    const { ref, inView } = useInView({ threshold: 0.1 });
    const [robotLoaded, setRobotLoaded] = useState(false);
    const [SpeechBubbleOverlay, setSpeechBubbleOverlay] = useState<React.ComponentType | null>(null);

    // Callback to set robot loaded
    const handleRobotLoaded = useCallback(() => {
        setRobotLoaded(true);
        // Lazy load the overlay component
        import('../../features/webllm/landing-page-robot/components/SpeechBubbleOverlay').then(module => {
            setSpeechBubbleOverlay(() => module.default);
        });
    }, []);

    return (
        <motion.div ref={ref}
            className=''
            animate={{ y: translateY }}
            style={{
                position: "relative",
                width: "100vw",
                height: "100cqh",
            }}
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
        </motion.div>
    );
};

export default RobotCanvas;