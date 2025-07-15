<script lang="ts">
  let { specifier }: { specifier: unknown } = $props();

  function openSpecifier(e: MouseEvent) {
    e.preventDefault();
    chrome?.devtools?.panels.openResource(String(specifier), 0, 0);
  }
</script>

<a
  href="."
  title="Open Specifier"
  aria-label="Open Specifier"
  role="button"
  onclick={openSpecifier}
>{specifier}</a>
