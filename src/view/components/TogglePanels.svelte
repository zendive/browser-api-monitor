<script lang="ts">
  import { runtimeListen } from '@/api/communication.ts';
  import {
    getSettings,
    setSettings,
    type TSettingsPanel,
  } from '@/api/settings.ts';

  let panels: TSettingsPanel[] = [];
  let popoverEl: HTMLElement | null = null;

  getSettings().then((state) => {
    panels = state.panels;
  });

  runtimeListen(async (o) => {
    if (o.msg === 'content-script-loaded') {
      popoverEl?.hidePopover();
    }
  });

  function onTogglePanelVisibility(index: number) {
    panels[index].visible = !panels[index].visible;
    setSettings({ panels });
  }

  function onTogglePanelWrap(index: number) {
    panels[index].wrap = !panels[index].wrap;
    setSettings({ panels });
    popoverEl?.showPopover();
  }
</script>

<div class="dropdown">
  <button title="Visible panels"><span class="icon -toggle-menu" /></button>
  <nav class="dropdown-content">
    {#each panels as panel, index (panel.key)}
      <div class="menu-item">
        <a
          href="void(0)"
          class="toggle-visibility"
          class:hidden={!panel.visible}
          on:click|preventDefault={void onTogglePanelVisibility(index)}
          >{panel.label}</a
        >

        {#if panel.key === 'eval'}
          <button
            class="btn-toggle-wrap"
            on:click={void onTogglePanelWrap(index)}
            >{`${panel.wrap ? 'unwrap' : 'wrap'}`}</button
          >
        {/if}
      </div>
    {/each}
  </nav>
</div>

<div bind:this={popoverEl} class="popover bc-invert" popover="auto">
  Tab reload required
</div>

<style lang="scss">
  .popover {
    inset: unset;
    top: 2rem;
    right: 50%;
    transform: translateX(50%);
    font-size: 2rem;
    padding: 1rem;
    border-radius: 1rem;
  }

  .dropdown {
    position: relative;
    display: inline-block;

    &:active,
    &:hover .dropdown-content {
      display: block;
    }

    .dropdown-content {
      position: absolute;
      display: none;
      min-width: 8rem;
      background-color: var(--bg);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      border-left: 1px solid var(--border);
      list-style: none;
      padding: 0px 6px;
      margin: 0;
      z-index: 1;

      .menu-item {
        display: flex;
        cursor: pointer;
        line-height: 1.5rem;

        .toggle-visibility {
          flex-grow: 1;
          color: var(--text);

          &:hover {
            font-weight: bold;
          }
          &.hidden {
            color: var(--text-passive);
          }
        }

        .btn-toggle-wrap {
          color: var(--text);
          border-left: 1px solid var(--border);
          border-right: none;
          margin-right: 0;
        }
      }
    }
  }
</style>
