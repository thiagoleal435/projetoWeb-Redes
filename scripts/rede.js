// =============================================
// Camada 3 — Rede
// Roteamento com Busca Gulosa + Canvas animado
// Utiliza os 100 roteadores de points.js
// =============================================

import { points } from './points.js';

// ── Construir grafo a partir do points.js ──
const GRAPH = {};
for (const p of points) {
    GRAPH[p.id] = {
        ip: p.ip,
        label: p.nome,
        x: p.x,
        y: p.y,
        ativo: p.ativo,
        conexoes: p.conexoes
    };
}

// ── Busca Gulosa ──
function heuristic(aId, bId) {
    const a = GRAPH[aId], b = GRAPH[bId];
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Busca Gulosa (Greedy Best-First Search).
 * Ignora roteadores inativos durante a travessia.
 * @param {string} startId
 * @param {string} goalId
 * @returns {string[]} IDs dos nós na rota, ou [] se não encontrar
 */
function greedySearch(startId, goalId) {
    const visited = new Set();
    const path = [];
    let cur = startId;

    while (cur !== goalId) {
        visited.add(cur);
        path.push(cur);

        // Filtrar vizinhos: não visitados E ativos (ou o próprio destino)
        const neighbors = GRAPH[cur].conexoes.filter(
            n => !visited.has(n) && (GRAPH[n].ativo || n === goalId)
        );

        if (!neighbors.length) return []; // Sem caminho possível
        cur = neighbors.reduce((best, n) =>
            heuristic(n, goalId) < heuristic(best, goalId) ? n : best
        );
    }

    path.push(goalId);
    return path;
}

// ── Sortear origem e destino ──
function sortearOrigemDestino() {
    const ativos = points.filter(p => p.ativo);
    const idxOrigem = Math.floor(Math.random() * ativos.length);
    let idxDestino;
    do {
        idxDestino = Math.floor(Math.random() * ativos.length);
    } while (idxDestino === idxOrigem);
    return { origem: ativos[idxOrigem], destino: ativos[idxDestino] };
}

// ── Pacote de rede ──
function buildNetworkPacket() {
    const { origem, destino } = sortearOrigemDestino();
    const routeIds = greedySearch(origem.id, destino.id);

    const rota = routeIds.map(id => ({
        id,
        ip: GRAPH[id].ip,
        label: GRAPH[id].label,
        x: GRAPH[id].x,
        y: GRAPH[id].y
    }));

    return {
        ipOrigem: origem.ip,
        ipDestino: destino.ip,
        origemId: origem.id,
        destinoId: destino.id,
        rota,
        ttl: 64,
        rotaEncontrada: routeIds.length > 0
    };
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

// ── Ícone do roteador ──
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
    // X vermelho se bloqueado (inativo)
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

// ── Desenho de label (apenas para nós da rota) ──
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
    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const alpha = (i / trail.length) * 0.5;
        const r = 3 + (i / trail.length) * 3;
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,221,0,${alpha})`;
        ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(255,221,0,0.8)'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(x, y, 7 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd00'; ctx.fill();
    ctx.restore();
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

    // Se rota não foi encontrada, mostrar mensagem
    if (!packet.rotaEncontrada) {
        const ctx2 = canvas.getContext('2d');
        canvas.width = 850; canvas.height = 200;
        canvas.style.width = '850px'; canvas.style.height = '200px';
        ctx2.fillStyle = 'rgba(5,10,25,0.8)';
        ctx2.fillRect(0, 0, 850, 200);
        ctx2.font = 'bold 16px Courier New'; ctx2.textAlign = 'center';
        ctx2.fillStyle = '#ff6b6b';
        ctx2.fillText('⚠ Rota não encontrada entre os roteadores sorteados', 425, 100);
        return;
    }

    const dpr = window.devicePixelRatio || 1;

    // Dimensões proporcionais ao range dos dados (26-955 x, 20-680 y)
    const PAD = 50;
    const cw = 1000, ch = 700;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Calcular range real das coordenadas
    const allX = points.map(p => p.x);
    const allY = points.map(p => p.y);
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Mapear coordenadas reais → canvas
    const positions = {};
    for (const [id, node] of Object.entries(GRAPH)) {
        positions[id] = {
            x: PAD + ((node.x - minX) / rangeX) * (cw - 2 * PAD),
            y: PAD + ((node.y - minY) / rangeY) * (ch - 2 * PAD)
        };
    }

    const routeSet = new Set(packet.rota.map(n => n.id));
    const routeEdges = new Set();
    for (let i = 0; i < packet.rota.length - 1; i++) {
        routeEdges.add(packet.rota[i].id + '|' + packet.rota[i + 1].id);
        routeEdges.add(packet.rota[i + 1].id + '|' + packet.rota[i].id);
    }

    // Estado da animação
    const SPEED = 0.006;
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

        // Desenhar apenas arestas da rota
        for (let i = 0; i < packet.rota.length - 1; i++) {
            const fromPos = positions[packet.rota[i].id];
            const toPos = positions[packet.rota[i + 1].id];
            ctx.beginPath(); ctx.moveTo(fromPos.x, fromPos.y); ctx.lineTo(toPos.x, toPos.y);
            ctx.strokeStyle = 'rgba(0,180,255,0.5)'; ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
            ctx.save(); ctx.shadowColor = 'rgba(0,180,255,0.3)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
        }

        // Desenhar todos os 100 nós
        const NODE_SIZE_ROUTE = 22;
        const NODE_SIZE_DEFAULT = 14;

        for (const [id, node] of Object.entries(GRAPH)) {
            const pos = positions[id];
            const inRoute = routeSet.has(id);
            const isInactive = !node.ativo;
            const flash = nodeFlash[id] || 0;
            const scale = 1 + flash * 0.2;
            const isOrigin = id === packet.origemId;
            const isDest = id === packet.destinoId;

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.scale(scale, scale);
            ctx.translate(-pos.x, -pos.y);

            if (inRoute) {
                // Nós da rota: ícone maior, azul (origem=verde, destino=vermelho)
                const color = isOrigin ? '#00e090' : isDest ? '#ff6b6b' : '#00b4ff';
                drawRouterIcon(ctx, pos.x, pos.y, NODE_SIZE_ROUTE, color, false);
                // Label apenas para nós da rota
                const lblColor = isOrigin ? '#00e090' : isDest ? '#ff6b6b' : '#88ddff';
                drawLabel(ctx, pos.x, pos.y, NODE_SIZE_ROUTE, node.label, node.ip, lblColor);
            } else if (isInactive) {
                // Inativos: ícone cinza pequeno + X vermelho
                drawRouterIcon(ctx, pos.x, pos.y, NODE_SIZE_DEFAULT, 'rgba(120,120,140,0.5)', true);
            } else {
                // Ativos fora da rota: ícone cinza pequeno (sem X)
                drawRouterIcon(ctx, pos.x, pos.y, NODE_SIZE_DEFAULT, 'rgba(120,120,140,0.4)', false);
            }

            ctx.restore();

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
export function renderRede() {
    const packet = buildNetworkPacket();

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

    const noRouteMsg = !packet.rotaEncontrada
        ? `<div class="net-no-route">⚠ Rota não encontrada — tente nova requisição</div>`
        : '';

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
                        <span class="net-info-value net-hops">${packet.rotaEncontrada ? packet.rota.length - 1 : '—'}</span>
                    </div>
                </div>
                ${noRouteMsg}
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
