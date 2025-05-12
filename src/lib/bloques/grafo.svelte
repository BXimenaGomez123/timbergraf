<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import caminos from '$lib/data/caminos.json';

  let width = 0;
  let height = 0;
  let svg;
  let map;
  let L;

  // Actualiza dimensiones
  function updateSize() {
    width = window.innerWidth;
    height = window.innerHeight - 80;
    if (svg) {
      svg
        .attr('width', width / 2)
        .attr('height', height);
    }
  }

  onMount(async () => {
    // Carga Leaflet solo en cliente
    const module = await import('leaflet');
    L = module.default;
    await import('leaflet/dist/leaflet.css');

    updateSize();
    window.addEventListener('resize', updateSize);
    buildAndDraw();
  });

  function buildAndDraw() {
    // 1) Construir nodos y enlaces de los caminos
    const nodesMap = new Map();
    const links = [];
    caminos.paths.forEach(pathObj => {
      const path = pathObj.nodes;
      for (let i = 0; i < path.length; i++) {
        const n = path[i];
        nodesMap.set(n.id, { ...n });
        if (i + 1 < path.length) {
          links.push({ source: path[i].id, target: path[i+1].id, weight: pathObj.weight });
        }
      }
    });
    const nodes = Array.from(nodesMap.values());

    // 2) Preparar SVG
    svg = d3.select('svg')
      .attr('width', width / 2)
      .attr('height', height);
    svg.selectAll('*').remove();

    // Flecha para enlaces
    svg.append('defs').append('marker')
      .attr('id','arrow')
      .attr('viewBox','0 -5 10 10')
      .attr('refX',15)
      .attr('refY',0)
      .attr('markerWidth',6)
      .attr('markerHeight',6)
      .attr('orient','auto')
      .append('path')
        .attr('d','M0,-5L10,0L0,5')
        .attr('fill','#999');

    // 3) Simulación de fuerza
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id).distance(100).strength(1))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter((width/2)/2, height/2));

    // 4) Dibujar enlaces
    const link = svg.append('g')
      .attr('stroke', '#999')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // 5) Dibujar nodos y labels
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class','node')
      .call(drag(simulation))
      .on('click', (event, d) => {
        if (d.type === 'MANEJO') renderMapForPath(d);
      });

    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.type==='MANEJO' ? '#2ca02c' : '#ccc');

    node.append('text')
      .text(d => d.id)
      .attr('x', 10)
      .attr('y', 3)
      .attr('fill', '#fff')
      .style('font-size', '10px');

    // 6) Tick: actualizar posiciones con clamp actualizar posiciones con clamp
    simulation.on('tick', () => {
      const r = 8;
      const svgW = width/2;
      const svgH = height;
      const minX = r, maxX = svgW - r;
      const minY = r, maxY = svgH - r;

      link
        .attr('x1', d => { d.source.x = clamp(d.source.x, minX, maxX); return d.source.x; })
        .attr('y1', d => { d.source.y = clamp(d.source.y, minY, maxY); return d.source.y; })
        .attr('x2', d => { d.target.x = clamp(d.target.x, minX, maxX); return d.target.x; })
        .attr('y2', d => { d.target.y = clamp(d.target.y, minY, maxY); return d.target.y; });

      node.attr('transform', d => {
        d.x = clamp(d.x, minX, maxX);
        d.y = clamp(d.y, minY, maxY);
        return `translate(${d.x},${d.y})`;
      });
    });

    // Inicializa mapa
    initMap();
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function initMap() {
    if (!map && L) {
      map = L.map('map').setView([0,0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }
  }

  function renderMapForPath(node) {
    // traza la ruta completa desde caminos.paths
    const pathObj = caminos.paths.find(p => p.nodes.some(n=>n.id===node.id));
    if (!pathObj) return;
    const coords = pathObj.nodes
      .map(n => [n.latitude, n.longitude])
      .filter(c => c[0]!=null && c[1]!=null);
    if (!map) return;
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) map.removeLayer(layer);
    });
    L.polyline(coords, { color: 'gold', weight: 4 }).addTo(map);
    coords.forEach(c => L.circleMarker(c, { radius: 5, color: 'red' }).addTo(map));
    map.fitBounds(coords);
  }

  function drag(sim) {
    return d3.drag()
      .on('start', e => {
        if (!e.active) sim.alphaTarget(0.3).restart();
        e.subject.fx = e.subject.x;
        e.subject.fy = e.subject.y;
      })
      .on('drag', e => {
        e.subject.fx = e.x;
        e.subject.fy = e.y;
      })
      .on('end', e => {
        if (!e.active) sim.alphaTarget(0);
        e.subject.fx = null;
        e.subject.fy = null;
      });
  }
</script>

<style>
  div.wrapper { display: flex; }
  svg { background: #1c1c1c; }
  #map { flex:1; height:100vh; }
</style>

<div class="wrapper">
  <svg></svg>
  <div id="map"></div>
</div>
