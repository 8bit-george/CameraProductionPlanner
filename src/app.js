const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const workspace = document.getElementById("workspace");

let background = null;
let backgroundImage = null;
let cameras = [];
let selectedId = null;
let editingId = null;
let zoom = 1;
let viewX = 0;
let viewY = 0;
let dragging = null;
let cameraIcon = null;
let cameraScale = 40;
const tintedIconCache = new Map();

// Replace YOUR_USERNAME with your Buy Me a Coffee username.
// Example: https://www.buymeacoffee.com/george
const BUY_ME_A_COFFEE_URL = "https://www.buymeacoffee.com/8bit_george";

const $ = id => document.getElementById(id);

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = workspace.clientWidth * dpr;
  canvas.height = workspace.clientHeight * dpr;
  canvas.style.width = workspace.clientWidth + "px";
  canvas.style.height = workspace.clientHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener("resize", resizeCanvas);

function fitBackground() {
  if (!backgroundImage) return;
  const w = workspace.clientWidth, h = workspace.clientHeight;
  const scale = Math.min(w / backgroundImage.width, h / backgroundImage.height);
  zoom = scale;
  viewX = (w - backgroundImage.width * zoom) / 2;
  viewY = (h - backgroundImage.height * zoom) / 2;
  updateZoomLabel();
  draw();
}

function worldToScreen(x, y) {
  return { x: viewX + x * zoom, y: viewY + y * zoom };
}
function screenToWorld(x, y) {
  return { x: (x - viewX) / zoom, y: (y - viewY) / zoom };
}

function draw() {
  const w = workspace.clientWidth, h = workspace.clientHeight;
  ctx.clearRect(0, 0, w, h);
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, viewX, viewY,
      backgroundImage.width * zoom, backgroundImage.height * zoom);
  }
  cameras.forEach(drawCamera);
}

function loadCameraIcon() {
  cameraIcon = new Image();
  cameraIcon.onload = () => draw();
  cameraIcon.src = "assets/camera.png";
}

function getTintedCameraIcon(color) {
  if (!cameraIcon || !cameraIcon.naturalWidth) return null;

  const key = color;
  if (tintedIconCache.has(key)) return tintedIconCache.get(key);

  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = cameraIcon.naturalWidth;
  iconCanvas.height = cameraIcon.naturalHeight;

  const iconCtx = iconCanvas.getContext("2d");
  iconCtx.drawImage(cameraIcon, 0, 0);
  iconCtx.globalCompositeOperation = "source-in";
  iconCtx.fillStyle = color;
  iconCtx.fillRect(0, 0, iconCanvas.width, iconCanvas.height);

  tintedIconCache.set(key, iconCanvas);
  return iconCanvas;
}

function drawTintedIcon(drawCtx, image, x, y, width, height) {
  drawCtx.drawImage(image, x, y, width, height);
}

function drawCameraGraphic(drawCtx, cam, scale, selected = false, includeOperator = true) {
  if (!cameraIcon || !cameraIcon.naturalWidth) return;

  const color = cam.color || "#3b82f6";
  const outlineColor = cam.outlineColor || "#111318";

  // The imported icon is nearly square. Keep it large enough to be
  // immediately recognisable while still leaving room for the labels.
  const iconW = cameraScale * scale;
  const iconH = iconW * (cameraIcon.naturalHeight / cameraIcon.naturalWidth);
  const outlineWidth = 1.5 * scale;

  const colourIcon = getTintedCameraIcon(color);
  const outlineIcon = getTintedCameraIcon(outlineColor);

  if (!colourIcon || !outlineIcon) return;

  drawCtx.save();
  drawCtx.rotate(cam.angle);

  // Thin outline around the imported icon.
  const outlineOffsets = [
    [-outlineWidth, 0], [outlineWidth, 0],
    [0, -outlineWidth], [0, outlineWidth],
    [-outlineWidth, -outlineWidth], [outlineWidth, -outlineWidth],
    [-outlineWidth, outlineWidth], [outlineWidth, outlineWidth]
  ];

  for (const [ox, oy] of outlineOffsets) {
    drawTintedIcon(
      drawCtx,
      outlineIcon,
      -iconW / 2 + ox,
      -iconH / 2 + oy,
      iconW,
      iconH
    );
  }

  // Main camera icon.
  drawTintedIcon(
    drawCtx,
    colourIcon,
    -iconW / 2,
    -iconH / 2,
    iconW,
    iconH
  );

  // Direction triangle. The imported camera points right, so the
  // triangle extends naturally from the front and acts as the rotation handle.
  const triangleBase = iconW / 2 + 15 * scale;
  const triangleTip = iconW / 2 + 40 * scale;
  const triangleHalfHeight = 9 * scale;

  drawCtx.fillStyle = color;
  drawCtx.strokeStyle = outlineColor;
  drawCtx.lineWidth = Math.max(1, 1.5 * scale);
  drawCtx.lineJoin = "round";

  drawCtx.beginPath();
  drawCtx.moveTo(triangleBase, -triangleHalfHeight);
  drawCtx.lineTo(triangleTip, 0);
  drawCtx.lineTo(triangleBase, triangleHalfHeight);
  drawCtx.closePath();
  drawCtx.fill();
  drawCtx.stroke();

  // Labels stay horizontal regardless of camera rotation.
  drawCtx.rotate(-cam.angle);

  const labelY = iconH / 2 + 8 * scale;

  drawCtx.fillStyle = outlineColor;
  drawCtx.font = `700 ${Math.max(13, 15 * scale)}px Segoe UI, Arial`;
  drawCtx.textAlign = "center";
  drawCtx.textBaseline = "top";
  drawCtx.fillText(cam.name, 0, labelY);

  if (includeOperator && cam.operator) {
    drawCtx.font = `800 ${Math.max(12, 13 * scale)}px Segoe UI, Arial`;
    drawCtx.fillText(cam.operator, 0, labelY + 19 * scale);
  }

  drawCtx.restore();
}

