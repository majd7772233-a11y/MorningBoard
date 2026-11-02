const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const PI2 = Math.PI * 2;

const mouse = { x: 0, y: 0, angle: 0 };
const gravity = 0.1;
const friction = 0.95;

let w;
let wH;
let h;
let hH;

const radius = 30;
let squid;
const tentacleWidth = 8;
const numTentacles = 6;
const numPoints = 10;
let particles = [];

let tentacles;

// --- Color palette: cycles on each click ---
const colorPalettes = [
  { body: '#1a1a2e', tentacle: '#16213e', eyeWhite: '#fff' },   // Dark navy (default)
  { body: '#7c3aed', tentacle: '#5b21b6', eyeWhite: '#ede9fe' }, // Purple
  { body: '#0f766e', tentacle: '#0d9488', eyeWhite: '#ccfbf1' }, // Teal
  { body: '#b91c1c', tentacle: '#991b1b', eyeWhite: '#fee2e2' }, // Red
  { body: '#0369a1', tentacle: '#0284c7', eyeWhite: '#e0f2fe' }, // Blue
  { body: '#92400e', tentacle: '#b45309', eyeWhite: '#fef3c7' }, // Amber
  { body: '#065f46', tentacle: '#047857', eyeWhite: '#d1fae5' }, // Green
  { body: '#831843', tentacle: '#9d174d', eyeWhite: '#fce7f3' }, // Pink
  { body: '#1e1b4b', tentacle: '#3730a3', eyeWhite: '#e0e7ff' }, // Indigo
  { body: '#374151', tentacle: '#4b5563', eyeWhite: '#f3f4f6' }, // Gray
];
let colorIndex = 0;
let currentPalette = colorPalettes[0];

const distanceBetween = (p1, p2) => Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
const angleBetween = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
const randomBetween = (min, max) => ~~((Math.random() * (max - min + 1)) + min);

const onResize = () => {
	w = window.innerWidth;
	h = window.innerHeight;

	wH = w >> 1;
	hH = h >> 1;

	canvas.width = w;
	canvas.height = h;
};

const updateStage = () => {
	onResize();

	mouse.x = wH;
	mouse.y = hH;

	squid = { x: mouse.x, y: mouse.y, radius, bodyWidth: radius * 2, bodyHeight: 30, angle: 0, velocity: 0 };
	tentacles = [];

	let connectionX = squid.x - squid.radius - tentacleWidth;
	const incX = squid.bodyWidth / (numTentacles - 1);

	for (let i = 0; i < numTentacles; i++) {
		const length = randomBetween(5, 20);

		const tentacle = {
			length,
			connections: [],
		};

		let connectionY = squid.y + squid.bodyHeight;

		for (let q = 0; q < numPoints; q++) {
			tentacle.connections.push({
				x: connectionX,
				y: connectionY,
				oldX: connectionX,
				oldY: connectionY,
			});

			connectionY += length;
		}

		connectionX += incX;

		tentacles.push(tentacle);
	}
};

const updatePoints = () => {
	tentacles.forEach((tentacle) => {
		const { connections } = tentacle;

		// update velocity and position of each point
		connections.forEach((point) => {
			const velX = point.x - point.oldX;
			const velY = point.y - point.oldY;

			point.oldX = point.x;
			point.oldY = point.y;

			point.x += velX * friction;
			point.y += velY * friction;

			point.y += gravity;
		});
	});
};

const updateSticks = () => {
	tentacles.forEach((tentacle) => {
		const { length, connections } = tentacle;

		// update the sticks between two points
		for (let i = 0; i < connections.length - 1; i++) {
			const from = connections[i];
			const to = connections[i + 1];

			const dx = to.x - from.x;
			const dy = to.y - from.y;

			const distance = distanceBetween(from, to);
			const difference = length - distance;
			const percent = difference / distance / 2;
			const offsetX = dx * percent;
			const offsetY = dy * percent;

			from.x -= offsetX;
			from.y -= offsetY;

			to.x += offsetX;
			to.y += offsetY;
		}
	});
};

const connectTentacles = () => {
	let x = squid.x - squid.radius + (tentacleWidth / 2);
	let y = squid.y + squid.bodyHeight;
	const posInc = (squid.bodyWidth - tentacleWidth) / (tentacles.length - 1);

	tentacles.forEach((tentacle) => {
		const connector = tentacle.connections[0];

		const angleDiff = angleBetween(squid.x, squid.y, x, y);
		const dx = squid.x - x;
		const dy = squid.y - y;
		const h = Math.sqrt((dx * dx) + (dy * dy));

		connector.x = squid.x + (Math.cos(angleDiff + squid.angle) * h);
		connector.y = squid.y + (Math.sin(angleDiff + squid.angle) * h);

		x += posInc;
	});
};

const drawTentacles = () => {
	tentacles.forEach((tentacle) => {
		const { connections } = tentacle;

		ctx.beginPath();
		ctx.strokeStyle = currentPalette.tentacle;
		ctx.lineWidth = tentacleWidth;
		ctx.lineCap = 'round';
    ctx.lineJoin ='round';
		ctx.moveTo(connections[0].x, connections[0].y);

		connections.slice(1).forEach((connector) => {
			ctx.lineTo(connector.x, connector.y);
		});

		ctx.stroke();
		ctx.closePath();
	});
};

