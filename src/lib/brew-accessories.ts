import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Hand-built from the three RED product references in output/tripo-references.
// Coordinates stay compatible with the brewing rig; liquid is a separate mesh.
type Profile = [number, number][];
const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

function turned(profile: Profile, material: THREE.Material, name: string, segments = 80) {
  const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  // All longitudes meet at the same pole: a radial normal there produces
  // triangular reflection seams across an otherwise flat glass floor.
  const normals = geometry.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) {
    const point = i % profile.length;
    if (profile[point][0] === 0) normals.setXYZ(i, 0, point === 0 ? -1 : 1, 0);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function hollowSpout(curve: THREE.Curve<THREE.Vector3>, outer: number, inner: number) {
  const tube = new THREE.TubeGeometry(curve, 64, outer, 16, false);
  const bore = new THREE.TubeGeometry(curve, 64, inner, 16, false);
  const indices = bore.index!, normals = bore.getAttribute('normal');
  for (let i = 0; i < indices.count; i += 3) {
    const b = indices.getX(i + 1); indices.setX(i + 1, indices.getX(i + 2)); indices.setX(i + 2, b);
  }
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  const lips = [0, 1].map(t => {
    const ring = new THREE.RingGeometry(inner, outer, 16);
    const direction = curve.getTangent(t).multiplyScalar(t === 0 ? -1 : 1);
    ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 0, 1), direction));
    const point = curve.getPoint(t); ring.translate(point.x, point.y, point.z);
    return ring;
  });
  const geometry = mergeGeometries([tube, bore, ...lips]);
  [tube, bore, ...lips].forEach(part => part.dispose());
  return geometry;
}

function enamel(logo: THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({ map: logo, color: '#ffffff', transparent: true, alphaTest: .08, depthWrite: false, toneMapped: false });
  material.name = 'RED_original_white_enamel';
  return material;
}

function cylinderLogo(logo: THREE.Texture, radius: number, height: number, angle: number, taper = 0) {
  const label = new THREE.Mesh(new THREE.CylinderGeometry(radius + taper, radius - taper, height, 48, 1, true, -angle / 2, angle), enamel(logo));
  label.name = 'RED_Coffee_Club_original_logo';
  label.renderOrder = 5;
  return label;
}

