<script lang="ts">
  import { type TMediaMetrics } from '../../../wrapper/MediaWrapper.ts';
  import MediaCommands from './MediaCommands.svelte';
  import MediaEvent from './MediaEvent.svelte';
  import MediaProp from './MediaProp.svelte';

  let { mediaId, events, props }: {
    mediaId: string;
    events: TMediaMetrics['events'];
    props: TMediaMetrics['props'];
  } = $props();
  let isSameSource = $derived.by(() => props['src'] === props['currentSrc']);
  const duplicateSrc = ['currentSrc', 'src'];
  let filteredProps = $derived.by(() => {
    let rv = Object.entries(props);

    if (isSameSource) {
      rv = rv.filter(([name]) => !duplicateSrc.includes(name));
    }

    return rv;
  });
</script>

<table class="group">
  <caption class="bc-invert ta-l">
    <MediaCommands
      {mediaId}
      paused={props['paused']}
    />
  </caption>
  <tbody>
    <tr>
      <td class="events">
        <table class="w-full">
          <caption class="bc-invert ta-l">Events</caption>
          <tbody>
            {#each Object.entries(events) as [name, value] (name)}
              <MediaEvent {name} {value} />
            {/each}
          </tbody>
        </table>
      </td>
      <td class="props">
        <table class="w-full">
          <caption class="bc-invert ta-l">Properties</caption>
          <tbody>
            {#if isSameSource}
              <MediaProp
                name="src/currentSrc"
                value={props['src']}
                {mediaId}
              />
            {/if}
            {#each filteredProps as [name, value] (name)}
              <MediaProp {name} {value} {mediaId} />
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
</style>
