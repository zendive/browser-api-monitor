<script lang="ts">
  import { Timer, Stopper } from '@/api/time';

  export let value: unknown;

  let isAnimated = false;
  const stopper = new Stopper().start();

  $: isEven = typeof value === 'number' ? 0 === value % 2 : false;

  function animateChange(node: HTMLElement, value: unknown) {
    const timer = new Timer(() => {
      isAnimated = false;
    }, 100);

    return {
      update(value: unknown) {
        if (stopper.elapsed() > 2e3) {
          isAnimated = true;
          timer.start();
          stopper.start();
        }
      },

      destroy() {
        timer.stop();
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

<style lang="scss">
  .number {
    // font-size: 1rem;
    font-weight: bold;

    &.even {
      text-decoration: underline;
    }
    &.animated {
      -webkit-text-stroke: 1px #00000070;
      animation: effect 100ms ease-in-out;
    }
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
