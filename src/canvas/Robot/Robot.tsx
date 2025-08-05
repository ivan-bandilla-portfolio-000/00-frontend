import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

interface RobotProps {
    isMobile?: boolean;
    isVisible?: boolean;
    onLoaded?: () => void;
}

const Robot = ({ isMobile = false, isVisible = true, onLoaded }: RobotProps) => {
    const robot = useGLTF('/3dModels/cute_desktop_animated/scene.gltf');
    const mixer = useRef<THREE.AnimationMixer | null>(null);

    useEffect(() => {
        if (robot.animations.length) {
            mixer.current = new THREE.AnimationMixer(robot.scene);
            robot.animations.forEach((clip) => {
                mixer.current?.clipAction(clip).play();
            });
            // Notify parent that robot is loaded
            onLoaded?.();
        }
        return () => {
            mixer.current?.stopAllAction();
        };
    }, [robot, onLoaded]);

    useFrame((_, delta) => {
        if (isVisible) {
            mixer.current?.update(delta);
        }
    });

    return (
        <mesh>
            <hemisphereLight intensity={0.15} groundColor="black" />
            <pointLight intensity={2} />
            <spotLight
                position={[4.5, 2, 3]}
                angle={1}
                penumbra={1}
                intensity={200}
                castShadow
                shadow-mapSize={1024}
            />
            <primitive
                object={robot.scene}
                scale={isMobile ? 2.5 : 4.5}
                position={isMobile ? [-4.5, -3.25, -1.5] : [-3.5, -3.25, -1.5]}
                rotation={[0, Math.PI / 2.5, 0]}
            />
        </mesh>
    );
};

export default Robot;