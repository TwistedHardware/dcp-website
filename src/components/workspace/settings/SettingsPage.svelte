<script lang="ts">
  import ApiKeysSection from "./ApiKeysSection.svelte";
  import SettingsFilterBar from "./account/SettingsFilterBar.svelte";
  import BalanceSection from "./account/BalanceSection.svelte";
  import ApiUsageSection from "./account/ApiUsageSection.svelte";
  import MaasUsageSection from "./account/MaasUsageSection.svelte";
  import CostOverTimeSection from "./account/CostOverTimeSection.svelte";
  // Future imports:
  // import ProfileSection from "./account/ProfileSection.svelte";
  // import BillingSection from "./account/BillingSection.svelte";

  let { lang = "en" }: { lang?: string } = $props();
</script>

<div class="max-w-4xl mx-auto p-6 lg:p-10 space-y-12 pb-24">

  <!-- Header -->
  <div class="space-y-1 border-b border-zinc-800/80 pb-6">
    <h2 class="text-2xl font-bold text-white tracking-tight">Workspace Settings</h2>
    <p class="text-zinc-400 text-sm">Manage your account, API access, and billing preferences.</p>
  </div>

  <!-- Sections Container -->
  <div class="space-y-16">

    <!-- Future Profile Section -->
    <!-- <ProfileSection {lang} /> -->

    <!-- Billing & Usage Section -->
    <section>
      <div class="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 class="text-lg font-medium text-zinc-200">Billing & Usage</h3>
          <p class="text-xs text-zinc-500 mt-1">Manage your balance and view API token consumption.</p>
        </div>
        <!-- Global time filter: applies to API usage, MaaS usage, and cost-over-time. -->
        <SettingsFilterBar {lang} />
      </div>

      <div class="space-y-6">
        <BalanceSection {lang} />
        <ApiUsageSection {lang} />
        <MaasUsageSection {lang} />
        <CostOverTimeSection {lang} />
      </div>
    </section>

    <!-- API Keys Section -->
    <section>
      <div class="mb-4">
        <h3 class="text-lg font-medium text-zinc-200">API Access</h3>
        <p class="text-xs text-zinc-500 mt-1">Generate keys to access DCP Cloud APIs programmatically.</p>
      </div>
      <ApiKeysSection {lang} />
    </section>

    <!-- Future Billing Section -->
    <!-- <section>
      <div class="mb-4">
        <h3 class="text-lg font-medium text-zinc-200">Billing & Usage</h3>
        <p class="text-xs text-zinc-500 mt-1">Manage subscriptions and view usage history.</p>
      </div>
      <BillingSection {lang} />
    </section> -->

  </div>
</div>