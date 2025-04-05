<script lang="ts">
  import { isToggableMediaProp, type TMediaMetrics  } from '../../wrapper/MediaWrapper.ts';
  import { EMsg, portPost } from '../../api/communication.ts';
    import Variable from './Variable.svelte';
  import MediaCommands from './MediaCommands.svelte';

  let { metrics }: { metrics: TMediaMetrics } = $props();

  

  function onToggleBoolean(property: string) {
    portPost({
      msg: EMsg.MEDIA_COMMAND,
      mediaId: metrics.mediaId,
      cmd: 'toggle-boolean',
      property: property as keyof HTMLMediaElement,
    });
  }

  function propValueFilter(value: unknown) {
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  }
</script>

<table class="group">
  <caption class="bc-invert ta-l">
    <MediaCommands mediaId={metrics.mediaId} />
  </caption>
  <tbody>
    <tr>
      <td class="events">
        <table class="w-full">
          <caption class="bc-invert ta-l">Events</caption>
          <tbody>
            {#each Object.entries(metrics.events) as [label, value] (label)}
              <tr class:isPassive={0 === value} class:isActive={0 !== value}>
                <td class="item-label">{label}</td>
                <td class="item-value"><Variable {value} /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </td>
      <td class="props">
        <table class="w-full">
          <caption class="bc-invert ta-l">Properties</caption>
          <tbody>
            {#each Object.entries(metrics.props) as [label, value] (label)}
              <tr class:isPassive={!value} class:isActive={true === value}>
                <td class="item-label">{label}</td>
                <td class="item-value">
                  {#if isToggableMediaProp(label)}
                    <i
                      class="is-toggable"
                      role="button"
                      tabindex="0"
                      onkeydown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        onToggleBoolean(label);
                      }}
                      onclick={() => void onToggleBoolean(label)}>{value}</i
                    >
                  {:else if ['networkState', 'readyState'].includes(label)}
                    <Variable {value} />
                  {:else}
                    {propValueFilter(value)}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
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
  .is-toggable {
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
