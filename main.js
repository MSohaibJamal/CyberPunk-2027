import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import gsap from 'gsap'; 
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();



// scene

const scene = new THREE.Scene();

// camera

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.z = 40;

// object

let model = null;

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/DamagedHelmet.glb',
  (gltf) => {
    model = gltf.scene; // Assign to outer variable
    model.position.set(0, 0, 0);
    model.scale.set(10, 10, 10);
    scene.add(model);
    applyTexturesFromJSON('/7.json', model);
  },
  undefined,
  (error) => {
    console.error('Error loading GLTF model:', error);
  }
);

// renderer

const renderer = new THREE.WebGLRenderer ({
  canvas: document.querySelector('canvas'),
  antialias: true,
  alpha: true,
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)

// RGB Shift Postprocessing
const RGBShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.005 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 offset = vec2(amount, -amount);
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a; // Preserve alpha
      gl_FragColor = vec4(r, g, b, a);
    }
  `
};

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms.amount.value = 0.0020; // Adjust for more/less shift
composer.addPass(rgbShiftPass);

// Load HDRI from CDN
new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      console.log('Loaded HDRI from CDN');
    },
    undefined,
    (err) => {
      console.warn('HDRI load failed:', err);
    }
  );

// utility: load textures from JSON descriptor and apply to model materials
async function applyTexturesFromJSON(jsonPath, model) {
  try {
    const resp = await fetch(jsonPath);
    if (!resp.ok) {
      console.warn('Texture JSON not found:', jsonPath);
      return;
    }
    const text = await resp.text();
    if (!text || !text.trim()) {
      console.warn('Texture JSON is empty:', jsonPath);
      return;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('Texture JSON invalid JSON:', jsonPath, e.message);
      return;
    }
    if (!data || typeof data !== 'object') {
      console.warn('Texture JSON empty or invalid:', jsonPath);
      return;
    }
    const loader = new THREE.TextureLoader();
    model.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat) => {
        ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'].forEach((k) => {
          if (data[k]) {
            const url = data[k].startsWith('http') ? data[k] : `/${data[k]}`;
            loader.load(url, (tex) => {
              if (k === 'map' || k === 'emissiveMap') tex.encoding = THREE.sRGBEncoding;
              mat[k] = tex;
              mat.needsUpdate = true;
            }, undefined, (err) => console.warn('Failed to load texture', url, err));
          }
        });
      });
    });
    console.log('Applied textures from', jsonPath);
  } catch (err) {
    console.error('Error applying textures from JSON:', err);
  }
}

window.addEventListener('mousemove', (e) => {
  if (model) {
    const rotationY = (e.clientX / window.innerWidth - .5) * Math.PI * 0.5;
    const rotationX = (e.clientY / window.innerHeight - .5) * Math.PI * 0.5;
    gsap.to(model.rotation, {
      x: rotationX,
      y: rotationY,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: true,
    });
  }
});

// render
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}   

animate();


// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
});
