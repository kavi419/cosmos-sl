import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { OrbitControls, Stars, useProgress, Text } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';

const ARCHIVE_POS = [0, 30, 150];

const PLANET_DATA = [
  {
    name: 'SUN', texture: '/textures/sun.jpg', size: 8, position: [0, 0, 0], description: 'The Star',
    details: 'Type: G-Type Main Sequence | Temp: 5,500°C', gravity: '247 m/s²',
    wiki: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. The Sun radiates energy mainly as visible light, ultraviolet light, and infrared radiation. It is by far the most important source of energy for life on Earth."
  },
  {
    name: 'MERCURY', texture: '/textures/mercury.jpg', size: 0.8, position: [12, 0, 0], description: 'The Swift Planet',
    details: 'Orbit: 88 Days | Temp: 430°C / -180°C', gravity: '3.7 m/s²',
    wiki: "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun's planets. Mercury is a rocky planet with a heavily cratered surface, similar to the Moon, indicating that it has been geologically inactive for billions of years."
  },
  {
    name: 'VENUS', texture: '/textures/venus.jpg', size: 1.5, position: [18, 0, 5], description: 'The Morning Star',
    details: 'Atmosphere: CO2 | Temp: 462°C', gravity: '8.87 m/s²',
    wiki: "Venus is the second planet from the Sun. It is a terrestrial planet and is sometimes called Earth's 'sister planet' because of their similar size, mass, proximity to the Sun, and bulk composition. However, it is radically different from Earth in other respects. It has the densest atmosphere of the four terrestrial planets, consisting of more than 96% carbon dioxide."
  },
  {
    name: 'EARTH', texture: '/textures/earth.jpg', size: 2.5, position: [28, 0, 0], description: 'Terra',
    details: 'Population: 8 Billion | Moon: 1', gravity: '9.8 m/s²',
    wiki: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. While large volumes of water can be found throughout the Solar System, only Earth sustains liquid surface water. Earth's atmosphere consists mostly of nitrogen and oxygen. It is the cradle of humanity and our only home in the vast cosmos."
  },
  {
    name: 'MARS', texture: '/textures/2k_mars.jpg', size: 1.8, position: [38, 0, -5], description: 'The Red Planet',
    details: 'Orbit: 687 Days | Temp: -63°C', gravity: '3.71 m/s²',
    wiki: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being larger than only Mercury. Mars carries the name of the Roman god of war and is often referred to as the 'Red Planet'. The latter refers to the effect of the iron oxide prevalent on Mars's surface, which gives it a striking reddish appearance."
  },
  {
    name: 'JUPITER', texture: '/textures/jupiter.jpg', size: 5, position: [55, 0, 10], description: 'The Gas Giant',
    details: 'Moons: 95 | Diameter: 139,820 km', gravity: '24.79 m/s²',
    wiki: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets in the Solar System combined, but slightly less than one-thousandth the mass of the Sun. Jupiter is primarily composed of hydrogen, followed by helium, which constitutes a quarter of its mass."
  },
  {
    name: 'SATURN', texture: '/textures/saturn.jpg', size: 4.5, position: [75, 0, -10], description: 'The Ringed Planet',
    details: 'Rings: 7 Groups | Moons: 146', gravity: '10.44 m/s²',
    wiki: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth. Saturn's most famous feature is its prominent ring system, which is composed mostly of ice particles, with a smaller amount of rocky debris and dust."
  },
  {
    name: 'URANUS', texture: '/textures/uranus.jpg', size: 3, position: [95, 0, 5], description: 'The Ice Giant',
    details: 'Tilt: 98° | Temp: -224°C', gravity: '8.69 m/s²',
    wiki: "Uranus is the seventh planet from the Sun. Its name is a reference to the Greek god of the sky, Uranus. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus is similar in composition to Neptune, and both have bulk chemical compositions which differ from that of the larger gas giants Jupiter and Saturn."
  },
  {
    name: 'NEPTUNE', texture: '/textures/neptune.jpg', size: 2.8, position: [115, 0, -5], description: 'The Blue Giant',
    details: 'Winds: 2,100 km/h | Temp: -214°C', gravity: '11.15 m/s²',
    wiki: "Neptune is the eighth planet from the Sun and the farthest known solar planet. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet. Neptune is 17 times the mass of Earth, slightly more massive than its near-twin Uranus. The planet's striking blue color is due to methane in its atmosphere."
  },
];

