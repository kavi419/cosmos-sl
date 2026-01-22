import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';

const PLANET_DATA = [
  { name: 'SUN', texture: '/textures/sun.jpg', size: 8, position: [0, 0, 0], description: 'The Star' },
  { name: 'MERCURY', texture: '/textures/mercury.jpg', size: 0.8, position: [12, 0, 0], description: 'The Swift Planet' },
  { name: 'VENUS', texture: '/textures/venus.jpg', size: 1.5, position: [18, 0, 5], description: 'The Morning Star' },
  { name: 'EARTH', texture: '/textures/earth.jpg', size: 2.5, position: [28, 0, 0], description: 'Our Home' },
  { name: 'MARS', texture: '/textures/2k_mars.jpg', size: 1.8, position: [38, 0, -5], description: 'The Red Planet' },
  { name: 'JUPITER', texture: '/textures/jupiter.jpg', size: 5, position: [55, 0, 10], description: 'The Gas Giant' },
  { name: 'SATURN', texture: '/textures/saturn.jpg', size: 4.5, position: [75, 0, -10], description: 'The Ringed Planet' },
  { name: 'URANUS', texture: '/textures/uranus.jpg', size: 3, position: [95, 0, 5], description: 'The Ice Giant' },
  { name: 'NEPTUNE', texture: '/textures/neptune.jpg', size: 2.8, position: [115, 0, -5], description: 'The Blue Giant' },
];

function Atmosphere({ position }) {
  return (
    <mesh position={position} scale={[1.1, 1.1, 1.1]}>
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

function Clouds({ position }) {
  const cloudMap = useLoader(TextureLoader, '/textures/clouds.jpg');
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0001;
    }
  });
  return (
    <mesh ref={ref} position={position} scale={[1.02, 1.02, 1.02]}>
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
    <group position={[0, 0, 0]}>
      {/* Sun Core */}
      <mesh>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial map={sunMap} color="#ffcc00" />
      </mesh>
    </group>
  );
}

