<template>
  <div>
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-[1400px] mx-auto px-4 py-2 flex items-center justify-between">
        <nav class="flex gap-1">
          <UButton variant="ghost" to="/" size="sm">Research Hub</UButton>
          <UButton variant="ghost" to="/articles" size="sm">Articles</UButton>
          <UButton variant="ghost" to="/data" size="sm">Data</UButton>
          <UButton variant="ghost" to="/projects" size="sm">Projects</UButton>
        </nav>
        <UColorModeButton />
      </div>
    </header>
    <slot />
  </div>
</template>
