<script lang="ts">
  import BlocksList from "./BlocksList.svelte";
  import type { Block, BlockDef } from "./blocks/types";

  export let value: Block[] = [];
  export let defs: BlockDef[] = [];
  export let allowedAtRoot: string[] | undefined = undefined;
</script>

<BlocksList bind:value {defs} allowed={allowedAtRoot} />
