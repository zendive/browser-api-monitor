<script lang="ts">
  let { specifier }: { specifier: unknown } = $props();

  function openSpecifier(e: MouseEvent) {
    e.preventDefault();
    chrome?.devtools?.panels.openResource(String(specifier), 0, 0);
  }
</script>

<a
  href="void(0)"
  onclick={openSpecifier}
  title="Open Specifier"
  aria-label="Open Specifier"
>{specifier}</a>
