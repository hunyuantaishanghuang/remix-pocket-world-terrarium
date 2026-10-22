import * as THREE from 'three';

export function createWalnutTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const colorImg = ctx.createImageData(size, size);
  const bumpImg = bCtx.createImageData(size, size);
  const cData = colorImg.data;
  const bData = bumpImg.data;

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    const sinNy4 = Math.sin(ny * Math.PI * 4) * 1.8;
    const sinNy2 = Math.sin(ny * Math.PI * 2) * 3.2;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const wave =
        Math.sin(nx * Math.PI * 10 + sinNy4) * 0.5 +
        Math.sin(nx * Math.PI * 26 + ny * 6.0) * 0.25 +
        Math.cos((nx - 0.5) * 18 + sinNy2) * 0.25;

      const grain = (wave + 1) * 0.5;
      const idx = (y * size + x) * 4;

      cData[idx] = Math.round(52 + grain * 44);
      cData[idx + 1] = Math.round(30 + grain * 26);
      cData[idx + 2] = Math.round(17 + grain * 15);
      cData[idx + 3] = 255;

      const bVal = Math.round(115 + grain * 28);
      bData[idx] = bVal;
      bData[idx + 1] = bVal;
      bData[idx + 2] = bVal;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(colorImg, 0, 0);
  bCtx.putImageData(bumpImg, 0, 0);

  // Subtle wood pores
  ctx.fillStyle = 'rgba(28, 14, 7, 0.25)';
  bCtx.fillStyle = 'rgba(60, 60, 60, 0.3)';
  for (let i = 0; i < 400; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const len = 4 + Math.random() * 10;
    ctx.fillRect(px, py, 1, len);
    bCtx.fillRect(px, py, 1, len);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

export function createLinenTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const colorImg = ctx.createImageData(size, size);
  const bumpImg = bCtx.createImageData(size, size);
  const cData = colorImg.data;
  const bData = bumpImg.data;

  const step = 2;
  for (let y = 0; y < size; y++) {
    const sy = Math.floor(y / step);
    const warpShade = (Math.sin(sy * 0.7) * 0.5 + 0.5) * 10;
    for (let x = 0; x < size; x++) {
      const sx = Math.floor(x / step);
      const weftShade = (Math.cos(sx * 0.8) * 0.5 + 0.5) * 10;
      const isOver = ((sx + sy) & 1) === 0;
      const delta = (isOver ? 7 : -7) + (warpShade - weftShade) * 0.45;

      const idx = (y * size + x) * 4;
      cData[idx] = Math.min(255, Math.max(0, Math.round(230 + delta)));
      cData[idx + 1] = Math.min(255, Math.max(0, Math.round(221 + delta)));
      cData[idx + 2] = Math.min(255, Math.max(0, Math.round(207 + delta)));
      cData[idx + 3] = 255;

      const bump = isOver ? 168 : 96;
      bData[idx] = bump;
      bData[idx + 1] = bump;
      bData[idx + 2] = bump;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(colorImg, 0, 0);
  bCtx.putImageData(bumpImg, 0, 0);

  ctx.fillStyle = 'rgba(181, 165, 145, 0.32)';
  ctx.fillRect(0, size * 0.84, size, 4);
  ctx.fillRect(0, size * 0.87, size, 2);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 3);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);

  return { map, bumpMap };
}

export function createChalkyWindowsillTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const colorImg = ctx.createImageData(size, size);
  const bumpImg = bCtx.createImageData(size, size);
  const cData = colorImg.data;
  const bData = bumpImg.data;

  for (let y = 0; y < size; y++) {
    const rowWave = Math.sin(y * 0.35) * 3;
    for (let x = 0; x < size; x++) {
      const grain = (Math.random() - 0.5) * 4 + rowWave;
      const v = Math.round(241 + grain);
      const bv = Math.round(128 + grain * 3.2);
      const idx = (y * size + x) * 4;

      cData[idx] = Math.min(255, v + 2);
      cData[idx + 1] = Math.min(255, v);
      cData[idx + 2] = Math.max(0, v - 5);
      cData[idx + 3] = 255;

      bData[idx] = bv;
      bData[idx + 1] = bv;
      bData[idx + 2] = bv;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(colorImg, 0, 0);
  bCtx.putImageData(bumpImg, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 2);

  return { map, bumpMap };
}

export function createRoomEnvTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#7c6d9c');
  grad.addColorStop(0.42, '#b9a3c9');
  grad.addColorStop(0.55, '#d6c3b8');
  grad.addColorStop(1.0, '#423632');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const winX = width * 0.22;
  const winY = height * 0.22;
  const winW = width * 0.16;
  const winH = height * 0.28;

  const glow = ctx.createRadialGradient(
    winX + winW * 0.5,
    winY + winH * 0.5,
    6,
    winX + winW * 0.5,
    winY + winH * 0.5,
    winW * 1.4,
  );
  glow.addColorStop(0, 'rgba(255, 238, 214, 0.75)');
  glow.addColorStop(0.5, 'rgba(235, 205, 225, 0.28)');
  glow.addColorStop(1, 'rgba(180, 160, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 247, 235, 0.85)';
  const gap = 5;
  const pw = (winW - gap) / 2;
  const ph = (winH - gap) / 2;
  ctx.fillRect(winX, winY, pw, ph);
  ctx.fillRect(winX + pw + gap, winY, pw, ph);
  ctx.fillRect(winX, winY + ph + gap, pw, ph);
  ctx.fillRect(winX + pw + gap, winY + ph + gap, pw, ph);

  const envTex = new THREE.CanvasTexture(canvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  return envTex;
}
