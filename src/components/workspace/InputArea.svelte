<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let disabled: boolean = false;
	export let placeholder: string = "Initiate command or query data...";
	export let shiftEnterText: string = "Shift + Enter for new line";
	export let tokenContextText: string = "ZKS Session Active";

	const dispatch = createEventDispatcher();
	let text = "";
	let textareaElement: HTMLTextAreaElement;

	function adjustHeight() {
		if (!textareaElement) return;
		textareaElement.style.height = "auto";
		textareaElement.style.height =
			Math.min(textareaElement.scrollHeight + 2, 120) + "px";
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	function submit() {
		const trimmed = text.trim();
		if (trimmed && !disabled) {
			dispatch("submit", { text: trimmed });
			text = "";
			adjustHeight();
		}
	}
</script>

<footer
	class="border-t border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-4 sm:p-6 flex-none z-10 w-full"
>
	<div class="max-w-3xl mx-auto">
		<div class="relative flex items-center">
			<textarea
				bind:this={textareaElement}
				bind:value={text}
				on:input={adjustHeight}
				on:keydown={handleKeydown}
				{disabled}
				rows="1"
				{placeholder}
				class="w-full bg-zinc-950 border border-zinc-800 rounded-xl ps-4 pe-14 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none shadow-inner transition overflow-y-auto disabled:opacity-50"
			></textarea>

			<button
				on:click={submit}
				disabled={disabled || text.trim() === ""}
				class="absolute right-2.5 h-8 w-8 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-sky-500 cursor-pointer shadow-md shadow-sky-500/10"
			>
				{@html `<i data-lucide="arrow-up" class="w-4 h-4 stroke-[2.5]"></i>`}
			</button>
		</div>

		<div
			class="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-500"
		>
			<span>{shiftEnterText}</span>
			<span id="token-counter">{tokenContextText}</span>
		</div>
	</div>
</footer>
