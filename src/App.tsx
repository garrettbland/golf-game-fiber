import { useRef, useState, useEffect } from "react";
import { Mesh, TextureLoader, Vector3 } from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stats, OrbitControls, Sky } from "@react-three/drei";
import {
  Physics,
  useBox,
  useSphere,
  Debug,
  PublicApi,
} from "@react-three/cannon";
import { FlagStick } from "./flag";
import { create } from "zustand";

const BALL_RADIUS = 0.5;

const hitBall = (api: PublicApi) => {
  console.log("happening...");

  const SPEED = 40;
  const LAUNCH_DEGREE = 20; // 90 degrees is flat
  const LAUNCH_RADIAN = (LAUNCH_DEGREE * Math.PI) / 180; // Convert to radians (2 radians in a circle)
  // const LAUNCH_ANGLE = (30 * Math.PI) / 180; // Convert to radians (2 radians in a circle)
  const DIRECTION = [0, 0, 0]; // Horizontal direction (x-axis)

  // Break impulse into components
  // const x = SPEED * Math.cos(LAUNCH_RADIAN) * DIRECTION[0];
  const x = 0;
  const y = SPEED * Math.cos(LAUNCH_RADIAN);
  const z = SPEED * Math.sin(LAUNCH_RADIAN);

  const launchDirection = 0; // left or right
  const backspin = -80;
  const launchAngle = 5; // ball speed also?
  const ballSpeed = -10; // launch angle also?
  const sideSpin = 0;

  // initial direction
  api.applyImpulse([x, y, z], [0, 0, 0]);

  // Apply angular velocity for rotation
  api.angularVelocity.set(backspin, sideSpin, 0); // Spins around the axis (side rotation)
};

// Step 1: Create a zustand store
const useStore = create((set) => ({
  ballPosition: [0, 0.5, 0],
  windSpeed: 0,
  windDirection: new Vector3(0, 0, 0),
  backSpin: 0,
  sideSpin: 0,
  rotationalSpin: 0, // rotational direction of golf ball
  ballApi: {},
  setBallApi: (api: PublicApi) => set({ ballApi: api }),
  setWindSpeed: (speed: number) => {
    console.log(`setting wind speed to ${speed}`);
    set({ windSpeed: speed });
  },
  setWindDirection: (direction: Vector3) => {
    console.log(`Setting wind direction to ${direction.x}/${direction.y}`);
    set({ windDirection: direction });
  },
  setBackSpin: (speed: number) => {
    set({ backSpin: speed });
  },
  setSideSpin: (speed: number) => {
    set({ sideSpin: speed });
  },
  resetBall: () => {
    console.log("resetting...");
    set({ ballPosition: [0, 0.5, 0] });
  },
  setBallPosition: (position: [number, number, number]) => {
    set({ ballPosition: position });
  },
}));

