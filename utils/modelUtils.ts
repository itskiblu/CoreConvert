
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

export async function convertModel(
  file: File, 
  targetFormat: 'obj' | 'stl' | 'glb' | 'usdz'
): Promise<Blob> {
  const mesh = await loadModel(file);
  
  switch (targetFormat) {
    case 'obj':
      return new Promise((resolve) => {
        const exporter = new OBJExporter();
        const result = exporter.parse(mesh);
        resolve(new Blob([result], { type: 'text/plain' }));
      });
      
    case 'stl':
      return new Promise((resolve) => {
        const exporter = new STLExporter();
        const result = exporter.parse(mesh, { binary: true });
        resolve(new Blob([result], { type: 'application/octet-stream' }));
      });
      
    case 'glb':
      return new Promise((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
          mesh,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(new Blob([result], { type: 'model/gltf-binary' }));
            } else {
              reject(new Error("GLB export failed"));
            }
          },
          (err) => reject(err),
          { binary: true }
        );
      });

    case 'usdz':
      return new Promise((resolve, reject) => {
        const exporter = new USDZExporter();
        exporter.parse(mesh).then((result) => {
           resolve(new Blob([result], { type: 'application/octet-stream' }));
        }).catch(e => reject(e));
      });
      
    default:
      throw new Error(`Unsupported export format: ${targetFormat}`);
  }
}

export async function modelToImage(file: File): Promise<Blob> {
  const mesh = await loadModel(file);
  const width = 1024;
  const height = 1024;
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // White background
  
  // Center the model
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  // Normalize scale to fit in view
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 5 / maxDim;
  mesh.scale.set(scale, scale, scale);
  
  // Recenter after scaling
  box.setFromObject(mesh);
  box.getCenter(center);
  mesh.position.sub(center);
  
  scene.add(mesh);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);
  
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  
  // Render
  renderer.render(scene, camera);
  
  return new Promise((resolve, reject) => {
    renderer.domElement.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Snapshot failed"));
      
      // Cleanup
      renderer.dispose();
      scene.clear();
    }, 'image/png');
  });
}

async function loadModel(file: File): Promise<THREE.Group | THREE.Object3D> {
  const buffer = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.obj')) {
    const text = new TextDecoder().decode(buffer);
    const loader = new OBJLoader();
    return loader.parse(text);
  } 
  else if (name.endsWith('.stl')) {
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }
  else if (name.endsWith('.ply')) {
    const loader = new PLYLoader();
    const geometry = loader.parse(buffer);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: 0x606060, flatShading: true });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }
  else if (name.endsWith('.glb') || name.endsWith('.gltf')) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.parse(
        buffer, 
        '', 
        (gltf) => resolve(gltf.scene), 
        (err) => reject(err)
      );
    });
  }
  
  throw new Error("Unsupported 3D format for loading");
}