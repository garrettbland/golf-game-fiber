import { DoubleSide, THREE } from "three";

/**
 * Mesh standard material gets shadows and stuff
 * Mesh basic material doesn't get shadows
 */

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
  return (
    <mesh {...props} receiveShadow wireframe>
      <cylinderGeometry args={[0.1, 0.1, 10, 10]} />
      <meshStandardMaterial color="white" />
      <Flag />
    </mesh>
  );
};
