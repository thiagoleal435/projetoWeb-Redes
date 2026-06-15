// =============================================
// Camada 3 — Rede
// Roteamento com Busca Gulosa + Canvas animado
// =============================================

// ── Grafo de roteadores ──
const GRAPH = {
    'client':    { ip: '192.168.1.10', label: 'Cliente',     x: 0, y: 2, type: 'client',  neighbors: ['router-gw'] },
    'router-gw': { ip: '192.168.1.1',  label: 'Gateway',     x: 1, y: 2, type: 'router',  neighbors: ['client', 'router-a', 'router-b'] },
    'router-a':  { ip: '10.0.1.1',     label: 'Roteador A',  x: 2, y: 1, type: 'router',  neighbors: ['router-gw', 'router-c', 'router-d'] },
    'router-b':  { ip: '10.0.2.1',     label: 'Roteador B',  x: 2, y: 3, type: 'router',  neighbors: ['router-gw', 'router-d', 'router-e'] },
    'router-c':  { ip: '10.0.3.1',     label: 'Roteador C',  x: 3, y: 0, type: 'router',  neighbors: ['router-a', 'router-f'] },
    'router-d':  { ip: '10.0.4.1',     label: 'Roteador D',  x: 3, y: 2, type: 'router',  neighbors: ['router-a', 'router-b', 'router-f', 'router-g'] },
    'router-e':  { ip: '10.0.5.1',     label: 'Roteador E',  x: 3, y: 4, type: 'router',  neighbors: ['router-b', 'router-g'] },
    'router-f':  { ip: '10.0.6.1',     label: 'Roteador F',  x: 4, y: 1, type: 'router',  neighbors: ['router-c', 'router-d', 'server'] },
    'router-g':  { ip: '10.0.7.1',     label: 'Roteador G',  x: 4, y: 3, type: 'router',  neighbors: ['router-d', 'router-e', 'server'] },
    'server':    { ip: '0.0.0.0',      label: 'Servidor',    x: 5, y: 2, type: 'server',   neighbors: ['router-f', 'router-g'] }
};

// ── Busca Gulosa ──
function heuristic(a, b) {
    const na = GRAPH[a], nb = GRAPH[b];
    return Math.sqrt((na.x - nb.x) ** 2 + (na.y - nb.y) ** 2);
}

function greedySearch(startId, goalId) {
    const visited = new Set();
    const path = [];
    let cur = startId;
    while (cur !== goalId) {
        visited.add(cur);
        path.push(cur);
        const nb = GRAPH[cur].neighbors.filter(n => !visited.has(n));
        if (!nb.length) break;
        cur = nb.reduce((best, n) => heuristic(n, goalId) < heuristic(best, goalId) ? n : best);
    }
    if (cur === goalId) path.push(goalId);
    return path;
}

// ── Pacote de rede ──
function buildNetworkPacket(hostIP) {
    GRAPH['server'].ip = hostIP || '200.160.2.3';
    const routeIds = greedySearch('client', 'server');
    const rota = routeIds.map(id => ({ id, ip: GRAPH[id].ip, label: GRAPH[id].label, x: GRAPH[id].x, y: GRAPH[id].y, type: GRAPH[id].type }));
    return { ipOrigem: GRAPH['client'].ip, ipDestino: GRAPH['server'].ip, rota, ttl: 64 };
}

// ── Animação ──
let animFrameId = null;

export function stopRedeAnimation() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
}

