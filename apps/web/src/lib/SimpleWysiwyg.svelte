<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";

  export let value = ""; // HTML
  export let placeholder = "";
  export let maxLength: number | null = null;

  const dispatch = createEventDispatcher<{ input: { value: string } }>();

  let el: HTMLDivElement;

  function normalizeHtml(html: string) {
    return (
      (html ?? "")
        // contenteditable wrappers -> br
        .replace(/<div><br><\/div>/gi, "<br>")
        .replace(/<\/div>\s*<div>/gi, "<br>")
        .replace(/<\/div>/gi, "")
        .replace(/<div>/gi, "")
        .replace(/<p><br><\/p>/gi, "<br>")
        .replace(/<\/p>\s*<p>/gi, "<br><br>")
        .replace(/<\/p>/gi, "")
        .replace(/<p>/gi, "")
        // NBSP -> space
        .replace(/&nbsp;/g, " ")
        // plain newlines inside HTML -> <br>
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>")
    );
  }

  function cleanup(html: string) {
    let out = normalizeHtml(html);

    const plain = out
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!plain) return "";

    // limit absurd br streaks
    out = out.replace(/(?:<br\s*\/?>\s*){6,}/gi, "<br><br><br><br><br>");

    return out.trim();
  }

  function emit() {
    if (!el) return;

    let html = cleanup(el.innerHTML ?? "");

    if (maxLength != null) {
      const txt = el.innerText ?? "";
      if (txt.length > maxLength) {
        el.innerText = txt.slice(0, maxLength);
        html = cleanup(el.innerHTML ?? "");
      }
    }

    value = html;
    dispatch("input", { value: html });
  }

  function cmd(name: string) {
    el?.focus();
    document.execCommand(name);
    emit();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak"); // <br>
      emit();
    }
  }

  function onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text/plain");
    if (text == null) return;

    e.preventDefault();
    el?.focus();

    const html = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(escapeHtml)
      .join("<br>");

    document.execCommand("insertHTML", false, html);
    emit();
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  $: if (el && (value ?? "") !== (el.innerHTML ?? "")) {
    if (document.activeElement !== el) {
      el.innerHTML = (value ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>");
    }
  }

  onMount(() => {
    el.innerHTML = (value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n/g, "<br>");
  });
</script>

<div class="wysiwyg">
  <div class="bar">
    <button
      type="button"
      class="tool"
      on:click={() => cmd("bold")}
      title="Bold"
    >
      <b>B</b>
    </button>
    <button
      type="button"
      class="tool"
      on:click={() => cmd("italic")}
      title="Italic"
    >
      <i>I</i>
    </button>

    {#if maxLength != null}
      <span class="count">{el?.innerText?.length ?? 0}/{maxLength}</span>
    {/if}
  </div>

  <div
    class="editor"
    bind:this={el}
    contenteditable="true"
    spellcheck="true"
    data-placeholder={placeholder}
    on:input={emit}
    on:keydown={onKeyDown}
    on:paste={onPaste}
  ></div>
</div>

<style>
  .wysiwyg {
    border: 1px solid #e0e4e0;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }
  .bar {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    padding: 0.45rem 0.55rem;
    border-bottom: 1px solid #eef2ee;
    background: #fbfdfc;
  }
  .tool {
    border: 1px solid #e6ebe6;
    background: #fff;
    border-radius: 8px;
    padding: 0.35rem 0.55rem;
    cursor: pointer;
    color: #2a2a2a;
  }
  .tool:active {
    transform: translateY(1px);
  }
  .count {
    margin-left: auto;
    color: #6e756f;
    font-size: 0.85rem;
  }
  .editor {
    min-height: 92px;
    padding: 0.65rem 0.75rem;
    outline: none;
    white-space: pre-wrap;
  }
  .editor:empty:before {
    content: attr(data-placeholder);
    color: #9aa19b;
  }
</style>
