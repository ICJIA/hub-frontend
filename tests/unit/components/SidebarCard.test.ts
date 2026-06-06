import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarCard from '../../../app/components/SidebarCard.vue'

const mountCard = (title: string, slotContent = '') =>
  mount(SidebarCard, {
    props: { title },
    slots: slotContent ? { default: slotContent } : {},
  })

describe('SidebarCard – rendering', () => {
  it('renders without errors', () => {
    const wrapper = mountCard('Related Resources')
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the title text', () => {
    const wrapper = mountCard('Related Resources')
    expect(wrapper.text()).toContain('Related Resources')
  })

  it('renders slot content', () => {
    const wrapper = mountCard('Info', '<p id="slot-content">Some info here</p>')
    expect(wrapper.find('#slot-content').exists()).toBe(true)
  })

  it('renders slot text', () => {
    const wrapper = mountCard('Box', '<span>Inner text</span>')
    expect(wrapper.text()).toContain('Inner text')
  })

  it('renders without slot content gracefully', () => {
    const wrapper = mountCard('Empty Card')
    expect(wrapper.text()).toContain('Empty Card')
  })

  it('wraps content in a div with rounded-lg class', () => {
    const wrapper = mountCard('Card')
    expect(wrapper.classes()).toContain('rounded-lg')
  })

  it('title is rendered in an h4 element', () => {
    const wrapper = mountCard('My Title')
    expect(wrapper.find('h4').text()).toBe('My Title')
  })

  it('h4 has font-bold class', () => {
    const wrapper = mountCard('Bold Title')
    expect(wrapper.find('h4').classes()).toContain('font-bold')
  })
})

describe('SidebarCard – props', () => {
  it('accepts title as required string prop', () => {
    const wrapper = mountCard('Test Title')
    expect(wrapper.props('title')).toBe('Test Title')
  })

  it('renders different title values correctly', () => {
    const titles = ['Downloads', 'Related Articles', 'Authors', 'Categories']
    for (const title of titles) {
      const wrapper = mountCard(title)
      expect(wrapper.text()).toContain(title)
    }
  })
})