function LoadingScreen() {
  const { active } = useProgress(); // Check if real loading is active
  const [progressValue, setProgressValue] = useState(0);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    // Animate progress from 0 to 100 over ~2 seconds
    const interval = setInterval(() => {
      setProgressValue((old) => {
        if (old >= 100) {
          clearInterval(interval);
          return 100;
        }
        return old + 1; // Increment by 1% every ~20ms
      });
    }, 20); // 20ms * 100 steps = 2000ms (2 seconds)

    return () => clearInterval(interval);
  }, []);

  // Wait until visual animation is done (100%) AND real assets are loaded (!active)
  if (progressValue === 100 && !active) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'black', zIndex: 9999, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#4ade80', fontFamily: 'monospace', padding: isMobile ? '20px' : '0'
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.8rem' : '4rem',
        fontWeight: 'bold',
        marginBottom: '10px',
        letterSpacing: isMobile ? '0.05em' : '0.2em',
        textAlign: 'center'
      }}>
        COSMOS EXPLORER
      </h1>
      <div style={{ fontSize: isMobile ? '0.7rem' : '1.2rem', marginBottom: '20px' }}>
        SYSTEM INITIALIZING...
      </div>

      {/* Progress Bar Container */}
      <div style={{
        width: '300px',
        height: '4px',
        background: '#111',
        borderRadius: '2px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(74, 222, 128, 0.2)'
      }}>
        {/* Smoothly Animated Bar */}
        <div style={{
          width: `${progressValue}%`,
          height: '100%',
          background: '#4ade80',
          boxShadow: '0 0 20px #4ade80', // Glowing effect
          transition: 'width 0.1s linear' // Smooth movement
        }} />
      </div>

      <p style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
        BOOT SEQUENCE: {progressValue}%
      </p>
    </div>
  );
}

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

