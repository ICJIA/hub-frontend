<template>
  <span>
    <template v-for="(seg, i) in segments" :key="i">
      <mark v-if="seg.highlight" class="bg-yellow-200 dark:bg-yellow-700 text-inherit not-italic rounded-sm">{{ seg.text }}</mark>
      <template v-else>{{ seg.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  query?: string
}>()

function buildRanges(text: string, query: string): [number, number][] {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const lower = text.toLowerCase()
  const ranges: [number, number][] = []

  for (const word of words) {
    const lw = word.toLowerCase()
    let i = 0
    while ((i = lower.indexOf(lw, i)) !== -1) {
      ranges.push([i, i + lw.length - 1])
      i++
    }
  }

  if (!ranges.length) return []

  // Merge overlapping / adjacent ranges
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [ranges[0]]
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1]
    if (s <= last[1] + 1) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
}

const segments = computed(() => {
  const ranges = props.query ? buildRanges(props.text, props.query) : []
  if (!ranges.length) return [{ text: props.text, highlight: false }]

  const segs: { text: string; highlight: boolean }[] = []
  let cursor = 0

  for (const [start, end] of ranges) {
    if (start > cursor) segs.push({ text: props.text.slice(cursor, start), highlight: false })
    segs.push({ text: props.text.slice(start, end + 1), highlight: true })
    cursor = end + 1
  }

  if (cursor < props.text.length) segs.push({ text: props.text.slice(cursor), highlight: false })

  return segs
})
</script>
