https://codepen.io/prisoner849/pen/YPKJLoy

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

console.clear();

window.addEventListener("dblclick", () => {
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen();
  }else{
    document.exitFullscreen();
  }
});

/*THREE.ShaderChunk["fog_vertex"] = `
#ifdef USE_FOG
	vFogDepth = length(- mvPosition);
#endif
`;*/

class FacetedBox extends THREE.BufferGeometry{
  constructor(w, h, d, f, isWireframed){
    super();
    let hw = w * 0.5, hh = h * 0.5, hd = d * 0.5;
    let vertices = [
      // px
      hw, hh - f, -hd + f,   // 0
      hw, -hh + f, -hd + f,  // 1
      hw, -hh + f, hd - f,   // 2
      hw, hh - f, hd - f,    // 3

      // pz
      hw - f, hh - f, hd,    // 4
      hw - f, -hh + f, hd,   // 5
      -hw + f, -hh + f, hd,  // 6
      -hw + f, hh - f, hd,   // 7

      // nx
      -hw, hh - f, hd - f,   // 8
      -hw, -hh + f, hd - f,  // 9
      -hw, -hh + f, -hd + f, // 10
      -hw, hh - f, -hd + f,  // 11

      // nz
      -hw + f, hh - f, -hd,  // 12
      -hw + f, -hh + f, -hd, // 13
      hw - f, -hh + f, -hd,  // 14
      hw - f, hh - f, -hd,   // 15

      // py
      hw - f, hh, -hd + f,   // 16
      hw - f, hh, hd - f,    // 17
      -hw + f, hh, hd - f,   // 18
      -hw + f, hh, -hd + f,  // 19

      // ny
      hw - f, -hh, -hd + f,  // 20
      hw - f, -hh, hd - f,   // 21
      -hw + f, -hh, hd - f,  // 22
      -hw + f, -hh, -hd + f  // 23
    ];

    let indices = [
      0, 2, 1, 3, 2, 0,
      4, 6, 5, 7, 6, 4,
      8, 10, 9, 11, 10, 8,
      12, 14, 13, 15, 14, 12,
      16, 18, 17, 19, 18, 16,
      20, 21, 22, 23, 20, 22,

      // link the sides
      3, 5, 2, 4, 5, 3,
      7, 9, 6, 8, 9, 7,
      11, 13, 10, 12, 13, 11,
      15, 1, 14, 0, 1, 15,

      // link the lids
      // top
      16, 3, 0, 17, 3, 16,
      17, 7, 4, 18, 7, 17,
      18, 11, 8, 19, 11, 18,
      19, 15, 12, 16, 15, 19,
      // bottom
      1, 21, 20, 2, 21, 1,
      5, 22, 21, 6, 22, 5,
      9, 23, 22, 10, 23, 9,
      13, 20, 23, 14, 20, 13,

      // corners
      // top
      3, 17, 4,
      7, 18, 8,
      11, 19, 12,
      15, 16, 0,
      // bottom
      2, 5, 21,
      6, 9, 22,
      10, 13, 23,
      14, 1, 20
    ];

    let indicesWire = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      8, 9, 9, 10, 10, 11, 11, 8,
      12, 13, 13, 14, 14, 15, 15, 12,
      16, 17, 17, 18, 18, 19, 19, 16,
      20, 21, 21, 22, 22, 23, 23, 20,
      // link the sides
      2, 5, 3, 4,     //px - pz
      6, 9, 7, 8,     // pz - nx
      10, 13, 11, 12, // nx - nz
      15, 0, 14, 1,   // nz - px

      // link the lids
      // top
      16, 0, 17, 3,   // px
      17, 4, 18, 7,   // pz
      18, 8, 19, 11,  // nx
      19, 12, 16, 15,  // nz
      // bottom
      20, 1, 21, 2,
      21, 5, 22, 6,
      22, 9, 23, 10,
      23, 13, 20, 14
    ];

    this.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.setIndex(isWireframed ? indicesWire : indices);
    if (!isWireframed) this.computeVertexNormals();
  }
}

