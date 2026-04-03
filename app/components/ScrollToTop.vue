<template>
  <button
    v-if="show"
    class="fixed bottom-6 right-6 z-10 bg-primary-500 text-white cursor-pointer rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors"
    aria-label="Scroll to top"
    @click="scrollToTop"
  >
    <UIcon name="i-heroicons-chevron-up" class="w-5 h-5" />
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)

const onScroll = () => { show.value = window.scrollY > 300 }
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
