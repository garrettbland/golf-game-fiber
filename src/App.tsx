import { useRef, useState } from "react";
import { Mesh, TextureLoader } from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stats, OrbitControls, Sky } from "@react-three/drei";
// import "./styles.css";

function Box(props) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef();
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

const Sun = () => {
  return (
    <>
      <directionalLight
        position={[10, 20, 10]} // Position of the sun in the scene
        intensity={1} // Intensity of sunlight
        // Enable shadow casting
        // shadow-mapSize-width={1024} // Set shadow map resolution
        // shadow-mapSize-height={1024} // Set shadow map resolution
      />
    </>
  );
};

const Course = () => {
  // const courseRef = useRef<Mesh>(null!);

  // courseRef.current.rotateOnAxis([1, 2], 45);

  const texture = useLoader(TextureLoader, "/grass.png");

  return (
    <mesh position={[0, -5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 20]} />
      <meshStandardMaterial side={2} map={texture} />
    </mesh>
  );
};

export const App = () => {
  return (
    <Canvas style={{ width: "100%", height: "100%" }} shadows>
      <Sky
        distance={450000} // Distance of the sky sphere
        sunPosition={[1, 1, 1]} // Direction of the sun
        inclination={0.49} // Tilt of the sun (affects the scene lighting)
        azimuth={0.25} // Direction of the sun's azimuth
      />
      {/* <ambientLight intensity={Math.PI / 2} /> */}
      <ambientLight intensity={1.2} />
      <Sun />
      {/* <spotLight
        position={[0, 100, 0]} // x y z
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      /> */}

      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
      <Course />
      <OrbitControls />
      <Stats />
      <axesHelper args={[5]} />
    </Canvas>
  );
};