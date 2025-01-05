import { useRef, useState, useEffect, Ref } from "react";
import { Mesh, TextureLoader, Vector3 } from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Stats,
  OrbitControls,
  Sky,
  PerspectiveCamera,
} from "@react-three/drei";
import { useBox, useSphere, PublicApi } from "@react-three/cannon";
import {
  Physics,
  RigidBody,
  RigidBodyProps,
  RapierRigidBody,
} from "@react-three/rapier";
import { FlagStick } from "./flag";
import { create } from "zustand";

const BALL_RADIUS = 0.5;

const hitBall = (ballRef: RapierRigidBody) => {
  console.log("happening...");
  console.log(ballRef);

  const { score, setScore } = useStore.getState();

  setScore(score + 1);

  const SPEED = 32;
  const LAUNCH_DEGREE = 30; // 90 degrees is flat
  const LAUNCH_RADIAN = (LAUNCH_DEGREE * Math.PI) / 180; // Convert to radians (2 radians in a circle)
  // const LAUNCH_ANGLE = (30 * Math.PI) / 180; // Convert to radians (2 radians in a circle)
  const DIRECTION_DEGREE = 90; // Horizontal direction in degrees (90 degrees is straigt down the pipe)
  const DIRECTION_RADIAN = (DIRECTION_DEGREE * Math.PI) / 180;

  // Break impulse into components
  const x = SPEED * Math.cos(DIRECTION_RADIAN);
  const y = SPEED * Math.sin(LAUNCH_RADIAN);
  const z = SPEED * Math.cos(LAUNCH_RADIAN);

  const BACK_SPIN = -5;
  const SIDE_SPIN = 0;

  // initial direction
  ballRef.applyImpulse(new Vector3(x, y, z), true);

  ballRef.applyTorqueImpulse(new Vector3(BACK_SPIN, SIDE_SPIN, 0), false);

  // ballRef.api.angularVelocity.set(BACK_SPIN, SIDE_SPIN, 0); // Spins around the axis (side rotation)
};

// Step 1: Create a zustand store
export const useStore = create((set) => ({
  ballPosition: [0, 0.5, 0],
  windSpeed: 0,
  windDirection: new Vector3(0, 0, 0),
  backSpin: 0,
  sideSpin: 0,
  rotationalSpin: 0, // rotational direction of golf ball
  ballApi: {},
  ballRef: {} as RapierRigidBody,
  isBallMoving: false,
  isDevMode: false,
  golfBallLocation: new Vector3(0, 5, 0),
  score: 0,
  isBallInHole: false,
  setBallInHole: (value) => set({ isBallInHole: value }),
  setScore: (newScore: number) => set({ score: newScore }),
  setGolfBallLocation: (position: Vector3) => {
    set({ golfBallLocation: position });
  },
  toggleDevMode: (value?: boolean) => {
    if (value) {
      set({ isDevMode: value });
    } else {
      set((currState) => ({ isDevMode: !currState.isDevMode }));
    }
  },
  setBallMoving: (isMoving: boolean) => set({ isBallMoving: isMoving }),
  setBallRef: (ref: Ref<RapierRigidBody>) => set({ ballRef: ref }),
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
    set({ golfBallLocation: [0, 0.5, 0] });
  },
  setBallPosition: (position: Vector3) => {
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
  // not using "usePlane" anymore, as "usePlane" is infinite. So basically
  // our stuff is colliding with air it looks like

  const texture = useLoader(TextureLoader, "/grass.png");

  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, -1, 50]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial side={2} map={texture} />
      </mesh>
    </RigidBody>
  );
};

