<script lang="ts">
  import { Timer } from '../../api/time.ts';
  import { VARIABLE_ANIMATION_THROTTLE } from './const.ts';

  let { value, title }: { value: unknown; title?: string } = $props();
  let isAnimated: boolean = $state(false);
  let isEven = $derived.by(() =>
    typeof value === 'number' ? !(value & 1) : false
  );
  let lastUpdated: number = Date.now();
  const timer = new Timer({ delay: 100 }, () => {
    isAnimated = false;
  });

  function animateChange(_node: HTMLElement, _value: unknown) {
    return {
      update(_value: unknown) {
        const startAnimation =
          Date.now() - lastUpdated > VARIABLE_ANIMATION_THROTTLE;

        if (startAnimation) {
          isAnimated = true;
          timer.start();
        }

        lastUpdated = Date.now();
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
  {title}
  use:animateChange={value}
>{value}</span>

<style lang="scss">
  .number {
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
