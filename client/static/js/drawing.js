const stage = $("stage");
const btnErase = $("btnErase");

const baseCanvas = $("baseCanvas");
const baseCanvasCtx = baseCanvas.getContext("2d");

baseCanvas.width = baseCanvas.offsetWidth;
baseCanvas.height = baseCanvas.offsetHeight;

const points = [];
let isDrawing = false;
let pollTime = 0;

const guests = {};

const [drawingCanvas, drawingCanvasCtx] = createCanvas("drawingCanvas");

function createCanvas(id) {
  const newCanvas = baseCanvas.cloneNode();
  newCanvas.id = id;
  newCanvas.style.backgroundColor = "transparent";
  stage.appendChild(newCanvas);
  newCanvas.width = newCanvas.offsetWidth;
  newCanvas.height = newCanvas.offsetHeight;

  const newCanvasCtx = newCanvas.getContext("2d");
  newCanvasCtx.lineWidth = 4;
  newCanvasCtx.lineJoin = newCanvasCtx.lineCap = "round";

  return [newCanvas, newCanvasCtx];
}

function getMidPoint(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
}

function pushPoints(p1, p2) {
  points.push({ x: p1, y: p2 });
  wsSend({
    type: "point",
    token: token,
    x: p1,
    y: p2,
    canvas_width: drawingCanvas.width,
    canvas_height: drawingCanvas.height,
  });
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawPoints(pointsTarget, ctx) {
  clearCanvas(ctx);

  let p1 = pointsTarget[0];
  let p2 = pointsTarget[1];

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);

  for (let i = 0; i < pointsTarget.length - 1; i++) {
    const midPoint = getMidPoint(p1, p2);
    ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    p1 = pointsTarget[i];
    p2 = pointsTarget[i + 1];
  }

  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

drawingCanvas.onmousedown = (e) => {
  e.preventDefault();
  e.stopPropagation();

  isDrawing = true;
  pushPoints(e.offsetX, e.offsetY);
};

drawingCanvas.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    drawingCanvas.dispatchEvent(mouseEvent);
  },
  false,
);

drawingCanvas.onmousemove = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!isDrawing) return;

  const d = new Date();
  const now = d.getTime();

  if (now - pollTime < 10) {
    return;
  }
  pollTime = now;

  pushPoints(e.offsetX, e.offsetY);
  drawPoints(points, drawingCanvasCtx);
};

drawingCanvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    drawingCanvas.dispatchEvent(mouseEvent);
  },
  false,
);

drawingCanvas.onmouseout = drawingCanvas.onmouseup = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (isDrawing) {
    isDrawing = false;
    points.length = 0;

    baseCanvasCtx.drawImage(drawingCanvas, 0, 0);
    clearCanvas(drawingCanvasCtx);

    wsSend({ type: "point", token: token, x: -1 });
  }
};

drawingCanvas.addEventListener(
  "touchend",
  () => {
    const mouseOutEvent = new MouseEvent("mouseout", {});
    drawingCanvas.dispatchEvent(mouseOutEvent);
    const mouseUpEvent = new MouseEvent("mouseup", {});
    drawingCanvas.dispatchEvent(mouseUpEvent);
  },
  false,
);

btnErase.onclick = () => {
  wsSend({ type: "erase" });
};

conn.addEventListener("message", (e) => {
  const messages = e.data.split("\n");
  for (const message of messages) {
    const data = JSON.parse(message);
    const guest = guests[data.token];
    const guestToken = data.token;

    switch (data.type) {
      case "point":
        if (data.x == -1) {
          baseCanvasCtx.drawImage(guest.canvas, 0, 0);
          guest.canvas.outerHTML = "";
          delete guests[guestToken];
        } else {
          if (guest) {
            const x = data.x * (baseCanvas.width / data.canvas_width);
            const y = data.y * (baseCanvas.height / data.canvas_height);
            guest.points.push({ x: x, y: y });
            drawPoints(guest.points, guest.canvasCtx);
          } else {
            guests[guestToken] = { points: [], canvas: {}, canvasCtx: {} };
            [guests[guestToken].canvas, guests[guestToken].canvasCtx] =
              createCanvas(guestToken);
          }
        }
        break;
      case "erase":
        clearCanvas(baseCanvasCtx);
        appendLog("Canvas cleared globally");
        break;
    }
  }
});
