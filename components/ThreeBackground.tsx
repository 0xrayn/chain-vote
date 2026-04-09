"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 3;

    // Particle field
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = (Math.random() - 0.5) * 16;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.022,
      transparent: true,
      opacity: 0.35,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // Second particle layer — neon green
    const positions2 = new Float32Array(300 * 3);
    for (let i = 0; i < 300 * 3; i += 3) {
      positions2[i] = (Math.random() - 0.5) * 14;
      positions2[i + 1] = (Math.random() - 0.5) * 14;
      positions2[i + 2] = (Math.random() - 0.5) * 8;
    }
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
    const mat2 = new THREE.PointsMaterial({
      color: 0x00f5a0,
      size: 0.015,
      transparent: true,
      opacity: 0.25,
    });
    scene.add(new THREE.Points(geo2, mat2));

    // Wireframe grid
    const gridGeo = new THREE.PlaneGeometry(24, 24, 28, 28);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0d1d2e,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2.5;
    grid.position.y = -2.5;
    scene.add(grid);

    // Floating octahedron nodes
    type NodeMesh = THREE.Mesh & { userData: { vy: number; rot: number } };
    const nodes: NodeMesh[] = [];
    for (let i = 0; i < 8; i++) {
      const r = Math.random() * 0.06 + 0.03;
      const geo = new THREE.OctahedronGeometry(r, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f5a0 : 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25 + Math.random() * 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat) as NodeMesh;
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3
      );
      mesh.userData = { vy: (Math.random() - 0.5) * 0.003, rot: Math.random() * 0.012 };
      scene.add(mesh);
      nodes.push(mesh);
    }

    // Connection lines between some nodes
    for (let i = 0; i < 4; i++) {
      const points = [nodes[i].position, nodes[i + 1 < nodes.length ? i + 1 : 0].position];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x1a3a5c,
        transparent: true,
        opacity: 0.4,
      });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let t = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.004;

      grid.position.z = Math.sin(t * 0.25) * 0.3;
      grid.rotation.z = Math.sin(t * 0.1) * 0.01;

      nodes.forEach((n) => {
        n.position.y += n.userData.vy;
        if (n.position.y > 3.5 || n.position.y < -3.5) n.userData.vy *= -1;
        n.rotation.x += n.userData.rot;
        n.rotation.y += n.userData.rot * 0.7;
        n.rotation.z += n.userData.rot * 0.3;
      });

      particleMat.opacity = 0.25 + Math.sin(t) * 0.08;
      mat2.opacity = 0.18 + Math.cos(t * 0.8) * 0.07;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={mountRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
