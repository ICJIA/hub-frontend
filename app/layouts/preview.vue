<template>
  <div class="light">
    <slot />
  </div>
</template>

<script setup>
const colorMode = useColorMode()
colorMode.preference = 'light'
colorMode.value = 'light'
</script>
