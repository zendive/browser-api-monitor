<script lang="ts">
  import { Fact, type TFact, type TFactsMap } from '../../wrapper/Fact.ts';

  let { facts, factsMap }: { facts: TFact; factsMap: TFactsMap } = $props();
</script>

<span
  class="fact-cell"
  title={Fact.getDetails(facts, factsMap)}
>
  {Fact.getTags(facts, factsMap)}
</span>

<style>
  .fact-cell {
    font-weight: bold;
    color: var(--error);
  }
</style>
