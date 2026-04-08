<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-3">{{ title }}</h4>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>
