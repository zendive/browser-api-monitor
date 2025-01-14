<script lang="ts">
  import { SELF_TIME_MAX_GOOD } from 'src/api/const.ts';
  import { Stopper } from 'src/api/time';

  let { value }: { value: number | null } = $props();
  let isBad = $derived.by(() => {
    return value && value > SELF_TIME_MAX_GOOD;
  });
</script>

<span class:shouldMark={isBad}>
  {Stopper.toString(value)}
</span>

<style lang="scss">
  .shouldMark {
    color: var(--error);
    font-weight: bold;
  }
</style>
