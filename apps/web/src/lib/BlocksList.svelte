<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Block, BlockDef, Field, Layout } from "./blocks/types";
  import BlocksList from "./BlocksList.svelte"; // recursion
  import SimpleWysiwyg from "./SimpleWysiwyg.svelte"; // <- juster path om nødvendig

  export let value: Block[] = [];
  export let defs: BlockDef[] = [];
  export let allowed: string[] | undefined = undefined;

  const dispatch = createEventDispatcher<{ change: { value: Block[] } }>();

  function setValue(next: Block[]) {
    value = next;
    dispatch("change", { value: next });
  }

  const defsByType = new Map(defs.map((d) => [d.type, d]));

  const uid = () =>
    crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const defaultLayout = (): Layout => ({ width: "content", align: "center" });

  let addType = (allowed?.[0] ?? defs[0]?.type ?? "heading") as string;

  $: defsByType.clear(), defs.forEach((d) => defsByType.set(d.type, d));
  $: {
    const opts = allowedTypes(undefined);
    if (!opts.includes(addType)) addType = opts[0] ?? "heading";
  }

  function allowedTypes(localAllowed?: string[]) {
    const all = defs.map((d) => d.type);
    return (localAllowed ?? allowed ?? all).filter((t) => defsByType.has(t));
  }

  function getDef(type: string) {
    return defsByType.get(type);
  }

  function makeBlock(type: string): Block {
    const def = getDef(type);
    return {
      id: uid(),
      type,
      layout: defaultLayout(),
      data: def ? def.defaults() : {},
    };
  }

  function move(i: number, delta: number) {
    const to = i + delta;
    if (to < 0 || to >= value.length) return;
    const copy = [...value];
    const [x] = copy.splice(i, 1);
    copy.splice(to, 0, x);
    setValue(copy);
  }

  function remove(i: number) {
    setValue(value.filter((_, idx) => idx !== i));
  }

  function add(type: string) {
    setValue([...value, makeBlock(type)]);
  }

  function updateField(i: number, field: Field, e: Event) {
    const t = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;

    let v: any;
    if (field.kind === "boolean") v = (t as HTMLInputElement).checked;
    else if (field.kind === "number")
      v = t.value === "" ? null : Number(t.value);
    else v = t.value;

    const copy = structuredClone(value) as Block[];
    copy[i].data = copy[i].data ?? {};
    copy[i].data[field.name] = v;
    setValue(copy);
  }

  function setFieldValue(i: number, fieldName: string, v: any) {
    const copy = structuredClone(value) as Block[];
    copy[i].data = copy[i].data ?? {};
    copy[i].data[fieldName] = v;
    setValue(copy);
  }

  function updateLayout(i: number, key: keyof Layout, e: Event) {
    const t = e.target as HTMLSelectElement;
    const copy = structuredClone(value) as Block[];
    copy[i].layout = copy[i].layout ?? {};
    (copy[i].layout as any)[key] = t.value;
    setValue(copy);
  }

  function addArrayItem(i: number, field: Extract<Field, { kind: "array" }>) {
    const copy = structuredClone(value) as Block[];
    const b = copy[i];
    b.data = b.data ?? {};
    if (!Array.isArray(b.data[field.name])) b.data[field.name] = [];

    const obj: any = {};
    for (const f of field.of) obj[f.name] = f.kind === "boolean" ? false : "";
    b.data[field.name].push(obj);

    setValue(copy);
  }

  function removeArrayItem(i: number, fieldName: string, idx: number) {
    const copy = structuredClone(value) as Block[];
    const b = copy[i];
    b.data = b.data ?? {};
    if (!Array.isArray(b.data[fieldName])) b.data[fieldName] = [];
    b.data[fieldName] = b.data[fieldName].filter(
      (_: any, x: number) => x !== idx,
    );
    setValue(copy);
  }

  function updateArrayField(
    i: number,
    fieldName: string,
    idx: number,
    key: string,
    e: Event,
    kind?: Field["kind"],
  ) {
    const t = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    let v: any = t.value;
    if (kind === "number") v = t.value === "" ? null : Number(t.value);
    if (kind === "boolean") v = (t as HTMLInputElement).checked;

    const copy = structuredClone(value) as Block[];
    const b = copy[i];
    b.data = b.data ?? {};
    if (!Array.isArray(b.data[fieldName])) b.data[fieldName] = [];
    b.data[fieldName][idx] = b.data[fieldName][idx] ?? {};
    b.data[fieldName][idx][key] = v;
    setValue(copy);
  }

  function setArrayFieldValue(
    i: number,
    fieldName: string,
    idx: number,
    key: string,
    v: any,
  ) {
    const copy = structuredClone(value) as Block[];
    const b = copy[i];
    b.data = b.data ?? {};
    if (!Array.isArray(b.data[fieldName])) b.data[fieldName] = [];
    b.data[fieldName][idx] = b.data[fieldName][idx] ?? {};
    b.data[fieldName][idx][key] = v;
    setValue(copy);
  }

  function addChildBlock(parentIndex: number, type: string) {
    const copy = structuredClone(value) as Block[];
    const b = copy[parentIndex];
    b.data = b.data ?? {};
    b.data.children = b.data.children ?? [];
    (b.data.children as Block[]).push(makeBlock(type));
    setValue(copy);
  }

  function ensureChildren(b: Block) {
    b.data = b.data ?? {};
    b.data.children = b.data.children ?? [];
    return b.data.children as Block[];
  }

  // ---- Nested add-type per block
  let nestedAddTypeByBlockId: Record<string, string> = {};

  function getNestedAddType(blockId: string, allowed?: string[]) {
    const opts = allowedTypes(allowed);
    const cur = nestedAddTypeByBlockId[blockId];
    if (cur && opts.includes(cur)) return cur;
    const fallback = opts[0] ?? "heading";
    nestedAddTypeByBlockId[blockId] = fallback;
    return fallback;
  }

  function setNestedAddType(blockId: string, v: string) {
    nestedAddTypeByBlockId[blockId] = v;
  }

  function onNestedTypeChange(blockId: string, e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value;
    setNestedAddType(blockId, v);
  }

  function handleNestedBlocksChange(
    i: number,
    e: CustomEvent<{ value: Block[] }>,
  ) {
    const copy = structuredClone(value) as Block[];
    copy[i].data = copy[i].data ?? {};
    copy[i].data.children = e.detail.value;
    setValue(copy);
  }
