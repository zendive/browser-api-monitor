<script lang="ts">
  import {
    getSettings,
    setSettings,
    type TSettingsPanel,
  } from '@/api/settings.ts';

  let panels: TSettingsPanel[] = [];

  getSettings().then((state) => {
    panels = state.panels;
  });
</script>

<div class="dropdown">
  <button title="Visible panels"><span class="icon -toggle-menu" /></button>
  <ul class="dropdown-content" role="menu" aria-label="Visible panels">
    {#each panels as panel (panel.key)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <li
        role="menuitem"
        class="menu-item"
        class:hidden={!panel.visible}
        on:click={() => {
          panel.visible = !panel.visible;
          setSettings({ panels });
        }}
      >
        {panel.label}
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
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      border-left: 1px solid var(--border);
      list-style: none;
      padding: 0px 6px;
      margin: 0;
      z-index: 1;
      user-select: none;

      .menu-item {
        cursor: pointer;
        line-height: 1.5rem;

        &:hover {
          font-weight: bold;
        }
        &.hidden {
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
