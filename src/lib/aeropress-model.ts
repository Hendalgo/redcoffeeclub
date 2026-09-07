import * as THREE from 'three';

export type AeroPressModel = ReturnType<typeof createAeroPress>;

export function createAeroPress(brandLogo: HTMLImageElement) {
  const root = new THREE.Group(); root.name = 'AeroPress_Original';
  const chamber = new THREE.Group(); chamber.name = 'Chamber';
  const plunger = new THREE.Group(); plunger.name = 'Plunger_with_silicone_seal';
  const filter = new THREE.Group(); filter.name = 'Paper_microfilter';
  const cap = new THREE.Group(); cap.name = 'Perforated_filter_cap';
  root.add(chamber, plunger, filter, cap);

  const smoke = new THREE.MeshPhysicalMaterial({ color: '#302720', metalness: .015, roughness: .26, transparent: true, opacity: .58, depthWrite: false, ior: 1.49, clearcoat: .6, clearcoatRoughness: .23, side: THREE.DoubleSide });
  const rim = new THREE.MeshPhysicalMaterial({ color: '#1d1815', metalness: .06, roughness: .28, clearcoat: .7 });
  const black = new THREE.MeshStandardMaterial({ color: '#161616', roughness: .35, metalness: .13 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#121313', roughness: .7 });
  const paper = new THREE.MeshStandardMaterial({ color: '#ede4d3', roughness: 1, side: THREE.DoubleSide });

  function lathe(name: string, profile: number[][], material: THREE.Material, parent: THREE.Group) {
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x,y]) => new THREE.Vector2(x,y)), 96), material);
    mesh.name = name; parent.add(mesh); return mesh;
  }
  // Closed radial profiles include wall thickness, rolled lips and tapered shoulders.
  lathe('Hollow_brewing_chamber', [[.585,-1.2],[.638,-1.2],[.65,-1.15],[.658,1.12],[.67,1.14],[.677,1.2],[.66,1.24],[.596,1.24],[.585,1.2],[.585,-1.2]], smoke, chamber);
  lathe('Upper_rolled_lip', [[.655,1.17],[.677,1.18],[.687,1.21],[.678,1.235],[.65,1.235],[.655,1.17]], rim, chamber);
  lathe('Lower_threaded_collar', [[.585,-1.31],[.665,-1.31],[.673,-1.27],[.673,-1.13],[.585,-1.13],[.585,-1.31]], rim, chamber);

  const flangeShape = new THREE.Shape();
  for (let i=0;i<7;i++) { const a=i/6*Math.PI*2+Math.PI/6; const x=Math.cos(a)*.99,y=Math.sin(a)*.99; i ? flangeShape.lineTo(x,y) : flangeShape.moveTo(x,y); }
  const flangeHole = new THREE.Path(); flangeHole.absarc(0,0,.587,0,Math.PI*2,true); flangeShape.holes.push(flangeHole);
  const flange = new THREE.Mesh(new THREE.ExtrudeGeometry(flangeShape,{depth:.065,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.018,curveSegments:64}),smoke);
  flange.name='Hexagonal_cup_support'; flange.rotation.x=-Math.PI/2; flange.position.y=-1.14; chamber.add(flange);
  // Three bayonet lugs mechanically lock the filter cap to the chamber.
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2;const lug=new THREE.Mesh(new THREE.BoxGeometry(.16,.075,.08),black);lug.name=`Bayonet_lug_${i+1}`;lug.position.set(Math.sin(a)*.66,-1.27,Math.cos(a)*.66);lug.rotation.y=a;chamber.add(lug);}

  lathe('Hollow_plunger_tube', [[.476,.06],[.53,.06],[.536,.14],[.543,2.51],[.554,2.58],[.5,2.61],[.484,2.55],[.476,.06]], smoke, plunger);
  lathe('Palm_grip_flange', [[.495,2.57],[.73,2.57],[.82,2.6],[.846,2.64],[.836,2.68],[.78,2.7],[.495,2.7],[.495,2.57]], smoke, plunger);
  lathe('Grip_polished_edge', [[.79,2.61],[.845,2.62],[.85,2.645],[.837,2.67],[.79,2.67],[.79,2.61]],rim,plunger);
  lathe('Silicone_piston', [[0,.015],[.54,.015],[.575,.045],[.576,.105],[.568,.14],[.57,.225],[.54,.25],[0,.25]],rubber,plunger);
  lathe('Piston_sealing_lip', [[.54,.065],[.58,.065],[.582,.085],[.58,.115],[.54,.115],[.54,.065]],black,plunger);
  const ribGeo=new THREE.BoxGeometry(.03,2.27,.075);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const rib=new THREE.Mesh(ribGeo,smoke);rib.name=`Internal_plunger_rib_${i+1}`;rib.position.set(Math.sin(a)*.475,1.4,Math.cos(a)*.475);rib.rotation.y=a;plunger.add(rib);}

  const filterMesh = new THREE.Mesh(new THREE.CylinderGeometry(.593,.593,.016,96),paper); filterMesh.name='Paper_disc';filterMesh.position.y=-1.327;filter.add(filterMesh);
  // Subtle paper fibers are deterministic and share a single merged line geometry.
  const fiberVertices=[]; for(let i=0;i<140;i++){const a=i*2.39996,r=Math.sqrt(i/140)*.56;const x=Math.cos(a)*r,z=Math.sin(a)*r;fiberVertices.push(x,-1.317,z,x+.012,-1.317,z+.005);}
  const fibers=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(fiberVertices,3)),new THREE.LineBasicMaterial({color:'#b8ab90',transparent:true,opacity:.25}));fibers.name='Paper_fibers';filter.add(fibers);

  lathe('Cap_rim', [[.61,-1.55],[.69,-1.55],[.71,-1.52],[.718,-1.3],[.704,-1.27],[.669,-1.27],[.665,-1.45],[.61,-1.45],[.61,-1.55]],black,cap);
  const ribShape=new THREE.BoxGeometry(.033,.215,.047);const ribs=new THREE.InstancedMesh(ribShape,black,56);ribs.name='56_molded_grip_ridges';const dummy=new THREE.Object3D();
  for(let i=0;i<56;i++){const a=i/56*Math.PI*2;dummy.position.set(Math.sin(a)*.713,-1.414,Math.cos(a)*.713);dummy.rotation.y=a;dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);}cap.add(ribs);
  const sieveShape=new THREE.Shape();sieveShape.absarc(0,0,.652,0,Math.PI*2,false);
  const holePositions=[[0,0]];for(let ring=1;ring<=3;ring++){const n=ring*6;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;holePositions.push([Math.cos(a)*ring*.167,Math.sin(a)*ring*.167]);}}
  for(const [x,y] of holePositions){const hole=new THREE.Path();hole.absarc(x,y,.047,0,Math.PI*2,true);sieveShape.holes.push(hole);}
  const sieve=new THREE.Mesh(new THREE.ExtrudeGeometry(sieveShape,{depth:.044,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:8}),black);sieve.name='Base_with_37_open_filter_holes';sieve.rotation.x=-Math.PI/2;sieve.position.y=-1.55;cap.add(sieve);

  // Curved label decal, rendered locally; it follows the barrel rather than a flat billboard.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=1024;labelCanvas.height=2048;
  const ctx=labelCanvas.getContext('2d')!;ctx.fillStyle='#d3b596';ctx.textAlign='center';
  // Place the supplied RED artwork intact. Compensate for the cylinder's UV aspect
  // so the logo keeps its proportions on the physical surface of the chamber.
  const logoWidth=640;
  const uvAspectCorrection=((.663+.648)/2*1.44/labelCanvas.width)/(2.12/labelCanvas.height);
  const logoHeight=logoWidth*(brandLogo.naturalHeight/brandLogo.naturalWidth)*uvAspectCorrection;
  ctx.drawImage(brandLogo,24,(labelCanvas.height-logoHeight)/2,logoWidth,logoHeight);
  for(let i=1;i<=4;i++){const y=1720-(i-1)*424;ctx.strokeStyle='#d3b596';ctx.lineWidth=7;ctx.beginPath();ctx.arc(778,y,65,0,Math.PI*2);ctx.stroke();ctx.font='80px sans-serif';ctx.fillText(String(i),778,y+28);}
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;labelTexture.anisotropy=4;
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.663,.648,2.12,64,1,true,-.72,1.44),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1}));label.name='RED_Coffee_Club_logo_and_1_to_4_markings';label.position.y=-.015;chamber.add(label);
  const anchors={plunger:new THREE.Object3D(),chamber:new THREE.Object3D(),filter:new THREE.Object3D(),cap:new THREE.Object3D()};
  anchors.plunger.position.set(.55,1.85,0);plunger.add(anchors.plunger);
  anchors.chamber.position.set(-.64,.15,0);chamber.add(anchors.chamber);
  anchors.filter.position.set(.57,-1.32,0);filter.add(anchors.filter);
  anchors.cap.position.set(-.6,-1.43,0);cap.add(anchors.cap);
  root.userData={description:'Parametric reconstruction of AeroPress Original with custom RED Coffee Club branding; not manufacturer CAD',brand:'RED Coffee Club',logoSource:'Supplied RED Coffee Club artwork: /images/logo.png',units:'One scene unit = 5 cm. GLB export applies 0.05 scale.'};
  return {root,chamber,plunger,filter,cap,anchors};
}

export function disposeModel(model: AeroPressModel) {
  const geoms=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  model.root.traverse(obj=>{if(obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments){geoms.add(obj.geometry);for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])){mats.add(mat);if('map' in mat && mat.map instanceof THREE.Texture)textures.add(mat.map);}}});
  geoms.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
