<script lang="ts">
  let { value, title }: { value: unknown; title?: string } = $props();
  let isEven = $derived.by(() =>
    typeof value === 'number' ? !(value & 1) : false
  );
</script>

<span class:even={isEven} {title}>{value}</span>

<style lang="scss">
  span {
    font-weight: bold;

    &.even {
      text-decoration: underline;
    }
  }
</style>
