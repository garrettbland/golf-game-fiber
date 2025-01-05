import { DoubleSide, THREE } from "three";
import { useRef } from "react";
import {
  Physics,
  RigidBody,
  Debug,
  RigidBodyProps,
  RapierRigidBody,
  CuboidCollider,
  CylinderCollider,
} from "@react-three/rapier";
import { useStore } from "./App";

/**
 * Mesh standard material gets shadows and stuff
 * Mesh basic material doesn't get shadows
 */

const Hole = ({ onBallInHole }: { onBallInHole: () => void }) => {
  return (
    <>
      <mesh position={[0, -5.2, 0]} receiveShadow>
        {/* Invisible cylinder representing the hole */}
        <cylinderGeometry args={[2, 2, 1, 32]} />
        <meshStandardMaterial color={"black"} opacity={1} />
      </mesh>
      <CylinderCollider
        sensor // Makes it a sensor (only detects overlaps, no physics interaction)
        onIntersectionEnter={(event) => {
          console.log(event);
          console.log("HERERE");
          // event.other
          // event.other.rigidBodyObject?.name === "ball"
          onBallInHole(); // Trigger callback when ball enters
        }}
        position={[0, -5.5, 0]}
        args={[1, 2]}
      />
    </>
  );
};

const Flag = () => {
  /**
   * A float32array is a way to handle arrays more effeciantly. It can only hold 32 bit floating
   * point numbers
   *
   * The vertices array defines the three corners of the triangle in 3D space: (x, y, z) coordinates.
   */
  const top = [0, 1, 0];
  const bottomLeft = [-1, -1, 0];
  const bottomRight = [1, -1, 0];
  const vertices = new Float32Array([...top, ...bottomLeft, ...bottomRight]);

  return (
    <mesh
      scale={[1.2, 1.2, 1.2]}
      receiveShadow
      position={[-0.5, 4, 0]}
      rotation={[0, 0, -0.5]}
    >
      <bufferGeometry>
        {/* Pass the vertices to the geometry */}
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length / 3}
          array={vertices}
          itemSize={3} // Each vertex has 3 values: x, y, z
        />
      </bufferGeometry>
      <meshStandardMaterial color="red" side={DoubleSide} />
    </mesh>
  );
};

export const FlagStick = (props) => {
  const setBallInHole = useStore((state) => state.setBallInHole);

  return (
    <RigidBody colliders="hull" includeInvisible type="fixed">
      <mesh {...props} receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 10, 10]} />
        <meshStandardMaterial color="white" />
        <Flag />
        <Hole onBallInHole={() => setBallInHole(true)} />
      </mesh>
    </RigidBody>
  );
};
