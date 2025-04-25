<script lang="ts">
  const TOTAL = 8;
  let i = $state.raw(0);

  export function tick() {
    i = ++i % TOTAL;
  }
</script>
<!--  style="--index:{index}" -->
<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <g fill="var(--text)">
    <!--// @license MIT; source https://github.com/n3r4zzurr0/svg-spinners -->
    <circle class:i={0 === i} cx="12" cy="3" r="1" />
    <circle class:i={1 === i} cx="18.36" cy="5.64" r="1" />
    <circle class:i={2 === i} cx="21" cy="12" r="1" />
    <circle class:i={3 === i} cx="18.36" cy="18.36" r="1" />
    <circle class:i={4 === i} cx="12" cy="21" r="1" />
    <circle class:i={5 === i} cx="5.64" cy="18.36" r="1" />
    <circle class:i={6 === i} cx="3" cy="12" r="1" />
    <circle class:i={7 === i} cx="5.64" cy="5.64" r="1" />
    <style>
      .i {
        r: 3;
      }
    </style>
  </g>
</svg>