// ── Helpers de desenho ──
function lerp(a, b, t) { return a + (b - a) * t; }

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Ícones ──
function drawClientIcon(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    // Monitor
    const mw = s * 1.4, mh = s * 0.95;
    const mx = cx - mw / 2, my = cy - mh / 2 - s * 0.12;
    roundRect(ctx, mx, my, mw, mh, 3);
    ctx.fillStyle = 'rgba(10,20,35,0.9)'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    // Tela
    ctx.fillStyle = color; ctx.globalAlpha = 0.2;
    ctx.fillRect(mx + 3, my + 3, mw - 6, mh - 6);
    ctx.globalAlpha = 1;
    // Texto na tela
    ctx.fillStyle = color; ctx.font = `${s * 0.35}px Courier New`; ctx.textAlign = 'center';
    ctx.fillText('> _', cx, cy - s * 0.05);
    // Base
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, my + mh);
    ctx.lineTo(cx + s * 0.3, my + mh);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, my + mh);
    ctx.lineTo(cx, my + mh + s * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, my + mh + s * 0.18);
    ctx.lineTo(cx + s * 0.35, my + mh + s * 0.18);
    ctx.stroke();
    ctx.restore();
}

function drawRouterIcon(ctx, cx, cy, s, color, blocked) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blocked ? 0 : 10;
    // Corpo
    const bw = s * 1.3, bh = s * 0.7;
    const bx = cx - bw / 2, by = cy - bh / 2;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fillStyle = blocked ? 'rgba(40,40,50,0.6)' : 'rgba(10,20,35,0.9)';
    ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    if (blocked) ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // LEDs
    const ledY = by + bh * 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(bx + bw * 0.25 + i * bw * 0.2, ledY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = blocked ? 'rgba(100,100,100,0.3)' : (i === 0 ? '#00e090' : '#00a0ff');
        ctx.fill();
    }
    // Antenas
    const antH = s * 0.35;
    ctx.strokeStyle = color;
    if (blocked) ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.25, by); ctx.lineTo(cx - s * 0.35, by - antH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.25, by); ctx.lineTo(cx + s * 0.35, by - antH); ctx.stroke();
    // Sinais nas antenas
    for (let j = 0; j < 2; j++) {
        const ax = j === 0 ? cx - s * 0.35 : cx + s * 0.35;
        const ay = by - antH;
        ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    }
    ctx.globalAlpha = 1;
    // X vermelho se bloqueado
    if (blocked) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3; ctx.globalAlpha = 0.85;
        const xs = s * 0.5;
        ctx.beginPath(); ctx.moveTo(cx - xs, cy - xs); ctx.lineTo(cx + xs, cy + xs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + xs, cy - xs); ctx.lineTo(cx - xs, cy + xs); ctx.stroke();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawServerIcon(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    const rw = s * 1.1, rh = s * 1.4;
    const rx = cx - rw / 2, ry = cy - rh / 2;
    roundRect(ctx, rx, ry, rw, rh, 4);
    ctx.fillStyle = 'rgba(10,20,35,0.9)'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    // Slots
    for (let i = 0; i < 3; i++) {
        const sy2 = ry + rh * 0.15 + i * rh * 0.28;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(rx + 4, sy2, rw - 8, rh * 0.2);
        ctx.strokeStyle = color; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
        ctx.strokeRect(rx + 4, sy2, rw - 8, rh * 0.2);
        ctx.globalAlpha = 1;
        // LED
        ctx.beginPath();
        ctx.arc(rx + rw - 10, sy2 + rh * 0.1, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#00e090' : color;
        ctx.fill();
    }
    ctx.restore();
}

// ── Desenho de label ──
function drawLabel(ctx, cx, cy, nodeSize, label, ip, color) {
    const ly = cy + nodeSize * 0.85;
    ctx.font = `bold 10px 'Courier New', monospace`;
    ctx.textAlign = 'center'; ctx.fillStyle = '#ccc';
    ctx.fillText(label, cx, ly);
    ctx.font = `9px 'Courier New', monospace`;
    ctx.fillStyle = color;
    ctx.fillText(ip, cx, ly + 13);
}

// ── Desenho do pacote ──
function drawPacket(ctx, x, y, trail, time) {
    // Trail
    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const alpha = (i / trail.length) * 0.5;
        const r = 3 + (i / trail.length) * 3;
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,221,0,${alpha})`;
        ctx.fill();
    }
    // Glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,221,0,0.8)'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(x, y, 7 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd00'; ctx.fill();
    ctx.restore();
    // Inner
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
}

// ── Efeito de entrega ──
function drawDeliveryEffect(ctx, x, y, progress) {
    for (let i = 0; i < 3; i++) {
        const r = 10 + progress * 40 + i * 15;
        const alpha = Math.max(0, 0.6 - progress * 0.8 - i * 0.15);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,107,107,${alpha})`;
        ctx.lineWidth = 2; ctx.stroke();
    }
}