const updateSquid = () => {
	const newX = squid.x + (mouse.x - squid.x) / 50;
	const newY = squid.y + (mouse.y - squid.y) / 50;
	const velocity = squid.x - newX;

	squid.angle = -velocity * 0.1;
	squid.velocity = velocity;
	squid.x = newX;
	squid.y = newY;
};

const drawSquid = () => {
	// Eye offsets — both eyes use the same small offset (radius 4) for symmetry
	const eyeXInc = Math.cos(mouse.angle) * 5;
	const eyeYInc = Math.sin(mouse.angle) * 5;

	ctx.save();
	ctx.translate(squid.x, squid.y);
	ctx.rotate(squid.angle);

	// body (rectangle base)
	ctx.beginPath();
	ctx.fillStyle = currentPalette.body;
	ctx.lineWidth = 1;
	ctx.rect(-squid.radius, 0, squid.bodyWidth, squid.bodyHeight);
	ctx.fill();
	ctx.closePath();

	// head (circle)
	ctx.beginPath();
	ctx.fillStyle = currentPalette.body;
	ctx.lineWidth = 1;
	ctx.arc(0, 0, squid.radius, 0, PI2, false);
	ctx.fill();
	ctx.closePath();

	// Left eye (at x = -14, same as before)
	ctx.beginPath();
	ctx.fillStyle = currentPalette.eyeWhite;
	ctx.arc(-14 + eyeXInc, eyeYInc, 4, 0, PI2, false);
	ctx.fill();
	ctx.closePath();

	// Pupil left
	ctx.beginPath();
	ctx.fillStyle = '#000';
	ctx.arc(-14 + eyeXInc, eyeYInc, 1.5, 0, PI2, false);
	ctx.fill();
	ctx.closePath();

	// Right eye (fixed: same radius 4, symmetric position at x = +14)
	ctx.beginPath();
	ctx.fillStyle = currentPalette.eyeWhite;
	ctx.arc(14 + eyeXInc, eyeYInc, 4, 0, PI2, false);
	ctx.fill();
	ctx.closePath();

	// Pupil right
	ctx.beginPath();
	ctx.fillStyle = '#000';
	ctx.arc(14 + eyeXInc, eyeYInc, 1.5, 0, PI2, false);
	ctx.fill();
	ctx.closePath();

	ctx.restore();
};

const drawParticles = () => {
	particles.forEach((p) => {
		p.radius *= 1.025;
		p.life *= 0.97;
		p.isDead = p.life <= 0.1;

		p.x += Math.cos(p.angle) * p.velocity;
		p.y += Math.sin(p.angle) * p.velocity; // Fixed typo: p.t -> p.y

		ctx.save();
		ctx.beginPath();
		// Bubbles have a light cyan/blue fill and a thin stroke matching the tentacle color to pop on light backgrounds
		ctx.fillStyle = `rgba(224, 242, 254, ${p.life * 0.6})`;
		ctx.strokeStyle = currentPalette.tentacle;
		ctx.lineWidth = 1;
		ctx.globalAlpha = p.life;
		ctx.arc(p.x, p.y, p.radius, 0, PI2, false);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	});
	particles = particles.filter(p => !p.isDead);
};

const clear = () => {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

const loop = () => {
	clear();

	drawParticles();

	updateSquid();

	updatePoints();
	updateSticks();

	connectTentacles();

	drawTentacles();
	drawSquid();

	if (Math.abs(squid.velocity) > 2 && particles.length < 200) {
		tentacles.forEach((tentacle) => {
			const pos = tentacle.connections[tentacle.connections.length - 1];
			const angle = angleBetween(pos.x, pos.y, mouse.x, mouse.y);

			particles.push({
				x: pos.x,
				y: pos.y,
				life: 1,
				radius: 1,
				isDead: false,
				velocity: randomBetween(1, 3) * 0.5,
				angle: angle,
			});
		});
	}

	requestAnimationFrame(loop);
};


window.addEventListener('resize', onResize);
updateStage();
loop();

const onPointerMove = (e) => {
	const target = (e.touches && e.touches.length) ? e.touches[0] : e;
	const { clientX: x, clientY: y } = target;

	mouse.x = x;
	mouse.y = y;
	mouse.angle = angleBetween(squid.x, squid.y, mouse.x, mouse.y);
};

// --- Click / tap: cycle to the next color palette ---
const onPointerClick = () => {
	colorIndex = (colorIndex + 1) % colorPalettes.length;
	currentPalette = colorPalettes[colorIndex];

	// Brief color-burst particle explosion at squid position
	for (let i = 0; i < 20; i++) {
		particles.push({
			x: squid.x,
			y: squid.y,
			life: 1,
			radius: randomBetween(2, 5),
			isDead: false,
			velocity: randomBetween(2, 6) * 0.5,
			angle: (i / 20) * PI2,
		});
	}
};

canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('touchmove', onPointerMove);
canvas.addEventListener('mousedown', onPointerClick);
canvas.addEventListener('touchstart', onPointerClick, { passive: true });

// --- Window postMessage listener for pointer-events: none mode ---
window.addEventListener('message', (event) => {
	const data = event.data;
	if (!data || !data.type) return;

	if (data.type === 'mousemove' || data.type === 'touchmove') {
		mouse.x = data.clientX;
		mouse.y = data.clientY;
		mouse.angle = angleBetween(squid.x, squid.y, mouse.x, mouse.y);
	} else if (data.type === 'mousedown' || data.type === 'touchstart') {
		onPointerClick();
	}
});
