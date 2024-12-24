import { useRef, useState, useEffect } from "react";
import { Mesh, TextureLoader, Vector3 } from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stats, OrbitControls, Sky } from "@react-three/drei";
import {
  Physics,
  useBox,
  usePlane,
  useSphere,
  Debug,
} from "@react-three/cannon";
import { FlagStick } from "./flag";
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

  // not using "usePlane" anymore, as "usePlane" is infinite. So basically
  // our stuff is colliding with air it looks like

  const [ref] = useBox(
    () => ({
      rotation: [-Math.PI / 2, 0, 0], // Rotate to lie flat
      position: [0, -10, 0], // Ground position
      material: { friction: 1 },
      args: [40, 200, 0.1],
    }),
    useRef<Mesh>(null)
  );

  const texture = useLoader(TextureLoader, "/grass.png");

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[40, 200]} />
      <meshStandardMaterial side={2} map={texture} />
    </mesh>
  );
};

const GolfBall = () => {
  const [hasHit, setHasHit] = useState(false);

  const [ref, api] = useSphere(
    () => ({
      mass: 1, // Ball reacts to gravity
      position: [0, 10, 0], // Initial position
      args: [1], // Radius of the ball
      restitution: 0.3, // Makes the ball bouncy
      material: { friction: 0.8 },
      linearDamping: 0.3, // Slows translational motion (straight line motion)
      angularDamping: 0.4, // Slows rotational motion
    }),
    useRef<Mesh>(null)
  );

  // Use state to store velocities
  const linearVelocity = useRef(new Vector3());
  const angularVelocity = useRef(new Vector3());

  // Subscribe to the velocity and angularVelocity once
  useEffect(() => {
    console.log("setting velocity...");

    const unsubscribeLinear = api.velocity.subscribe((v) => {
      linearVelocity.current = new Vector3(v[0], v[1], v[2]);
    });
    const unsubscribeAngular = api.angularVelocity.subscribe((w) => {
      angularVelocity.current = new Vector3(w[0], w[1], w[2]);
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      unsubscribeLinear();
      unsubscribeAngular();
    };
  }, [api.velocity]);

  useFrame(() => {
    if (!hasHit) return;

    // console.log(`ang velocity ${JSON.stringify(angularVelocity.current)}`);

    // const linearVelocity = new Vector3();
    // const angularVelocity = new Vector3();

    // // Get the ball's linear and angular velocity
    // api.velocity.subscribe((v) => linearVelocity.set(v[0], v[1], v[2]));
    // api.angularVelocity.subscribe((v) => angularVelocity.set(v[0], v[1], v[2]));

    // Magnus effect parameters
    const ballRadius = 0.2; // Radius of the ball
    const airDensity = 1.225; // Approximate air density (kg/m^3)
    const liftCoefficient = 0.2; // Empirical coefficient, adjust for realism

    // Compute Magnus force
    const magnusForce = new Vector3()
      .crossVectors(angularVelocity.current, linearVelocity.current)
      .multiplyScalar(
        liftCoefficient *
          airDensity *
          Math.PI *
          Math.pow(ballRadius, 3) *
          linearVelocity.current.length()
      );

    // Get the ball's linear and angular velocity
    // api.velocity.get((v) => linearVelocity.set(v[0], v[1], v[2]));
    // api.angularVelocity.get((w) => angularVelocity.set(w[0], w[1], w[2]));

    // If both velocities are small, skip applying Magnus force
    // if (linearVelocity.length() === 0 || angularVelocity.length() === 0) return;

    // Apply the Magnus force to the ball
    // api.applyForce(
    //   [magnusForce.x, magnusForce.y, magnusForce.z],
    //   [0, 0, 0] // Apply at the ball's center
    // );

    // console.log(`Apply ${magnusForce.x} force`);
  });

  const hitBall = () => {
    // initial direction
    api.applyImpulse([0, 8, 8], [0, 0, 0]);

    // Apply angular velocity for rotation
    api.angularVelocity.set(0, 100, 0); // Spins around the axis (side rotation)
    setHasHit(true);
    // api.applyForce(
    //   [50, 0, 0],
    //   [0, 0, 0] // Apply at the ball's center
    // );
  };

  return (
    <mesh ref={ref} onClick={() => hitBall()} receiveShadow scale={[2, 2, 2]}>
      <sphereGeometry args={[0.2, 20, 20]} />
      <meshStandardMaterial color={"white"} wireframe />
      <axesHelper args={[2]} />
    </mesh>
  );
};

export const App = () => {
  return (
    <>
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

        <FlagStick position={[0, -5, 80]} />

        <Physics gravity={[0, -9.8, 0]}>
          <Debug>
            <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} />
            <GolfBall />
            <Course />
          </Debug>
        </Physics>
        <OrbitControls />
        <Stats />
        <axesHelper args={[5]} />
      </Canvas>
    </>
  );
};
