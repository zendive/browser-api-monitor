<script lang="ts">
  import { onMount } from 'svelte';
  import { EWrapperCallstackType } from '../../wrapper/shared/TraceUtil.ts';
  import { EMsg, listenRuntime } from '../../api/communication.ts';
  import Alert from '../shared/Alert.svelte';
  import {
    toggleKeepAwake,
    togglePanelVisibility,
    togglePanelWrap,
    toggleWrapperCallstackType,
    useConfigState,
  } from '../../state/config.state.svelte.ts';

  const config = useConfigState();
  let reloadMessageEl: Alert;
  let selfEl: HTMLElement;
  let wrapperCallstackTypeText = $derived.by(() => {
    return config.wrapperCallstackType === EWrapperCallstackType.FULL
      ? 'full'
      : 'short';
  });
  let keepAwakeText = $derived.by(() => {
    return config.keepAwake ? 'on' : 'off';
  });

  onMount(() => {
    listenRuntime((o) => {
      if (o.msg === EMsg.CONTENT_SCRIPT_LOADED) {
        reloadMessageEl.hide();
        selfEl.hidePopover();
      }
    });
  });

  function onTogglePanelWrap(index: number) {
    togglePanelWrap(index);
    reloadMessageEl.show();
  }

  function onToggleWrapperCallstackType() {
    toggleWrapperCallstackType();
    reloadMessageEl.show();
  }
</script>

<button
  type="button"
  popovertarget="toggle-panels-menu"
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
            type="button"
            class="btn-toggle"
            title="Toggle callstack type: full/short"
            onclick={onToggleWrapperCallstackType}
          >
            {wrapperCallstackTypeText}
          </button>
        </td>
      </tr>

      {#each config?.panels || [] as panel, index (panel.key)}
        <tr class="menu-item" class:-dash-bottom={index === 2}>
          <td class="-left">
            <a
              href="."
              role="button"
              class="toggle-visibility"
              class:hidden={!panel.visible}
              title="Toggle panel visibility"
              onclick={(e) => {
                e.preventDefault();
                togglePanelVisibility(index);
              }}
            >{panel.label}</a>
          </td>

          {#if panel.wrap !== undefined}
            <td class="-right">
              <button
                type="button"
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
            type="button"
            class="btn-toggle"
            onclick={toggleKeepAwake}
          >
            {keepAwakeText}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<Alert
  bind:this={reloadMessageEl}
  dismissable={false}
  title="Attention"
>Page reload required</Alert>

<style lang="scss">
  #toggle-panels-menu {
    position-area: block-end span-inline-end;
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
