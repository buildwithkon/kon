// @vitest-environment happy-dom
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import type { KonPageV1 } from '@konxyz/runtime-core'
import { TabBar } from './tab-bar'

const pages: KonPageV1[] = [
  { id: 'home', title: 'Home', icon: 'home' },
  { id: 'agenda', title: 'Agenda', icon: 'calendar' }
]

function mount(activeId: string) {
  const host = document.createElement('div')
  const clicks: string[] = []
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- vnode host render
  render(TabBar({ pages, activeId, onSelect: (id) => clicks.push(id) }) as any, host)
  return { host, clicks }
}

describe('TabBar', () => {
  test('renders a button per page with its title', () => {
    const { host } = mount('home')
    const labels = [...host.querySelectorAll('button')].map((b) => b.textContent)
    expect(labels.some((l) => l?.includes('Home'))).toBe(true)
    expect(labels.some((l) => l?.includes('Agenda'))).toBe(true)
  })

  test('marks the active page with aria-current', () => {
    const { host } = mount('agenda')
    const current = host.querySelector('[aria-current="page"]')
    expect(current?.textContent).toContain('Agenda')
  })

  test('calls onSelect with the page id on click', () => {
    const { host, clicks } = mount('home')
    const agenda = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Agenda'))
    agenda?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toEqual(['agenda'])
  })
})
