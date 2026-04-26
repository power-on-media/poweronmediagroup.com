import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Line, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Lenis from 'lenis';
import './styles.css';

const YELLOW = '#e8ff47';
const WHITE = '#f4f4ed';
const CYAN = '#80f7ff';

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return progress;
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

function Particles({ count = 1500 }) {
  const points = useRef();
  const [positions, colors] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const yellow = new THREE.Color(YELLOW);
    const white = new THREE.Color(WHITE);
    const cyan = new THREE.Color(CYAN);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 12;
      const a = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 34;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = Math.sin(a) * r * 0.58 + (Math.random() - 0.5) * 5;
      p[i * 3 + 2] = z;
      const col = Math.random() > 0.86 ? cyan : Math.random() > 0.55 ? yellow : white;
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    return [p, c];
  }, [count]);
  useFrame(({ clock }, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.025;
    points.current.rotation.z = Math.sin(clock.elapsedTime * 0.12) * 0.05;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.72} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function WireTunnel({ progress }) {
  const group = useRef();
  const rings = useMemo(() => Array.from({ length: 15 }, (_, i) => i), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.z = progress * Math.PI * 1.6 + Math.sin(clock.elapsedTime * 0.2) * 0.06;
    group.current.position.z = -progress * 10;
  });
  return (
    <group ref={group}>
      {rings.map((i) => (
        <mesh key={i} position={[0, 0, -i * 1.15]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.35 + i * 0.22, 0.006, 6, 96]} />
          <meshBasicMaterial color={YELLOW} transparent opacity={0.18 - i * 0.006} />
        </mesh>
      ))}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const pts = Array.from({ length: 15 }).map((__, j) => [Math.cos(a) * (2.35 + j * 0.22), Math.sin(a) * (2.35 + j * 0.22), -j * 1.15]);
        return <Line key={i} points={pts} color={YELLOW} transparent opacity={0.13} lineWidth={1} />;
      })}
    </group>
  );
}

function PowerCore({ progress }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.28 + progress * 3;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.35) * 0.16 + progress * 0.55;
    const s = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.025;
    group.current.scale.setScalar(s);
  });
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.32}>
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[1.16, 2]} />
          <meshStandardMaterial color="#101207" emissive={YELLOW} emissiveIntensity={0.42} roughness={0.22} metalness={0.7} wireframe />
        </mesh>
        <mesh scale={0.72}>
          <octahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={1.2} transparent opacity={0.22} roughness={0.18} metalness={0.35} />
        </mesh>
        {[1.7, 2.15, 2.6].map((r, idx) => (
          <mesh key={r} rotation={[idx * 0.7, idx * 0.42, idx * 0.2]}>
            <torusGeometry args={[r, 0.01, 8, 160]} />
            <meshBasicMaterial color={idx === 1 ? CYAN : YELLOW} transparent opacity={idx === 1 ? 0.18 : 0.26} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function CaseNode({ position, title, label, color = YELLOW }) {
  return (
    <Float speed={1.5} floatIntensity={0.18} rotationIntensity={0.14}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[2.45, 1.32, 0.08]} />
          <meshStandardMaterial color="#090909" emissive={color} emissiveIntensity={0.12} roughness={0.36} metalness={0.15} transparent opacity={0.82} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(2.45, 1.32, 0.08)]} />
          <lineBasicMaterial color={color} transparent opacity={0.65} />
        </lineSegments>
        <Text position={[-1.04, 0.36, 0.08]} fontSize={0.12} color={color} anchorX="left" anchorY="middle">{label}</Text>
        <Text position={[-1.04, -0.1, 0.08]} fontSize={0.22} maxWidth={1.95} color={WHITE} anchorX="left" anchorY="middle">{title}</Text>
      </group>
    </Float>
  );
}

