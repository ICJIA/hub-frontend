import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentCard from '../../../app/components/ContentCard.vue'

// Stubs for Nuxt UI components that aren't available in test env
const globalStubs = {
  UBadge: { template: '<span class="badge" data-testid="badge"><slot/></span>' },
  UIcon: { template: '<span class="icon" />' },
}

// Mocks for Nuxt auto-imported template functions
const globalMocks = {
  formatDate: (d: string) => (d ? `Formatted: ${d}` : ''),
  truncate: (t: string, len: number) => (t && t.length > len ? t.substring(0, len) + '...' : t || ''),
}

const mountCard = (props = {}) =>
  mount(ContentCard, {
    props: { title: 'Test Title', ...props },
    global: { stubs: globalStubs, mocks: globalMocks },
  })

describe('ContentCard – rendering', () => {
  it('renders without errors', () => {
    const wrapper = mountCard()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the title', () => {
    const wrapper = mountCard({ title: 'Crime Statistics Report' })
    expect(wrapper.text()).toContain('Crime Statistics Report')
  })

  it('renders description when provided', () => {
    const wrapper = mountCard({ description: 'An overview of crime data.' })
    expect(wrapper.text()).toContain('An overview of crime data.')
  })

  it('does not render description paragraph when description is null', () => {
    const wrapper = mountCard({ description: null })
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('renders formatted date when date prop is provided', () => {
    const wrapper = mountCard({ date: '2024-01-15' })
    expect(wrapper.text()).toContain('Formatted: 2024-01-15')
  })

  it('does not render date when date prop is null', () => {
    const wrapper = mountCard({ date: null })
    expect(wrapper.find('.text-xs').exists()).toBe(false)
  })

  it('renders category badges when categories are provided', () => {
    const wrapper = mountCard({ categories: ['Crime', 'Statistics'] })
    const badges = wrapper.findAll('[data-testid="badge"]')
    expect(badges).toHaveLength(2)
  })

  it('renders the correct category label text', () => {
    const wrapper = mountCard({ categories: ['Justice'] })
    expect(wrapper.text()).toContain('Justice')
  })

  it('does not render badges section when categories array is empty', () => {
    const wrapper = mountCard({ categories: [] })
    const badges = wrapper.findAll('[data-testid="badge"]')
    expect(badges).toHaveLength(0)
  })

  it('renders image when imageUrl is provided', () => {
    const wrapper = mountCard({ imageUrl: 'https://example.com/img.png' })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/img.png')
  })

  it('sets img alt attribute to title', () => {
    const wrapper = mountCard({ title: 'My Article', imageUrl: 'https://example.com/img.png' })
    const img = wrapper.find('img')
    expect(img.attributes('alt')).toBe('My Article')
  })

  it('renders placeholder when no image and showPlaceholder is true', () => {
    const wrapper = mountCard({ imageUrl: null, showPlaceholder: true })
    expect(wrapper.text()).toContain('No Image')
  })

  it('does not render placeholder when showPlaceholder is false', () => {
    const wrapper = mountCard({ imageUrl: null, showPlaceholder: false })
    expect(wrapper.text()).not.toContain('No Image')
  })

  it('does not render placeholder when imageUrl is provided', () => {
    const wrapper = mountCard({ imageUrl: 'https://example.com/img.png', showPlaceholder: true })
    expect(wrapper.text()).not.toContain('No Image')
  })
})

describe('ContentCard – props', () => {
  it('accepts title as required string prop', () => {
    const wrapper = mountCard({ title: 'Hello World' })
    expect(wrapper.props('title')).toBe('Hello World')
  })

  it('accepts date as optional string prop', () => {
    const wrapper = mountCard({ date: '2024-06-01' })
    expect(wrapper.props('date')).toBe('2024-06-01')
  })

  it('accepts description as optional string prop', () => {
    const wrapper = mountCard({ description: 'Some description' })
    expect(wrapper.props('description')).toBe('Some description')
  })

  it('accepts categories as optional array prop', () => {
    const wrapper = mountCard({ categories: ['A', 'B'] })
    expect(wrapper.props('categories')).toEqual(['A', 'B'])
  })

  it('defaults viewMode to grid', () => {
    const wrapper = mountCard()
    expect(wrapper.props('viewMode')).toBe('grid')
  })

  it('accepts list viewMode', () => {
    const wrapper = mountCard({ viewMode: 'list' })
    expect(wrapper.props('viewMode')).toBe('list')
  })

  it('applies flex class in list view mode with an image', () => {
    const wrapper = mountCard({ viewMode: 'list', imageUrl: 'https://example.com/img.png' })
    expect(wrapper.classes()).toContain('flex')
  })
})

describe('ContentCard – events', () => {
  it('emits click event when card is clicked', async () => {
    const wrapper = mountCard()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('emits click event only once per click', async () => {
    const wrapper = mountCard()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('emits click on multiple clicks', async () => {
    const wrapper = mountCard()
    await wrapper.trigger('click')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(2)
  })
})

describe('ContentCard – image loading', () => {
  it('img has loading="lazy" attribute', () => {
    const wrapper = mountCard({ imageUrl: 'https://example.com/img.png' })
    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('shimmer placeholder is visible initially (before image loads)', () => {
    const wrapper = mountCard({ imageUrl: 'https://example.com/img.png' })
    const shimmer = wrapper.find('.animate-pulse')
    expect(shimmer.exists()).toBe(true)
  })
})
