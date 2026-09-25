<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    X,
    RotateCw,
    File as FileIcon,
    FileText,
    FileCode,
    FileArchive,
    FileImage,
    AlertCircle,
  } from "lucide-svelte";
  import type { UploadedFile } from "../../lib/types/chat";

  let { file, onRemove, onRetry }: {
    file: UploadedFile;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
  } = $props();

  const isImage = $derived(file.mime?.startsWith("image/"));

  const Icon = $derived.by(() => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = file.mime ?? "";
    if (mime.startsWith("image/")) return FileImage;
    if (["ts", "tsx", "js", "jsx", "go", "rs", "py", "rb", "java", "kt",
         "dart", "c", "cpp", "h", "hpp", "cs", "php", "swift", "sh",
         "html", "css", "scss", "sql", "json", "yaml", "yml", "toml"].includes(ext))
      return FileCode;
    if (["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext)) return FileArchive;
    if (["txt", "md", "rst", "log"].includes(ext)) return FileText;
    if (mime === "application/pdf") return FileText;
    if (["doc", "docx", "rtf", "odt"].includes(ext)) return FileText;
    return FileIcon;
  });

  onDestroy(() => {
    if (file._previewUrl) URL.revokeObjectURL(file._previewUrl);
  });
</script>

<div
  class="relative group w-[72px] h-[72px] shrink-0 rounded-lg border bg-zinc-950 overflow-hidden
         {file.status === 'error'
           ? 'border-red-500/60'
           : 'border-zinc-800 hover:border-zinc-700'} transition"
  title={file.name}
>
  {#if isImage && file._previewUrl}
    <img
      src={file._previewUrl}
      alt={file.name}
      class="absolute inset-0 w-full h-full object-cover"
    />
  {:else}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1">
      <svelte:component this={Icon} class="w-5 h-5 text-zinc-400" />
      <span class="text-[9px] leading-tight text-zinc-500 truncate w-full text-center px-1">
        {file.name}
      </span>
    </div>
  {/if}

  {#if isImage}
    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5">
      <span class="text-[9px] text-zinc-200 truncate block">{file.name}</span>
    </div>
  {/if}

  {#if file.status === "uploading"}
    <div class="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] flex items-center justify-center">
      <div class="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></div>
    </div>
  {/if}

  {#if file.status === "error"}
    <button
      type="button"
      onclick={() => onRetry(file.id)}
      class="absolute inset-0 bg-red-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 cursor-pointer"
      aria-label="Retry upload"
    >
      <AlertCircle class="w-4 h-4 text-red-400" />
      <span class="text-[9px] text-red-300 flex items-center gap-0.5">
        <RotateCw class="w-2.5 h-2.5" /> Retry
      </span>
    </button>
  {/if}

  {#if file.status !== "uploading"}
    <button
      type="button"
      onclick={() => onRemove(file.id)}
      class="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700
             text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center justify-center
             opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
      aria-label="Remove file"
    >
      <X class="w-3 h-3" />
    </button>
  {/if}
</div>