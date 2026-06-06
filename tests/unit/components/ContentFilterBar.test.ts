import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentFilterBar from '../../../app/components/ContentFilterBar.vue'

const globalStubs = {
  USelect: {
    props: ['modelValue', 'items', 'placeholder', 'disabled'],
    template: `
      <select
        :value="modelValue"
        :disabled="disabled"
        class="u-select"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    `,
    emits: ['update:modelValue'],
  },
  UInput: {
    props: ['modelValue', 'placeholder', 'icon', 'trailingIcon'],
    template: `<input class="u-input" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', $event.target.value)" @keydown.escape="$emit('keydown:escape')" />`,
    emits: ['update:modelValue', 'click:trailing', 'keydown:escape'],
  },
  UIcon: { template: '<span class="icon" />' },
}

const mountBar = (props = {}) =>
  mount(ContentFilterBar, {
    props: {
      availableTopics: [],
      availableAuthors: [],
      availableYears: [],
      topic: null,
      author: null,
      year: null,
      search: '',
      viewMode: 'grid',
      showAuthorFilter: true,
      ...props,
    },
    global: { stubs: globalStubs },
  })

describe('ContentFilterBar – rendering', () => {
  it('renders without errors', () => {
    const wrapper = mountBar()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the "Filter by:" label', () => {
    const wrapper = mountBar()
    expect(wrapper.text()).toContain('Filter by:')
  })

  it('renders view mode toggle buttons', () => {
    const wrapper = mountBar()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders grid view button', () => {
    const wrapper = mountBar({ viewMode: 'grid' })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders the search input', () => {
    const wrapper = mountBar()
    expect(wrapper.find('.u-input').exists()).toBe(true)
  })

  it('renders topic select dropdown', () => {
    const wrapper = mountBar()
    const selects = wrapper.findAll('.u-select')
    expect(selects.length).toBeGreaterThan(0)
  })

  it('renders author select when showAuthorFilter is true', () => {
    const wrapper = mountBar({ showAuthorFilter: true, availableAuthors: ['Alice', 'Bob'] })
    const selects = wrapper.findAll('.u-select')
    expect(selects.some(s => !s.attributes('disabled'))).toBe(true)
  })

  it('renders disabled author select when showAuthorFilter is false', () => {
    const wrapper = mountBar({ showAuthorFilter: false })
    const disabledSelects = wrapper.findAll('select[disabled]')
    expect(disabledSelects.length).toBeGreaterThan(0)
  })
})

describe('ContentFilterBar – props binding', () => {
  it('binds search prop to local search input value', () => {
    const wrapper = mountBar({ search: 'crime' })
    const input = wrapper.find('.u-input')
    expect(input.element.value).toBe('crime')
  })

  it('renders topic options from availableTopics', () => {
    const wrapper = mountBar({ availableTopics: ['Crime', 'Justice', 'Policy'] })
    expect(wrapper.text()).toContain('Crime')
    expect(wrapper.text()).toContain('Justice')
  })

  it('renders year options from availableYears', () => {
    const wrapper = mountBar({ availableYears: ['2022', '2023', '2024'] })
    expect(wrapper.text()).toContain('2022')
    expect(wrapper.text()).toContain('2023')
  })
})

describe('ContentFilterBar – events', () => {
  it('emits update:viewMode with "list" when list button is clicked', async () => {
    const wrapper = mountBar({ viewMode: 'grid' })
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['list'])
  })

  it('emits update:viewMode with "grid" when grid button is clicked', async () => {
    const wrapper = mountBar({ viewMode: 'list' })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['grid'])
  })

  it('emits update:search after typing in search input (debounced)', async () => {
    vi.useFakeTimers()
    const wrapper = mountBar()
    const input = wrapper.find('.u-input')
    await input.setValue('new search')
    vi.runAllTimers()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:search')).toBeTruthy()
    vi.useRealTimers()
  })

  it('emits update:search with empty string on clear', async () => {
    vi.useFakeTimers()
    const wrapper = mountBar({ search: 'old value' })
    ;(wrapper.vm as unknown as { clearSearch: () => void }).clearSearch()
    vi.runAllTimers()
    await wrapper.vm.$nextTick()
    const events = wrapper.emitted('update:search')
    expect(events).toBeTruthy()
    const lastEmit = events![events!.length - 1]
    expect(lastEmit).toEqual([''])
    vi.useRealTimers()
  })
})

describe('ContentFilterBar – search debounce', () => {
  it('does not emit immediately before debounce delay', async () => {
    vi.useFakeTimers()
    const wrapper = mountBar()
    const input = wrapper.find('.u-input')
    await input.setValue('test query')
    // Before timer fires
    expect(wrapper.emitted('update:search')).toBeFalsy()
    vi.useRealTimers()
  })

  it('emits after debounce timer fires', async () => {
    vi.useFakeTimers()
    const wrapper = mountBar()
    const input = wrapper.find('.u-input')
    await input.setValue('delayed query')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:search')).toBeTruthy()
    vi.useRealTimers()
  })

  it('syncs localSearch when parent resets search prop', async () => {
    const wrapper = mountBar({ search: 'initial' })
    await wrapper.setProps({ search: '' })
    const input = wrapper.find('.u-input')
    expect(input.element.value).toBe('')
  })

  it('clearSearch resets localSearch to empty string', async () => {
    const wrapper = mountBar({ search: 'something' })
    ;(wrapper.vm as unknown as { clearSearch: () => void }).clearSearch()
    await wrapper.vm.$nextTick()
    const input = wrapper.find('.u-input')
    expect(input.element.value).toBe('')
  })
})

describe('ContentFilterBar – view mode active state', () => {
  it('grid button has active class when viewMode is grid', () => {
    const wrapper = mountBar({ viewMode: 'grid' })
    const gridBtn = wrapper.findAll('button')[0]
    expect(gridBtn.classes()).toContain('bg-primary-500')
  })

  it('list button has active class when viewMode is list', () => {
    const wrapper = mountBar({ viewMode: 'list' })
    const listBtn = wrapper.findAll('button')[1]
    expect(listBtn.classes()).toContain('bg-primary-500')
  })
})