const GolfBall = () => {
  const setBallRef = useStore((state) => state.setBallRef);
  const setSideSpin = useStore((state) => state.setSideSpin);
  const setBackSpin = useStore((state) => state.setBackSpin);
  const ballPosition = useStore((state) => state.ballPosition);
  const setBallMoving = useStore((state) => state.setBallMoving);
  const isDevMode = useStore((state) => state.isDevMode);
  const golfBallLocation = useStore((state) => state.golfBallLocation);

  // Old cannon stuff
  // const [ref, api] = useSphere(
  //   () => ({
  //     mass: 1, // Ball reacts to gravity
  //     position: ballPosition, // Initial position
  //     args: [BALL_RADIUS], // Radius of the ball
  //     restitution: 0.3, // Makes the ball bouncy
  //     material: { friction: 0.8 },
  //     linearDamping: 0.3, // Slows translational motion (straight line motion)
  //     angularDamping: 0.2, // Slows rotational motion
  //   }),
  //   useRef<Mesh>(null)
  // );

  // Use state to store velocities
  const linearVelocity = useRef(new Vector3()); // motion
  const angularVelocity = useRef(new Vector3()); // spin

  // Old cannon stuff
  // useEffect(() => {
  //   console.log("ball position changed!");
  //   api.position.set(ballPosition[0], ballPosition[1], ballPosition[2]);
  //   api.velocity.set(0, 0, 0);
  //   api.angularVelocity.set(0, 0, 0);
  // }, [ballPosition]);

  const setBallApi = useStore((state) => state.setBallApi);

  // Subscribe to the velocity and angularVelocity once
  // useEffect(() => {
  //   console.log("setting velocity...");

  //   setBallApi({});

  //   // const unsubscribePosition = api.position.subscribe((position) => {
  //   //   //console.log(position[1]);
  //   // });

  //   const unsubscribeLinear = api.velocity.subscribe((v) => {
  //     linearVelocity.current = new Vector3(v[0], v[1], v[2]);
  //     //console.log(`Linear velocity changging...${JSON.stringify(v)}`);
  //     // console.log(`Velocity Z ${v[2].toFixed(2)}`);
  //     // console.log(`Velocity X ${v[0].toFixed(2)}`);
  //     // console.log(`Velocity Y ${v[1].toFixed(2)}`);
  //     // console.log(`Velocity Z ${v[2].toFixed(2)}`);
  //     // if (Number(v[2].toFixed(2)) < 1) {
  //     //   api.velocity.set(v[0], v[1], 0);
  //     // }
  //     // if (Math.abs(Number(v[1].toFixed(2))) < 1) {
  //     //   api.velocity.set(v[0], 0, v[2]);
  //     // }
  //   });
  //   const unsubscribeAngular = api.angularVelocity.subscribe((w) => {
  //     angularVelocity.current = new Vector3(w[0], w[1], w[2]);
  //     //console.log(`Angular velocity changging...${JSON.stringify(w)}`);
  //     // console.log(`Angular ${w}`);

  //     setSideSpin(angularVelocity.current.y.toFixed(2));
  //     setBackSpin(angularVelocity.current.x.toFixed(2));
  //   });

  //   // Cleanup the subscription when the component unmounts
  //   return () => {
  //     unsubscribePosition();
  //     unsubscribeLinear();
  //     unsubscribeAngular();
  //   };
  // }, [api.velocity, api.angularVelocity]);

  // useFrame(() => {
  //   const test = true;
  //   if (test) return;

  //   // console.log(api.velocity);

  //   const backSpinRate = Number(angularVelocity.current.x.toFixed(2));

  //   /**
  //    * To do - figure out how to only do this after the ball is hit
  //    */
  //   if (
  //     Number(linearVelocity.current.z.toFixed(2)) > 0 &&
  //     backSpinRate < 3 &&
  //     backSpinRate !== 0
  //   ) {
  //     console.log("BAM");
  //     api.angularVelocity.set(0, angularVelocity.current.y, 0);
  //   }

  //   if (test) return;
  //   // if (!hasHit) return;

  //   // Magnus effect parameters
  //   const ballRadius = BALL_RADIUS; // Radius of the ball
  //   const airDensity = 1.225; // Approximate air density (kg/m^3)
  //   const liftCoefficient = 0.2; // Empirical coefficient, adjust for realism

  //   // Compute Magnus force
  //   const magnusForce = new Vector3()
  //     .crossVectors(angularVelocity.current, linearVelocity.current)
  //     .multiplyScalar(liftCoefficient * airDensity * Math.pow(ballRadius, 3));

  //   // .multiplyScalar(
  //   //   liftCoefficient *
  //   //     airDensity *
  //   //     Math.PI *
  //   //     Math.pow(ballRadius, 3) *
  //   //     linearVelocity.current.length()
  //   // );

  //   // Get the ball's linear and angular velocity
  //   // api.velocity.get((v) => linearVelocity.set(v[0], v[1], v[2]));
  //   // api.angularVelocity.get((w) => angularVelocity.set(w[0], w[1], w[2]));

  //   // If both velocities are small, skip applying Magnus force
  //   // this is measuring magnitude
  //   if (
  //     linearVelocity.current.length() === 0 ||
  //     angularVelocity.current.length() === 0
  //   )
  //     return;

  //   // Apply the Magnus force to the ball
  //   const crossWind = 0;
  //   const linearWind = 0;
  //   // api.applyForce(
  //   //   [magnusForce.x + crossWind, magnusForce.y, magnusForce.z + linearWind],
  //   //   [0, 0, 0] // Apply at the ball's center
  //   // );

  //   // console.log(`Apply ${magnusForce.x} force`);
  // });

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
  const ballRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (ballRef.current) {
      console.log("Setting ball ref...");
      setBallRef(ballRef);
    }
  }, []);

  useEffect(() => {
    setBallMoving(ballRef.current?.isMoving());
  }, [ballRef.current]);

  const RESTITUTION = 0.3; // Bounciness
  const LINEAR_DAMPING = 0.5; // Slows translational motion (straight line motion)
  const ANGULAR_DAMPING = 0.5; // Slows rotational motion

  return (
    <RigidBody
      ref={ballRef}
      mass={1}
      colliders="ball"
      friction={1}
      restitution={RESTITUTION}
      linearDamping={LINEAR_DAMPING}
      angularDamping={ANGULAR_DAMPING}
      position={golfBallLocation}
    >
      <mesh receiveShadow>
        <sphereGeometry args={[BALL_RADIUS, 10, 10]} />
        <meshStandardMaterial color={"white"} wireframe={isDevMode} />
        <axesHelper args={[2]} visible={isDevMode} />
      </mesh>
    </RigidBody>
  );
};

