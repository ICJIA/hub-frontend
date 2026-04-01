<template>
  <div>
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-[1400px] mx-auto px-4 py-2 flex items-center justify-between">
        <nav class="flex gap-1">
          <UButton variant="ghost" to="/" size="sm">Articles</UButton>
          <UButton variant="ghost" to="/apps" size="sm">Apps</UButton>
          <UButton variant="ghost" to="/datasets" size="sm">Datasets</UButton>
        </nav>
        <UColorModeButton />
      </div>
    </header>
    <slot />
  </div>
</template>
