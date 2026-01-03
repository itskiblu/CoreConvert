
import { ConversionType } from '../types';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertModelFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const baseName = file.name.split('.').slice(0, -1).join('.');
  const { scene } = await loadModel(file);
  
  switch (type) {
      case 'MODEL_TO_GLB': return exportGLTF(scene, baseName, true);
      case 'MODEL_TO_OBJ': return exportOBJ(scene, baseName);
      case 'MODEL_TO_STL': return exportSTL(scene, baseName);
      case 'MODEL_TO_USDZ': return exportUSDZ(scene, baseName);
      case 'MODEL_TO_IMAGE': return renderImage(scene, baseName);
      default: throw new Error(`Unsupported model conversion: ${type}`);
  }
}

async function loadModel(file: File): Promise<{ scene: any, object: any }> {
    // @ts-ignore
    const THREE = await import('three');
    const url = URL.createObjectURL(file);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const ext = file.name.split('.').pop()?.toLowerCase();
    let object;

    if (ext === 'glb' || ext === 'gltf') {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const gltf = await new GLTFLoader().loadAsync(url);
        object = gltf.scene;
    } else if (ext === 'obj') {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        object = await new OBJLoader().loadAsync(url);
    } else if (ext === 'stl') {
        const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
        const geometry = await new STLLoader().loadAsync(url);
        object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x606060 }));
    } else if (ext === 'ply') {
        const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');
        const geometry = await new PLYLoader().loadAsync(url);
        geometry.computeVertexNormals();
        object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x606060 }));
    } else throw new Error("Unsupported format");

    scene.add(object);
    return { scene, object };
}

async function exportGLTF(scene: any, name: string, binary: boolean): Promise<ConversionResult> {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    return new Promise((res, rej) => {
        new GLTFExporter().parse(scene, (result: any) => {
            const blob = result instanceof ArrayBuffer ? new Blob([result]) : new Blob([JSON.stringify(result)], { type: 'application/json' });
            res({ url: URL.createObjectURL(blob), name: `${name}.${binary ? 'glb' : 'gltf'}`, blob });
        }, (err: any) => rej(err), { binary });
    });
}

async function exportOBJ(scene: any, name: string): Promise<ConversionResult> {
    const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
    const blob = new Blob([new OBJExporter().parse(scene)], { type: 'text/plain' });
    return { url: URL.createObjectURL(blob), name: `${name}.obj`, blob };
}

async function exportSTL(scene: any, name: string): Promise<ConversionResult> {
    const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
    const blob = new Blob([new STLExporter().parse(scene, { binary: true })]);
    return { url: URL.createObjectURL(blob), name: `${name}.stl`, blob };
}

async function exportUSDZ(scene: any, name: string): Promise<ConversionResult> {
    const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
    const blob = new Blob([await new USDZExporter().parse(scene)]);
    return { url: URL.createObjectURL(blob), name: `${name}.usdz`, blob };
}

async function renderImage(scene: any, name: string): Promise<ConversionResult> {
    // @ts-ignore
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1024, 1024);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    camera.position.copy(center).add(new THREE.Vector3(size/2, size/5, size/2));
    camera.lookAt(center);
    renderer.render(scene, camera);
    return new Promise(r => renderer.domElement.toBlob(b => r({ url: URL.createObjectURL(b!), name: `${name}.png`, blob: b! }), 'image/png'));
}
