<script>
    import MovieGraph from '$lib/bloques/grafo.svelte';
  
</script>
  
<h1>Grafo de Timber-Chain</h1>
  
<section class="chart-section">
<h2>Grafo Interativo</h2>
<MovieGraph />
</section>
  
<style>
    h1 {
      text-align: center;
      color: #ffd700;
      margin: 1rem 0;
      font-size: 2rem;
    }
  
    h2 {
      text-align: center;
      color: #ffffff;
      margin: 1rem 0;
      font-size: 1.5rem;
    }
  
    .chart-section {
      margin: 2rem auto;
      padding: 1rem;
      max-width: 100%;
      background: #1c1c1c;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    }
  
    body, html {
      background: #121212;
      color: #fff;
      font-family: 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
    }
</style>
  