// function Box(props) {
//   // This reference will give us direct access to the mesh
//   const meshRef = useRef();
//   // Set up state for the hovered and active state
//   const [hovered, setHover] = useState(false);
//   const [active, setActive] = useState(false);
//   // Subscribe this component to the render-loop, rotate the mesh every frame
//   useFrame((state, delta) => (meshRef.current.rotation.x += delta));
//   // Return view, these are regular three.js elements expressed in JSX
//   return (
//     <mesh
//       {...props}
//       ref={meshRef}
//       scale={active ? 1.5 : 1}
//       onClick={(event) => setActive(!active)}
//       onPointerOver={(event) => setHover(true)}
//       onPointerOut={(event) => setHover(false)}
//       castShadow
//     >
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
//     </mesh>
//   );
// }

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
      position: [0, -0, 0], // Ground position
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
  const setSideSpin = useStore((state) => state.setSideSpin);
  const setBackSpin = useStore((state) => state.setBackSpin);
  const ballPosition = useStore((state) => state.ballPosition);

  const [ref, api] = useSphere(
    () => ({
      mass: 1, // Ball reacts to gravity
      position: ballPosition, // Initial position
      args: [BALL_RADIUS], // Radius of the ball
      restitution: 0.3, // Makes the ball bouncy
      material: { friction: 0.8 },
      linearDamping: 0.3, // Slows translational motion (straight line motion)
      angularDamping: 0.2, // Slows rotational motion
    }),
    useRef<Mesh>(null)
  );

  // Use state to store velocities
  const linearVelocity = useRef(new Vector3()); // motion
  const angularVelocity = useRef(new Vector3()); // spin

  useEffect(() => {
    console.log("ball position changed!");
    api.position.set(ballPosition[0], ballPosition[1], ballPosition[2]);
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
  }, [ballPosition]);

  const setBallApi = useStore((state) => state.setBallApi);

  // Subscribe to the velocity and angularVelocity once
  useEffect(() => {
    console.log("setting velocity...");

    setBallApi(api);

    const unsubscribeLinear = api.velocity.subscribe((v) => {
      linearVelocity.current = new Vector3(v[0], v[1], v[2]);
    });
    const unsubscribeAngular = api.angularVelocity.subscribe((w) => {
      angularVelocity.current = new Vector3(w[0], w[1], w[2]);
      setSideSpin(angularVelocity.current.y.toFixed(2));
      setBackSpin(angularVelocity.current.x.toFixed(2));
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      unsubscribeLinear();
      unsubscribeAngular();
    };
  }, [api.velocity, api.angularVelocity]);

  useFrame(() => {
    // if (!hasHit) return;

    // Magnus effect parameters
    const ballRadius = BALL_RADIUS; // Radius of the ball
    const airDensity = 1.225; // Approximate air density (kg/m^3)
    const liftCoefficient = 0.2; // Empirical coefficient, adjust for realism

    // Compute Magnus force
    const magnusForce = new Vector3()
      .crossVectors(angularVelocity.current, linearVelocity.current)
      .multiplyScalar(liftCoefficient * airDensity * Math.pow(ballRadius, 3));

    // .multiplyScalar(
    //   liftCoefficient *
    //     airDensity *
    //     Math.PI *
    //     Math.pow(ballRadius, 3) *
    //     linearVelocity.current.length()
    // );

    // Get the ball's linear and angular velocity
    // api.velocity.get((v) => linearVelocity.set(v[0], v[1], v[2]));
    // api.angularVelocity.get((w) => angularVelocity.set(w[0], w[1], w[2]));

    // If both velocities are small, skip applying Magnus force
    // this is measuring magnitude
    if (
      linearVelocity.current.length() === 0 ||
      angularVelocity.current.length() === 0
    )
      return;

    // Apply the Magnus force to the ball
    const crossWind = 0;
    const linearWind = 0;
    // api.applyForce(
    //   [magnusForce.x + crossWind, magnusForce.y, magnusForce.x + linearWind],
    //   [0, 0, 0] // Apply at the ball's center
    // );

    // console.log(`Apply ${magnusForce.x} force`);
  });

  // const hitBall = () => {
  //   console.log("happening...");

  //   const launchDirection = -2;
  //   const backspin = -100;
  //   const launchAngle = 8;
  //   const ballSpeed = 8;
  //   const sideSpin = 60;

  //   // initial direction
  //   api.applyImpulse([launchDirection, launchAngle, ballSpeed], [0, 0, 0]);

  //   // Apply angular velocity for rotation
  //   api.angularVelocity.set(backspin, sideSpin, 0); // Spins around the axis (side rotation)

  //   setHasHit(true);
  // };

  return (
    <mesh ref={ref} receiveShadow>
      <sphereGeometry args={[BALL_RADIUS, 10, 10]} />
      <meshStandardMaterial color={"white"} wireframe />
      <axesHelper args={[2]} />
    </mesh>
  );
};

const DevTools = () => {
  const windSpeed = useStore((state) => state.windSpeed);
  const windDirection = useStore((state) => state.windDirection);
  const sideSpin = useStore((state) => state.sideSpin);
  const backSpin = useStore((state) => state.backSpin);
  const setBallPosition = useStore((state) => state.setBallPosition);
  const resetBall = useStore((state) => state.resetBall);
  const ballApi = useStore((state) => state.ballApi);
  return (
    <div
      style={{
        zIndex: 999,
        position: "fixed",
        top: 0,
        right: 0,
        background: "white",
        padding: 2,
      }}
    >
      <span>Wind Speed: {windSpeed}</span>
      <br />
      <span>Wind Direction: {windDirection}</span>
      <br />
      <span>Side Speed: {sideSpin}</span>
      <br />
      <span>Back Spin: {backSpin}</span>
      <br />
      <button onClick={() => resetBall()}>Reset Ball</button>
      <button onClick={() => hitBall(ballApi)}>Hit Ball</button>
    </div>
  );
};

export const App = () => {
  const test = new Vector3(0, 3, 3);
  return (
    <>
      <DevTools />
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

        <FlagStick position={[0, 5, -80]} />

        <arrowHelper
          args={[
            new Vector3(0, 10, 10).normalize(), // we normalize here just to get direction, we don't care about length or magnitude.
            new Vector3(0, 0, 0),
            30,
            0xff0000,
          ]}
        />

        <Physics gravity={[0, -9.8, 0]}>
          <Debug>
            {/* <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} /> */}
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