function Scene({ progress, reduced }) {
  const rig = useRef();
  const mouse = useRef([0, 0]);
  useEffect(() => {
    const onMove = (e) => {
      mouse.current = [(e.clientX / window.innerWidth - 0.5), (e.clientY / window.innerHeight - 0.5)];
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  useFrame(({ camera }, delta) => {
    const p = ease(progress);
    const mx = mouse.current[0];
    const my = mouse.current[1];
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mx * 0.85 + Math.sin(p * Math.PI * 2) * 0.72, delta * 2.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -my * 0.45 + 0.2 - p * 0.25, delta * 2.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.4 - p * 2.1, delta * 1.6);
    camera.lookAt(0, 0, -2.6 - p * 3.5);
    if (rig.current) {
      rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, p * 2.2 + mx * 0.12, delta * 1.8);
      rig.current.position.y = THREE.MathUtils.lerp(rig.current.position.y, p * -0.35, delta * 1.6);
    }
  });
  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 18]} />
      <ambientLight intensity={0.34} />
      <pointLight position={[0, 1.6, 4]} intensity={5.5} color={YELLOW} />
      <pointLight position={[-4, -2, 2]} intensity={1.4} color={CYAN} />
      {!reduced && <Environment preset="night" />}
      <group ref={rig}>
        <Particles count={reduced ? 550 : 1700} />
        <WireTunnel progress={progress} />
        <PowerCore progress={progress} />
        <CaseNode position={[-3.35, -0.25, -3.8]} label="LIVE MEDIA" title="24/7 channels" />
        <CaseNode position={[3.08, 0.48, -5.2]} label="NATIVE APP" title="iOS products" color={CYAN} />
        <CaseNode position={[-2.8, 1.15, -7.1]} label="AI OPS" title="agent systems" />
        <CaseNode position={[2.6, -1.0, -8.5]} label="LAUNCH" title="sites that sell" color={CYAN} />
      </group>
    </>
  );
}

const chapters = [
  { k: '01 / system online', h: 'A cinematic build engine.', p: 'Strategy, design, code, media, and AI agents moving as one system.' },
  { k: '02 / command layer', h: 'Less agency. More operating system.', p: 'No handoff maze. One senior operator with team-scale output.' },
  { k: '03 / shipped proof', h: 'Live channels. Native apps. Authority engines.', p: 'Surfline Top Cams. Aww That Face. ADU Home Construction.' },
  { k: '04 / deploy', h: 'Bring the impossible-looking thing.', p: 'If it needs to look expensive, work correctly, and ship fast — start here.' }
];

function Overlay({ progress }) {
  const active = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
  return (
    <div className="overlay">
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Power-On home"><span className="power-dot" />POWER<span>-ON</span></a>
        <div className="navlinks"><a href="#proof">Proof</a><a href="#contact">Start</a></div>
      </nav>

      <section id="top" className="hero-copy chapter">
        <div className="kicker">AI-native skunkworks studio</div>
        <h1>Build the impossible-looking thing.</h1>
        <p>Immersive sites. Apps. Live systems. Automations. Agent-powered operations. Shipped fast.</p>
        <a className="cta" href="#contact">Start the build →</a>
      </section>

      <div className="chapter-track">
        {chapters.map((c, i) => (
          <section key={c.k} className={`chapter float-copy ${i === active ? 'active' : ''}`}>
            <div className="kicker">{c.k}</div>
            <h2>{c.h}</h2>
            <p>{c.p}</p>
          </section>
        ))}
      </div>

      <section id="proof" className="proof-panel">
        <div className="kicker">selected proof</div>
        <div className="proof-grid">
          <a href="https://www.youtube.com/watch?v=hm9iAviOZ20" target="_blank" rel="noreferrer"><b>Surfline Top Cams</b><span>24/7 live stream infrastructure</span></a>
          <a href="https://www.awwthatface.com/" target="_blank" rel="noreferrer"><b>Aww That Face</b><span>Native iOS product</span></a>
          <a href="https://aduhomeconstruction.com/" target="_blank" rel="noreferrer"><b>ADU Authority</b><span>SEO + lead capture engine</span></a>
        </div>
      </section>

      <section id="contact" className="contact-panel">
        <div>
          <div className="kicker">work with Marc</div>
          <h2>Bring the messy idea.</h2>
          <p>I’ll turn it into the thing people can see, use, buy, or pitch.</p>
        </div>
        <form id="contact-form" action="https://formspree.io/f/mpqynojk" method="POST">
          <input name="name" placeholder="Name" autoComplete="name" required />
          <input name="email" type="email" placeholder="Email" autoComplete="email" required />
          <textarea name="message" placeholder="What are we building? The messy version is fine." required />
          <button type="submit">Send signal →</button>
          <div className="success" id="form-success">Signal received. Marc will reply directly.</div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const progress = useScrollProgress();
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(mobile || motion);
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    let raf;
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
  useEffect(() => {
    const form = document.getElementById('contact-form');
    const success = document.getElementById('form-success');
    if (!form || !success) return;
    const onSubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) { Array.from(form.children).forEach((child) => { if (child !== success) child.style.display = 'none'; }); success.classList.add('visible'); }
        else form.submit();
      } catch { form.submit(); }
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, []);
  return (
    <>
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 0.2, 7.4], fov: 42 }} dpr={[1, reduced ? 1.25 : 1.75]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}><Scene progress={progress} reduced={reduced} /></Suspense>
        </Canvas>
      </div>
      <Overlay progress={progress} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
