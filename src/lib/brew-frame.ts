import * as THREE from 'three';

/** Clamp visible solid geometry to a DOM slot, including intermediate poses. */
export function createBrewFrame(roots:THREE.Object3D[]){
  const meshes:Array<{node:THREE.Mesh;box:THREE.Box3}>=[];
  roots.forEach(root=>root.traverse(node=>{
    if(!(node instanceof THREE.Mesh)||node instanceof THREE.InstancedMesh)return;
    node.geometry.computeBoundingBox();
    if(node.geometry.boundingBox)meshes.push({node,box:node.geometry.boundingBox.clone()});
  }));
  const point=new THREE.Vector3();
  function bounds(camera:THREE.Camera,viewport:{width:number;height:number}){
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for(const {node,box} of meshes){
      let visible=true;for(let parent:THREE.Object3D|null=node;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}
      if(!visible)continue;
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        point.set(x,y,z).applyMatrix4(node.matrixWorld).project(camera);
        const px=(point.x*.5+.5)*viewport.width,py=(-point.y*.5+.5)*viewport.height;
        left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
      }
    }
    return {left,right,top,bottom};
  }
  function fit(camera:THREE.OrthographicCamera,viewport:{width:number;height:number},rect:{left:number;top:number;width:number;height:number}){
    roots.forEach(root=>root.updateWorldMatrix(true,true));camera.updateMatrixWorld(true);
    let box=bounds(camera,viewport);
    if(!Number.isFinite(box.left)||rect.width<1||rect.height<1)return;
    const padding=16,left=rect.left+padding,right=rect.left+rect.width-padding,top=rect.top+padding,bottom=rect.top+rect.height-padding;
    const scale=Math.min(1,Math.max(1,right-left)/Math.max(1,box.right-box.left),Math.max(1,bottom-top)/Math.max(1,box.bottom-box.top));
    camera.zoom*=scale;camera.updateProjectionMatrix();box=bounds(camera,viewport);
    const dx=box.left<left?left-box.left:box.right>right?right-box.right:0;
    const dy=box.top<top?top-box.top:box.bottom>bottom?bottom-box.bottom:0;
    camera.left-=dx/camera.zoom;camera.right-=dx/camera.zoom;
    camera.top+=dy/camera.zoom;camera.bottom+=dy/camera.zoom;camera.updateProjectionMatrix();
  }
  return {fit,bounds};
}