function drawCamera(cam) {
  const p = worldToScreen(cam.x, cam.y);
  const scale = Math.max(0.8, Math.min(1.35, zoom));

  ctx.save();
  ctx.translate(p.x, p.y);
  drawCameraGraphic(ctx, cam, scale, cam.id === selectedId, true);
  ctx.restore();
}

function cameraAt(sx, sy) {
  const scale = Math.max(0.8, Math.min(1.35, zoom));
  const hitRadius = 38 * scale;

  for (let i = cameras.length - 1; i >= 0; i--) {
    const p = worldToScreen(cameras[i].x, cameras[i].y);
    if (Math.hypot(sx - p.x, sy - p.y) <= hitRadius) {
      return cameras[i];
    }
  }
  return null;
}

function directionHandleAt(sx, sy) {
  const scale = Math.max(0.8, Math.min(1.35, zoom));
  const iconW = cameraScale * scale;
  const triangleTip = iconW / 2 + 30 * scale;

  for (let i = cameras.length - 1; i >= 0; i--) {
    const c = cameras[i];
    const p = worldToScreen(c.x, c.y);
    const hx = p.x + Math.cos(c.angle) * triangleTip;
    const hy = p.y + Math.sin(c.angle) * triangleTip;

    if (Math.hypot(sx - hx, sy - hy) <= 12) return c;
  }

  return null;
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;

  // Middle mouse button pans the background/workspace.
  if (e.button === 1) {
    dragging = {
      mode: "pan",
      startX: sx,
      startY: sy,
      startViewX: viewX,
      startViewY: viewY
    };
    canvas.style.cursor = "grabbing";
    e.preventDefault();
    return;
  }

  const handleCam = directionHandleAt(sx, sy);
  const cam = handleCam || cameraAt(sx, sy);

  if (cam) {
    selectedId = cam.id;
    dragging = { cam, mode: handleCam ? "rotate" : "move" };
    renderSidebar();
    draw();
    return;
  }

  // Dragging an empty part of the canvas pans the background.
  dragging = {
    mode: "pan",
    startX: sx,
    startY: sy,
    startViewX: viewX,
    startViewY: viewY
  };
  canvas.style.cursor = "grabbing";
});

window.addEventListener("mousemove", e => {
  if (!dragging) return;

  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;

  if (dragging.mode === "pan") {
    viewX = dragging.startViewX + (sx - dragging.startX);
    viewY = dragging.startViewY + (sy - dragging.startY);
    draw();
    return;
  }

  const world = screenToWorld(sx, sy);
  const cam = dragging.cam;

  if (dragging.mode === "move") {
    cam.x = world.x;
    cam.y = world.y;
  } else {
    cam.angle = Math.atan2(world.y - cam.y, world.x - cam.x);
  }

  draw();
});

window.addEventListener("mouseup", e => {
  if (dragging?.mode === "pan") {
    canvas.style.cursor = "default";
  }
  dragging = null;
});

$("backgroundInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    background = reader.result;
    backgroundImage = new Image();
    backgroundImage.onload = () => {
      $("emptyState").style.display = "none";
      fitBackground();
    };
    backgroundImage.src = background;
  };
  reader.readAsDataURL(file);
});

$("addCamera").addEventListener("click", () => {
  const n = cameras.length + 1;
  const centre = screenToWorld(workspace.clientWidth / 2, workspace.clientHeight / 2);
  const cam = {
    id: crypto.randomUUID(),
    name: `Camera ${n}`,
    description: "",
    lens: "",
    operator: "",
    x: centre.x,
    y: centre.y,
    angle: -Math.PI / 2,
    color: "#3b82f6",
    outlineColor: "#111318"
  };
  cameras.push(cam);
  selectedId = cam.id;
  renderSidebar();
  draw();
  startEdit(cam.id);
});

