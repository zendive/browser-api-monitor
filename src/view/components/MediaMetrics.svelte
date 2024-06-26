<script lang="ts">
  import Variable from '@/view/components/Variable.svelte';
  import type { TMediaMetrics } from '@/api/mediaMonitor.ts';
  import MediaCommands from './MediaCommands.svelte';
  import { portPost } from '@/api/communication.ts';
  import { MEDIA_ELEMENT_TOGGABLE_PROPS } from '@/api/const.ts';

  export let metrics: TMediaMetrics;

  function isToggable(property: string) {
    return MEDIA_ELEMENT_TOGGABLE_PROPS.has(property);
  }

  function onToggleBoolean(property: string) {
    if (!isToggable(property)) {
      return;
    }

    portPost({
      msg: 'media-command',
      mediaId: metrics.mediaId,
      cmd: 'toggle-boolean',
      property: property as keyof HTMLMediaElement,
    });
  }
</script>

<table class="group">
  <caption class="bc-invert ta-l">
    <MediaCommands bind:mediaId={metrics.mediaId} />
  </caption>
  <tr>
    <td class="events">
      <table class="w-full">
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
      <table class="w-full">
        <caption class="bc-invert ta-l">Properties</caption>
        {#each Object.entries(metrics.props) as [label, value] (label)}
          <tr
            class:isPassive={null === value ||
              false === value ||
              '' === value ||
              0 === value}
            class:isActive={true === value}
          >
            <td class="item-label">{label}</td>
            <td class="item-value">
              {#if isToggable(label)}
                <i
                  class="isToggable"
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    onToggleBoolean(label);
                  }}
                  on:click={() => void onToggleBoolean(label)}>{value}</i
                >
              {:else if ['networkState', 'readyState'].includes(label)}
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

<style lang="scss">
  .group {
    max-width: 37rem;

    &:not(:first-child) {
      border-left: 1px solid var(--border);
    }
  }
  .events,
  .props {
    vertical-align: top;
  }
  .isPassive {
    color: var(--text-passive);
    font-weight: normal;
  }
  .isToggable {
    cursor: pointer;
  }
  .isActive {
    font-weight: bold;
  }
  .item-label {
    text-align: right;
  }
  .props .item-value {
    word-break: break-all;
  }
  .item-value {
    text-align: left;
    margin-left: 1rem;
  }
</style>
