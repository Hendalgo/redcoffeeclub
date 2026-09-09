import * as THREE from 'three';

// Transmission needs a real scene background. Three's transparent-canvas
// fallback is half-white, which makes clear glass look frosted over dark CSS.
// Match the workbench background in its own coordinates, independent of scroll.
export function createBrewBackdrop() {
  const uniforms = { uRect: {value:new THREE.Vector4()}, uViewport: {value:new THREE.Vector2()}, uCenterX:{value:.27}, uClip: {value:new THREE.Vector4(-1e6,-1e6,2e6,2e6)} };
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest:false, depthWrite:false, toneMapped:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}',
    fragmentShader:`
      varying vec2 vUv; uniform vec4 uRect; uniform vec2 uViewport; uniform vec4 uClip; uniform float uCenterX;
      void main(){
        vec2 pixel=uRect.xy+vec2(vUv.x,1.0-vUv.y)*uRect.zw;
        if(pixel.x<uClip.x||pixel.y<uClip.y||pixel.x>uClip.x+uClip.z||pixel.y>uClip.y+uClip.w)discard;
        vec2 center=uViewport*vec2(uCenterX,.48);
        vec2 radii=uViewport*vec2(.73,.52);
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
  function resize(canvas:HTMLCanvasElement, parentRect?:DOMRect, clipRect?:DOMRect) {
    uniforms.uCenterX.value=innerWidth<=760?.5:.27;
    const rect=canvas.getBoundingClientRect();
    const workbench=parentRect??canvas.closest('.brew-workbench')?.getBoundingClientRect();
    if(clipRect)uniforms.uClip.value.set(clipRect.left-(workbench?.left??0),clipRect.top-(workbench?.top??0),clipRect.width,clipRect.height);
    uniforms.uRect.value.set(rect.left-(workbench?.left??0),rect.top-(workbench?.top??0),rect.width,rect.height);
    uniforms.uViewport.value.set(workbench?.width??innerWidth,workbench?.height??innerHeight);
  }
  return {mesh,resize,dispose:()=>{mesh.geometry.dispose();material.dispose();}};
}
