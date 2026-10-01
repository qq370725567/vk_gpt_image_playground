import { TEXT_REASONING_EFFORT_VALUES, type ReasoningEffort } from '../types'
import { getAgentTextApiProfile, TEXT_MODEL_VALUES } from '../lib/apiProfiles'
import { isPresetProfileLocked } from '../lib/presetConfig'
import { useStore } from '../store'
import Select from './Select'

const TEXT_MODEL_DESCRIPTIONS: Record<string, string> = {
  'gpt-6-astra': '顶级旗舰文本模型。相比 gpt-5.6-sol，拥有更强的推理、理解与复杂任务处理能力，擅长高难度指令、多步骤规划与精细图像创作指导，适合追求最高质量、处理复杂创作需求的场景。',
  'gpt-6.1-sol': '进阶主力文本模型。在复杂任务中提供接近 gpt-6-astra 的表现，同时兼顾使用成本，适合多步骤创作规划、精细提示词优化与图像创作指导。',
  'gpt-6-sol': '新一代主力文本模型。兼顾推理能力与使用成本，适合复杂指令、多轮沟通与多步骤创作规划，可用于提示词优化和图像创作指导。',
  'gpt-6-luna': '新一代高效文本模型。侧重低成本与高频任务处理，适合需求明确的对话、提示词改写和创意草稿，便于快速尝试不同表达与创作方向。',
  'gpt-5.6-sol': '上一代高性能文本模型。具备较强的推理与理解能力，适合复杂指令、多轮对话与图像创作指导，也可用于延续既有创作流程。',
  'gpt-5.6-terra': '均衡型文本模型。在能力、速度与成本之间取得良好平衡，日常对话与图像生成任务的主力选择，适合大多数场景。',
  'gpt-5.6-luna': '轻量快速型文本模型。响应速度最快、成本最低，适合简单对话与快速生成任务，复杂需求可切换到更高阶模型。',
}

const IMAGE_MODEL_DESCRIPTION =
  '旗舰级图像模型。原生多模态理解，忠实还原复杂画面指令，细节、光影与画面内文字渲染出色，支持文生图、图生图与局部重绘，适合追求最佳出图效果的场景。'

const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string> = {
  none: '不思考（沿用配置）',
  minimal: '最低（沿用配置）',
  low: '轻度',
  medium: '中',
  high: '高',
  xhigh: '极高',
  max: '最高（沿用配置）',
}

export default function ModelSelectorPanel() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const textProfile = getAgentTextApiProfile(settings)
  const effort = textProfile?.reasoningEffort ?? 'medium'

  const selectClass = 'px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] text-xs transition-all duration-200 shadow-sm'

  return (
    <div className="fixed right-3 sm:right-6 z-40 bottom-[calc(var(--input-bar-clearance,12rem)+1rem)] w-44 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10 p-3 flex flex-col gap-2.5">
      <label className="flex flex-col gap-0.5">
        <span className="text-gray-400 dark:text-gray-500 ml-1 text-[11px]">图像模型</span>
        <Select
          value="gpt-image-2"
          onChange={() => {}}
          options={[{ label: 'gpt-image-2', value: 'gpt-image-2', tooltip: `gpt-image-2\n${IMAGE_MODEL_DESCRIPTION}` }]}
          showValueTooltips
          className={selectClass}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-gray-400 dark:text-gray-500 ml-1 text-[11px]">文本模型</span>
        <Select
          value={settings.textModel}
          onChange={(model) => setSettings({ textModel: model })}
          options={TEXT_MODEL_VALUES.map((value) => ({ label: value, value, tooltip: `${value}\n${TEXT_MODEL_DESCRIPTIONS[value]}` }))}
          showValueTooltips
          className={selectClass}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-gray-400 dark:text-gray-500 ml-1 text-[11px]">思考程度</span>
        <Select
          value={effort}
          valueLabel={REASONING_EFFORT_LABELS[effort]}
          onChange={(value) => {
            if (!textProfile) return
            setSettings({ profiles: settings.profiles.map((profile) => profile.id === textProfile.id ? { ...profile, reasoningEffort: value } : profile) })
          }}
          options={TEXT_REASONING_EFFORT_VALUES.map((value) => ({ label: REASONING_EFFORT_LABELS[value], value }))}
          disabled={!textProfile || isPresetProfileLocked(textProfile.id)}
          className={selectClass}
        />
      </label>
    </div>
  )
}