const DevTools = () => {
  const windSpeed = useStore((state) => state.windSpeed);
  const windDirection = useStore((state) => state.windDirection);
  const sideSpin = useStore((state) => state.sideSpin);
  const backSpin = useStore((state) => state.backSpin);
  const setBallPosition = useStore((state) => state.setBallPosition);
  const ballPosition = useStore((state) => state.ballPosition);
  const resetBall = useStore((state) => state.resetBall);
  const ballRef: RapierRigidBody = useStore((state) => state.ballRef.current);
  const setBallMoving = useStore((state) => state.setBallMoving);
  const isMoving = useStore((state) => state.isMoving);
  const toggleDevMode = useStore((state) => state.toggleDevMode);
  const isDevMode = useStore((state) => state.isDevMode);
  const setGolfBallLocation = useStore((state) => state.setGolfBallLocation);

  useEffect(() => {
    if (window.location.hash && window.location.hash === "#dev") {
      toggleDevMode(true);
    }
  }, []);

  useEffect(() => {
    // Update position and angular velocity each frame
    const interval = setInterval(() => {
      //console.log("ere");
      if (ballRef) {
        setBallMoving(ballRef.isMoving());
        //console.log(ballRef.isMoving() ? "yes" : "no");
        // Get current position (translation)
        const currentPosition = ballRef.translation();

        setBallPosition(currentPosition);
        // setPosition([currentPosition.x, currentPosition.y, currentPosition.z]);
        //console.log(currentPosition);

        // Get current angular velocity (spin rate)
        const currentAngularVelocity = ballRef.rotation();
        // setAngularVelocity([
        //   currentAngularVelocity.x,
        //   currentAngularVelocity.y,
        //   currentAngularVelocity.z,
        // ]);
      }
    }, 100); // Update every 100ms (10 times per second)

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [ballRef]);

  if (!ballRef) {
    return <div>Loading...</div>;
  }

  const handleResetBall = () => {
    ballRef.setTranslation(new Vector3(0, 5, 0), true);
    ballRef.setAngvel({ x: 0, y: 0, z: 0 }, false); // angular velocity (rotation)
    ballRef.setLinvel({ x: 0, y: 0, z: 0 }, false); // linear velocity (speed)
  };

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
      <div>
        <button onClick={() => toggleDevMode()}>Toggle Dev Mode</button>
      </div>
      {isDevMode && (
        <>
          <span>Wind Speed: {windSpeed}</span>
          <br />
          <span>Wind Direction: {windDirection}</span>
          <br />
          <span>Is Moving: {isMoving ? "Yes" : "No"}</span>
          <br />
          <span>Height: {ballPosition.y?.toFixed(2)}</span>
          <br />
          <span>Side Speed: {sideSpin}</span>
          <br />
          <span>Back Spin: {backSpin}</span>
          <br />
          <button onClick={() => handleResetBall()}>Reset Ball</button>
          <button onClick={() => hitBall(ballRef)}>Hit Ball</button>
        </>
      )}
    </div>
  );
};

