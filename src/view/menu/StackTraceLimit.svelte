<script lang="ts">
import { onMount } from 'svelte';
import { Point, twoPI, Vector } from '../shared/canvas.ts';

interface IOption {
  data: number;
  x: number;
  y: number;
}

let {
  value,
  onApply,
}: {
  value: number;
  onApply: (value: number) => void;
} = $props();
const uid = $props.id();
let selfEl: HTMLElement;
let mode: 1 | 10 = $state(1);
const optionsCount = 10;
const radiusRem = 3.0;
const paddingRem = 0.6;
const axis = new Point(radiusRem, radiusRem);
const deltaAngle = twoPI / optionsCount;
const MAX_VALUE = Number.MAX_SAFE_INTEGER - 1;
let options = $derived.by(() => {
  const vector = Vector.toNorth(radiusRem - paddingRem);
  const rv: IOption[] = new Array(optionsCount);

  for (let n = 0; n < optionsCount; n++) {
    let data = (n + 1) * mode;
    rv[n] = {
      data: data === 100 ? MAX_VALUE : data,
      ...vector.rotateRight(deltaAngle).atBase(axis),
    };
  }

  return rv;
});

onMount(() => {
  mode = (value > 10) ? 10 : 1;
});

function nextMode() {
  mode = (mode === 1) ? 10 : 1;
}

function displayValue(value: number) {
  return value < MAX_VALUE ? value : 'max';
}

function displayLabel(value: number) {
  if (value === 10) {
    return 'default';
  } else if (value === MAX_VALUE) {
    return 'Number.MAX_SAFE_INTEGER';
  }

  return null;
}
</script>

<button type="button" interestfor={uid}>{displayValue(value)}</button>
<div
  bind:this={selfEl}
  id={uid}
  popover="hint"
  style:--box-size="{2 * radiusRem}rem"
>
  {#each options as {data, x, y} (data)}
    <button
      type="button"
      class="btn-toggle"
      class:-current={data === value}
      style:--x="{x}rem"
      style:--y="{y}rem"
      onclick={() => {
        selfEl.hidePopover();
        onApply(data);
      }}
      title={displayLabel(data)}
    >{displayValue(data)}</button>
  {/each}

  <button
    type="button"
    class="btn-toggle -next"
    style:--x="{radiusRem}rem"
    style:--y="{radiusRem}rem"
    onclick={nextMode}
  >next</button>
</div>

<style lang="scss">
div[popover] {
  position: relative;
  transform: translateY(calc(-50% - 0.55rem));
  width: var(--box-size);
  height: var(--box-size);
  position-area: block-end span-all;
  background-color: var(--bg-popover);
  border: 1px solid var(--attention);
  border-radius: 50%;

  button {
    position: absolute;
    transform: translate(
      calc(var(--x) - 50%),
      calc(var(--y) - 50%)
    );
    border-radius: 50%;

    &:hover {
      border: 1px solid var(--border);
    }

    &.-current {
      color: var(--attention);
    }

    &.-next {
      width: calc(var(--box-size) - 50%);
      height: calc(var(--box-size) - 50%);
    }
  }
}
</style>
