"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Evenly spread points on a sphere (fibonacci sphere) — stand-ins for applications/evidence nodes. */
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return points;
}

function EvidenceGraph() {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(() => fibonacciSphere(26, 2.1), []);

  // Connect every node to its two nearest neighbours — a light, readable mesh rather than a dense tangle.
  const edges = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    nodes.forEach((a, i) => {
      const distances = nodes
        .map((b, j) => ({ j, d: i === j ? Infinity : a.distanceTo(b) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      for (const { j } of distances) pairs.push([a, nodes[j]]);
    });
    return pairs;
  }, [nodes]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = Math.sin(Date.now() * 0.00012) * 0.15;
    }
  });

  return (
    <group ref={group}>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color="#5b7ba3" transparent opacity={0.28} lineWidth={1} />
      ))}
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 7 === 0 ? 0.09 : 0.05, 16, 16]} />
          <meshStandardMaterial
            color={i % 7 === 0 ? "#e08a1e" : "#dce6f0"}
            emissive={i % 7 === 0 ? "#e08a1e" : "#1f3a5f"}
            emissiveIntensity={i % 7 === 0 ? 1.1 : 0.35}
          />
        </mesh>
      ))}
      {/* Decision core */}
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color="#e08a1e" emissive="#c4740f" emissiveIntensity={0.9} wireframe />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#fdf1de" />
      <pointLight position={[-4, -2, -3]} intensity={20} color="#3a5a82" />
      <EvidenceGraph />
    </Canvas>
  );
}
