<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { ETimer, Timer } from '../../../api/time.ts';
  import { Mean } from '../../../api/Mean.ts';

  let {
    time,
    SelfTimeSlot,
  }: {
    time: number;
    SelfTimeSlot: Snippet<[number, string, string]>;
  } = $props();
  const mean = new Mean();
  const vs = $state({
    stdDev: '0.0',
    mean: time,
    max: time,
  });
  const eachSecond = new Timer({ type: ETimer.TIMEOUT, delay: 1e3 }, () => {
    if (!mean.samples) {
      return;
    }

    vs.stdDev = mean.sampleStdDev().toFixed(1);
    vs.mean = mean.mean;
    vs.max = mean.max;

    mean.reset();
    eachSecond.start();
  });

  $effect(() => void mean.add(time));

  onMount(() => {
    eachSecond.start();
    return () => void eachSecond.stop();
  });
</script>

{@render SelfTimeSlot(vs.mean, 'mean ± SD', `\u00A0±${vs.stdDev}`)}
{@render SelfTimeSlot(vs.max, 'max', '')}