const GameUI = () => {
  const isDevMode = useStore((state) => state.isDevMode);
  const ballRef: RapierRigidBody = useStore((state) => state.ballRef.current);
  const score = useStore((state) => state.score);
  const setScore = useStore((state) => state.setScore);
  const resetBall = useStore((state) => state.resetBall);
  const isBallInHole = useStore((state) => state.isBallInHole);
  const setBallInHole = useStore((state) => state.setBallInHole);

  if (isDevMode || !ballRef) return null;

  return (
    <>
      {isBallInHole && (
        <div
          style={{
            zIndex: 999,
            position: "fixed",
            top: 0,
            left: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            height: "100%",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
            }}
          >
            <div>
              <h1 style={{ fontSize: 40, fontWeight: "bold", color: "white" }}>
                You made it in the hole with a score of {score}!
              </h1>
              <button
                onClick={() => {
                  resetBall();
                  setBallInHole(false);
                  setScore(0);
                }}
                style={{ fontSize: 20 }}
              >
                Play again
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          zIndex: 998,
          position: "fixed",
          bottom: 0,
          right: 0,
          background: "rgba(0,0,0,0)",
          padding: 2,
          width: "100%",
        }}
      >
        <div
          style={{
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            style={{ fontSize: 40, fontWeight: "bold" }}
            onClick={() => hitBall(ballRef)}
          >
            Hit Ball!
          </button>
          <span style={{ fontSize: 40, fontWeight: "bold" }}>
            Score: {score}
          </span>
        </div>
      </div>
    </>
  );
};

export const App = () => {
  const isDevMode = useStore((state) => state.isDevMode);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (isDevMode) return;

    if (cameraRef.current) {
      cameraRef.current.position.set(10, 10, -10);
      cameraRef?.current.lookAt(0, 20, -80); // Make the camera face the ball
    }
  }, [isDevMode]);

  return (
    <>
      <DevTools />
      <GameUI />
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

        {/* <arrowHelper
          args={[
            new Vector3(0, 13.680805733026748, 37.58770483143634).normalize(), // we normalize here just to get direction, we don't care about length or magnitude.
            new Vector3(0, 0, 0),
            30,
            0xff0000,
          ]}
        /> */}

        <Physics gravity={[0, -19.8, 0]} debug={isDevMode}>
          <FlagStick position={[0, 4, 80]} />
          {/* <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} /> */}
          <GolfBall />
          <Course />
        </Physics>
        <OrbitControls enabled={isDevMode} makeDefault={isDevMode} />
        <PerspectiveCamera makeDefault={!isDevMode} ref={cameraRef} fov={100} />

        {isDevMode && <Stats />}
        <axesHelper args={[5]} visible={isDevMode} />
      </Canvas>
    </>
  );
};
