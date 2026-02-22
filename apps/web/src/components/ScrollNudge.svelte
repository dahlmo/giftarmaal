<script lang="ts">
  export let onClick: () => void = () => {};
</script>

<button
  type="button"
  class="scroll-indicator"
  on:click={onClick}
  aria-label="Scroll ned til innhold"
>
  {#each [0, 1, 2] as i}
    <svg class={"chevron chevron-" + i} viewBox="0 0 100 40">
      <path
        d="M8 8 L50 32 L92 8"
        stroke="currentColor"
        stroke-width="8"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  {/each}
</button>

<style>
  .scroll-indicator {
    margin-top: 16rem;
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    user-select: none;
    align-items: center;
  }

  .chevron {
    width: 20px;
    height: 10px;
    flex-shrink: 0;
  }

  .chevron-0 {
    color: #bfbfbf; /* lys */
  }

  .chevron-1 {
    color: #8a8a8f; /* medium */
  }

  .chevron-2 {
    color: #3a3a3d; /* mørk */
  }
</style>
