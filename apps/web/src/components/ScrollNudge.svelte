<script lang="ts">
  export let onClick: () => void = () => {};
</script>

<button
  type="button"
  class="scroll-indicator"
  on:click={onClick}
  aria-label="Scroll ned til innhold"
>
  {#each Array(3) as _}
    <svg class="chevron" viewBox="0 0 100 24">
      <path
        d="M10 6 L50 18 L90 6"
        stroke="currentColor"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  {/each}
</button>

<style>
  .scroll-indicator {
    margin-top: 3.8rem;
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    color: #b3b3b3;
    user-select: none;
  }

  .chevron {
    width: 80px; /* T V I N G bredde */
    height: 24px;
    flex-shrink: 0;
    animation: pulse 2.4s infinite ease-in-out;
  }

  @keyframes pulse {
    0% {
      color: #c0c0c0;
    }
    50% {
      color: #4a4a4a;
    }
    100% {
      color: #c0c0c0;
    }
  }
</style>
