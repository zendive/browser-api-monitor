<script lang="ts">
  import { EWrapperCallstackType } from '../../api/storage/storage.local.ts';
  import { EMsg, runtimeListen } from '../../api/communication.ts';
  import Alert from '../shared/Alert.svelte';
  import {
    toggleKeepAwake,
    togglePanelVisibility,
    togglePanelWrap,
    toggleWrapperCallstackType,
    useConfigState,
  } from '../../state/config.state.svelte.ts';

  const config = useConfigState();
  let reloadMessageEl: Alert | null = null;
  let selfEl: HTMLElement | null = null;

  runtimeListen((o) => {
    if (o.msg === EMsg.CONTENT_SCRIPT_LOADED) {
      reloadMessageEl?.hide();
      selfEl?.hidePopover();
    }
  });

  function onTogglePanelWrap(index: number) {
    togglePanelWrap(index);
    reloadMessageEl?.show();
  }

  function onToggleWrapperCallstackType() {
    toggleWrapperCallstackType();
    reloadMessageEl?.show();
  }
</script>

<button
  popovertarget="toggle-panels-menu"
  class="toggle-menu-button"
  title="Control Panel"
  aria-label="Control Panel"
>
  <span class="icon -toggle-menu"></span>
</button>

<div bind:this={selfEl} popover="auto" id="toggle-panels-menu" role="menu">
  <table class="menu-content">
    <tbody>
      <tr class="menu-item -dash-bottom">
        <td class="-left">Callstack Type</td>
        <td class="-right">
          <button
            class="btn-toggle"
            title="Toggle callstack type: full/short"
            onclick={onToggleWrapperCallstackType}
          >
            {
              `${
                config.wrapperCallstackType ===
                    EWrapperCallstackType.FULL
                  ? 'full'
                  : 'short'
              }`
            }
          </button>
        </td>
      </tr>

      {#each config?.panels || [] as panel, index (panel.key)}
        <tr class="menu-item" class:-dash-bottom={index === 2}>
          <td class="-left">
            <a
              href="void(0)"
              class="toggle-visibility"
              class:hidden={!panel.visible}
              title="Toggle panel visibility"
              onclick={(e) => {
                e.preventDefault();
                togglePanelVisibility(index);
              }}
            >{panel.label}</a>
          </td>

          {#if panel.wrap !== null}
            <td class="-right">
              <button
                class="btn-toggle"
                title="Wrap/unwrap function to start/stop collect it's metrics"
                onclick={() => void onTogglePanelWrap(index)}
              >
                {`${panel.wrap ? 'wrapped' : 'unwrapped'}`}
              </button>
            </td>
          {/if}
        </tr>
      {/each}

      <tr class="menu-item -dash-top">
        <td class="-left">
          Prevent the system from going to Sleep state due to user inactivity
        </td>
        <td class="-right">
          <button
            class="btn-toggle"
            onclick={toggleKeepAwake}
          >
            {`${config.keepAwake ? 'on' : 'off'}`}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<Alert bind:this={reloadMessageEl} dismissable={false} title="Attention"
>Tab reload required</Alert>

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
      margin: 0.2rem 0;

      .menu-item {
        td {
          line-height: 1rem;
          padding: 0.1rem 0 0.1rem 0;

          &.-left {
            max-width: 12rem;
          }
          &.-right {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        &.-dash-bottom {
          border-bottom: 1px solid var(--border);
        }

        &.-dash-top {
          border-top: 1px solid var(--border);
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
          margin-left: 0.375rem;
          font-weight: bold;
        }
      }
    }
  }
</style>