export function createBrewAccessories(image: HTMLImageElement) {
  const logo = new THREE.Texture(image); logo.colorSpace = THREE.SRGBColorSpace; logo.needsUpdate = true;
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: .035, transmission: 1,
    thickness: .075, ior: 1.46, transparent: true, opacity: 1, depthWrite: false,
    clearcoat: .12, clearcoatRoughness: .05, envMapIntensity: .85,
    attenuationColor: '#e5eee8', attenuationDistance: 4,
  });
  glass.name = 'Clear_borosilicate_glass';
  const black = new THREE.MeshPhysicalMaterial({ color: '#17191a', roughness: .32, clearcoat: .15, metalness: .1 });
  black.name = 'Matte_graphite';
  const steel = new THREE.MeshPhysicalMaterial({ color: '#999ea3', metalness: 1, roughness: .3, anisotropy: .4, anisotropyRotation: Math.PI / 2 });
  steel.name = 'Brushed_stainless_steel';

  const cup = new THREE.Group(); cup.name = 'RED_glass_cup';
  cup.add(turned([
    [0, 0], [.52, 0], [.64, 0], [.69, .015], [.73, .045], [.755, .10],
    [.916, 1.60], [.925, 1.655], [.922, 1.68], [.908, 1.697],
    [.885, 1.694], [.873, 1.676], [.87, 1.60], [.70, .18],
    [.66, .155], [.56, .155], [0, .155],
  ], glass, 'Cup_hollow_body_and_polished_rim'));
  const cupHandlePath = new THREE.CurvePath<THREE.Vector3>();
  cupHandlePath.add(new THREE.CubicBezierCurve3(v(.896, 1.36), v(1.15, 1.41), v(1.52, 1.34), v(1.52, .99)));
  cupHandlePath.add(new THREE.CubicBezierCurve3(v(1.52, .99), v(1.52, .67), v(1.19, .36), v(.78, .30)));
  const cupHandle = new THREE.Mesh(new THREE.TubeGeometry(cupHandlePath, 56, .085, 14, false), glass);
  cupHandle.name = 'Cup_D_handle'; cup.add(cupHandle);
  const cupLabel = cylinderLogo(logo, .844, .50, .85, .027); cupLabel.position.y = .90; cup.add(cupLabel);
  cup.userData = { reference: 'taza-cristal-red.png', liquidFloor: .18, liquidMaxHeight: 1.08 };

  const kettle = new THREE.Group(); kettle.name = 'RED_glass_gooseneck_kettle';
  kettle.add(turned([
    [0, -.55], [.40, -.55], [.50, -.55], [.57, -.54], [.62, -.50], [.645, -.44],
    [.653, -.3], [.653, .56], [.65, .595], [.632, .611], [.613, .595],
    [.614, .54], [.614, -.38], [.595, -.43], [.54, -.466], [.46, -.466], [0, -.466],
  ], glass, 'Kettle_hollow_glass_body'));
  const lid = turned([[0, .58], [.636, .58], [.666, .593], [.672, .619], [.665, .642], [.63, .651], [0, .651]], black, 'Kettle_separate_lid');
  const knob = turned([[0, .648], [.132, .648], [.145, .661], [.145, .79], [.135, .803], [0, .803]], black, 'Kettle_lid_knob', 48);
  kettle.add(lid, knob);
  const handleShape = new THREE.Shape();
  handleShape.moveTo(.645, .51); handleShape.lineTo(1.065, .58);
  handleShape.quadraticCurveTo(1.18, .59, 1.20, .46); handleShape.lineTo(1.30, -.10);
  handleShape.quadraticCurveTo(1.32, -.21, 1.22, -.26); handleShape.lineTo(.665, -.51);
  handleShape.lineTo(.637, -.33); handleShape.lineTo(1.12, -.12);
  handleShape.lineTo(1.027, .37); handleShape.lineTo(.655, .33); handleShape.closePath();
  const handleGeometry = new THREE.ExtrudeGeometry(handleShape, { depth: .12, bevelEnabled: true, bevelSize: .034, bevelThickness: .025, bevelSegments: 3, steps: 1, curveSegments: 12 });
  handleGeometry.translate(0, 0, -.06);
  const kettleHandle = new THREE.Mesh(handleGeometry, black); kettleHandle.name = 'Kettle_angular_handle'; kettle.add(kettleHandle);
  for (const y of [.43, -.40]) {
    const lug = new THREE.Mesh(new THREE.SphereGeometry(.123, 24, 16), glass); lug.position.set(.636, y, 0); lug.scale.set(.8, 1.1, .85); kettle.add(lug);
  }
  const neck = new THREE.CurvePath<THREE.Vector3>();
  neck.add(new THREE.CubicBezierCurve3(v(-.59, -.38), v(-1.05, -.40), v(-1.09, -.10), v(-1.16, .25)));
  neck.add(new THREE.CubicBezierCurve3(v(-1.16, .25), v(-1.23, .63), v(-1.34, .65), v(-1.46, .59)));
  const spout = new THREE.Mesh(hollowSpout(neck, .062, .040), glass); spout.name = 'Kettle_open_glass_spout'; kettle.add(spout);
  const kettleLabel = cylinderLogo(logo, .656, .315, .70); kettleLabel.position.y = -.02; kettle.add(kettleLabel);
  const kettleTip = v(-1.46, .59);
  kettle.scale.setScalar(1.35);
  kettle.userData = { reference: 'tetera-vidrio-red.png', spoutTip: kettleTip.toArray() };

  const scoop = new THREE.Group(); scoop.name = 'RED_measuring_scoop';
  const bowl: Profile = [[0, -.268]];
  for (let i = 1; i <= 24; i++) { const a = i / 24 * Math.PI / 2; bowl.push([.31 * Math.sin(a), -.268 * Math.cos(a)]); }
  bowl.push([.310, .013], [.298, .02], [.286, .013]);
  for (let i = 24; i >= 0; i--) { const a = i / 24 * Math.PI / 2; bowl.push([.285 * Math.sin(a), -.239 * Math.cos(a)]); }
  scoop.add(turned(bowl, steel, 'Scoop_concave_bowl', 64));
  const grip = new THREE.Shape();
  grip.moveTo(-.30, -.075); grip.bezierCurveTo(-.36, -.11, -.44, -.083, -.60, -.091);
  grip.lineTo(-1.32, -.104); grip.quadraticCurveTo(-1.42, -.104, -1.42, 0);
  grip.quadraticCurveTo(-1.42, .104, -1.32, .104); grip.lineTo(-.60, .091);
  grip.bezierCurveTo(-.44, .083, -.36, .11, -.30, .075); grip.closePath();
  const gripGeometry = new THREE.ExtrudeGeometry(grip, { depth: .025, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 3, curveSegments: 16, steps: 1 });
  gripGeometry.rotateX(-Math.PI / 2); gripGeometry.translate(0, -.023, 0);
  const scoopHandle = new THREE.Mesh(gripGeometry, steel); scoopHandle.name = 'Scoop_flat_tapered_handle'; scoop.add(scoopHandle);
  const scoopLogo = new THREE.Mesh(new THREE.PlaneGeometry(.165, .116), enamel(logo));
  scoopLogo.name = 'RED_Coffee_Club_handle_logo'; scoopLogo.rotation.set(-Math.PI / 2, 0, Math.PI / 2); scoopLogo.position.set(-.74, .012, 0); scoopLogo.renderOrder = 5; scoop.add(scoopLogo);
  scoop.userData = { reference: 'cuchara-red.png' };

  return { cup, kettle, scoop, kettleTip };
}
