<script lang="ts">
  import Variable from './Variable.svelte';
  import type { TVideoMetrics } from '@/api/videoMonitor';

  export let metrics: TVideoMetrics | null = null;
</script>

{#if metrics}
  <section class="group">
    <table class="events">
      <caption class="bc-invert ta-l">Events</caption>
      {#each Object.entries(metrics.events) as [label, value]}
        <tr class:isPassive={0 === value} class:isActive={0 !== value}>
          <td class="item-label">{label}</td>
          <td class="item-value"><Variable bind:value /></td>
        </tr>
      {/each}
    </table>

    <table class="props">
      <caption class="bc-invert ta-l">Properties</caption>
      {#each Object.entries(metrics.props) as [label, value]}
        <tr class:isPassive={null === value} class:isActive={true === value}>
          <td class="item-label">{label}</td>
          <td class="item-value">
            {#if ['networkState', 'readyState'].includes(label)}
              <Variable bind:value />
            {:else}
              {value}
            {/if}
          </td>
        </tr>
      {/each}
    </table>
  </section>
{/if}

<style>
  .group {
    display: flex;

    &:not(:first-child) {
      border-left: 1px solid silver;
    }
  }
  .events,
  .props {
    border: none;
  }
  .isPassive {
    color: gray;
    font-weight: normal;
  }
  .isActive {
    font-weight: bold;
  }
  .item-label {
    text-align: right;
  }
  .item-value {
    text-align: left;
    margin-left: 1rem;
    word-break: break-all;
  }
</style>