function renderSidebar() {
  $("cameraCount").textContent = cameras.length;
  const list = $("cameraList");
  list.innerHTML = "";
  cameras.forEach(cam => {
    const card = document.createElement("div");
    card.className = "camera-card" + (cam.id === selectedId ? " selected" : "");
    card.innerHTML = `
      <div class="card-top">
        <div class="camera-number">${escapeHtml(cam.name.replace(/^Camera /, ""))}</div>
        <div class="card-name">${escapeHtml(cam.name)}</div>
      </div>
      <div class="card-description">${escapeHtml(cam.description || "No shot description yet.")}</div>
      <div class="card-actions">
        <button data-edit="${cam.id}">Edit</button>
        <button data-delete="${cam.id}">Remove</button>
      </div>`;
    card.addEventListener("click", () => {
      selectedId = cam.id;
      renderSidebar();
      draw();
    });
    list.appendChild(card);
  });
  list.querySelectorAll("[data-edit]").forEach(b =>
    b.addEventListener("click", e => { e.stopPropagation(); startEdit(b.dataset.edit); }));
  list.querySelectorAll("[data-delete]").forEach(b =>
    b.addEventListener("click", e => {
      e.stopPropagation();
      cameras = cameras.filter(c => c.id !== b.dataset.delete);
      if (selectedId === b.dataset.delete) selectedId = null;
      if (editingId === b.dataset.delete) closeInspector();
      renderSidebar(); draw();
    }));
}

function startEdit(id) {
  const cam = cameras.find(c => c.id === id);
  if (!cam) return;
  editingId = id;
  $("editName").value = cam.name;
  $("editDescription").value = cam.description;
  $("editLens").value = cam.lens;
  $("editOperator").value = cam.operator;
  $("editColor").value = cam.color || "#3b82f6";
  $("editOutlineColor").value = cam.outlineColor || "#111318";
  $("inspector").classList.remove("hidden");
}
function closeInspector() {
  editingId = null;
  $("inspector").classList.add("hidden");
}
$("saveCamera").addEventListener("click", () => {
  const cam = cameras.find(c => c.id === editingId);
  if (!cam) return;
  cam.name = $("editName").value.trim() || `Camera ${cameras.indexOf(cam) + 1}`;
  cam.description = $("editDescription").value.trim();
  cam.lens = $("editLens").value.trim();
  cam.operator = $("editOperator").value.trim();
  cam.color = $("editColor").value || "#3b82f6";
  cam.outlineColor = $("editOutlineColor").value || "#111318";
  closeInspector();
  renderSidebar(); draw();
});
$("cancelEdit").addEventListener("click", closeInspector);

function updateZoomLabel() {
  $("zoomLabel").textContent = Math.round(zoom * 100) + "%";
}
$("zoomIn").addEventListener("click", () => {
  zoom *= 1.15; updateZoomLabel(); draw();
});
$("zoomOut").addEventListener("click", () => {
  zoom /= 1.15; updateZoomLabel(); draw();
});

$("donateButton").addEventListener("click", () => {
  window.open(BUY_ME_A_COFFEE_URL, "_blank");
});

$("clearPlan").addEventListener("click", () => {
  if (!confirm("Clear the background and all cameras?")) return;
  backgroundImage = null;
  background = null;
  cameras = [];
  selectedId = null;

  // Reset the file picker so the same background can be imported again.
  $("backgroundInput").value = "";

  $("emptyState").style.display = "block";
  renderSidebar(); draw();
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function makeExportCanvas() {
  const w = backgroundImage ? backgroundImage.width : 1600;
  const h = backgroundImage ? backgroundImage.height : 900;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;

  const c = out.getContext("2d");
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, w, h);

  if (backgroundImage) c.drawImage(backgroundImage, 0, 0);

  const scale = Math.max(0.9, Math.min(1.8, w / 1600));

  cameras.forEach(cam => {
    c.save();
    c.translate(cam.x, cam.y);
    drawCameraGraphic(c, cam, scale, false, true);
    c.restore();
  });

  return out;
}

$("exportPng").addEventListener("click", () => {
  const out = makeExportCanvas();
  const a = document.createElement("a");
  a.download = "camera-production-plan.png";
  a.href = out.toDataURL("image/png");
  a.click();
});

$("exportPdf").addEventListener("click", () => {
  const out = makeExportCanvas();
  const image = out.toDataURL("image/jpeg", 0.95);
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>Camera Production Plan</title>
    <style>@page{size:auto;margin:10mm}body{margin:0;text-align:center}
    img{max-width:100%;max-height:100vh}</style></head>
    <body><img src="${image}"><script>
    window.onload=()=>setTimeout(()=>window.print(),300);
    <\/script></body></html>`);
  win.document.close();
});

$("cameraScale").addEventListener("input", e => {
  cameraScale = Number(e.target.value);
  $("cameraScaleLabel").textContent = cameraScale;
  draw();
});

loadCameraIcon();
resizeCanvas();
renderSidebar();