function Planet({ name, texture, size, position }) {
  const map = useLoader(TextureLoader, texture);
  const ringStrip = useLoader(TextureLoader, name === 'SATURN' ? '/textures/saturn_ring_strip.jpg' : '/textures/sun.jpg');
  const ref = useRef();

  // Configure texture only once or when it changes
  useEffect(() => {
    if (name === 'SATURN' && ringStrip) {
      ringStrip.center.set(0.5, 0.5);
      ringStrip.rotation = 0; // Reset rotation to ensure horizontal strip maps correctly
    }
  }, [name, ringStrip]);

  const ringGeo = useMemo(() => {
    if (name !== 'SATURN') return null;
    const geometry = new THREE.RingGeometry(size + 1, size + 6, 64);
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const radius = v3.length();
      // Map radius to U coordinate [0, 1]
      const u = (radius - (size + 1)) / 5; // 5 is the width of the ring ( (size+6) - (size+1) )
      uv.setXY(i, u, 0.5); // Sample middle horizontal line of the strip
    }
    return geometry;
  }, [name, size]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
    }
  });

  return (
    <group position={position}>
      {/* Surface */}
      <mesh ref={ref}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial map={map} />
      </mesh>

      {/* Conditional: Venus Atmosphere */}
      {name === 'VENUS' && (
        <mesh scale={[1.05, 1.05, 1.05]}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshPhongMaterial
            color="#e6c073"
            transparent={true}
            opacity={0.8}
            shininess={50}
          />
        </mesh>
      )}

      {/* Conditional: Saturn Rings */}
      {name === 'SATURN' && (
        <mesh geometry={ringGeo} rotation={[-Math.PI / 2, 0.15, 0]}>
          <meshBasicMaterial
            map={ringStrip}
            side={THREE.DoubleSide}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}

function EarthGroup() {
  const earthData = PLANET_DATA.find(p => p.name === 'EARTH');
  const earthMap = useLoader(TextureLoader, '/textures/earth.jpg');
  const moonMap = useLoader(TextureLoader, '/textures/moon.jpg');
  const earthRef = useRef();
  const moonRef = useRef();

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.00004;
    }
    if (moonRef.current) {
      const t = clock.getElapsedTime() * 0.1;
      const distance = 8;
      moonRef.current.position.x = Math.sin(t) * distance;
      moonRef.current.position.z = Math.cos(t) * distance;
      moonRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group position={earthData.position}>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial map={earthMap} />
      </mesh>

      {/* Atmosphere and Clouds */}
      <Atmosphere position={[0, 0, 0]} />
      <Clouds position={[0, 0, 0]} />

      {/* Moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial map={moonMap} />
      </mesh>
    </group>
  );
}

function CameraHandler({ target }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!controls) return;

    const data = PLANET_DATA.find(p => p.name === target);
    if (!data) return;

    const [tx, ty, tz] = data.position;
    const viewSize = data.size * 5;

    gsap.to(camera.position, {
      x: tx + viewSize,
      y: ty + data.size,
      z: tz + viewSize,
      duration: 2,
      ease: 'power2.inOut',
    });

    gsap.to(controls.target, {
      x: tx,
      y: ty,
      z: tz,
      duration: 2,
      ease: 'power2.inOut',
    });
  }, [target, camera, controls]);

  return null;
}

function App() {
  const [target, setTarget] = useState('EARTH');
  const currentPlanet = PLANET_DATA.find(p => p.name === target);

  const sidebarStyle = {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 20,
    pointerEvents: 'auto',
  };

  const navButtonStyle = {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    color: '#00ffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    textAlign: 'left',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    width: '120px',
    backdropFilter: 'blur(5px)',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: 'black', overflow: 'hidden' }}>

      {/* UI Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{ color: 'white' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '0.2em', margin: 0 }}>COSMOS EXPLORER</h1>
          <p style={{ opacity: 0.7, margin: '5px 0 0 0' }}>SOLAR SYSTEM EXPLORATION // v2.0</p>
        </div>

        {/* Sidebar Navigation */}
        <div style={sidebarStyle}>
          <p style={{ color: '#00ffff', fontSize: '0.6rem', marginBottom: '5px', opacity: 0.5, fontFamily: 'monospace' }}>NAVIGATION_TARGETS</p>
          {PLANET_DATA.map(planet => (
            <button
              key={planet.name}
              onClick={() => setTarget(planet.name)}
              style={{
                ...navButtonStyle,
                background: target === planet.name ? 'rgba(0, 255, 255, 0.2)' : navButtonStyle.background,
                borderColor: target === planet.name ? 'rgba(0, 255, 255, 1)' : navButtonStyle.borderColor,
                boxShadow: target === planet.name ? '0 0 15px rgba(0, 255, 255, 0.3)' : 'none',
              }}
            >
              {planet.name}
            </button>
          ))}
        </div>

        {/* Bottom Data Logs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontFamily: 'monospace' }}>
          <div>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>CURRENT_TARGET</span><br />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{target}</span><br />
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{currentPlanet?.description}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            STATUS: ACTIVE LINK<br />
            VELOCITY: {target === 'SUN' ? '---' : '29.78 KM/S'}<br />
            DISTANCE: {target === 'SUN' ? '0' : '149.6M KM'}
          </div>
        </div>
      </div>

      {/* 3D Canvas Layer */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 50], fov: 45 }}>
          <CameraHandler target={target} />
          <ambientLight intensity={1.0} />
          <pointLight position={[0, 0, 0]} intensity={3.0} distance={300} decay={1} />
          <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Render Planets */}
          {PLANET_DATA.map(planet => {
            if (planet.name === 'SUN') return <Sun key={planet.name} />;
            if (planet.name === 'EARTH') return <EarthGroup key={planet.name} />;
            return <Planet key={planet.name} {...planet} />;
          })}

          <OrbitControls makeDefault enableZoom={true} enablePan={false} enableRotate={true} />

          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.02} intensity={1.5} height={300} />
          </EffectComposer>
        </Canvas>
      </div>

    </div>
  );
}

export default App;
