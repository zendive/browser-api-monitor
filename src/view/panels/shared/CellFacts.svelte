<script lang="ts">
  import {
    Fact,
    type TFact,
    type TFactsMap,
  } from '../../../wrapper/shared/Fact.ts';

  let { facts, factsMap }: { facts: TFact; factsMap: TFactsMap } = $props();
</script>

<span
  class="fact-cell"
  title={Fact.getDetails(factsMap)}
>
  {Fact.getTags(facts, factsMap)}
</span>

<style>
  .fact-cell {
    font-weight: bold;
    color: var(--attention);
  }
</style>
