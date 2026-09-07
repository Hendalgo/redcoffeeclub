// Local visual/export fixture, loaded through Vite by accessories-qa.mjs only.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createBrewAccessories } from '../src/lib/brew-accessories';

export async function openStudio() {
  const image = new Image(); image.src = '/images/logo.png'; await image.decode();
  const parts = createBrewAccessories(image);
  const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
  renderer.setSize(1000,1000); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#a9adac');
  const generator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = generator.fromScene(room,.04); scene.environment = environment.texture;
  room.dispose(); generator.dispose();
  const camera = new THREE.PerspectiveCamera(32,1,.01,50);
  scene.add(new THREE.HemisphereLight('#ffffff','#b5b5b5',2));
  const key = new THREE.DirectionalLight('#ffffff',3); key.position.set(-3,5,5); scene.add(key);
  const fill = new THREE.DirectionalLight('#eaf1ff',2); fill.position.set(4,3,-3); scene.add(fill);
  document.body.replaceChildren(renderer.domElement);
  document.body.style.cssText = 'margin:0;background:#a9adac;display:grid;place-items:center;overflow:hidden';
  renderer.domElement.style.cssText = 'display:block;width:1000px;height:1000px';
  let active: THREE.Group | null = null;
  function show(name: 'cup'|'kettle'|'scoop', angle=0, filled=false) {
    if(active) scene.remove(active);
    active = parts[name].clone(true); scene.add(active);
    if(name==='cup' && filled) {
      const coffee = new THREE.Mesh(new THREE.CylinderGeometry(.802,.7,.85,80),new THREE.MeshPhysicalMaterial({color:'#321104',roughness:.2,clearcoat:1}));
      coffee.position.y=.18+.85/2; active.add(coffee);
    }
    const bounds = new THREE.Box3().setFromObject(active), center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3()), radius=Math.max(size.x,size.y,size.z);
    const pitch=name==='scoop' ? 1.8 : .95;
    camera.position.set(center.x+Math.sin(angle)*radius*2.5,center.y+radius*pitch,center.z+Math.cos(angle)*radius*2.5);
    camera.lookAt(center); camera.updateProjectionMatrix(); renderer.render(scene,camera);
    let triangles=0; active.traverse(node=>{if(node instanceof THREE.Mesh)triangles+=(node.geometry.index?.count??node.geometry.attributes.position.count)/3;});
    return {name, triangles, bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},calls:renderer.info.render.calls};
  }
  async function exportPart(name:'cup'|'kettle'|'scoop') {
    const group=parts[name].clone(true); group.scale.multiplyScalar(.05);
    group.userData={...group.userData,author:'Hidra / RED Coffee Club',construction:'Parametric mesh modeled from the supplied generated reference',rigUnitMeters:.05};
    const buffer=await new GLTFExporter().parseAsync(group,{binary:true}) as ArrayBuffer;
    return Array.from(new Uint8Array(buffer));
  }
  return {show,exportPart};
}
