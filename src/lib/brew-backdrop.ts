import * as THREE from 'three';

// Transmission needs a real scene background. Three's transparent-canvas
// fallback is half-white, which makes clear glass look frosted over dark CSS.
// This opaque plane reproduces brew-dialog's CSS background inside both passes.
export function createBrewBackdrop() {
  const uniforms = { uRect: {value:new THREE.Vector4()}, uViewport: {value:new THREE.Vector2()} };
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest:false, depthWrite:false, toneMapped:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}',
    fragmentShader:`
      varying vec2 vUv; uniform vec4 uRect; uniform vec2 uViewport;
      void main(){
        vec2 pixel=uRect.xy+vec2(vUv.x,1.0-vUv.y)*uRect.zw;
        vec2 center=uViewport*vec2(.73,.48);
        vec2 radii=uViewport*vec2(.73,.52)*1.41421356;
        float distanceFromCenter=length((pixel-center)/radii);
        float glow=clamp(1.0-distanceFromCenter/.57,0.0,1.0)*(.2117647);
        vec3 rgb=mix(vec3(20.,17.,15.)/255.,vec3(116.,82.,54.)/255.,glow);
        vec3 linear=mix(rgb/12.92,pow((rgb+.055)/1.055,vec3(2.4)),step(vec3(.04045),rgb));
        gl_FragColor=vec4(linear,1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), material);
  mesh.name='Brewing_background_for_refraction';mesh.frustumCulled=false;mesh.renderOrder=-1000;
  function resize(canvas:HTMLCanvasElement) {
    const rect=canvas.getBoundingClientRect();
    uniforms.uRect.value.set(rect.left,rect.top,rect.width,rect.height);
    uniforms.uViewport.value.set(innerWidth,innerHeight);
  }
  return {mesh,resize,dispose:()=>{mesh.geometry.dispose();material.dispose();}};
}
