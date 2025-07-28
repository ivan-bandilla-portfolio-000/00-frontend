
import * as THREE from 'three';
import { Suspense, useRef, useEffect, useState, useContext } from 'react';
import { LLMContext } from '@/services/LLMService';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';
import { useIsMobile } from '@/hooks/useIsMobile';
import { choosePortfolioContextInstruction } from '@/constants/webLLM';
import { useInView } from 'react-intersection-observer';


import CanvasLoader from '@/components/Loader';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

const Robot = ({ isMobile = false, isVisible = true }) => {
    const robot = useGLTF('/3dModels/cute_desktop_animated/scene.gltf');
    const mixer = useRef();

    useEffect(() => {
        if (robot.animations.length) {
            mixer.current = new THREE.AnimationMixer(robot.scene);
            robot.animations.forEach((clip) => {
                mixer.current.clipAction(clip).play();
            });
        }
        return () => mixer.current?.stopAllAction();
    }, [robot]);

    useFrame((state, delta) => {
        if (isVisible) {
            mixer.current?.update(delta);
        }
    });

    return (
        <mesh>
            <hemisphereLight intensity={0.15}
                groundColor="black"
            />
            <pointLight intensity={2} />
            <spotLight
                position={[4.5, 2, 3]}
                angle={1}
                penumbra={1}
                intensity={200}
                castShadow
                shadow-mapSize={1024}
            // decay={false}
            />
            <primitive
                object={robot.scene}
                scale={isMobile ? 2.5 : 4.5}
                position={isMobile ? [-4.5, -3.25, -1.5] : [-3.5, -3.25, -1.5]}
                rotation={[0, Math.PI / 2.5, 0]}
            />
        </mesh>
    )
}

const SpeechBubble = ({ children, showButtons = false, onYes, onNo }) => (
    <div
        className="
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-full
            z-20 bg-white rounded-2xl
            px-7 py-4
            shadow-lg
            text-[1.15rem] text-[#333] text-pretty
            min-w-[220px] max-w-[320px]
            border-2 border-[#e0e0e0]
        "
    >
        {children}
        {showButtons && (
            <div
                className='mt-4 flex justify-end'>
                <div className='flex gap-2 w-3/4'>
                    <Button
                        className='flex-1'
                        variant="default"
                        onClick={onYes}
                    >Yes</Button>

                    <Button
                        className='flex-1'
                        variant="outline"
                        onClick={onNo}
                    >No</Button>
                </div>
            </div>
        )}
        <div
            className="absolute left-1/2 bottom-[-22px] translate-x-[150%] w-0 h-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.07)]"
            style={{
                borderLeft: "18px solid transparent",
                borderRight: "18px solid transparent",
                borderTop: "22px solid #fff"
            }} />
    </div>
);

const RobotCanvas = () => {
    const isMobile = useIsMobile();

    const llm = useContext(LLMContext);
    const [bubbleText, setBubbleText] = useState("Hello");
    const [showButtons, setShowButtons] = useState(false);
    const { ref, inView } = useInView({ threshold: 0.1 });


    useEffect(() => {
        const timeout = setTimeout(() => {
            setBubbleText("...");
        }, 3000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchLLM = async () => {
            if (!llm || !llm.initialized) return;
            try {
                llm.setSystemPrompt(choosePortfolioContextInstruction);
                const result = await llm.getResponse("");
                if (!cancelled) {
                    setBubbleText(result.trim());
                    setShowButtons(true);
                }
            } catch (e) {
                setBubbleText("Sorry, I couldn't load a question.");
            }
        };
        fetchLLM();
        return () => { cancelled = true; };
    }, [llm, llm?.initialized]);

    const handleYes = () => {
        // Do something for Yes
    };

    const handleNo = () => {
        // Do something for No
    };

    return (
        <div ref={ref} style={{ position: "relative", width: "100vw", height: "100vh" }}>
            {/* Popover overlay */}
            <div
                className=" absolute inset-0 -translate-x-[5%] translate-y-[4%] z-10"
            >
                <SpeechBubble showButtons={showButtons} onYes={handleYes} onNo={handleNo}>
                    {bubbleText}
                </SpeechBubble>
            </div>
            {/* Canvas below */}
            <Canvas
                frameloop="always"
                shadows
                camera={{ position: [20, 3, 5], fov: 25 }}
                gl={{ preserveDrawingBuffer: true }}
                style={{ height: "100vh" }}
            >
                <Suspense fallback={<CanvasLoader />}>
                    <OrbitControls
                        enableZoom={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 2}
                    />
                    <Robot isMobile={isMobile} isVisible={inView} />
                </Suspense>
                <Preload all />
            </Canvas>
        </div>
    )
}


export default RobotCanvas