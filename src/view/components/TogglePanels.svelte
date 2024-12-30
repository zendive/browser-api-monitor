<script lang="ts">
  import {
    getSettings,
    setSettings,
    WrapperCallstackType,
    type TSettingsPanel,
    type TWrapperCallstackType,
  } from '../../api/settings.ts';
  import { runtimeListen } from '../../api/communication.ts';
  import Alert from './Alert.svelte';

  const nonWrappable = ['media', 'activeTimers'];
  let panels: TSettingsPanel[] = [];
  let wrapperCallstackType: TWrapperCallstackType;
  let reloadMessageEl: Alert | null = null;
  let selfEl: HTMLElement | null = null;

  getSettings().then((state) => {
    panels = state.panels;
    wrapperCallstackType = state.wrapperCallstackType;
  });

  runtimeListen(async (o) => {
    if (o.msg === 'content-script-loaded') {
      reloadMessageEl?.hide();
      selfEl?.hidePopover();
    }
  });

  function onTogglePanelVisibility(index: number) {
    panels[index].visible = !panels[index].visible;
    setSettings({ panels });
  }

  function onTogglePanelWrap(index: number) {
    panels[index].wrap = !panels[index].wrap;
    setSettings({ panels });
    reloadMessageEl?.show();
  }

  function onToggleWrapperCallstackType() {
    wrapperCallstackType =
      wrapperCallstackType === WrapperCallstackType.FULL
        ? WrapperCallstackType.SHORT
        : WrapperCallstackType.FULL;
    setSettings({ wrapperCallstackType });
    reloadMessageEl?.show();
  }
</script>

<button
  popovertarget="toggle-panels-menu"
  class="toggle-menu-button"
  title="Settings"
  aria-label="Settings"><span class="icon -toggle-menu"></span></button
>

<div bind:this={selfEl} popover="auto" id="toggle-panels-menu" role="menu">
  <table class="menu-content">
    <tbody>
      <tr class="menu-item -dash">
        <td>Callstack Type</td>
        <td
          ><button
            class="btn-toggle"
            title="Toggle callstack type: full/short"
            on:click={onToggleWrapperCallstackType}
            >{`${wrapperCallstackType === WrapperCallstackType.FULL ? 'full' : 'short'}`}</button
          ></td
        >
      </tr>

      {#each panels as panel, index (panel.key)}
        <tr class="menu-item">
          <td
            ><a
              href="void(0)"
              class="toggle-visibility"
              class:hidden={!panel.visible}
              title="Toggle panel visibility: visible/hidden"
              on:click|preventDefault={void onTogglePanelVisibility(index)}
              >{panel.label}</a
            ></td
          >

          {#if !nonWrappable.includes(panel.key)}
            <td
              ><button
                class="btn-toggle"
                title="Toggle function wrapping state: wrap/unwrap"
                on:click={void onTogglePanelWrap(index)}
                >{`${panel.wrap ? 'unwrap' : 'wrap'}`}</button
              ></td
            >
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<Alert bind:this={reloadMessageEl} dismissable={false} title="Attention"
  >Tab reload required</Alert
>

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
    padding: 0 0.375rem;

    .menu-content {
      .menu-item {
        line-height: 1.4rem;

        &.-dash {
          border-bottom: 1px solid var(--border);
        }

        .toggle-visibility {
          color: var(--text);
          text-wrap: nowrap;

          &.hidden {
            color: var(--text-passive);
          }
        }

        .btn-toggle {
          color: var(--text);
          border-left: 1px solid var(--border);
          border-right: none;
          margin-left: 0.375rem;
        }
      }
    }
  }
</style>
