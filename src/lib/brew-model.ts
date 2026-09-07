import * as THREE from 'three';
import { createAeroPress, disposeModel } from './aeropress-model';
import { brewAt } from './brew-choreography.mjs';
import { cupLevel } from './brew-fluid.mjs';
import { gravityStream, liquidSurface } from './brew-liquid';
import { createBrewAccessories } from './brew-accessories';

export function createBrewTable(logo: HTMLImageElement) {
  const product = createAeroPress(logo);
  const accessories = createBrewAccessories(logo);
  const { cup, kettle, scoop, kettleTip } = accessories;
  const root = new THREE.Group(), brewer = new THREE.Group();
  root.add(brewer, cup); brewer.add(product.root);
  root.name = 'RED_interactive_brewing';
  const cream = new THREE.MeshStandardMaterial({ color: '#e6d3b4', roughness: .35 });
  const groundsMaterial = new THREE.MeshStandardMaterial({ color: '#352015', roughness: 1 });
  const coffeeMaterial = new THREE.MeshStandardMaterial({ color: '#351505', roughness: .32, metalness: 0, envMapIntensity: .15 });
  // Opaque liquid writes depth before the transparent barrel, keeping its
  // level readable through both walls without transparent sorting artifacts.
  const infusionMaterial = new THREE.MeshStandardMaterial({ color: '#573013', roughness: .36, envMapIntensity: .2 });
  const waterMaterial = new THREE.MeshPhysicalMaterial({ color: '#ddcfb9', roughness: .08, clearcoat: 1, transparent: true, opacity: .72, depthWrite: false });
  const cupCoffee = new THREE.Mesh(new THREE.CylinderGeometry(.84,.7,1.27,64,1,true), coffeeMaterial); cup.add(cupCoffee);
  const liquidVertices=cupCoffee.geometry.getAttribute('position');
  const originalVertices=Float32Array.from(liquidVertices.array);
  let lastCupFill=-1;
  const grounds = new THREE.Mesh(new THREE.CylinderGeometry(.575,.575,1,64),groundsMaterial); brewer.add(grounds);
  const infusion = new THREE.Mesh(new THREE.CylinderGeometry(.577,.577,1,64,1,true),infusionMaterial); brewer.add(infusion);
  const coffeeJetMaterial = new THREE.MeshPhysicalMaterial({color:'#43200b',roughness:.12,clearcoat:1,envMapIntensity:.5});
  const coffeeStream = gravityStream(coffeeJetMaterial,.065); root.add(coffeeStream.mesh);
  const cupSurface=liquidSurface(coffeeMaterial),chamberSurface=liquidSurface(infusionMaterial);
  cup.add(cupSurface.mesh);brewer.add(chamberSurface.mesh);
  const fluid={time:-1,water:0,coffee:0,waterFlow:0,coffeeFlow:0,energy:0};
  const coffeeSource=new THREE.Vector3(),coffeeTarget=new THREE.Vector3();
  const spout=new THREE.Vector3(),waterTarget=new THREE.Vector3();
  const droplets=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,8,6),coffeeMaterial,16);
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);droplets.frustumCulled=false;cup.add(droplets);

  root.add(kettle, scoop);
  const kettleWaterMaterial = new THREE.MeshPhysicalMaterial({ color: '#b6d5dd', roughness: .09, clearcoat: 1, transparent: true, opacity: .19, depthWrite: false });
  const kettleWater = new THREE.Mesh(new THREE.CylinderGeometry(.606,.585,1,64,1,true),kettleWaterMaterial);
  const kettleWaterTop = new THREE.Mesh(new THREE.CircleGeometry(.606,64).rotateX(-Math.PI/2),kettleWaterMaterial);
  kettleWater.name='Kettle_water_volume';kettleWaterTop.name='Kettle_level_surface';
  kettleWater.renderOrder=3;kettleWaterTop.renderOrder=4;kettle.add(kettleWater,kettleWaterTop);
  const kettleWaterVertices=kettleWater.geometry.getAttribute('position');
  const kettleWaterOriginal=Float32Array.from(kettleWaterVertices.array);
  const kettleTopVertices=kettleWaterTop.geometry.getAttribute('position');
  const waterStream = gravityStream(waterMaterial,.045);root.add(waterStream.mesh);

  const particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.023,0),groundsMaterial,70);particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(particles);
  const dummy=new THREE.Object3D();
  const stirrer=new THREE.Mesh(new THREE.CylinderGeometry(.025,.045,2.0,12),cream);root.add(stirrer);
  const steam = new THREE.Group(); root.add(steam);
  const ripples = new THREE.Group(); cup.add(ripples);
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: '#bc8761', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.RingGeometry(.98,1,64),rippleMaterial);
    ring.rotation.x=-Math.PI/2;ripples.add(ring);
  }
  const steamMaterial = new THREE.MeshBasicMaterial({ color: '#ecd8be', transparent: true, opacity: .1, depthWrite:false });
  for(let i=0;i<3;i++){
    const path=new THREE.CatmullRomCurve3(Array.from({length:12},(_,j)=>new THREE.Vector3(Math.sin(j*.6+i)*.08+i*.22-.22,j*.085,0)));
    steam.add(new THREE.Mesh(new THREE.TubeGeometry(path,24,.012,5,false),steamMaterial));
  }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.8,3.8),new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv; void main(){float a=(1.0-smoothstep(0.15,1.0,length(vUv-0.5)*2.0))*0.28;gl_FragColor=vec4(0.01,0.005,0.002,a);}'}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.88;root.add(shadow);
  const palm=new THREE.Vector3(), rim=new THREE.Vector3();

  function update(progress:number, _moving:boolean, time:number, activity=0, reduced=false) {
    const pose=brewAt(progress);
    product.cap.position.y=pose.cap; product.cap.rotation.y=pose.capTurn;
    product.filter.position.y=pose.filter;
    product.plunger.position.set(-pose.plungerX,pose.plunger,-.9*Math.min(1,Math.abs(pose.plungerX)));
    brewer.position.set(pose.bodyX,pose.bodyY,0); brewer.rotation.z=-pose.serveAway*.15;
    brewer.visible=pose.serveAway<.998;
    brewer.scale.setScalar(1-pose.serveAway*.22);
    cup.position.set(pose.cupX,-2.86,0); cup.rotation.y=-.15;
    shadow.position.x=pose.cupX;
    const dt=fluid.time<0?1/60:Math.min(.05,Math.max(.001,time-fluid.time));
    const reset=pose.water<fluid.water-.01||pose.cupLiquid<fluid.coffee-.01||progress<2;
    const waterRate=!reset&&progress<=3.001?Math.max(0,(pose.water-fluid.water)/dt)*2.8:0;
    const coffeeRate=!reset&&progress>=4&&progress<=5?Math.max(0,(pose.cupLiquid-fluid.coffee)/dt)*2.5:0;
    fluid.waterFlow=reset||reduced?0:THREE.MathUtils.damp(fluid.waterFlow,Math.min(1.5,waterRate),14,dt);
    fluid.coffeeFlow=reset||reduced?0:THREE.MathUtils.damp(fluid.coffeeFlow,Math.min(1.6,coffeeRate),12,dt);
    const stirring=pose.stirIn*(1-pose.stirOut)*activity;
    fluid.energy=reset||reduced?0:Math.max(Math.min(1,Math.max(fluid.coffeeFlow,fluid.waterFlow,stirring)),fluid.energy*Math.exp(-dt*7));
    fluid.time=time;fluid.water=pose.water;fluid.coffee=pose.cupLiquid;
    const level=cupLevel(pose.cupLiquid),coffeeHeight=.001+level.height;
    cupCoffee.visible=pose.cupLiquid>.001;cupCoffee.scale.y=coffeeHeight/1.27;cupCoffee.position.y=.18+coffeeHeight/2;
    cupSurface.mesh.visible=cupCoffee.visible;cupSurface.mesh.position.y=.18+coffeeHeight;
    cupSurface.update(reduced?0:time,fluid.energy,level.radius);
    ripples.visible=pose.cupLiquid>.001&&fluid.coffeeFlow>.006;
    ripples.position.y=.184+coffeeHeight;rippleMaterial.opacity=Math.min(1,fluid.coffeeFlow)*.12;
    ripples.children.forEach((ring,i)=>{const wave=(time*.8+i/3)%1;ring.scale.setScalar(level.radius*(.1+wave*.87));});
    // The surface follows the glass's taper as its level rises.
    if(lastCupFill!==pose.cupLiquid){
      for(let i=0;i<liquidVertices.count;i++){
        const t=(originalVertices[i*3+1]+.635)/1.27;
        const scale=(.7+(level.radius-.7)*t)/(.7+.14*t);
        liquidVertices.setX(i,originalVertices[i*3]*scale);liquidVertices.setZ(i,originalVertices[i*3+2]*scale);
      }
      liquidVertices.needsUpdate=true;lastCupFill=pose.cupLiquid;
    }
    grounds.visible=pose.dose>.001;grounds.scale.y=.001+pose.dose*.17;grounds.position.y=-1.24+grounds.scale.y/2;
    const waterHeight=Math.max(.001,pose.chamberLiquid*1.96);
    infusion.visible=pose.chamberLiquid>.001;infusion.scale.y=waterHeight;infusion.position.y=-1.04+waterHeight/2;
    chamberSurface.mesh.visible=infusion.visible;chamberSurface.mesh.position.y=-1.04+waterHeight;
    chamberSurface.update(reduced?0:time,fluid.energy,.577);
    coffeeSource.set(0,-1.55+pose.bodyY,0);coffeeTarget.set(pose.cupX,cup.position.y+.18+coffeeHeight,0);
    coffeeStream.update(coffeeSource,coffeeTarget,pose.serve>0?0:fluid.coffeeFlow,time);
    droplets.visible=fluid.coffeeFlow>.035&&pose.serve===0&&pose.cupLiquid>.001;
    if(droplets.visible){
      for(let i=0;i<16;i++){
        const cycle=(time*2.5+i*.618)%1,angle=i*2.39996;
        const radius=cycle*.23*Math.min(1,fluid.coffeeFlow);
        dummy.position.set(Math.cos(angle)*radius,.18+coffeeHeight+Math.sin(cycle*Math.PI)*.10,Math.sin(angle)*radius);
        dummy.scale.setScalar((1-cycle)*Math.min(1,fluid.coffeeFlow));dummy.scale.y*=1.5;
        dummy.updateMatrix();droplets.setMatrixAt(i,dummy.matrix);
      }
      droplets.instanceMatrix.needsUpdate=true;
    }
    kettle.visible=pose.kettleIn>0&&pose.kettleOut<1;
    kettle.position.set(2.09+2.6*(1-pose.kettleIn+pose.kettleOut),2.14+.9*(1-pose.kettleIn+pose.kettleOut),-.25*(1-pose.kettleIn));
    kettle.rotation.z=.42*pose.toolPour+.15*(1-pose.kettleIn)-.2*pose.kettleOut;
    kettle.scale.setScalar(1.35*(.5+.5*pose.kettleIn*(1-pose.kettleOut)));
    kettleWater.visible=kettleWaterTop.visible=kettle.visible&&pose.water<.997;
    if(kettleWater.visible){
      const top=-.458+.79*(1-pose.water),slope=Math.tan(kettle.rotation.z);
      for(let i=0;i<kettleWaterVertices.count;i++){
        const x=kettleWaterOriginal[i*3],upper=kettleWaterOriginal[i*3+1]>0;
        kettleWaterVertices.setY(i,upper?Math.max(-.457,Math.min(.574,top-slope*x)):-.458);
      }
      for(let i=0;i<kettleTopVertices.count;i++)kettleTopVertices.setY(i,Math.max(-.457,Math.min(.574,top-slope*kettleTopVertices.getX(i))));
      kettleWaterVertices.needsUpdate=true;kettleTopVertices.needsUpdate=true;
      kettleWater.geometry.computeVertexNormals();kettleWaterTop.geometry.computeVertexNormals();
    }
    kettle.updateMatrix();spout.copy(kettleTip).applyMatrix4(kettle.matrix);
    waterTarget.set(.04,-1.04+waterHeight,0);
    waterStream.update(spout,waterTarget,progress>3.15?0:fluid.waterFlow,time);
    scoop.visible=progress>1&&progress<2;
    scoop.position.set(-.3-2.5*(1-pose.scoopIn+pose.scoopOut),1.9+.6*(1-pose.scoopIn+pose.scoopOut),.15*Math.sin(pose.scoopIn*Math.PI));
    scoop.rotation.z=-pose.scoop*.8;scoop.scale.setScalar(.4+.6*pose.scoopIn*(1-pose.scoopOut));
    particles.visible=progress>1.2&&progress<1.86;
    if(particles.visible){for(let i=0;i<70;i++){const fraction=((progress-1.2)*2.8+i*.071)%1;const angle=i*2.39996;dummy.position.set(Math.sin(angle)*.19,1.8-fraction*2.87,Math.cos(angle)*.19);dummy.rotation.set(i,progress*7,i*.3);dummy.scale.setScalar(1);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}particles.instanceMatrix.needsUpdate=true;}
    stirrer.visible=pose.stirIn>0&&pose.stirOut<1;
    const stirred=pose.stirIn*(1-pose.stirOut);
    stirrer.position.set(Math.sin(pose.stirAngle)*.27*stirred,1.1+3*(1-stirred),Math.cos(pose.stirAngle)*.27*stirred);
    stirrer.rotation.set(Math.cos(pose.stirAngle)*.13*stirred,0,Math.sin(pose.stirAngle)*.13*stirred);
    stirrer.scale.setScalar(.4+.6*stirred);
    steam.visible=pose.serve>.75;steam.position.set(pose.cupX,-1.22,0);steam.rotation.y=Math.sin(time*.5)*.3;
    steamMaterial.opacity=.1*pose.serve;
    root.position.y=-(1.1*(1-Math.min(1,progress)))+pose.serve*1.55;
    root.rotation.y=-.12+.08*Math.min(1,progress)-.14*Math.min(1,Math.max(0,progress-1))+.12*Math.min(1,Math.max(0,progress-3))+.18*pose.serve;
    root.updateMatrixWorld(true);
    palm.set(0,2.7,0).applyMatrix4(product.plunger.matrixWorld);
    rim.set(0,.6,0).applyMatrix4(product.plunger.matrixWorld);
    return {pose,palm,rim,fluid:{...fluid,level:coffeeHeight,jetVisible:coffeeStream.mesh.visible},fluidActive:fluid.energy>.002||fluid.coffeeFlow>.006||fluid.waterFlow>.006};
  }
  function dispose(){disposeModel({...product,root});}
  return {root,update,dispose};
}