class Tower extends THREE.Mesh{
  constructor(){
    let g = mergeGeometries(
      [
        new FacetedBox(1, 5, 1, 0.1, false).translate(0, 2.5, 0).toNonIndexed(),
        new FacetedBox(2, 0.25, 2, 0.05, false).translate(0, 0.25, 0).toNonIndexed(),
        new FacetedBox(1.75, 0.25, 1.75, 0.05, false).translate(0, 0.5, 0).toNonIndexed(),
        new FacetedBox(1.5, 0.25, 1.5, 0.05, false).translate(0, 0.75, 0).toNonIndexed()
      ]
    ).scale(1.5, 1.5, 1.5);
    g.computeVertexNormals();
    let m = new THREE.MeshLambertMaterial({
      color: 0x222222,
      onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        shader.uniforms.u_seed = {value: Math.random() * 100};
        shader.vertexShader = `
          varying vec3 vPos;
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            vPos = position;
          `
        );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
          uniform float time;
          uniform float u_seed;
          varying vec3 vPos;
          ${noise}
          ${shader.fragmentShader}
        `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `vec4 diffuseColor = vec4( diffuse, opacity );
            
            vec3 mult = vec3(10, 5, 10);
            float n = abs(
              snoise(
                vec4(
                  floor(
                    vPos * mult)
                    , floor(u_seed + time)
                )
              )
            );
            
            n *= step(2.7, vPos.y) - step(6.7, vPos.y);
            
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1), pow(n + 0.25, 8.));
          
          `
        );
        //console.log(shader.fragmentShader);
      }
    });
    super(g, m);

    let lg = new THREE.EdgesGeometry(g);
    let lm = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.5, 1, 0.75),
      polygonOffset: true,
      polygonOffsetFactor: 0.1,
      polygonOffsetUnit: 1
    });
    let l = new THREE.LineSegments(lg, lm);
    this.add(l);

  }
}

class Towers extends THREE.Object3D{
  constructor(){
    super();
    for(let i = 0; i < 400; i++){
      let xPos = i % 20;
      let yPos = Math.floor(i / 20);
      if ((xPos + yPos) % 2 != 0) continue;
      let tower = new Tower();
      tower.position.set(
        -9.5 + xPos, 
        0,
        -9.5 + yPos
      ).multiply(new THREE.Vector3(5, 0, 5));
      this.add(tower);
    }
  }
  
  update(t){
    this.children.forEach(tower => {
      let currZ = tower.position.z + t;
      if(currZ > 50){
        currZ = -50 + (currZ + 50) % 100;
      }
      tower.position.z = currZ;
    })
  }
}


let gu = {
  time: {
    value: 0
  }
};
let dpr = Math.min(devicePixelRatio, 1);
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 25, 50);
let camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0.25, 0, 1).setLength(1);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth * dpr, innerHeight * dpr);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth * dpr, innerHeight * dpr);
});

let camShift = new THREE.Vector3(0.75, 0.18, 0);
camera.position.add(camShift);
let controls = new OrbitControls(camera, renderer.domElement);
controls.target.add(camShift);
controls.enableDamping = true;

let light = new THREE.DirectionalLight(0xffffff, Math.PI * 2);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, Math.PI * 0.25));

// <stuff>
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI * 0.5),
  new THREE.MeshBasicMaterial({
    color: 0x222222,
    onBeforeCompile: shader => {
      shader.uniforms.time = gu.time;
      shader.fragmentShader = `
        uniform float time;
        ${noise}
        ${shader.fragmentShader}
      `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( diffuse, opacity );
        
          vec2 cUv =  abs(fract((vUv + vec2(0., time / 100.)) * 20.) - 0.5);
          float f = smoothstep(0.45 - 0.005, 0.45 + 0.005, max(cUv.x, cUv.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.25), f);
        
        `
      );
      console.log(shader.fragmentShader);
    }
  })
);
ground.material.defines = {"USE_UV" : ""};
scene.add(ground);

let towers = new Towers();
scene.add(towers);

// </stuff>

let clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
  let dt = clock.getDelta();
  t += dt;
  gu.time.value = t;
  controls.update();
  
  towers.update(dt);
  
  renderer.render(scene, camera);
});
