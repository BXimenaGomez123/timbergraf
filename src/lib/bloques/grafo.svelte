<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import grafoCompleto from '$lib/data/grafo_timber.json';

  let graphData = null;
  let filteredGraph = { nodes: [], links: [] };
  let selectedNodeId = '';
  let highlightedNodeId = null;
  let routeLinks = [];  // Links a resaltar

  let width = 0;
  let height = 0;

  onMount(() => {
    graphData = grafoCompleto;
    updateSize();
    window.addEventListener('resize', updateSize);
  });

  function updateSize() {
    width = window.innerWidth;
    height = window.innerHeight - 80; 
  }

  function searchNode(nodeId) {
    const node = graphData.nodes.find(d => d.id === nodeId);
    if (!node) return;

    highlightedNodeId = nodeId;

    const componentId = node.component;

    const nodesInComponent = graphData.nodes.filter(d => d.component === componentId);
    const nodeIdsInComponent = new Set(nodesInComponent.map(d => d.id));

    let linksInComponent = graphData.links.filter(d =>
      nodeIdsInComponent.has(d.source) && nodeIdsInComponent.has(d.target)
    ).map(d => ({
      source: typeof d.source === 'object' ? d.source.id : d.source,
      target: typeof d.target === 'object' ? d.target.id : d.target,
      weight: d.weight
    }));

    const adjacency = new Map();
    for (const node of nodesInComponent) {
      adjacency.set(node.id, []);
    }
    for (const link of linksInComponent) {
      adjacency.get(link.source).push(link.target);
      adjacency.get(link.target).push(link.source);
    }

    const visited = new Set([nodeId]);
    const queue = [nodeId];
    const resultNodes = new Set([nodeId]);

    const MAX_NODES = 30;

    while (queue.length > 0 && resultNodes.size < MAX_NODES) {
      const current = queue.shift();
      for (const neighbor of adjacency.get(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          resultNodes.add(neighbor);

          if (resultNodes.size >= MAX_NODES) break;

          queue.push(neighbor);
        }
      }
    }

    const nodes = graphData.nodes.filter(d => resultNodes.has(d.id));
    const nodeIds = new Set(nodes.map(d => d.id));

    const links = graphData.links.filter(d =>
      nodeIds.has(d.source) && nodeIds.has(d.target)
    ).map(d => ({
      source: typeof d.source === 'object' ? d.source.id : d.source,
      target: typeof d.target === 'object' ? d.target.id : d.target,
      weight: d.weight
    }));

    filteredGraph = { nodes, links };

    // Para este ejemplo, definimos una ruta manual (o puedes cargar de rutasOptimas)
    routeLinks = [
      { source: '2506383000108', target: '2506383000109' },
      { source: '2506383000109', target: '2506383000110' },
    ]; // este sería el camino óptimo a resaltar

    drawGraph(filteredGraph);
  }

  function drawGraph(graph) {
    d3.select('svg').selectAll('*').remove();  

    const svg = d3.select('svg')
      .attr('width', width)
      .attr('height', height);

    const nodeRadius = 10;

    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke-width', d => {
        const isRoute = routeLinks.some(r => r.source === d.source && r.target === d.target);
        return isRoute ? 4 : Math.sqrt(d.weight || 1);
      })
      .attr('stroke', d => {
        const isRoute = routeLinks.some(r => r.source === d.source && r.target === d.target);
        return isRoute ? '#FFD700' : '#999';
      });

    const node = svg.append('g')
      .selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => colorScale(d))
      .attr('stroke', d => d.id === highlightedNodeId ? '#FFD700' : '#fff')
      .attr('stroke-width', d => d.id === highlightedNodeId ? 3 : 1.5)
      .call(drag(simulation));

    const tooltip = d3.select("#tooltip");

    node.on('mouseover', (event, d) => {
        tooltip.style("display", "block")
          .html(`<strong>ID: ${d.id}</strong><br/>
                Tipo: ${d.type}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on('mouseout', () => {
        tooltip.style("display", "none");
      })
      .on('click', d => showDetails(d));

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function showDetails(d) {
      alert(`ID: ${d.id}\nTipo: ${d.type}`);
    }

    function drag(simulation) {
      return d3.drag()
        .on('start', event => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', event => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', event => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }
  }

  // Escala fija de colores
  function colorScale(d) {
    if (d.type === 'PTO_IBAMA') return '#1f77b4';
    if (d.type === 'MANEJO') return '#2ca02c';
    if (d.type === 'FINAL') return '#d62728';
    return '#ccc';
  }
</script>

<div class="grafo-container">
  <input placeholder="ID del nodo" bind:value={selectedNodeId} />
  <button on:click={() => searchNode(selectedNodeId)}>Buscar</button>

  <svg width={width} height={height}></svg>

  <div id="tooltip" style="position: absolute; display: none; background: white; border: 1px solid #ccc; padding: 5px;"></div>
</div>
