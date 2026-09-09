import * as THREE from 'three';
import type { AeroPressModel } from './aeropress-model';
import { createBrewTable } from './brew-model';
import { createBrewBackdrop } from './brew-backdrop';
import { createBrewFrame } from './brew-frame';
import { brewSession } from './brew-session';

export function createSharedBrewScene(logo: HTMLImageElement, product: AeroPressModel, scene: THREE.Scene) {
  const originalParent = product.root.parent!;
  const table = createBrewTable(logo, product);
  originalParent.add(product.root);
  const extras = new THREE.Group();
  extras.add(...table.root.children.filter(child => child !== table.brewer));
  table.root.add(extras);
  const bridgeRoot = new THREE.Group(), backdrop = createBrewBackdrop();
  scene.add(table.root, bridgeRoot, backdrop.mesh);
  table.root.visible = bridgeRoot.visible = backdrop.mesh.visible = false;
  table.chamberContents.visible = false;
  const fromPosition = new THREE.Vector3(), toPosition = new THREE.Vector3();
  const fromScale = new THREE.Vector3(), toScale = new THREE.Vector3();
  const fromRotation = new THREE.Quaternion(), toRotation = new THREE.Quaternion();
  const palm = new THREE.Vector3(), rim = new THREE.Vector3();
  const startPlunger = new THREE.Vector3(), endPlunger = new THREE.Vector3();
  const framing=createBrewFrame([product.root,table.cup]);
  let displayed = 0, previous = 0, lastMotion = 0;

  function update(blend: number, delta: number, time: number, reduced: boolean) {
    table.root.visible = backdrop.mesh.visible = blend > 0;
    bridgeRoot.visible = blend > 0 && blend < 1;
    const reveal = THREE.MathUtils.smoothstep(blend, .45, 1);
    table.chamberContents.visible = reveal > 0;
    table.chamberContents.scale.y = reveal;
    if (!blend) return null;
    // Capture the current exploration pose of this exact model before changing parents.
    product.root.updateWorldMatrix(true, false);
    product.root.matrixWorld.decompose(fromPosition, fromRotation, fromScale);
    startPlunger.copy(product.plunger.position);
    const startFilter = product.filter.position.y, startCap = product.cap.position.y, startTurn = product.cap.rotation.y;
    table.brewer.add(product.root);
    const target = brewSession.driver.value, now = performance.now();
    const input = (target >= 2 && target <= 3) || (target >= 4 && target <= 5);
    displayed = input && !reduced ? THREE.MathUtils.damp(displayed, target, 22, Math.min(delta, .05)) : target;
    if (target !== previous) lastMotion = now;
    previous = target;
    const activity = reduced ? 0 : 1 - THREE.MathUtils.smoothstep(now - lastMotion, 75, 550);
    const result = table.update(displayed, now - lastMotion < 75, time, activity, reduced);
    table.brewer.updateWorldMatrix(true, false);
    table.brewer.matrixWorld.decompose(toPosition, toRotation, toScale);
    if (blend < 1) {
      bridgeRoot.add(product.root);
      bridgeRoot.position.lerpVectors(fromPosition, toPosition, blend);
      bridgeRoot.quaternion.slerpQuaternions(fromRotation, toRotation, blend);
      bridgeRoot.scale.lerpVectors(fromScale, toScale, blend);
      endPlunger.copy(product.plunger.position);
      product.plunger.position.lerpVectors(startPlunger, endPlunger, blend);
      product.filter.position.y = THREE.MathUtils.lerp(startFilter, product.filter.position.y, blend);
      product.cap.position.y = THREE.MathUtils.lerp(startCap, product.cap.position.y, blend);
      product.cap.rotation.y = THREE.MathUtils.lerp(startTurn, product.cap.rotation.y, blend);
    }
    extras.scale.setScalar(reveal);
    return result;
  }
  function project(camera: THREE.Camera, canvas: HTMLCanvasElement, rect: DOMRect, workbench: DOMRect) {
    scene.updateMatrixWorld(true);
    palm.set(0, 2.7, 0).applyMatrix4(product.plunger.matrixWorld).project(camera);
    rim.set(0, .6, 0).applyMatrix4(product.plunger.matrixWorld).project(camera);
    if (brewSession.handle) {
      brewSession.handle.style.left = `${(palm.x * .5 + .5) * canvas.clientWidth - rect.left}px`;
      brewSession.handle.style.top = `${(-palm.y * .5 + .5) * canvas.clientHeight - rect.top}px`;
    }
    brewSession.travel = Math.abs(rim.y - palm.y) * .5 * canvas.clientHeight;
    backdrop.resize(canvas, workbench, rect);
  }
  function dispose() {
    originalParent.add(product.root);
    table.dispose(); backdrop.dispose();
    table.root.removeFromParent(); bridgeRoot.removeFromParent(); backdrop.mesh.removeFromParent();
  }
  async function prepare(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    // Compile hidden accessories before they enter the journey. Glass also renders
    // the opaque objects in an untone-mapped transmission pass, a separate variant.
    await renderer.compileAsync(scene, camera);
    const toneMapping = renderer.toneMapping;
    let transmission: Promise<THREE.Object3D>;
    try {
      renderer.toneMapping = THREE.NoToneMapping;
      transmission = renderer.compileAsync(scene, camera);
    } finally { renderer.toneMapping = toneMapping; }
    await transmission;
    await new Promise<void>(resolve => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), {timeout:1200});
      else setTimeout(resolve, 32);
    });
    // Initialize transmission buffers, texture uploads and geometry once while
    // the reader is still exploring. Scissor to one corner pixel: the current
    // full-size canvas, camera and render targets stay in place and never flash.
    const scissor=renderer.getScissor(new THREE.Vector4()), scissorTest=renderer.getScissorTest();
    const visibility=new Map<THREE.Object3D,boolean>();
    for(const root of [table.root,table.chamberContents]){
      root.traverse(node=>{if(!visibility.has(node))visibility.set(node,node.visible);node.visible=true;});
    }
    const backdropVisible=backdrop.mesh.visible;backdrop.mesh.visible=true;
    try {
      renderer.setScissor(0,0,1,1);renderer.setScissorTest(true);
      renderer.render(scene,camera);
    } finally {
      for(const [node,visible] of visibility)node.visible=visible;
      backdrop.mesh.visible=backdropVisible;
      renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
    }
  }
  return { table, update, project, prepare, dispose, framing };
}
