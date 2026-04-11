"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/ThemeProvider";

export default function ThreeBackground() {
  const mountRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4;

    const isDark = theme === "dark";
    const c1 = isDark ? 0x00d4ff : 0x0284c7;
    const c2 = isDark ? 0x00f5a0 : 0x00a86b;
    const c3 = isDark ? 0x7c3aed : 0x7c3aed;
    const gridColor = isDark ? 0x0a1a2e : 0xc8dff5;
    const lineColor = isDark ? 0x122a47 : 0xa8cbea;

    const count1 = 1000;
    const pos1 = new Float32Array(count1 * 3);
    for (let i = 0; i < count1 * 3; i += 3) {
      pos1[i] = (Math.random() - 0.5) * 20;
      pos1[i + 1] = (Math.random() - 0.5) * 20;
      pos1[i + 2] = (Math.random() - 0.5) * 12;
    }
    const geo1 = new THREE.BufferGeometry();
    geo1.setAttribute("position", new THREE.BufferAttribute(pos1, 3));
    const mat1 = new THREE.PointsMaterial({ color: c1, size: 0.025, transparent: true, opacity: isDark ? 0.4 : 0.3 });
    const pts1 = new THREE.Points(geo1, mat1);
    scene.add(pts1);

    const count2 = 400;
    const pos2 = new Float32Array(count2 * 3);
    for (let i = 0; i < count2 * 3; i += 3) {
      pos2[i] = (Math.random() - 0.5) * 16;
      pos2[i + 1] = (Math.random() - 0.5) * 16;
      pos2[i + 2] = (Math.random() - 0.5) * 10;
    }
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute("position", new THREE.BufferAttribute(pos2, 3));
    const mat2 = new THREE.PointsMaterial({ color: c2, size: 0.018, transparent: true, opacity: isDark ? 0.3 : 0.25 });
    const pts2 = new THREE.Points(geo2, mat2);
    scene.add(pts2);

    const count3 = 150;
    const pos3 = new Float32Array(count3 * 3);
    for (let i = 0; i < count3 * 3; i += 3) {
      pos3[i] = (Math.random() - 0.5) * 12;
      pos3[i + 1] = (Math.random() - 0.5) * 12;
      pos3[i + 2] = (Math.random() - 0.5) * 8;
    }
    const geo3 = new THREE.BufferGeometry();
    geo3.setAttribute("position", new THREE.BufferAttribute(pos3, 3));
    const mat3 = new THREE.PointsMaterial({ color: c3, size: 0.03, transparent: true, opacity: isDark ? 0.2 : 0.15 });
    const pts3 = new THREE.Points(geo3, mat3);
    scene.add(pts3);

    const gridGeo = new THREE.PlaneGeometry(30, 30, 36, 36);
    const gridMat = new THREE.MeshBasicMaterial({ color: gridColor, wireframe: true, transparent: true, opacity: isDark ? 0.07 : 0.12 });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2.4;
    grid.position.y = -3;
    scene.add(grid);

    type NodeMesh = THREE.Mesh & { userData: { vy: number; rot: number; vx: number } };
    const nodes: NodeMesh[] = [];
    const nodeGeos = [
      new THREE.OctahedronGeometry(0.06, 0),
      new THREE.TetrahedronGeometry(0.07, 0),
      new THREE.IcosahedronGeometry(0.05, 0),
    ];
    for (let i = 0; i < 12; i++) {
      const geoIdx = i % 3;
      const mat = new THREE.MeshBasicMaterial({
        color: [c1, c2, c3][i % 3],
        wireframe: true,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.4,
      });
      const mesh = new THREE.Mesh(nodeGeos[geoIdx], mat) as unknown as NodeMesh;
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4
      );
      mesh.userData = {
        vy: (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.002,
        rot: Math.random() * 0.015,
      };
      scene.add(mesh);
      nodes.push(mesh);
    }

    for (let i = 0; i < 6; i++) {
      const a = nodes[i];
      const b = nodes[(i + 3) % nodes.length];
      const pts = [a.position.clone(), b.position.clone()];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.3 });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    const ringGeo = new THREE.TorusGeometry(1.5, 0.003, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: c1, transparent: true, opacity: isDark ? 0.12 : 0.08 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.position.set(3, 1, -2);
    scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.002, 8, 60),
      new THREE.MeshBasicMaterial({ color: c2, transparent: true, opacity: isDark ? 0.1 : 0.07 })
    );
    ring2.rotation.x = Math.PI / 5;
    ring2.position.set(-3, -1, -1);
    scene.add(ring2);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let t = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.004;

      camera.position.x += (mouse.x - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      grid.position.z = Math.sin(t * 0.2) * 0.4;
      grid.rotation.z = Math.sin(t * 0.08) * 0.008;

      pts1.rotation.y = t * 0.025;
      pts2.rotation.y = -t * 0.018;
      pts3.rotation.x = t * 0.012;

      ring.rotation.z = t * 0.08;
      ring2.rotation.z = -t * 0.06;

      nodes.forEach((n) => {
        n.position.y += n.userData.vy;
        n.position.x += n.userData.vx;
        if (Math.abs(n.position.y) > 4) n.userData.vy *= -1;
        if (Math.abs(n.position.x) > 6) n.userData.vx *= -1;
        n.rotation.x += n.userData.rot;
        n.rotation.y += n.userData.rot * 0.7;
      });

      mat1.opacity = (isDark ? 0.3 : 0.22) + Math.sin(t) * 0.08;
      mat2.opacity = (isDark ? 0.22 : 0.18) + Math.cos(t * 0.8) * 0.06;
      mat3.opacity = (isDark ? 0.15 : 0.1) + Math.sin(t * 1.2) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [theme]);

  return (
    <canvas
      ref={mountRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