// ── Iniciar canvas ──
export function initRedeCanvas(packet) {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = 850, ch = 420;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const routeSet = new Set(packet.rota.map(n => n.id));
    const routeEdges = new Set();
    for (let i = 0; i < packet.rota.length - 1; i++) {
        routeEdges.add(packet.rota[i].id + '|' + packet.rota[i + 1].id);
        routeEdges.add(packet.rota[i + 1].id + '|' + packet.rota[i].id);
    }

    // Mapear coordenadas do grafo → canvas
    const padX = 80, padY = 70;
    const maxGx = 5, maxGy = 4;
    const positions = {};
    for (const [id, node] of Object.entries(GRAPH)) {
        positions[id] = {
            x: padX + (node.x / maxGx) * (cw - 2 * padX),
            y: padY + (node.y / maxGy) * (ch - 2 * padY)
        };
    }

    // Estado da animação
    const SPEED = 0.008;
    const PAUSE_FRAMES = 30;
    const DELIVERY_FRAMES = 60;
    let segIdx = 0, progress = 0, pauseTimer = 0, deliveryTimer = 0;
    let delivering = false;
    const trail = [];
    const nodeFlash = {};
    let startTime = performance.now();

    function animate(now) {
        const time = (now - startTime) / 1000;
        ctx.clearRect(0, 0, cw, ch);

        // Background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
        for (let gx = 0; gx < cw; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
        for (let gy = 0; gy < ch; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }

        // Desenhar arestas
        for (const [id, node] of Object.entries(GRAPH)) {
            for (const nb of node.neighbors) {
                if (id < nb) { // evitar duplicata
                    const from = positions[id], to = positions[nb];
                    const isRoute = routeEdges.has(id + '|' + nb);
                    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
                    if (isRoute) {
                        ctx.strokeStyle = 'rgba(0,180,255,0.5)'; ctx.lineWidth = 2.5;
                        ctx.setLineDash([]);
                        ctx.save(); ctx.shadowColor = 'rgba(0,180,255,0.3)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
                    } else {
                        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
                        ctx.setLineDash([4, 6]);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }

        // Desenhar nós
        const nodeSize = 28;
        for (const [id, node] of Object.entries(GRAPH)) {
            const pos = positions[id];
            const inRoute = routeSet.has(id);
            const flash = nodeFlash[id] || 0;
            const scale = 1 + flash * 0.2;

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.scale(scale, scale);
            ctx.translate(-pos.x, -pos.y);

            if (node.type === 'client') {
                drawClientIcon(ctx, pos.x, pos.y, nodeSize, '#00e090');
            } else if (node.type === 'server') {
                drawServerIcon(ctx, pos.x, pos.y, nodeSize, '#ff6b6b');
            } else {
                const col = inRoute ? '#00b4ff' : 'rgba(120,120,140,0.5)';
                drawRouterIcon(ctx, pos.x, pos.y, nodeSize, col, !inRoute);
            }

            const lblCol = node.type === 'client' ? '#00e090' : node.type === 'server' ? '#ff6b6b' : inRoute ? '#88ddff' : 'rgba(150,150,160,0.5)';
            drawLabel(ctx, pos.x, pos.y, nodeSize, node.label, node.ip, lblCol);

            ctx.restore();

            // Decair flash
            if (nodeFlash[id] > 0) nodeFlash[id] = Math.max(0, nodeFlash[id] - 0.03);
        }

        // Animação do pacote
        if (delivering) {
            deliveryTimer++;
            const dp = deliveryTimer / DELIVERY_FRAMES;
            const sp = positions[packet.rota[packet.rota.length - 1].id];
            drawDeliveryEffect(ctx, sp.x, sp.y, dp);
            if (deliveryTimer >= DELIVERY_FRAMES) {
                delivering = false; deliveryTimer = 0;
                segIdx = 0; progress = 0; trail.length = 0;
            }
        } else if (pauseTimer > 0) {
            pauseTimer--;
            const cur = positions[packet.rota[segIdx].id];
            drawPacket(ctx, cur.x, cur.y, trail, time);
        } else {
            const fromId = packet.rota[segIdx].id;
            const toId = packet.rota[segIdx + 1].id;
            const from = positions[fromId], to = positions[toId];
            const px = lerp(from.x, to.x, progress);
            const py = lerp(from.y, to.y, progress);

            trail.push({ x: px, y: py });
            if (trail.length > 20) trail.shift();

            drawPacket(ctx, px, py, trail, time);
            progress += SPEED;

            if (progress >= 1) {
                progress = 0;
                segIdx++;
                nodeFlash[toId] = 1;

                if (segIdx >= packet.rota.length - 1) {
                    delivering = true;
                    trail.length = 0;
                } else {
                    pauseTimer = PAUSE_FRAMES;
                }
            }
        }

        // TTL info no canto
        const currentTTL = packet.ttl - segIdx;
        ctx.save();
        ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`TTL: ${currentTTL}  |  Hop: ${segIdx}/${packet.rota.length - 1}`, cw - 15, 20);
        ctx.restore();

        animFrameId = requestAnimationFrame(animate);
    }

    animFrameId = requestAnimationFrame(animate);
}

// ── Renderizar HTML da camada ──
export function renderRede(hostIP) {
    const packet = buildNetworkPacket(hostIP);

    const routeRows = packet.rota.map((n, i) => {
        const isFirst = i === 0, isLast = i === packet.rota.length - 1;
        const typeLabel = isFirst ? 'ORIGEM' : isLast ? 'DESTINO' : `HOP ${i}`;
        const cls = isFirst ? 'route-origin' : isLast ? 'route-dest' : 'route-hop';
        return `<div class="route-table-row ${cls}">
            <span class="route-table-hop">${typeLabel}</span>
            <span class="route-table-ip">${n.ip}</span>
            <span class="route-table-name">${n.label}</span>
        </div>`;
    }).join('');

    const html = `
        <div class="osi-layer layer-3">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">3</div>
                <div class="osi-layer-title">
                    <span>Camada de Rede</span>
                    <span>Roteamento — Busca Gulosa (Greedy Best-First Search)</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="network-packet-info">
                    <div class="net-info-item">
                        <span class="net-info-label">IP Origem</span>
                        <span class="net-info-value net-origin">${packet.ipOrigem}</span>
                    </div>
                    <div class="net-info-item">
                        <span class="net-info-label">IP Destino</span>
                        <span class="net-info-value net-dest">${packet.ipDestino}</span>
                    </div>
                    <div class="net-info-item">
                        <span class="net-info-label">TTL</span>
                        <span class="net-info-value net-ttl">${packet.ttl}</span>
                    </div>
                    <div class="net-info-item">
                        <span class="net-info-label">Hops</span>
                        <span class="net-info-value net-hops">${packet.rota.length - 1}</span>
                    </div>
                </div>
                <div class="network-canvas-container">
                    <span class="net-anim-title">📡 Simulação da Rota do Pacote</span>
                    <div class="network-canvas-wrapper">
                        <canvas id="network-canvas"></canvas>
                    </div>
                </div>
                <div class="route-table">
                    <span class="route-table-title">🗺️ Tabela de Roteamento (Rota Gulosa)</span>
                    <div class="route-table-header">
                        <span>Tipo</span>
                        <span>Endereço IP</span>
                        <span>Identificação</span>
                    </div>
                    ${routeRows}
                </div>
            </div>
        </div>
    `;

    return { html, networkPacket: packet };
}