</script>

<div class="blocks">
  {#each value as b, i (b.id)}
    <div class="card">
      <div class="top">
        <div class="tag">{b.type}</div>
        <div class="btns">
          <button class="ghost" on:click={() => move(i, -1)}>↑</button>
          <button class="ghost" on:click={() => move(i, 1)}>↓</button>
          <button class="danger" on:click={() => remove(i)}>Slett</button>
        </div>
      </div>

      <div class="layout">
        <label>
          <span>Bredde</span>
          <select
            value={b.layout?.width ?? "content"}
            on:change={(e) => updateLayout(i, "width", e)}
          >
            <option value="narrow">Narrow</option>
            <option value="content">Content</option>
            <option value="full">Full</option>
          </select>
        </label>

        <label>
          <span>Align</span>
          <select
            value={b.layout?.align ?? "center"}
            on:change={(e) => updateLayout(i, "align", e)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </label>
      </div>

      {#if getDef(b.type)}
        {@const def = getDef(b.type)}
        <div class="grid">
          {#each def.fields as f (f.name)}
            {#if f.kind === "string"}
              <label class="full">
                <span>{f.label}</span>
                <input
                  value={b.data?.[f.name] ?? ""}
                  placeholder={f.placeholder}
                  on:input={(e) => updateField(i, f, e)}
                />
              </label>
            {:else if f.kind === "url"}
              <label class="full">
                <span>{f.label}</span>
                <input
                  value={b.data?.[f.name] ?? ""}
                  placeholder={f.placeholder ?? "https://..."}
                  on:input={(e) => updateField(i, f, e)}
                />
              </label>
            {:else if f.kind === "number"}
              <label>
                <span>{f.label}</span>
                <input
                  type="number"
                  value={b.data?.[f.name] ?? ""}
                  on:input={(e) => updateField(i, f, e)}
                />
              </label>
            {:else if f.kind === "boolean"}
              <label class="check full">
                <input
                  type="checkbox"
                  checked={!!b.data?.[f.name]}
                  on:change={(e) => updateField(i, f, e)}
                />
                <span>{f.label}</span>
              </label>
            {:else if f.kind === "text"}
              <div class="full">
                <span class="lbl">{f.label}</span>
                <SimpleWysiwyg
                  value={b.data?.[f.name] ?? ""}
                  placeholder={f.placeholder ?? ""}
                  on:input={(e) => setFieldValue(i, f.name, e.detail.value)}
                />
              </div>
            {:else if f.kind === "select"}
              <label>
                <span>{f.label}</span>
                <select
                  value={b.data?.[f.name] ?? ""}
                  on:change={(e) => updateField(i, f, e)}
                >
                  {#each f.options as opt (opt.value)}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
              </label>
            {:else if f.kind === "array"}
              <div class="full array">
                <div class="array-head">
                  <strong>{f.label}</strong>
                  <button class="ghost" on:click={() => addArrayItem(i, f)}
                    >+ Legg til</button
                  >
                </div>

                {#each b.data?.[f.name] ?? [] as row, idx (idx)}
                  <div class="array-row">
                    <div class="array-fields">
                      {#each f.of as sf (sf.name)}
                        {#if sf.kind === "string"}
                          <label class="full">
                            <span>{sf.label}</span>
                            <input
                              value={row?.[sf.name] ?? ""}
                              on:input={(e) =>
                                updateArrayField(
                                  i,
                                  f.name,
                                  idx,
                                  sf.name,
                                  e,
                                  sf.kind,
                                )}
                            />
                          </label>
                        {:else if sf.kind === "text"}
                          <div class="full">
                            <span class="lbl">{sf.label}</span>
                            <SimpleWysiwyg
                              value={row?.[sf.name] ?? ""}
                              placeholder={sf.placeholder ?? ""}
                              on:input={(e) =>
                                setArrayFieldValue(
                                  i,
                                  f.name,
                                  idx,
                                  sf.name,
                                  e.detail.value,
                                )}
                            />
                          </div>
                        {:else}
                          <label class="full">
                            <span>{sf.label}</span>
                            <input
                              value={row?.[sf.name] ?? ""}
                              on:input={(e) =>
                                updateArrayField(
                                  i,
                                  f.name,
                                  idx,
                                  sf.name,
                                  e,
                                  sf.kind,
                                )}
                            />
                          </label>
                        {/if}
                      {/each}
                    </div>

                    <button
                      class="danger"
                      on:click={() => removeArrayItem(i, f.name, idx)}
                      >Slett</button
                    >
                  </div>
                {/each}
              </div>
            {:else if f.kind === "blocks"}
              <div class="full nested">
                <div class="nested-head">
                  <strong>{f.label}</strong>
                  <div class="nested-add">
                    <select
                      value={getNestedAddType(b.id, f.allowed)}
                      on:change={(e) => onNestedTypeChange(b.id, e)}
                    >
                      {#each allowedTypes(f.allowed) as t (t)}
                        <option value={t}
                          >{defsByType.get(t)?.title ?? t}</option
                        >
                      {/each}
                    </select>

                    <button
                      class="ghost"
                      on:click={() =>
                        addChildBlock(i, getNestedAddType(b.id, f.allowed))}
                      >+ Legg til</button
                    >
                  </div>
                </div>

                <BlocksList
                  value={ensureChildren(b)}
                  {defs}
                  allowed={f.allowed}
                  on:change={(e) => handleNestedBlocksChange(i, e)}
                />
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="muted">Ukjent block-type: {b.type}</div>
      {/if}
    </div>
  {/each}

  <div class="add-root">
    <select bind:value={addType}>
      {#each allowedTypes(undefined) as t (t)}
        <option value={t}>{defsByType.get(t)?.title ?? t}</option>
      {/each}
    </select>
    <button class="ghost" on:click={() => add(addType)}>+ Legg til</button>
  </div>
</div>

<style>
  .blocks {
    display: grid;
    gap: 0.75rem;
  }
  .card {
    border: 1px solid #e8ece8;
    border-radius: 12px;
    padding: 0.8rem;
    background: #fbfdfc;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.6rem;
  }
  .tag {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: #eef4f1;
    color: #2f6f5e;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
  }
  .btns {
    display: flex;
    gap: 0.4rem;
  }
  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  label span,
  .lbl {
    font-size: 0.8rem;
    color: #6e756f;
  }
  input,
  textarea,
  select {
    padding: 0.5rem 0.6rem;
    border: 1px solid #e0e4e0;
    border-radius: 8px;
    width: 100%;
    background: #fff;
  }
  .full {
    grid-column: 1 / -1;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .array {
    border-top: 1px solid #eef2ee;
    padding-top: 0.6rem;
  }
  .array-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .array-row {
    border: 1px solid #e8ece8;
    border-radius: 12px;
    padding: 0.6rem;
    background: #fff;
    display: grid;
    gap: 0.5rem;
  }
  .array-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  .nested {
    border-top: 1px solid #eef2ee;
    padding-top: 0.6rem;
  }
  .nested-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .nested-add {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .add-root {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  button {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 0;
    background: #2f6f5e;
    color: #fff;
    cursor: pointer;
  }
  button.ghost {
    background: #eef4f1;
    color: #2f6f5e;
  }
  button.danger {
    background: #dc4b4b;
  }
  .muted {
    color: #6e756f;
  }
  @media (max-width: 760px) {
    .grid,
    .layout,
    .array-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
