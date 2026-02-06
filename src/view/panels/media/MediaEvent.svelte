<script lang="ts">
  import Variable from '../../shared/Variable.svelte';

  let { name, value }: { name: string; value: unknown } = $props();
</script>

<tr class:isPassive={0 === value} class:isActive={0 !== value}>
  <td class="name">{name}</td>
  <td class="value"><Variable {value} /></td>
</tr>

<style lang="scss">
  .isPassive {
    color: var(--text-passive);
    font-weight: normal;
  }
  .isActive {
    font-weight: bold;
  }
  .name {
    text-align: right;
  }
  .value {
    text-align: left;
    margin-left: 1rem;
  }
</style>
