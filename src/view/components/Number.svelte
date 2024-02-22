<script lang="ts">
  export let value: number;

  let isAnimated = false;
  $: isEven = 0 === value % 2;

  function animateChange(node: HTMLElement, value: number) {
    let timeout: number;
    return {
      update(value: number) {
        isAnimated = true;
        timeout = setTimeout(() => {
          isAnimated = false;
        }, 100);
      },

      destroy() {
        clearTimeout(timeout);
      },
    };
  }
</script>

<span
  class="number"
  class:even={isEven}
  class:animated={isAnimated}
  use:animateChange={value}>{value}</span
>

<style>
  .number {
    font-size: 1rem;
    font-weight: bold;

    &.even {
      text-decoration: underline;
    }
  }
  .animated {
    -webkit-text-stroke: 1px #00000070;
    animation: effect 100ms ease-in-out;
  }

  @keyframes effect {
    0% {
      background: linear-gradient(red, black 0%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    100% {
      background: linear-gradient(red, yellow 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
</style>
