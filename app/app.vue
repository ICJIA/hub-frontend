<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup>
const colorMode = useColorMode()
colorMode.preference = 'light'
</script>
