<script lang="ts">
  import { TSettingsPanel, getSettings, setSettings } from '@/api/settings';

  let panels: TSettingsPanel[] = [];
  $: getSettings().then((state) => {
    panels = state.visiblePanels;
  });

  function onChangeVisibility(panel: TSettingsPanel) {
    panel.visible = !panel.visible;
    void setSettings({ visiblePanels: panels });
  }
</script>

<div class="dropdown">
  <button title="Visible panels"><span class="icon -toggle-menu" /></button>
  <ul class="dropdown-content" role="menu" aria-label="Visible panels">
    {#each panels as panel (panel.name)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <li
        role="menuitem"
        class="menu-item"
        class:non-visible={!panel.visible}
        on:click={() => onChangeVisibility(panel)}
      >
        {panel.name}
      </li>
    {/each}
  </ul>
</div>

<style lang="scss">
  .dropdown {
    position: relative;
    display: inline-block;

    .dropdown-content {
      position: absolute;
      display: none;
      min-width: 8rem;
      background-color: var(--bg);
      list-style: none;
      padding: 6px;
      margin: 0;
      // border: 1px solid var(--border);
      box-shadow: 0px 4px 4px 0px var(--border);
      z-index: 1;

      .menu-item {
        cursor: pointer;
        line-height: 1.5rem;

        &:hover {
          font-weight: bold;
        }
        &.non-visible {
          color: var(--text-passive);
        }
      }
    }
    &:active,
    &:hover .dropdown-content {
      display: block;
    }
  }
</style>
