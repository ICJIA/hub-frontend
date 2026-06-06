import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollToTop from '../../../app/components/ScrollToTop.vue'

const globalStubs = {
  UIcon: { template: '<span class="icon" />' },
}

describe('ScrollToTop – rendering', () => {
  it('renders without errors', () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('button is hidden by default (show is false)', () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('button is visible after scrolling past 300px threshold', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('button is hidden when scrollY is exactly 300', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('button re-hides when scrolling back to top', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(true)

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

describe('ScrollToTop – accessibility', () => {
  it('button has aria-label attribute', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').attributes('aria-label')).toBe('Scroll to top')
  })

  it('button aria-label is descriptive and non-empty', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    const label = wrapper.find('button').attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
  })

  it('button is a native button element (keyboard accessible)', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').element.tagName).toBe('BUTTON')
  })
})

describe('ScrollToTop – interaction', () => {
  it('calls window.scrollTo when button is clicked', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    scrollToSpy.mockRestore()
  })

  it('adds scroll event listener on mount', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener')
    mount(ScrollToTop, { global: { stubs: globalStubs } })
    expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    addEventSpy.mockRestore()
  })

  it('removes scroll event listener on unmount', () => {
    const removeEventSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    wrapper.unmount()
    expect(removeEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    removeEventSpy.mockRestore()
  })
})

describe('ScrollToTop – styles', () => {
  it('button has fixed positioning classes', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').classes()).toContain('fixed')
  })

  it('button has z-index class for overlay', async () => {
    const wrapper = mount(ScrollToTop, { global: { stubs: globalStubs } })
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').classes()).toContain('z-10')
  })
})
