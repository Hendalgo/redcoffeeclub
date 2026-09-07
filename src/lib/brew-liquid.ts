import * as THREE from 'three';
import { fallingJet } from './brew-fluid.mjs';

// Fixed buffers and shader displacement: no fluid solver, per-frame geometry
// allocation or extra render target on mobile.
export function liquidSurface(material: THREE.MeshStandardMaterial) {
  const geometry = new THREE.BufferGeometry(), positions: number[] = [], indices: number[] = [];
  const rings = 18, sectors = 48;
  for (let r = 0; r <= rings; r++) for (let s = 0; s <= sectors; s++) {
    const angle = s / sectors * Math.PI * 2;
    positions.push(Math.cos(angle) * r / rings, 0, Math.sin(angle) * r / rings);
    if (r < rings && s < sectors) { const a = r * (sectors + 1) + s, b = a + sectors + 1; indices.push(a,a+1,b,b,a+1,b+1); }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const uniforms = { uTime: { value: 0 }, uEnergy: { value: 0 } };
  const topMaterial = material.clone(); topMaterial.side = THREE.DoubleSide;
  topMaterial.roughness = .16; topMaterial.envMapIntensity = .7;
  topMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `uniform float uTime; uniform float uEnergy;
      float wave(vec2 p) {
        float r = length(p);
        float edge = 1.0 - smoothstep(.78,1.0,r);
        float impact = sin(r*26.0-uTime*10.0)*exp(-r*2.2);
        float slosh = .3*sin(p.x*6.0-uTime*3.2)+.2*cos(p.y*8.0+uTime*2.4);
        return uEnergy*.018*(impact+slosh)*edge;
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      float dx = (wave(position.xz+vec2(.002,0.0))-wave(position.xz-vec2(.002,0.0)))/.004;
      float dz = (wave(position.xz+vec2(0.0,.002))-wave(position.xz-vec2(0.0,.002)))/.004;
      vec3 objectNormal = normalize(vec3(-dx,1.0,-dz));
    `).replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y += wave(position.xz);');
  };
  topMaterial.customProgramCacheKey = () => 'red-liquid-surface-v1';
  const mesh = new THREE.Mesh(geometry, topMaterial);
  mesh.frustumCulled = false;
  return { mesh, update(time: number, energy: number, radius: number) {
    uniforms.uTime.value = time; uniforms.uEnergy.value = energy;
    mesh.scale.set(radius,1,radius);
  } };
}

export function gravityStream(material: THREE.Material, radius: number) {
  const segments = 28, sides = 8;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((segments+1)*(sides+1)*3);
  const normals = new Float32Array(positions.length), indices: number[] = [];
  for (let i=0;i<segments;i++) for(let j=0;j<sides;j++) {
    const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);
  }
  const position = new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage);
  const normal = new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position',position);geometry.setAttribute('normal',normal);geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  const tangent=new THREE.Vector3(),side=new THREE.Vector3(),binormal=new THREE.Vector3();
  const up=new THREE.Vector3(0,0,1);
  return { mesh, update(source: THREE.Vector3, target: THREE.Vector3, flow: number, time: number) {
    const height=source.y-target.y;
    mesh.visible=height>.015&&flow>.006;
    if(!mesh.visible)return;
    const {flight}=fallingJet(height,flow);
    const vx=(target.x-source.x)/flight,vz=(target.z-source.z)/flight;
    for(let i=0;i<=segments;i++){
      const fraction=i/segments,t=fraction*flight;
      const y=source.y-.8*t-4.905*t*t;
      const x=source.x+vx*t+Math.sin(fraction*11-time*13)*.006*Math.sin(fraction*Math.PI);
      const z=source.z+vz*t+Math.cos(fraction*9-time*11)*.004*Math.sin(fraction*Math.PI);
      const jet=fallingJet(source.y-y,flow,.8,radius);
      const neck=1+.1*Math.sin(fraction*30-time*20)*fraction;
      tangent.set(vx,-.8-9.81*t,vz).normalize();side.crossVectors(tangent,up).normalize();binormal.crossVectors(tangent,side);
      for(let j=0;j<=sides;j++){
        const angle=j/sides*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),k=i*(sides+1)+j;
        const nx=side.x*c+binormal.x*s,ny=side.y*c+binormal.y*s,nz=side.z*c+binormal.z*s;
        position.setXYZ(k,x+nx*jet.radius*neck,y+ny*jet.radius*neck,z+nz*jet.radius*neck);
        normal.setXYZ(k,nx,ny,nz);
      }
    }
    position.needsUpdate=true;normal.needsUpdate=true;
  } };
}


