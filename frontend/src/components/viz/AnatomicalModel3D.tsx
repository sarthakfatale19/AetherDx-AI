"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, ContactShadows, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

interface AnatomicalModel3DProps {
  condition: string;
  riskTier: string;
  probability: number;
  contributingFactors: any[];
  onScreenshotReady?: (base64Data: string) => void;
  triggerScreenshot?: boolean;
}

/** Helper to get color based on risk */
const getOrganColor = (organ: string, condition: string, riskTier: string) => {
  const isHeartCondition = condition.toLowerCase().includes("heart") || condition.toLowerCase().includes("cardio");
  const isLungsCondition = condition.toLowerCase().includes("lung") || condition.toLowerCase().includes("pulmonary");
  const isBrainCondition = condition.toLowerCase().includes("brain") || condition.toLowerCase().includes("stroke");

  if (organ === "Heart" && isHeartCondition) {
    return riskTier === "HIGH" ? "#ef4444" : riskTier === "MODERATE" ? "#f59e0b" : "#22c55e";
  }
  if (organ === "Lungs" && isLungsCondition) {
    return riskTier === "HIGH" ? "#ef4444" : riskTier === "MODERATE" ? "#f59e0b" : "#22c55e";
  }
  if (organ === "Brain" && isBrainCondition) {
    return riskTier === "HIGH" ? "#ef4444" : riskTier === "MODERATE" ? "#f59e0b" : "#22c55e";
  }
  // Default healthy green/blue tint
  return "#10b981";
};

// --- Abstract Organ Geometries ---

function Brain({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 2.8;
    }
    // Subtle pulsing bloom
    if (materialRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2; // 0 to 1
      materialRef.current.emissiveIntensity = 0.5 + pulse * 1.5;
    }
  });

  return (
    <group position={[0, 2.8, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial 
          ref={materialRef}
          color={color} 
          transmission={0.5} 
          roughness={0.2} 
          thickness={1} 
          clearcoat={1} 
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>
      <Html position={[0.7, 0.2, 0]} center className="pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-xl">
          <div className="font-bold text-gray-300">Brain</div>
        </div>
      </Html>
    </group>
  );
}

function Heart({ color, probability }: { color: string; probability: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  // Heartbeat animation based on risk
  useFrame((state) => {
    const speed = probability > 70 ? 8 : 3;
    const beat = Math.sin(state.clock.elapsedTime * speed);
    const scale = 1 + beat * 0.05;
    
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
    
    // Intense glowing heartbeat
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.8 + (beat > 0 ? beat * 2.5 : 0);
    }
  });

  return (
    <group position={[0.2, 1.2, 0.3]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshPhysicalMaterial 
          ref={materialRef}
          color={color} 
          roughness={0.1} 
          clearcoat={1} 
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>
      <Html position={[0.5, 0, 0]} center className="pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap">
          <div className="font-bold text-gray-300">Heart</div>
        </div>
      </Html>
    </group>
  );
}

function Lungs({ color }: { color: string }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const materialRefLeft = useRef<THREE.MeshPhysicalMaterial>(null);
  const materialRefRight = useRef<THREE.MeshPhysicalMaterial>(null);
  
  // Breathing animation
  useFrame((state) => {
    const breath = Math.sin(state.clock.elapsedTime * 2);
    const scaleX = 1 + breath * 0.05;
    const scaleY = 1 + breath * 0.1;
    if (leftRef.current) leftRef.current.scale.set(scaleX, scaleY, 1);
    if (rightRef.current) rightRef.current.scale.set(scaleX, scaleY, 1);

    // Breathing glow
    const glow = 0.5 + ((breath + 1) / 2) * 1.5;
    if (materialRefLeft.current) materialRefLeft.current.emissiveIntensity = glow;
    if (materialRefRight.current) materialRefRight.current.emissiveIntensity = glow;
  });

  return (
    <group position={[0, 1.2, 0]}>
      <mesh ref={leftRef} position={[-0.5, 0.2, 0]}>
        <capsuleGeometry args={[0.25, 0.6, 16, 16]} />
        <meshPhysicalMaterial ref={materialRefLeft} emissive={color} emissiveIntensity={1} color={color} transmission={0.8} opacity={0.9} transparent roughness={0.3} />
      </mesh>
      <mesh ref={rightRef} position={[0.5, 0.2, 0]}>
        <capsuleGeometry args={[0.25, 0.6, 16, 16]} />
        <meshPhysicalMaterial ref={materialRefRight} emissive={color} emissiveIntensity={1} color={color} transmission={0.8} opacity={0.9} transparent roughness={0.3} />
      </mesh>
      <Html position={[-0.9, 0, 0]} center className="pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap">
          <div className="font-bold text-gray-300">Lungs</div>
        </div>
      </Html>
    </group>
  );
}

function AbstractBodyOutline() {
  return (
    <group position={[0, 1.5, -0.2]}>
      {/* Torso */}
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.9, 1.8, 32, 64]} />
        {/* Crystal-like semi-transparent appearance */}
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={1} 
          ior={1.5}
          thickness={2}
          opacity={0.3} 
          transparent 
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  );
}

function Scene({ condition, riskTier, probability }: AnatomicalModel3DProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} />
      <pointLight position={[-5, 5, -5]} intensity={1} color="#6366f1" />
      <spotLight position={[0, 5, 0]} intensity={2} angle={0.8} penumbra={1} color="#ffffff" />
      
      {/* Postprocessing Bloom Effect */}
      <EffectComposer multisampling={4}>
        <Bloom 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.9} 
          intensity={1.5} 
          mipmapBlur 
        />
      </EffectComposer>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <AbstractBodyOutline />
        <Brain color={getOrganColor("Brain", condition, riskTier)} />
        <Heart color={getOrganColor("Heart", condition, riskTier)} probability={probability} />
        <Lungs color={getOrganColor("Lungs", condition, riskTier)} />
      </Float>

      <Environment preset="studio" />
      <ContactShadows position={[0, -0.8, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
      
      {/* Interactive Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5} 
        minDistance={2} 
        maxDistance={10} 
        autoRotate
        autoRotateSpeed={0.8}
        makeDefault
      />
    </>
  );
}

export default function AnatomicalModel3D(props: AnatomicalModel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Take screenshot when triggerScreenshot changes to true
  useEffect(() => {
    if (props.triggerScreenshot && props.onScreenshotReady && canvasRef.current) {
      // Small timeout to allow render completion
      setTimeout(() => {
        if (canvasRef.current) {
          const base64Data = canvasRef.current.toDataURL("image/jpeg", 0.9);
          props.onScreenshotReady?.(base64Data);
        }
      }, 500); // 500ms allows initial bloom and float rotation to settle
    }
  }, [props.triggerScreenshot, props.onScreenshotReady]);

  return (
    <div className="w-full h-[400px] bg-gradient-to-b from-[#0a0a0e] to-[#12121a] rounded-xl overflow-hidden shadow-2xl border border-white/10 relative cursor-grab active:cursor-grabbing group">
      {/* SHAP / Insight overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#818CF8] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#818CF8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#818CF8]"></span>
          </span>
          Live Organ Analysis
        </div>
      </div>

      {/* Interaction Hint Overlay */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="bg-black/50 backdrop-blur border border-white/10 text-white/70 px-3 py-1 rounded-full text-[10px] tracking-wide uppercase shadow-lg">
           ✦ Drag to rotate • Scroll to zoom ✦
         </div>
      </div>

      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 1.5, 6], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true, logarithmicDepthBuffer: true }}
        dpr={[1, 2]}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
