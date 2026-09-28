// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, getAgentTextApiProfile, getEffectiveAgentTextProfile, normalizeSettings } from '../lib/apiProfiles'
import * as presetConfig from '../lib/presetConfig'
import { buildSettingsFromUrlParams } from '../lib/urlSettings'
import { useStore } from '../store'
import ModelSelectorPanel from './ModelSelectorPanel'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

describe('ModelSelectorPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    useStore.setState({ settings: normalizeSettings({ ...DEFAULT_SETTINGS }) })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('图像和文本模型悬浮提示同时显示模型名称与介绍', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<ModelSelectorPanel />))

    const triggers = container.querySelectorAll('.cursor-pointer')
    act(() => triggers[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
    expect(document.body.textContent).toContain('gpt-image-2\n旗舰级图像模型')

    act(() => triggers[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true })))
    act(() => triggers[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
    expect(document.body.textContent).toContain('gpt-5.6-sol\n上一代高性能文本模型')

    act(() => root.unmount())
  })

  it('在文本模型下方选择四档思考程度并在恢复设置后用于请求', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<ModelSelectorPanel />))

    const labels = container.querySelectorAll('label')
    expect(labels[1].textContent).toContain('文本模型')
    expect(labels[2].textContent).toBe('思考程度中')
    const trigger = labels[2].querySelector('.cursor-pointer')!

    for (const [value, label] of [['low', '轻度'], ['medium', '中'], ['high', '高'], ['xhigh', '极高']]) {
      act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      expect(Array.from(labels[2].querySelectorAll('[data-option-value]'), (el) => el.textContent)).toEqual(['轻度', '中', '高', '极高'])
      act(() => labels[2].querySelector(`[data-option-value="${value}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true })))

      const restored = normalizeSettings(JSON.parse(JSON.stringify(useStore.getState().settings)))
      expect(getAgentTextApiProfile(restored)?.reasoningEffort).toBe(value)
      expect(getEffectiveAgentTextProfile(restored)?.reasoningEffort).toBe(value)
      expect(restored.profiles.find((profile) => profile.id === restored.agentImageProfileId)).toEqual(DEFAULT_SETTINGS.profiles.find((profile) => profile.id === DEFAULT_SETTINGS.agentImageProfileId))
      expect(trigger.textContent).toBe(label)
    }

    act(() => root.unmount())
  })

  it.each(['设置页', 'URL'])('选择轻度后通过%s改为高会同步显示和实际请求', (source) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<ModelSelectorPanel />))

    const trigger = container.querySelectorAll('label')[2].querySelector('.cursor-pointer')!
    act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    act(() => container.querySelector('[data-option-value="low"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(getAgentTextApiProfile(useStore.getState().settings)?.reasoningEffort).toBe('low')

    const settings = useStore.getState().settings
    act(() => useStore.getState().setSettings(source === 'URL'
      ? buildSettingsFromUrlParams(settings, new URLSearchParams(`profileId=${settings.agentTextProfileId}&reasoningEffort=high`))
      : { profiles: settings.profiles.map((profile) => profile.id === settings.agentTextProfileId ? { ...profile, reasoningEffort: 'high' } : profile) }))

    expect(trigger.textContent).toBe('高')
    expect(getEffectiveAgentTextProfile(useStore.getState().settings)?.reasoningEffort).toBe('high')
    act(() => root.unmount())
  })

  it.each([
    ['none', '不思考（沿用配置）'],
    ['minimal', '最低（沿用配置）'],
    ['max', '最高（沿用配置）'],
  ] as const)('旧档位 %s 显示中文，且仍可切换到四档选项', (reasoningEffort, label) => {
    useStore.setState({ settings: normalizeSettings({
      ...DEFAULT_SETTINGS,
      profiles: DEFAULT_SETTINGS.profiles.map((profile) => profile.id === DEFAULT_SETTINGS.agentTextProfileId ? { ...profile, reasoningEffort } : profile),
    }) })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<ModelSelectorPanel />))

    const trigger = container.querySelectorAll('label')[2].querySelector('.cursor-pointer')!
    expect(trigger.textContent).toBe(label)
    expect(getEffectiveAgentTextProfile(useStore.getState().settings)?.reasoningEffort).toBe(reasoningEffort)
    act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(Array.from(container.querySelectorAll('[data-option-value]'), (el) => el.textContent)).toEqual(['轻度', '中', '高', '极高'])
    act(() => container.querySelector('[data-option-value="xhigh"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(trigger.textContent).toBe('极高')
    expect(getEffectiveAgentTextProfile(useStore.getState().settings)?.reasoningEffort).toBe('xhigh')
    act(() => root.unmount())
  })

  it('文本配置锁定时禁用思考程度选择', () => {
    vi.spyOn(presetConfig, 'isPresetProfileLocked').mockReturnValue(true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<ModelSelectorPanel />))

    const trigger = container.querySelectorAll('label')[2].querySelector('.cursor-pointer')!
    act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(trigger.className).toContain('!cursor-not-allowed')
    expect(container.querySelector('[data-option-value]')).toBeNull()
    act(() => root.unmount())
  })
})
