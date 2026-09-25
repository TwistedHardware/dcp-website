<script lang="ts">
  import { tick } from "svelte";
  import { ArrowUp, Paperclip, UploadCloud } from "lucide-svelte";
  import FileChip from "./FileChip.svelte";
  import ModelSelect from "./ModelSelect.svelte";
  import type { ModelId, UploadedFile } from "../../lib/types/chat";;

  let {
    disabled = false,
    placeholder = "Initiate command or query data...",
    shiftEnterText = "Shift + Enter for new line",
    tokenContextText = "ZKS Session Active",
    sessionId,
    model = "fast",
    uploadedFiles = [],
    maxFiles = 10,
    maxTextareaHeight = 160,
    onsubmit,
    onmodelchange,
    onfileadded,
    onfileremoved,
    onfileretry,
		onUpload,
  }: {
    disabled?: boolean;
    placeholder?: string;
    shiftEnterText?: string;
    tokenContextText?: string;
    sessionId: string;
    model?: ModelId;
    uploadedFiles?: UploadedFile[];
    maxFiles?: number;
    maxTextareaHeight?: number;
    onsubmit: (payload: {
      text: string;
      model: ModelId;
      sessionId: string;
      files: UploadedFile[];
    }) => void;
    onmodelchange: (m: ModelId) => void;
    onfileadded: (f: UploadedFile) => void;
    onfileremoved: (id: string) => void;
    onfileretry: (id: string) => void;
		onUpload: (file: File, id: string) => void | Promise<void>;
  } = $props();

  let text = $state("");
  let textareaElement: HTMLTextAreaElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let isDragOver = $state(false);

  const isUploading = $derived(uploadedFiles.some((f) => f.status === "uploading"));
  const sendDisabled = $derived(
    disabled || isUploading || text.trim() === ""
  );
  const attachDisabled = $derived(
    disabled || uploadedFiles.length >= maxFiles
  );

  function adjustHeight() {
    if (!textareaElement) return;
    textareaElement.style.height = "auto";
    textareaElement.style.height =
      Math.min(textareaElement.scrollHeight + 2, maxTextareaHeight) + "px";
  }

  async function resetHeight() {
    if (!textareaElement) return;
    textareaElement.style.height = "auto";
    await tick();
    adjustHeight();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || sendDisabled) return;

    onsubmit({
      text: trimmed,
      model,
      sessionId,
      files: uploadedFiles,
    });

    text = "";
    resetHeight();
  }

  // ---- File ingestion (upload / drag-drop / paste all funnel here) ----

  function addFiles(files: FileList | File[]) {
		const arr = Array.from(files);
		if (!arr.length) return;

		const room = maxFiles - uploadedFiles.length;
		const accepted = arr.slice(0, Math.max(0, room));

		for (const file of accepted) {
			const previewUrl = file.type.startsWith("image/")
				? URL.createObjectURL(file)
				: undefined;

			const id = crypto.randomUUID();

			// 1. Announce the chip immediately (parent stores it as "uploading")
			onfileadded({
				id,
				name: file.name,
				mime: file.type,
				size: file.size,
				status: "uploading",
				_file: file,
				_previewUrl: previewUrl,
			});

			// 2. Delegate the actual network call to the parent
			void onUpload(file, id);
		}
	}

  function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) addFiles(input.files);
    input.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    if (disabled) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (disabled) return;
    isDragOver = true;
  }

  function onDragLeave(e: DragEvent) {
    // Only clear when leaving the wrapper (not child elements)
    const related = e.relatedTarget as Node | null;
    const current = e.currentTarget as Node;
    if (related && current.contains(related)) return;
    isDragOver = false;
  }

  function onPaste(e: ClipboardEvent) {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }
</script>

<div
  class="relative border-t border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-4 sm:p-6 z-10 w-full"
  ondrop={onDrop}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  role="region"
  aria-label="Message composer"
>
  <div class="max-w-3xl mx-auto">
    {#if uploadedFiles.length > 0}
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {#each uploadedFiles as file (file.id)}
          <FileChip {file} onRemove={onfileremoved} onRetry={onfileretry} />
        {/each}
      </div>
    {/if}

    <div class="relative flex items-end gap-2">
      <!-- Attach button -->
      <button
        type="button"
        disabled={attachDisabled}
        onclick={() => fileInput?.click()}
        class="shrink-0 h-9 w-9 rounded-lg border border-zinc-800 hover:border-zinc-700
               text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60
               flex items-center justify-center transition
               disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Attach files"
        title={uploadedFiles.length >= maxFiles ? `Max ${maxFiles} files` : "Attach files"}
      >
        <Paperclip class="w-4 h-4" />
      </button>

      <input
        bind:this={fileInput}
        type="file"
        multiple
        class="hidden"
        onchange={onFileInputChange}
      />

      <!-- Textarea wrapper -->
      <div class="relative flex-1 flex items-cente">
        <textarea
          bind:this={textareaElement}
          bind:value={text}
          oninput={adjustHeight}
          onkeydown={handleKeydown}
          onpaste={onPaste}
          {disabled}
          rows="1"
          {placeholder}
          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl
                 ps-4 pe-14 py-3 text-sm text-zinc-100 placeholder-zinc-500
                 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                 resize-none shadow-inner transition overflow-y-auto
                 disabled:opacity-50"
        ></textarea>

        <button
          type="button"
          onclick={submit}
          disabled={sendDisabled}
          class="absolute top-1/2 -translate-y-1/2 end-2.5 h-8 w-8
                 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg
                 flex items-center justify-center transition
                 disabled:opacity-40 disabled:hover:bg-sky-500
                 cursor-pointer shadow-md shadow-sky-500/10"
          aria-label="Send message"
        >
          <ArrowUp class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between mt-2 px-1 gap-2">
      <ModelSelect value={model} onchange={onmodelchange} disabled={disabled} />
      <div class="flex items-center gap-3 text-[11px] text-zinc-500">
        <span class="hidden sm:inline">{shiftEnterText}</span>
        <span id="token-counter">{tokenContextText}</span>
      </div>
    </div>
  </div>

  <!-- Drag overlay -->
  {#if isDragOver}
    <div
      class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center
             border-2 border-dashed border-sky-500/60 bg-zinc-950/80 backdrop-blur-sm
             rounded-none"
    >
      <UploadCloud class="w-8 h-8 text-sky-400 mb-2" />
      <span class="text-sm text-sky-300 font-medium">Drop files to attach</span>
      <span class="text-[11px] text-zinc-500 mt-1">
        {maxFiles - uploadedFiles.length} slot{maxFiles - uploadedFiles.length === 1 ? "" : "s"} remaining
      </span>
    </div>
  {/if}
</div>