// Low-resolution stills with a dissolve between them and an ordered dither on the way out.
import * as THREE from 'three';

export const W = 640;
export const H = 400;

const FRAG = /* glsl */ `
  uniform sampler2D tCur;
  uniform sampler2D tPrev;
  uniform float uMix;
  uniform float uFade;
  uniform float uLevels;
  uniform float uExposure;
  varying vec2 vUv;
  float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  vec3 film(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  void main(){
    vec3 c = mix(texture2D(tPrev, vUv).rgb, texture2D(tCur, vUv).rgb, uMix);
    c = film(c * uExposure);
    c = pow(c, vec3(1.0 / 2.2));
    vec2 q = vUv - 0.5;
    c *= 1.0 - dot(q, q) * 0.55;
    c *= uFade;
    float d = bayer4(gl_FragCoord.xy) - 0.47;
    c = floor(c * (uLevels - 1.0) + 0.5 + d * 0.9) / (uLevels - 1.0);
    gl_FragColor = vec4(c, 1.0);
  }`;

export function createRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;

  const float = r.capabilities.isWebGL2 && r.extensions.has('EXT_color_buffer_float');
  const target = () =>
    new THREE.WebGLRenderTarget(W, H, {
      type: float ? THREE.HalfFloatType : THREE.UnsignedByteType,
      samples: 4,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
  let cur = target(),
    prev = target();

  const uniforms = {
    tCur: { value: cur.texture },
    tPrev: { value: prev.texture },
    uMix: { value: 1 },
    uFade: { value: 1 },
    uLevels: { value: 8 },
    uExposure: { value: 1.15 },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    }),
  );
  const postScene = new THREE.Scene();
  postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let t0 = 0,
    dur = 0;
  let fadeFrom = 1,
    fadeTo = 1,
    fadeT0 = 0,
    fadeDur = 0,
    fadeDone = null;

  const present = () => {
    r.setRenderTarget(null);
    r.render(postScene, postCam);
  };
  const draw = (scene, camera) => {
    r.setRenderTarget(cur);
    r.render(scene, camera);
  };

  return {
    three: r,
    uniforms,
    /** Cut or dissolve to a new still. */
    show(scene, camera, ms = 450) {
      [cur, prev] = [prev, cur];
      uniforms.tCur.value = cur.texture;
      uniforms.tPrev.value = prev.texture;
      draw(scene, camera);
      uniforms.uMix.value = ms > 0 ? 0 : 1;
      t0 = performance.now();
      dur = ms;
      present();
    },
    /** Redraw the current still in place (something on screen is moving). */
    refresh(scene, camera) {
      draw(scene, camera);
      present();
    },
    fade(to, ms, done) {
      fadeFrom = uniforms.uFade.value;
      fadeTo = to;
      fadeT0 = performance.now();
      fadeDur = ms;
      fadeDone = done || null;
    },
    /** Advance any dissolve or fade. Returns true while one is running. */
    tick(now) {
      let busy = false;
      if (uniforms.uMix.value < 1) {
        uniforms.uMix.value = Math.min(1, (now - t0) / dur);
        busy = true;
      }
      if (fadeDur > 0) {
        const k = Math.min(1, (now - fadeT0) / fadeDur);
        uniforms.uFade.value = fadeFrom + (fadeTo - fadeFrom) * k;
        busy = true;
        if (k >= 1) {
          fadeDur = 0;
          const cb = fadeDone;
          fadeDone = null;
          if (cb) cb();
        }
      }
      if (busy) present();
      return busy;
    },
  };
}
