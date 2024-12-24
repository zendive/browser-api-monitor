<script lang="ts">
  import { runtimeListen } from '@/api/communication.ts';
  import {
    getSettings,
    setSettings,
    type TSettingsPanel,
  } from '@/api/settings.ts';

  const nonWrappable = ['media', 'activeTimers'];
  let panels: TSettingsPanel[] = [];
  let reloadMessageEl: HTMLElement | null = null;

  getSettings().then((state) => {
    panels = state.panels;
  });

  runtimeListen(async (o) => {
    if (o.msg === 'content-script-loaded') {
      reloadMessageEl?.hidePopover();
    }
  });

  function onTogglePanelVisibility(index: number) {
    panels[index].visible = !panels[index].visible;
    setSettings({ panels });
  }

  function onTogglePanelWrap(index: number) {
    panels[index].wrap = !panels[index].wrap;
    setSettings({ panels });
    reloadMessageEl?.showPopover();
  }
</script>

<button
  popovertarget="toggle-panels-menu"
  class="toggle-menu-button"
  title="Control panels"><span class="icon -toggle-menu" /></button
>

<div popover="auto" id="toggle-panels-menu" role="menu">
  <table class="menu-content">
    {#each panels as panel, index (panel.key)}
      <tr class="menu-item">
        <td
          ><a
            href="void(0)"
            class="toggle-visibility"
            class:hidden={!panel.visible}
            on:click|preventDefault={void onTogglePanelVisibility(index)}
            >{panel.label}</a
          ></td
        >

        {#if !nonWrappable.includes(panel.key)}
          <td
            ><button
              class="btn-toggle-wrap"
              on:click={void onTogglePanelWrap(index)}
              >{`${panel.wrap ? 'unwrap' : 'wrap'}`}</button
            ></td
          >
        {/if}
      </tr>
    {/each}
  </table>
</div>

<div
  popover="manual"
  bind:this={reloadMessageEl}
  class="reload-message bc-invert"
>
  Tab reload required
</div>

<style lang="scss">
  .toggle-menu-button {
    anchor-name: --toggle-menu-button;
  }

  #toggle-panels-menu {
    position: absolute;
    position-anchor: --toggle-menu-button;
    top: anchor(bottom);
    left: anchor(left);

    background-color: var(--bg-popover);
    border: 1px solid var(--border);
    margin: 0;

    .menu-content {
      .menu-item {
        line-height: 1.4rem;

        .toggle-visibility {
          color: var(--text);
          text-wrap: nowrap;
          margin-left: 0.375rem;

          &.hidden {
            color: var(--text-passive);
          }
        }

        .btn-toggle-wrap {
          color: var(--text);
          border-left: 1px solid var(--border);
          border-right: none;
          margin-left: 0.375rem;
        }
      }
    }
  }

  .reload-message {
    inset: unset;
    top: 2rem;
    right: 50%;
    transform: translateX(50%);
    font-size: 2rem;
    padding: 1rem;
    border-radius: 1rem;
  }
</style>
