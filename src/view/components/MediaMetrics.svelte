<script lang="ts">
  import Variable from './Variable.svelte';
  import type { TMediaMetrics } from '@/api/mediaMonitor';

  export let caption: string;
  export let metrics: TMediaMetrics;
</script>

<table class="group">
  <caption class="bc-invert ta-l">{caption}</caption>
  <tr>
    <td class="events">
      <table>
        <caption class="bc-invert ta-l">Events</caption>
        {#each Object.entries(metrics.events) as [label, value] (label)}
          <tr class:isPassive={0 === value} class:isActive={0 !== value}>
            <td class="item-label">{label}</td>
            <td class="item-value"><Variable bind:value /></td>
          </tr>
        {/each}
      </table>
    </td>
    <td class="props">
      <table>
        <caption class="bc-invert ta-l">Properties</caption>
        {#each Object.entries(metrics.props) as [label, value] (label)}
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
    </td>
  </tr>
</table>

<style>
  .group {
    max-width: 28rem;

    &:not(:first-child) {
      border-left: 1px solid silver;
    }
  }
  .events,
  .props {
    vertical-align: top;
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
  }
</style>
