<script lang="ts">
  import Number from './Number.svelte';
  import type { TVideoMetrics } from '@/api/videoMonitor';

  export let metrics: TVideoMetrics | null = null;
</script>

{#if metrics}
  <div class="group">
    <table class="events">
      <caption class="group-caption">Events</caption>
      {#each Object.entries(metrics.events) as [label, value]}
        <tr>
          <td class="item-label">{label}</td>
          <td class="item-value"><Number bind:value /></td>
        </tr>
      {/each}
    </table>

    <table class="props">
      <caption class="group-caption">Properties</caption>
      {#each Object.entries(metrics.props) as [label, value]}
        <tr>
          <td class="item-label">{label}</td>
          <td class="item-value">{value}</td>
        </tr>
      {/each}
    </table>
  </div>
{/if}

<style>
  .group {
    display: flex;
  }
  .events,
  .props {
    border: none;
  }
  .group-caption {
    background-color: black;
    color: white;
    text-align: center;
  }
  .item-label {
    text-align: right;
    word-wrap: break-word;
  }
  .item-value {
    text-align: left;
    margin-left: 1rem;
    word-wrap: break-word;
    text-wrap: wrap;
  }
</style>
