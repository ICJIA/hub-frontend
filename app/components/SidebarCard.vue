<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <h4 class="font-bold text-gray-800 mb-3">{{ title }}</h4>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>