function Clouds({ position, speed = 1 }) {
  const cloudMap = useLoader(TextureLoader, '/textures/clouds.jpg');
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0001 * speed;
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

function AsteroidBelt({ speed = 1 }) {
  const count = 2000;
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const asteroids = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = 38 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 4;
      const scale = 0.1 + Math.random() * 0.3;
      const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
      data.push({ x, y, z, scale, rotation });
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    asteroids.forEach((data, i) => {
      dummy.position.set(data.x, data.y, data.z);
      dummy.rotation.set(...data.rotation);
      dummy.scale.set(data.scale, data.scale, data.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, dummy]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005 * speed;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#8c8c8c" roughness={0.8} />
    </instancedMesh>
  );
}

function Planet({ name, texture, size, position, speed = 1 }) {
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
      ref.current.rotation.y += 0.001 * speed;
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

function HolographicScreen({ planet, isOpen, isMobile }) {
  if (!planet || !isOpen) return null;

  return (
    <group position={ARCHIVE_POS}>
      {/* The Glow Screen */}
      <mesh>
        <planeGeometry args={[45, 28]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid Wireframe */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[45, 28]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.2} wireframe={true} />
      </mesh>

      {/* Header */}
      <Text
        position={[0, 10, 0.2]}
        fontSize={isMobile ? 1.5 : 3}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        {planet.name} DATABASE
      </Text>

      {/* Sub-Header */}
      <Text
        position={[-20, 7, 0.2]}
        fontSize={0.8}
        color="#00ffff"
        anchorX="left"
        anchorY="middle"
      >
        CLASSIFIED_DATA_ARCHIVE // SECTOR_07
      </Text>

      {/* Body Text */}
      <Text
        position={[0, -2, 0.2]}
        fontSize={isMobile ? 0.7 : 1}
        maxWidth={isMobile ? 22 : 40}
        lineHeight={1.4}
        color="white"
        textAlign="justify"
        anchorX="center"
        anchorY="middle"
      >
        {planet.wiki}
        {"\n\n"}
        SYSTEM ANALYSIS: Nominal conditions.
      </Text>

      {/* Scanning Line Effect */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[45, 0.1]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function EarthGroup({ speed = 1 }) {
  const earthData = PLANET_DATA.find(p => p.name === 'EARTH');
  const earthMap = useLoader(TextureLoader, '/textures/earth.jpg');
  const moonMap = useLoader(TextureLoader, '/textures/moon.jpg');
  const earthRef = useRef();
  const moonRef = useRef();

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.00004 * speed;
    }
    if (moonRef.current) {
      const t = clock.getElapsedTime() * 0.1 * speed;
      const distance = 8;
      moonRef.current.position.x = Math.sin(t) * distance;
      moonRef.current.position.z = Math.cos(t) * distance;
      moonRef.current.rotation.y += 0.002 * speed;
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
      <Clouds position={[0, 0, 0]} speed={speed} />

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

    const isMobile = window.innerWidth < 768;

    if (target === 'ARCHIVE') {
      gsap.to(camera.position, {
        x: ARCHIVE_POS[0],
        y: ARCHIVE_POS[1],
        z: ARCHIVE_POS[2] + (isMobile ? 120 : 40),
        duration: 2.5,
        ease: 'power3.inOut',
      });

      gsap.to(controls.target, {
        x: ARCHIVE_POS[0],
        y: ARCHIVE_POS[1],
        z: ARCHIVE_POS[2],
        duration: 2.5,
        ease: 'power3.inOut',
      });
      return;
    }

    const data = PLANET_DATA.find(p => p.name === target);
    if (!data) return;

    const [tx, ty, tz] = data.position;
    const viewSize = data.size * (isMobile ? 8 : 5);

    gsap.to(camera.position, {
      x: tx + viewSize,
      y: ty + data.size,
      z: tz + viewSize + (isMobile ? 10 : 0),
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
  const [prevTarget, setPrevTarget] = useState('EARTH');
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(new Audio('/sounds/space.mp3'));
  const currentPlanet = PLANET_DATA.find(p => p.name === (target === 'ARCHIVE' ? prevTarget : target));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 1.0;
    if (audioPlaying) {
      audio.play().catch(e => console.log("Audio play deferred until interaction."));
    } else {
      audio.pause();
    }
  }, [audioPlaying]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const sidebarStyle = {
    position: 'absolute',
    left: isMobile ? '0' : 'auto',
    right: isMobile ? '0' : '20px',
    top: isMobile ? 'auto' : '50%',
    bottom: isMobile ? '10px' : 'auto',
    width: isMobile ? '100vw' : 'auto',
    transform: isMobile ? 'none' : 'translateY(-50%)',
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    overflowX: isMobile ? 'auto' : 'visible',
    whiteSpace: isMobile ? 'nowrap' : 'normal',
    padding: isMobile ? '10px 20px' : '0',
    gap: isMobile ? '8px' : '10px',
    zIndex: 20,
    pointerEvents: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const navButtonStyle = {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    color: '#00ffff',
    padding: isMobile ? '4px 8px' : '6px 12px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: isMobile ? '0.6rem' : '0.7rem',
    textAlign: 'left',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    width: isMobile ? 'auto' : '120px',
    minWidth: isMobile ? '80px' : '120px',
    backdropFilter: 'blur(5px)',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: 'black', overflow: 'hidden' }}>
      <LoadingScreen />

      {/* UI Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
        padding: isMobile ? '20px' : '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        transition: 'opacity 0.5s ease',
        opacity: target === 'ARCHIVE' ? 0 : 1
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transform: isMobile ? 'scale(0.7)' : 'none', transformOrigin: 'top left' }}>
          <div style={{ color: 'white', marginBottom: '15px' }}>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '3rem', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>COSMOS EXPLORER</h1>
            <p style={{ opacity: 0.7, margin: '2px 0 0 0', fontSize: isMobile ? '0.5rem' : '1rem' }}>SOLAR SYSTEM EXPLORATION // v2.0</p>
          </div>
          <button
            onClick={() => setAudioPlaying(!audioPlaying)}
            style={{ ...navButtonStyle, width: 'auto', marginBottom: '20px', pointerEvents: 'auto' }}
          >
            {audioPlaying ? '[ 🔊 SOUND: ON ]' : '[ 🔇 SOUND: OFF ]'}
          </button>

          <div style={{ color: '#00ffff', fontFamily: 'monospace', fontSize: '0.7rem', pointerEvents: 'auto' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>TIME WARP: {timeSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={timeSpeed}
              onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
              style={{ width: '150px', cursor: 'pointer', accentColor: '#00ffff' }}
            />
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div style={sidebarStyle}>
          {isMobile && (
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
          )}
          <p style={{
            color: '#00ffff',
            fontSize: '0.5rem',
            marginBottom: isMobile ? '0' : '5px',
            marginRight: isMobile ? '10px' : '0',
            opacity: 0.5,
            fontFamily: 'monospace',
            display: isMobile ? 'none' : 'block'
          }}>NAVIGATION_TARGETS</p>
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

        {/* Planet Info Panel (Bottom Left) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            padding: isMobile ? '12px' : '25px',
            backdropFilter: 'blur(10px)',
            width: isMobile ? '100%' : '380px',
            boxSizing: 'border-box',
            marginBottom: isMobile ? '60px' : '0'
          }}>
            <span style={{ fontSize: '0.6rem', color: '#00ffff', opacity: 0.6, fontFamily: 'monospace' }}>DATA_STREAM // {target}</span><br />
            <span style={{ fontSize: isMobile ? '1.4rem' : '2.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.05em' }}>{target}</span><br />
            <span style={{ fontSize: isMobile ? '0.6rem' : '0.9rem', color: '#00ffff', opacity: 0.8 }}>{currentPlanet?.description}</span>
            <div style={{ height: '1px', background: 'rgba(0, 255, 255, 0.2)', margin: isMobile ? '10px 0' : '15px 0' }} />
            <div style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: isMobile ? '0.5rem' : '0.8rem', lineHeight: '1.4', marginBottom: '15px' }}>
              STATS: {currentPlanet?.details}<br />
              GRAVITY: {currentPlanet?.gravity}
            </div>
            {target !== 'ARCHIVE' && (
              <button
                onClick={() => { setPrevTarget(target); setTarget('ARCHIVE'); }}
                style={{
                  ...navButtonStyle,
                  width: 'auto',
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid #00ffff',
                  padding: '8px 20px',
                  pointerEvents: 'auto'
                }}
              >
                [ ACCESS ARCHIVE ]
              </button>
            )}
          </div>

          <div style={{ textAlign: 'right', color: '#4ade80', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            SYSTEM: ONLINE<br />
            VERSION: v2.0-STABLE
          </div>
        </div>
      </div>

      {/* Archive Interaction UI (Only visible in Archive Mode) */}
      {target === 'ARCHIVE' && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          pointerEvents: 'auto'
        }}>
          <button
            onClick={() => setTarget(prevTarget)}
            style={{
              ...navButtonStyle,
              width: 'auto',
              background: 'rgba(0, 255, 255, 0.1)',
              border: '2px solid #00ffff',
              padding: '12px 40px',
              fontSize: '1rem',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
            }}
          >
            RETURN TO ORBIT
          </button>
        </div>
      )}

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
            if (planet.name === 'EARTH') return <EarthGroup key={planet.name} speed={timeSpeed} />;
            return <Planet key={planet.name} {...planet} speed={timeSpeed} />;
          })}

          <AsteroidBelt speed={timeSpeed} />

          <OrbitControls makeDefault enableZoom={true} enablePan={false} enableRotate={true} />

          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.02} intensity={1.5} height={300} />
          </EffectComposer>

          <HolographicScreen planet={currentPlanet} isOpen={target === 'ARCHIVE'} isMobile={isMobile} />
        </Canvas>
      </div>

    </div>
  );
}

export default App;
