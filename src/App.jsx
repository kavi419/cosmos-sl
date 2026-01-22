import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

function Atmosphere() {
  return (
    <mesh scale={[1.1, 1.1, 1.1]}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshPhongMaterial
        color="#4488ff"
        opacity={0.1}
        transparent={true}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Clouds() {
  const cloudMap = useLoader(TextureLoader, '/textures/clouds.jpg');
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0001;
    }
  });
  return (
    <mesh ref={ref} scale={[1.02, 1.02, 1.02]}>
      <sphereGeometry args={[2.53, 32, 32]} />
      <meshStandardMaterial
        map={cloudMap}
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Sun() {
  const sunMap = useLoader(TextureLoader, '/textures/sun.jpg');
  return (
    <group position={[15, 5, 10]}>
      {/* Sun Core */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial map={sunMap} color="#ffcc00" />
      </mesh>
    </group>
  );
}

function Earth() {
  const earthMap = useLoader(TextureLoader, '/textures/earth.jpg');
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.00004;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial map={earthMap} />
    </mesh>
  );
}

function Moon() {
  const moonMap = useLoader(TextureLoader, '/textures/moon.jpg');
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * 0.1;
      const distance = 8;
      ref.current.position.x = Math.sin(t) * distance;
      ref.current.position.z = Math.cos(t) * distance;
      ref.current.rotation.y += 0.002;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial map={moonMap} />
    </mesh>
  );
}

function App() {
  return (
    // USE INLINE STYLES to guarantee full screen size, ignoring external CSS issues.
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: 'black', overflow: 'hidden' }}>

      {/* UI Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{ color: 'white' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '0.2em', margin: 0 }}>COSMOS EXPLORER</h1>
          <p style={{ opacity: 0.7, margin: '5px 0 0 0' }}>INTERACTIVE SYSTEM // ONLINE</p>
        </div>
        {/* Bottom Data Logs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontFamily: 'monospace' }}>
          <div>TARGET: EARTH<br />STATUS: HABITABLE</div>
          <div style={{ textAlign: 'right' }}>ORBIT: STABLE<br />LIGHT SOURCE: DETECTED</div>
        </div>
      </div>

      {/* 3D Canvas Layer */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[15, 5, 10]} intensity={2.0} />
          <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Components */}
          <Earth />
          <Clouds />
          <Atmosphere />
          <Moon />
          <Sun />

          <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.02}
              intensity={2.0}
              height={300}
            />
          </EffectComposer>
        </Canvas>
      </div>

    </div>
  );
}

export default App;
