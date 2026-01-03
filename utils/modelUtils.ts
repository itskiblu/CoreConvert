import { ConversionType } from '../types';
import * as THREE from 'three';

// Define result interface
interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertModelFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const baseName = file.name.split('.').slice(0, -1).join('.');
  
  // 1. Load the model into a Three.js Scene
  const { scene, object } = await loadModel(file);
  
  // 2. Export
  switch (type) {
      case 'MODEL_TO_GLB':
          return exportGLTF(scene, baseName, true); // Binary
      case 'MODEL_TO_OBJ':
          return exportOBJ(scene, baseName);
      case 'MODEL_TO_STL':
          return exportSTL(scene, baseName);
      case 'MODEL_TO_USDZ':
          return exportUSDZ(scene, baseName);
      case 'MODEL_TO_IMAGE':
          return renderImage(scene, baseName);
      default:
          throw new Error(`Unsupported model conversion: ${type}`);
  }
}

async function loadModel(file: File): Promise<{ scene: THREE.Scene, object: THREE.Object3D }> {
    const url = URL.createObjectURL(file);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Add some lights so it renders/exports with visibility
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const ext = file.name.split('.').pop()?.toLowerCase();
    let object: THREE.Object3D;

    if (ext === 'glb' || ext === 'gltf') {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        object = gltf.scene;
    } else if (ext === 'obj') {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const loader = new OBJLoader();
        object = await loader.loadAsync(url);
    } else if (ext === 'stl') {
        const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
        const loader = new STLLoader();
        const geometry = await loader.loadAsync(url);
        const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
        object = new THREE.Mesh(geometry, material);
    } else if (ext === 'ply') {
        const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');
        const loader = new PLYLoader();
        const geometry = await loader.loadAsync(url);
        geometry.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
        object = new THREE.Mesh(geometry, material);
    } else {
        throw new Error("Unsupported input format for 3D conversion");
    }

    scene.add(object);
    return { scene, object };
}

async function exportGLTF(scene: THREE.Scene, name: string, binary: boolean): Promise<ConversionResult> {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    
    return new Promise((resolve, reject) => {
        exporter.parse(
            scene,
            (result) => {
                let blob;
                if (result instanceof ArrayBuffer) {
                    blob = new Blob([result], { type: 'model/gltf-binary' });
                } else {
                    const output = JSON.stringify(result, null, 2);
                    blob = new Blob([output], { type: 'model/gltf+json' });
                }
                resolve({ 
                    url: URL.createObjectURL(blob), 
                    name: `${name}.${binary ? 'glb' : 'gltf'}`, 
                    blob 
                });
            },
            (err) => reject(err),
            { binary }
        );
    });
}

async function exportOBJ(scene: THREE.Scene, name: string): Promise<ConversionResult> {
    const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
    const exporter = new OBJExporter();
    const result = exporter.parse(scene);
    const blob = new Blob([result], { type: 'text/plain' });
    return { url: URL.createObjectURL(blob), name: `${name}.obj`, blob };
}

async function exportSTL(scene: THREE.Scene, name: string): Promise<ConversionResult> {
    const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
    const exporter = new STLExporter();
    const result = exporter.parse(scene, { binary: true }); // Prefer binary
    const blob = new Blob([result], { type: 'application/vnd.ms-pki.stl' });
    return { url: URL.createObjectURL(blob), name: `${name}.stl`, blob };
}

async function exportUSDZ(scene: THREE.Scene, name: string): Promise<ConversionResult> {
    const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
    const exporter = new USDZExporter();
    const result = await exporter.parse(scene);
    const blob = new Blob([result], { type: 'model/vnd.usdz+zip' });
    return { url: URL.createObjectURL(blob), name: `${name}.usdz`, blob };
}

async function renderImage(scene: THREE.Scene, name: string): Promise<ConversionResult> {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1024, 1024);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    
    // Fit camera to object
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    
    camera.position.copy(center);
    camera.position.x += size / 2.0;
    camera.position.y += size / 5.0;
    camera.position.z += size / 2.0;
    camera.lookAt(center);
    
    renderer.render(scene, camera);
    
    return new Promise((resolve) => {
        renderer.domElement.toBlob((blob) => {
            if (blob) {
                 resolve({ url: URL.createObjectURL(blob), name: `${name}.png`, blob });
            }
        }, 'image/png');
    });
}