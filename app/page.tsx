'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Clock3, Database, Download, FileText, Lightbulb, LoaderCircle, Pencil, RotateCcw, Save, Search, Sparkles, Upload, WandSparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type Phase = 'ready' | 'analyzing' | 'results' | 'refine' | 'final';
type WebModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };

const WORKFLOW_STEPS = [
  { workflow: '准备', label: '填写任务' },
  { workflow: 'Workflow 1', label: '检索分析' },
  { workflow: 'Workflow 1', label: '生成 Top 3' },
  { workflow: 'Workflow 1', label: '选择与优化' },
  { workflow: 'Workflow 2', label: '生成三套方案' },
  { workflow: 'Workflow 2', label: '选择方案' },
  { workflow: 'Workflow 2', label: '修改定稿' },
  { workflow: '完成', label: '编辑与下载' },
] as const;

const BASE_OPPORTUNITIES = [
  {
    rank: '01', score: 86, title: '城市夜游的“冰爽补给站”',
    meta: ['杭州', '七夕', '18–30 岁情侣', '无糖可乐'], tone: 'coral',
    signal: '夜游人群、节日即时需求与产品卖点高度重叠。',
    reason: '七夕夜游存在强社交属性，无糖产品可以用“无负担分享”完成场景化表达。',
    evidence: ['2025 夏季夜间即饮活动：目标人群与夜游场景均高度一致', '用户研究：18–30 岁人群对低糖与新鲜互动更敏感', '竞品检索：当前召回结果中暂未发现同类夜游补给机制'],
    scores: [['节点与时间', 94], ['用户与场景', 88], ['历史 Campaign', 82], ['品牌与产品', 90], ['竞品差异', 76], ['执行可行性', 78]],
    combination: [['区域', '杭州湖滨与运河夜游动线'], ['时间 / 节点', '七夕当周，18:00–22:30'], ['目标人群', '18–30 岁情侣与约会人群'], ['主推产品', '无糖可乐即饮装'], ['消费场景', '夜游途中的解渴、休息与分享'], ['核心渠道', '夜游点位 + 便利店 + 小红书']],
    risk: '节日现场客流高度集中，点位授权、冷链补货和排队体验会直接影响执行。竞品未被召回不等于市场上不存在类似活动。',
    nextSteps: ['核验 2 个夜游点位的通行人群与停留时长', '小样本测试“无负担分享”表达是否能驱动参与', '先做 7 天小规模试点，跟踪参与率、分享率与终端动销'],
  },
  {
    rank: '02', score: 79, title: '高校商圈“开学第一口”',
    meta: ['华东校园', '9 月', '新生社交', '迷你罐'], tone: 'blue',
    signal: '新场景更利于拉新，但历史验证强度偏弱。',
    reason: '开学初期的社交关系正在建立，迷你罐适合设计轻量交换与破冰任务。',
    evidence: ['校园样本：小包装在轻社交场景更容易被分享', '推断：新生入学节点对品牌记忆建立有利', '风险：与用户指定的七夕时间窗口不完全一致'],
    scores: [['节点与时间', 70], ['用户与场景', 84], ['历史 Campaign', 66], ['品牌与产品', 85], ['竞品差异', 88], ['执行可行性', 82]],
    combination: [['区域', '杭州高教园区周边商圈'], ['时间 / 节点', '9 月开学首周'], ['目标人群', '大一新生与社团新成员'], ['主推产品', '无糖可乐迷你罐'], ['消费场景', '宿舍分享、社团招新与破冰'], ['核心渠道', '校园便利店 + 社团 + 校园社媒']],
    risk: '与用户指定的七夕时间窗口不一致，历史案例也只能作为弱参考，不应表述为已验证。',
    nextSteps: ['与七夕方向做一次时间优先级确认', '访谈 8–12 名新生，验证破冰任务意愿', '仅在 1 个校区试点后再评估扩大'],
  },
  {
    rank: '03', score: 72, title: '便利店晚高峰的“搭餐时刻”',
    meta: ['一线城市', '工作日', '加班人群', '经典可乐'], tone: 'amber',
    signal: '执行门槛低，竞品差异化空间有限。',
    reason: '通过便利店即时搭餐组合提高渗透，适合快速试点，但与情侣人群的关联偏弱。',
    evidence: ['历史案例：晚高峰搭餐促销具备稳定触达', '品牌资料：经典可乐与餐饮场景有强绑定', '冲突：七夕、情侣、无糖产品三个原始条件支持不足'],
    scores: [['节点与时间', 54], ['用户与场景', 68], ['历史 Campaign', 86], ['品牌与产品', 76], ['竞品差异', 62], ['执行可行性', 91]],
    combination: [['区域', '杭州核心写字楼周边'], ['时间 / 节点', '工作日 18:00–20:00'], ['目标人群', '晚归与加班白领'], ['主推产品', '经典可乐即饮装'], ['消费场景', '便利店搭餐与晚餐补给'], ['核心渠道', '连锁便利店 + 外卖平台']],
    risk: '方案与七夕、情侣人群和无糖产品均存在核心冲突，且搭餐机制的竞品差异化空间有限。',
    nextSteps: ['确认是否允许放宽用户原始任务条件', '对比经典与无糖产品的搭餐选择', '使用 3 家门店做对照测试后再决定去留'],
  },
];

type Opportunity = (typeof BASE_OPPORTUNITIES)[number] & { raw?: string };

type HistoryEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  brief: string;
  opportunities: Opportunity[];
  phase: Phase;
  activeStep: number;
  selected: number;
  feedback: string;
  files: string[];
  runMode: 'preview' | 'coze';
  campaignPlans: string[];
  campaignSelected: number | null;
  campaignOpinion: string;
  campaignResult: string;
  campaignDraft: string;
  campaignMode: 'preview' | 'coze';
  campaignNotice: string;
};

const HISTORY_STORAGE_KEY = 'marketing-workflow-history-v1';
const HISTORY_LIMIT = 20;

function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

type CampaignPlan = {
  title: string;
  type: string;
  target_user: string;
  strategy: string;
  execution: string;
  channel: string;
  budget: string;
  metrics: string;
  risk: string;
};

function firstMatch(input: string, values: string[], fallback: string) {
  return values.find((value) => input.includes(value)) ?? fallback;
}

function contextualOpportunities(input: string): Opportunity[] {
  const region = firstMatch(input, ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '南京', '武汉', '西安', '苏州', '长沙', '青岛', '全国'], '目标城市');
  const timing = firstMatch(input, ['春节', '元旦', '情人节', '七夕', '五一', '国庆', '中秋', '暑期', '寒假', '开学', '夏季', '冬季', '早高峰', '晚高峰'], '待明确节点');
  const audience = firstMatch(input, ['年轻白领', '白领', '情侣', '大学生', '学生', '宝妈', '亲子家庭', '新手妈妈', '银发人群', '运动人群', '宠物主', 'Z世代', '年轻人'], '核心目标人群');
  const product = firstMatch(input, ['低糖咖啡', '咖啡', '无糖可乐', '可乐', '护肤品', '防晒', '洗发水', '奶茶', '酸奶', '零食', '宠物食品', '运动鞋', '手机', '旅游产品'], '目标产品');
  const scene = firstMatch(input, ['早高峰办公', '办公', '夜游', '校园', '商场', '社区', '运动', '户外', '通勤', '餐饮', '便利店', '线上', '直播'], '高频消费');
  const objective = firstMatch(input, ['拉新', '复购', '转化', '销量', '品牌认知', '声量', '种草'], '机会验证');
  const seed = [...input].reduce((total, char) => total + char.charCodeAt(0), 0);
  const angles = [
    { title: `${region}${scene}的“${product}关键时刻”`, channel: `${scene}核心点位 + 内容种草`, signal: `将${product}放入${audience}的${scene}需求，优先验证${objective}。` },
    { title: `${audience}的“${product}共创计划”`, channel: '社群 + 用户共创 + 社交内容', signal: `从${audience}的参与与分享动机切入，形成可扩散内容。` },
    { title: `${region}渠道的“${product}小规模增长试验”`, channel: '零售终端 + 定向触达 + 对照测试', signal: `用最小试点验证${region}的${objective}假设，降低盲目扩大风险。` },
  ];

  return BASE_OPPORTUNITIES.map((base, index) => {
    const score = Math.max(58, Math.min(90, 84 - index * 7 + ((seed + index * 13) % 7) - 3));
    return {
      ...base,
      score,
      title: angles[index].title,
      meta: [region, timing, audience, product],
      signal: angles[index].signal,
      reason: `该方向直接来自本次输入中的“${region}、${timing}、${audience}、${product}、${scene}”条件组合。当前为本地预览推断，需要 Coze 知识库召回后才能升级为事实结论。`,
      evidence: [`用户明确输入：${input.slice(0, 90)}${input.length > 90 ? '…' : ''}`, `本地推断：${scene}与${audience}可形成可测试的${objective}假设`, 'Coze 知识库、历史 Campaign 与竞品证据：待真实 Workflow 连接成功后填充'],
      scores: [['节点与时间', timing === '待明确节点' ? 55 : score + 3], ['用户与场景', audience === '核心目标人群' ? 58 : score], ['历史 Campaign', 50], ['品牌与产品', product === '目标产品' ? 55 : score - 2], ['竞品差异', 60 + ((seed + index) % 12)], ['执行可行性', 72 + ((seed + index * 3) % 14)]],
      combination: [['区域', region], ['时间 / 节点', timing], ['目标人群', audience], ['主推产品', product], ['消费场景', scene], ['核心渠道', angles[index].channel]],
      risk: `当前未获得 Coze 知识库和竞品检索的真实证据，所以不能将该方向表述为“已验证”；其中${timing === '待明确节点' ? '时间节点、' : ''}${product === '目标产品' ? '产品、' : ''}执行资源仍需确认。`,
      nextSteps: [`先确认${region}、${timing}与${audience}是否为硬性条件`, `用 8–12 名${audience}做小样本访谈`, `在 1 个${scene}点位试运行并跟踪${objective}指标`],
    } as Opportunity;
  });
}

function markdownSection(markdown: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return markdown.match(new RegExp(`###\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|$)`))?.[1]?.trim() ?? '';
}

function listValues(section: string) {
  return section.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*]|\d+[.、])\s*/, '').trim()).filter(Boolean);
}

function labeledValue(section: string, labels: string[], fallback: string) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const value = section.match(new RegExp(`(?:^|\\n)\\s*[-*]?\\s*${escaped}\\s*[：:]\\s*([^\\n]+)`))?.[1]?.trim();
    if (value) return value.replace(/\*\*/g, '');
  }
  return fallback;
}

function parseMarkdownOpportunity(markdown: string, index: number, sourceInput: string): Opportunity {
  const base = BASE_OPPORTUNITIES[index] ?? BASE_OPPORTUNITIES[0];
  const combinationSection = markdownSection(markdown, '机会组合');
  const scoreSection = markdownSection(markdown, '评分拆解');
  const reason = markdownSection(markdown, '为什么值得做');
  const evidence = listValues(markdownSection(markdown, '证据与依据'));
  const risk = markdownSection(markdown, '主要风险');
  const nextSteps = listValues(markdownSection(markdown, '下一步验证建议'));
  const scoreValue = Number(markdown.match(/机会指数[：:]\s*\*{0,2}(\d{1,3})\s*\/\s*100/)?.[1] ?? base.score);
  const title = markdown.match(/##\s*机会\d+\s*[｜|]\s*([^\n]+)/)?.[1]?.trim() ?? base.title;
  const combination = [
    ['区域', labeledValue(combinationSection, ['区域'], '待确认区域')],
    ['时间 / 节点', labeledValue(combinationSection, ['时间/节点', '时间 / 节点', '时间节点'], '待确认节点')],
    ['目标人群', labeledValue(combinationSection, ['目标人群'], '待确认人群')],
    ['主推产品', labeledValue(combinationSection, ['产品', '主推产品'], '待确认产品')],
    ['消费场景', labeledValue(combinationSection, ['消费场景'], '待确认场景')],
    ['核心渠道', labeledValue(combinationSection, ['核心渠道', '渠道'], '待确认渠道')],
  ];
  const scoreLabels = [
    ['节点与时间', ['节点与时间匹配']],
    ['用户与场景', ['用户需求/场景匹配', '用户需求/消费场景匹配', '用户需求与场景匹配', '用户与场景匹配']],
    ['历史 Campaign', ['历史Campaign验证', '历史 Campaign 验证']],
    ['品牌与产品', ['品牌与产品匹配']],
    ['竞品差异', ['竞品差异化空间']],
    ['执行可行性', ['执行可行性']],
  ] as const;
  const scores = scoreLabels.map(([display, labels]) => {
    const text = labeledValue(scoreSection, [...labels], '0');
    return [display, Number(text.match(/\d{1,3}/)?.[0] ?? 0)] as [string, number];
  });
  const firstReason = reason.replace(/\*\*/g, '').split(/\n\n|\r?\n/).find(Boolean) ?? '来自 Coze Workflow 的机会分析。';
  return {
    ...base,
    rank: `0${index + 1}`,
    score: Math.max(0, Math.min(100, scoreValue)),
    title,
    meta: combination.slice(0, 4).map(([, value]) => value),
    signal: firstReason.length > 88 ? `${firstReason.slice(0, 88)}…` : firstReason,
    reason: reason || '来自 Coze Workflow 的机会分析。',
    evidence: evidence.length ? evidence : [`Coze Workflow 已返回方案；原始任务：${sourceInput}`],
    scores,
    combination,
    risk: risk || '尚未返回明确风险，请在执行前补充核验。',
    nextSteps: nextSteps.length ? nextSteps : ['核验关键假设', '设计小规模试点', '根据试点数据决定是否扩大'],
    raw: markdown.trim(),
  } as Opportunity;
}

function extractWorkflow1Opportunities(messages: WorkflowReply['messages'], sourceInput: string) {
  const content = (messages ?? []).map((message) => message.content).join('\n');
  const firstHeading = content.search(/##\s*机会[123]\s*[｜|]/);
  if (firstHeading < 0) return [];
  return content.slice(firstHeading)
    .split(/\n-\s*(?=##\s*机会[123]\s*[｜|])/)
    .filter((part) => /##\s*机会[123]\s*[｜|]/.test(part))
    .slice(0, 3)
    .map((part, index) => parseMarkdownOpportunity(part.replace(/^\s*-\s*/, ''), index, sourceInput));
}

type WorkflowReply = {
  error?: string;
  status?: 'interrupted' | 'completed';
  messages?: Array<{ content: string; nodeTitle: string }>;
  eventId?: string;
  interruptType?: number;
};

function extractCampaignPlans(messages: WorkflowReply['messages']) {
  const plans: string[] = [];
  for (const message of messages ?? []) {
    for (const line of message.content.split(/\r?\n/)) {
      const candidate = line.replace(/^\s*-\s*/, '').trim();
      if (!candidate.startsWith('{')) continue;
      try {
        const embedded = JSON.parse(candidate) as Record<string, unknown>;
        if (embedded.title && embedded.strategy && embedded.execution) plans.push(JSON.stringify(embedded, null, 2));
      } catch {}
    }
    let value: unknown = message.content;
    for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
      try { value = JSON.parse(value); } catch { break; }
    }
    if (!value || typeof value !== 'object') continue;
    const record = value as Record<string, unknown>;
    for (const key of ['plan1', 'plan2', 'plan3']) {
      if (record[key]) plans.push(typeof record[key] === 'string' ? record[key] : JSON.stringify(record[key], null, 2));
    }
    if (Array.isArray(record.options)) {
      for (const option of record.options) {
        const name = option && typeof option === 'object' ? (option as { name?: unknown }).name : option;
        if (name) plans.push(typeof name === 'string' ? name : JSON.stringify(name, null, 2));
      }
    }
  }
  return [...new Set(plans)].slice(0, 3);
}

function extractFinalOutput(messages: WorkflowReply['messages'], fallback: string) {
  return (messages ?? []).map((message) => {
    let value: unknown = message.content;
    for (let depth = 0; depth < 3 && typeof value === 'string'; depth += 1) {
      try { value = JSON.parse(value); } catch { break; }
      if (value && typeof value === 'object') {
        const record = value as { output?: unknown; plan?: unknown };
        if (typeof record.output === 'string') value = record.output;
        else if (typeof record.plan === 'string') value = record.plan;
      }
    }
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }).filter(Boolean).join('\n\n') || fallback;
}

function combinationValue(opportunity: Opportunity, label: string, fallback: string) {
  return opportunity.combination.find(([name]) => name === label)?.[1] as string ?? fallback;
}

function buildLocalCampaignPlans(opportunity: Opportunity, userFeedback: string): string[] {
  const region = combinationValue(opportunity, '区域', '目标区域');
  const timing = combinationValue(opportunity, '时间 / 节点', '目标档期');
  const audience = combinationValue(opportunity, '目标人群', '核心目标人群');
  const product = combinationValue(opportunity, '主推产品', '主推产品');
  const scene = combinationValue(opportunity, '消费场景', '核心消费场景');
  const request = userFeedback ? `；同时落实用户要求：${userFeedback}` : '';
  const seed = [...`${opportunity.title}${audience}${product}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const baseBudget = 18 + seed % 13;
  const budgetLimit = Number(userFeedback.match(/预算[^。；，,]*?(\d+)\s*万/)?.[1] ?? 0);
  const budget = (defaultLow: number, defaultHigh: number, allocation: string) => {
    if (!budgetLimit) return `${defaultLow}–${defaultHigh} 万元（${allocation}）`;
    const high = Math.min(defaultHigh, budgetLimit);
    const low = Math.min(defaultLow, Math.max(5, Math.round(high * 0.65)));
    return `${low}–${high} 万元，不超过用户设定的 ${budgetLimit} 万元上限（${allocation}）`;
  };

  const plans: CampaignPlan[] = [
    {
      title: `${opportunity.title}·场景体验站`,
      type: '线下体验型方案（Offline Experience）',
      target_user: `${region}的${audience}`,
      strategy: `在${timing}把${product}嵌入${scene}的关键决策时刻，用可参与、可试用、可分享的体验推动现场转化${request}。`,
      execution: `选择 2 个高匹配点位进行 7 天试点；设置主题体验区、产品试用、双人/组队互动任务与即时领券；按“到场—参与—试用—核销—分享”记录完整漏斗，并根据前 2 天数据调整物料与动线。`,
      channel: `${region}核心点位、周边门店、地图平台定向曝光、现场二维码与本地生活内容`,
      budget: budget(baseBudget, baseBudget + 12, '场地与搭建 40%、产品及物料 25%、人员 15%、传播 12%、机动 8%'),
      metrics: '到场人数、互动参与率、试用率、优惠券核销率、活动点位增量销量、单次有效参与成本、UGC 发布量',
      risk: '点位审批与客流不及预期；用双点位备选、分时预约、轻量化模块搭建和每日补货阈值控制执行风险。',
    },
    {
      title: `${audience}的“${product}真实一刻”`,
      type: '社交传播型方案（Social Media Campaign）',
      target_user: `${audience}及其同圈层影响者`,
      strategy: `把${opportunity.signal}转化为低门槛内容命题，通过真实场景模板和共创激励形成可复制的 UGC${request}。`,
      execution: `发布 3 套内容模板（情境记录、前后反差、好友共创），招募 20–30 位本地种子用户先产出样板；连续 14 天设置周榜与精选复投，品牌账号每日回应高质量内容并将优胜作品导流至转化页面。`,
      channel: '小红书、抖音、微信社群、品牌自有账号与本地 KOC 矩阵',
      budget: budget(Math.max(12, baseBudget - 5), baseBudget + 7, '种子内容 35%、媒体加热 30%、激励 20%、制作与监测 15%'),
      metrics: '有效 UGC 数、话题参与率、互动成本、完播率、品牌词搜索提升、落地页访问与转化率、负面反馈率',
      risk: '内容同质化或话题偏离品牌；用示例边界、关键词监测、人工精选和分阶段加热避免无效曝光。',
    },
    {
      title: `${region}${scene}增长伙伴计划`,
      type: '商业合作型方案（Partnership Campaign）',
      target_user: `合作渠道覆盖的${audience}`,
      strategy: `寻找与${scene}互补的渠道伙伴，将${product}组合进双方现有交易或会员权益，降低独立获客成本${request}。`,
      execution: `筛选 3 类候选伙伴并按人群重合度、点位能力、数据可回传性评分；先与 1 家伙伴上线 4 周联合套餐/会员任务，设置独立商品码和渠道码；第 2 周复盘后决定追加资源或止损。`,
      channel: '合作方门店与会员体系、联合商品页、双方私域、渠道销售终端',
      budget: budget(baseBudget + 5, baseBudget + 22, '合作权益 40%、联合物料 20%、渠道激励 20%、数据与传播 12%、机动 8%'),
      metrics: '联合套餐销量、新增会员数、渠道核销率、交叉购买率、单客获取成本、合作方增量收入、复购率',
      risk: '双方目标和数据口径不一致；在合同中明确 KPI、归因窗口、数据字段、素材审批时限及两周止损机制。',
    },
  ];
  return plans.map((plan) => JSON.stringify(plan, null, 2));
}

function parseCampaignPlan(source: string): CampaignPlan | null {
  try {
    const parsed = JSON.parse(source) as CampaignPlan;
    return parsed?.title ? parsed : null;
  } catch {
    return null;
  }
}

function buildFinalCampaign(planSource: string, opportunity: Opportunity, opinion: string) {
  const plan = parseCampaignPlan(planSource);
  const title = plan?.title ?? opportunity.title;
  const revision = opinion.trim() || '无额外修改，按已确认方向执行。';
  const timing = combinationValue(opportunity, '时间 / 节点', '目标档期');
  const region = combinationValue(opportunity, '区域', '目标区域');
  const product = combinationValue(opportunity, '主推产品', '主推产品');
  return [
    `# 1. Campaign 名称\n${title}`,
    `## 2. 背景与目标\n围绕“${opportunity.title}”在${region}落地，以${product}为主推产品。首轮采用可控规模试点，验证用户参与、渠道转化与增量销量三类结果，再决定是否扩大。`,
    `## 3. 用户洞察\n${opportunity.reason}`,
    `## 4. 核心策略\n${plan?.strategy ?? opportunity.signal}\n\n用户最新意见：${revision}`,
    `## 5. 活动玩法\n${plan?.execution ?? '以单点小规模试验验证核心假设，并完整记录参与到转化的行为漏斗。'}`,
    `## 6. 执行计划\n- T-21～T-14：确认合作资源、点位、预算和数据口径\n- T-13～T-7：完成创意物料、人员培训与小样本测试\n- T-6～T-1：预热、渠道铺设与应急演练\n- ${timing}：正式执行，按日监测核心漏斗并快速优化\n- T+1～T+7：复盘增量效果、用户反馈与扩大条件`,
    `## 7. 渠道推广\n${plan?.channel ?? combinationValue(opportunity, '核心渠道', '核心触达渠道')}`,
    `## 8. 预算规划\n${plan?.budget ?? '先按小规模试点核算，设置 8%–10% 机动预算；扩大前重新核验单客成本。'}`,
    `## 9. KPI 指标\n${plan?.metrics ?? '触达量、参与率、转化率、增量销量、单客获取成本与复购意向。'}\n\n扩大门槛：核心转化指标达到试点目标且单客成本处于预算上限以内；否则复盘后调整或停止。`,
    `## 10. 风险与应对\n${plan?.risk ?? opportunity.risk}\n\n事实边界：当前本地版本未获得 Coze 知识库真实召回，历史案例与竞品结论需在正式发布 Workflow 2 后复核。`,
  ].join('\n\n');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function campaignToWordHtml(content: string, title: string) {
  const body = content.split(/\r?\n/).map((line) => {
    const safe = escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const heading = line.match(/^(#{1,4})\s+(.+)/);
    if (heading) return `<h${Math.min(heading[1].length, 4)}>${escapeHtml(heading[2])}</h${Math.min(heading[1].length, 4)}>`;
    if (/^\s*[-*]\s+/.test(line)) return `<p class="list">• ${safe.replace(/^\s*[-*]\s+/, '')}</p>`;
    if (/^\s*\d+[.、]\s+/.test(line)) return `<p class="list">${safe}</p>`;
    if (/^\s*---+\s*$/.test(line)) return '<hr />';
    if (/^\s*\|/.test(line)) return `<p class="table-line">${safe}</p>`;
    return line.trim() ? `<p>${safe}</p>` : '<p class="spacer">&nbsp;</p>';
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif;color:#25322b;line-height:1.7;margin:42px}h1{font-size:24px;color:#ec4d2f}h2{font-size:19px;margin-top:26px;border-bottom:1px solid #d9e2dc;padding-bottom:6px}h3{font-size:16px;margin-top:20px}h4{font-size:14px}p{margin:7px 0}.list{margin-left:20px}.table-line{font-family:Consolas,monospace;font-size:11px;margin:1px 0}.spacer{line-height:.5}hr{border:0;border-top:1px solid #d9e2dc;margin:20px 0}</style></head><body>${body}</body></html>`;
}

export default function Home() {
  const [brief, setBrief] = useState('在杭州做一场七夕期间的无糖可乐营销，面向 18–30 岁情侣，优先考虑夜间线下场景。');
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => contextualOpportunities('在杭州做一场七夕期间的无糖可乐营销，面向 18–30 岁情侣，优先考虑夜间线下场景。'));
  const [phase, setPhase] = useState<Phase>('ready');
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [runMode, setRunMode] = useState<'preview' | 'coze'>('preview');
  const [runError, setRunError] = useState('');
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignResult, setCampaignResult] = useState('');
  const [campaignError, setCampaignError] = useState('');
  const [campaignPlans, setCampaignPlans] = useState<string[]>([]);
  const [campaignSelected, setCampaignSelected] = useState<number | null>(null);
  const [campaignOpinion, setCampaignOpinion] = useState('');
  const [workflow2Event, setWorkflow2Event] = useState<{ eventId: string; interruptType: number } | null>(null);
  const [campaignMode, setCampaignMode] = useState<'coze' | 'preview'>('preview');
  const [campaignNotice, setCampaignNotice] = useState('');
  const [campaignDraft, setCampaignDraft] = useState('');
  const [campaignEditing, setCampaignEditing] = useState(false);
  const [workflow1Event, setWorkflow1Event] = useState<{ eventId: string; interruptType: number } | null>(null);
  const [workflow1Loading, setWorkflow1Loading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const runAnalysis = async () => {
    if (!brief.trim()) return;
    const historyId = createHistoryId();
    const now = new Date().toISOString();
    const initialHistory: HistoryEntry = {
      id: historyId,
      createdAt: now,
      updatedAt: now,
      brief: brief.trim(),
      opportunities,
      phase: 'analyzing',
      activeStep: 1,
      selected: 0,
      feedback: '',
      files: [...files],
      runMode,
      campaignPlans: [],
      campaignSelected: null,
      campaignOpinion: '',
      campaignResult: '',
      campaignDraft: '',
      campaignMode: 'preview',
      campaignNotice: '',
    };
    setActiveHistoryId(historyId);
    setHistory((current) => [initialHistory, ...current].slice(0, HISTORY_LIMIT));
    setActiveStep(1);
    setPhase('analyzing');
    setRunError('');
    try {
      const response = await fetch('/api/coze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', query: brief.trim(), files: [] }),
      });
      const result = await response.json() as WorkflowReply;
      if (!response.ok) throw new Error(result.error || 'Coze Workflow 运行失败');
      const parsed = extractWorkflow1Opportunities(result.messages, brief.trim());
      setRunMode('coze');
      setRunError('');
      setOpportunities(parsed.length === 3 ? parsed : contextualOpportunities(brief.trim()));
      if (result.eventId && typeof result.interruptType === 'number') setWorkflow1Event({ eventId: result.eventId, interruptType: result.interruptType });
      else setWorkflow1Event(null);
    } catch (error) {
      setRunMode('preview');
      setRunError(error instanceof Error ? error.message : '真实 Coze Workflow 暂时不可用');
      setOpportunities(contextualOpportunities(brief.trim()));
      setWorkflow1Event(null);
    }
    setSelected(0);
    setFeedback('');
    setActiveStep(2);
    setPhase('results');
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setHistory((parsed as HistoryEntry[]).slice(0, HISTORY_LIMIT));
      }
    } catch {
      // Corrupted browser data should not prevent the workflow from loading.
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
    } catch {
      // The workflow remains usable even if the browser blocks local persistence.
    }
  }, [history, historyReady]);

  useEffect(() => {
    if (!historyReady || history.length > 0 || phase === 'ready') return;
    const historyId = createHistoryId();
    const now = new Date().toISOString();
    setActiveHistoryId(historyId);
    setHistory([{ id: historyId, createdAt: now, updatedAt: now, brief, opportunities, phase, activeStep, selected, feedback, files, runMode, campaignPlans, campaignSelected, campaignOpinion, campaignResult, campaignDraft, campaignMode, campaignNotice }]);
  }, [activeStep, brief, campaignDraft, campaignMode, campaignNotice, campaignOpinion, campaignPlans, campaignResult, campaignSelected, feedback, files, history.length, historyReady, opportunities, phase, runMode, selected]);

  useEffect(() => {
    if (!historyReady || !activeHistoryId) return;
    setHistory((current) => current.map((entry) => entry.id === activeHistoryId ? {
      ...entry,
      updatedAt: new Date().toISOString(),
      opportunities,
      phase,
      activeStep,
      selected,
      feedback,
      files,
      runMode,
      campaignPlans,
      campaignSelected,
      campaignOpinion,
      campaignResult,
      campaignDraft,
      campaignMode,
      campaignNotice,
    } : entry));
  }, [activeHistoryId, activeStep, campaignDraft, campaignMode, campaignNotice, campaignOpinion, campaignPlans, campaignResult, campaignSelected, feedback, files, historyReady, opportunities, phase, runMode, selected]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'stage_marketing_brief',
      title: '填写营销任务',
      description: '将营销任务填入原型，并展示可供评估的 Top 3 示例机会。',
      inputSchema: { type: 'object', properties: { brief: { type: 'string', minLength: 1 } }, required: ['brief'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input: unknown) {
        const value = input as { brief?: unknown };
        if (typeof value.brief !== 'string' || !value.brief.trim()) throw new Error('brief 必须是非空文本');
        const stagedBrief = value.brief.trim();
        const stagedOpportunities = contextualOpportunities(stagedBrief);
        const historyId = createHistoryId();
        const now = new Date().toISOString();
        const stagedHistory: HistoryEntry = { id: historyId, createdAt: now, updatedAt: now, brief: stagedBrief, opportunities: stagedOpportunities, phase: 'results', activeStep: 2, selected: 0, feedback: '', files: [], runMode: 'preview', campaignPlans: [], campaignSelected: null, campaignOpinion: '', campaignResult: '', campaignDraft: '', campaignMode: 'preview', campaignNotice: '' };
        setActiveHistoryId(historyId);
        setHistory((current) => [stagedHistory, ...current].slice(0, HISTORY_LIMIT));
        setBrief(stagedBrief);
        setOpportunities(stagedOpportunities);
        setRunMode('preview');
        setActiveStep(2);
        setPhase('results');
        return { status: 'staged', opportunityCount: 3 };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: 'confirm_marketing_opportunity',
      title: '确认营销机会',
      description: '从 Top 3 中确认一个机会；可选提供修改意见，然后在页面中展示完整最终方案。',
      inputSchema: { type: 'object', properties: { rank: { type: 'integer', minimum: 1, maximum: 3 }, feedback: { type: 'string' } }, required: ['rank'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input: unknown) {
        const value = input as { rank?: unknown; feedback?: unknown };
        if (!Number.isInteger(value.rank) || Number(value.rank) < 1 || Number(value.rank) > 3) throw new Error('rank 必须是 1、2 或 3');
        if (value.feedback !== undefined && typeof value.feedback !== 'string') throw new Error('feedback 必须是文本');
        const index = Number(value.rank) - 1;
        setSelected(index);
        setFeedback(typeof value.feedback === 'string' ? value.feedback.trim() : '');
        setActiveStep(3);
        setPhase('final');
        return { status: 'confirmed', rank: value.rank, title: opportunities[index].title, revised: Boolean(value.feedback && String(value.feedback).trim()) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const chosen = opportunities[selected];

  const restoreHistory = (entry: HistoryEntry) => {
    const restoredPhase = entry.phase === 'analyzing' ? 'results' : entry.phase;
    setActiveHistoryId(entry.id);
    setBrief(entry.brief);
    setOpportunities(entry.opportunities?.length ? entry.opportunities : contextualOpportunities(entry.brief));
    setPhase(restoredPhase);
    setActiveStep(entry.phase === 'analyzing' ? 2 : Math.max(0, Math.min(WORKFLOW_STEPS.length - 1, entry.activeStep ?? 0)));
    setSelected(Math.max(0, Math.min(2, entry.selected ?? 0)));
    setFeedback(entry.feedback ?? '');
    setFiles(entry.files ?? []);
    setRunMode(entry.runMode ?? 'preview');
    setRunError('');
    setWorkflow1Event(null);
    setWorkflow1Loading(false);
    setCampaignPlans(entry.campaignPlans ?? []);
    setCampaignSelected(entry.campaignSelected ?? null);
    setCampaignOpinion(entry.campaignOpinion ?? '');
    setCampaignResult(entry.campaignResult ?? '');
    setCampaignDraft(entry.campaignDraft || entry.campaignResult || '');
    setCampaignMode(entry.campaignResult ? (entry.campaignMode ?? 'preview') : 'preview');
    setCampaignNotice(entry.campaignNotice ?? '');
    setCampaignError('');
    setCampaignLoading(false);
    setCampaignEditing(false);
    setWorkflow2Event(null);
    setHistoryOpen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const completeWorkflow1 = async (opinion: string) => {
    const normalizedOpinion = opinion.trim();
    setActiveStep(3);
    setFeedback(normalizedOpinion);
    if (runMode !== 'coze' || !workflow1Event) {
      setPhase('final');
      return;
    }
    setWorkflow1Loading(true);
    setRunError('');
    try {
      const selectedPlan = chosen.raw || [
        `## 机会${selected + 1}｜${chosen.title}`,
        `**机会指数：${chosen.score}/100**`,
        ...chosen.combination.map(([label, value]) => `- ${label}：${value}`),
        `### 为什么值得做\n${chosen.reason}`,
        `### 主要风险\n${chosen.risk}`,
      ].join('\n\n');
      const choiceResponse = await fetch('/api/coze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', workflow: 1, ...workflow1Event, answer: selectedPlan }),
      });
      const choiceResult = await choiceResponse.json() as WorkflowReply;
      if (!choiceResponse.ok) throw new Error(choiceResult.error || 'Workflow 1 方案选择失败');

      let finalResult = choiceResult;
      if (choiceResult.eventId && typeof choiceResult.interruptType === 'number') {
        const opinionResponse = await fetch('/api/coze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resume', workflow: 1, eventId: choiceResult.eventId, interruptType: choiceResult.interruptType, answer: normalizedOpinion || '无' }),
        });
        finalResult = await opinionResponse.json() as WorkflowReply;
        if (!opinionResponse.ok) throw new Error(finalResult.error || 'Workflow 1 修改意见处理失败');
      }

      const finalMarkdown = extractFinalOutput(finalResult.messages, selectedPlan);
      const finalOpportunity = parseMarkdownOpportunity(finalMarkdown, selected, brief.trim());
      setOpportunities((current) => current.map((item, index) => index === selected ? { ...finalOpportunity, rank: item.rank, tone: item.tone, raw: finalMarkdown } : item));
      setWorkflow1Event(null);
      setPhase('final');
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Workflow 1 最终方案生成失败');
      setPhase('final');
    } finally {
      setWorkflow1Loading(false);
    }
  };

  const runWorkflow2 = async () => {
    setActiveStep(4);
    setCampaignLoading(true);
    setCampaignError('');
    setCampaignResult('');
    setCampaignDraft('');
    setCampaignEditing(false);
    setCampaignPlans([]);
    setCampaignSelected(null);
    setCampaignOpinion('');
    setCampaignNotice('');
    const opportunityPlan = chosen.raw || [
      `# ${chosen.title}`,
      ...chosen.combination.map(([label, value]) => `- ${label}：${value}`),
      `\n## 为什么值得做\n${chosen.reason}`,
      `\n## 主要风险\n${chosen.risk}`,
      feedback ? `\n## 用户修改意见\n${feedback}` : '',
    ].filter(Boolean).join('\n');
    try {
      const response = await fetch('/api/coze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', workflow: 2, input: opportunityPlan, files: [] }),
      });
      const result = await response.json() as WorkflowReply;
      if (!response.ok) throw new Error(result.error || 'Workflow 2 运行失败');
      setCampaignMode('coze');
      setCampaignPlans(extractCampaignPlans(result.messages));
      if (result.eventId && typeof result.interruptType === 'number') setWorkflow2Event({ eventId: result.eventId, interruptType: result.interruptType });
      const output = result.messages?.map((message) => message.content).filter(Boolean).join('\n\n') ?? '';
      if (!extractCampaignPlans(result.messages).length) {
        setCampaignResult(output || `Workflow 2 已运行至${result.status === 'interrupted' ? '方案选择节点' : '结束节点'}。`);
        setActiveStep(result.status === 'completed' ? 7 : 5);
      } else {
        setActiveStep(5);
      }
    } catch (error) {
      setCampaignMode('preview');
      setCampaignPlans(buildLocalCampaignPlans(chosen, feedback));
      setWorkflow2Event(null);
      setActiveStep(5);
      setCampaignNotice(`Coze Workflow 2 尚未发布，已按原工作流节点在本地生成三套动态方案。发布后会自动切换为 Coze 实时结果。原始错误：${error instanceof Error ? error.message : '暂时不可用'}`);
    } finally {
      setCampaignLoading(false);
    }
  };

  const chooseCampaignPlan = async (index: number) => {
    setCampaignSelected(index);
    setActiveStep(6);
    if (campaignMode === 'preview') return;
    if (!workflow2Event) return;
    setCampaignLoading(true);
    setCampaignError('');
    try {
      const response = await fetch('/api/coze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume', workflow: 2, ...workflow2Event, answer: campaignPlans[index] }) });
      const result = await response.json() as WorkflowReply;
      if (!response.ok) throw new Error(result.error || 'Workflow 2 方案选择失败');
      if (result.eventId && typeof result.interruptType === 'number') setWorkflow2Event({ eventId: result.eventId, interruptType: result.interruptType });
      else setWorkflow2Event(null);
      if (result.status === 'completed') {
        const finalOutput = extractFinalOutput(result.messages, '方案已完成');
        setCampaignResult(finalOutput);
        setCampaignDraft(finalOutput);
        setCampaignEditing(false);
        setActiveStep(7);
      }
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'Workflow 2 方案选择失败');
    } finally { setCampaignLoading(false); }
  };

  const finishCampaignPlan = async () => {
    if (campaignSelected === null) return;
    setActiveStep(6);
    if (campaignMode === 'preview') {
      const finalOutput = buildFinalCampaign(campaignPlans[campaignSelected], chosen, campaignOpinion);
      setCampaignResult(finalOutput);
      setCampaignDraft(finalOutput);
      setCampaignEditing(false);
      setActiveStep(7);
      return;
    }
    if (!workflow2Event) return;
    setCampaignLoading(true);
    setCampaignError('');
    try {
      const answer = JSON.stringify({ plan: campaignPlans[campaignSelected], opinion: campaignOpinion.trim() || '无' });
      const response = await fetch('/api/coze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume', workflow: 2, ...workflow2Event, answer }) });
      const result = await response.json() as WorkflowReply;
      if (!response.ok) throw new Error(result.error || 'Workflow 2 最终方案生成失败');
      setWorkflow2Event(null);
      const finalOutput = extractFinalOutput(result.messages, '最终 Campaign 方案已生成');
      setCampaignResult(finalOutput);
      setCampaignDraft(finalOutput);
      setCampaignEditing(false);
      setActiveStep(7);
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'Workflow 2 最终方案生成失败');
    } finally { setCampaignLoading(false); }
  };

  const saveCampaignEdits = () => {
    if (!campaignDraft.trim()) return;
    setCampaignResult(campaignDraft.trim());
    setCampaignDraft(campaignDraft.trim());
    setCampaignEditing(false);
  };

  const downloadCampaign = () => {
    if (!campaignResult.trim()) return;
    const documentTitle = chosen.title || 'Campaign执行方案';
    const blob = new Blob(['\ufeff', campaignToWordHtml(campaignResult, documentTitle)], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60)}-执行方案.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Sparkles size={19} /></div>
        <nav aria-label="主导航">
          <button className="nav-item active" aria-label="机会发现"><Lightbulb size={20} /></button>
          <button className="nav-item" aria-label="检索"><Search size={20} /></button>
          <button className="nav-item" aria-label="资料"><FileText size={20} /></button>
        </nav>
        <div className="avatar">EQ</div>
      </aside>

      <section className="workspace">
        <section className="workflow-progress" aria-label="Workflow 1 到 Workflow 2 的任务执行进度">
          <div className="workflow-progress-head">
            <div>
              <p className="workflow-progress-kicker">TASK PROGRESS / WORKFLOW 1 → WORKFLOW 2</p>
              <strong>{activeStep === WORKFLOW_STEPS.length - 1 ? '任务已完成，可继续编辑或下载' : `当前：${WORKFLOW_STEPS[activeStep].label}`}</strong>
            </div>
            <span>{activeStep + 1}<small> / {WORKFLOW_STEPS.length}</small></span>
          </div>
          <Progress className="workflow-progress-line" value={(activeStep / (WORKFLOW_STEPS.length - 1)) * 100} aria-label={`已进行到第 ${activeStep + 1} 步，共 ${WORKFLOW_STEPS.length} 步`} />
          <div className="workflow-progress-scroll">
            <ol className="workflow-step-list">
              {WORKFLOW_STEPS.map((step, index) => {
                const status = index < activeStep ? 'complete' : index === activeStep ? 'active' : 'pending';
                return <li className={status} key={`${step.workflow}-${step.label}`} aria-current={status === 'active' ? 'step' : undefined}>
                  <span className="workflow-step-index">{status === 'complete' ? <Check size={13} strokeWidth={3} /> : index + 1}</span>
                  <div><small>{step.workflow}</small><strong>{step.label}</strong></div>
                </li>;
              })}
            </ol>
          </div>
        </section>

        <header className="topbar">
          <div><p className="eyebrow">MARKETING INTELLIGENCE / 01</p><h1>机会发现</h1></div>
          <div className="topbar-actions">
            <Badge variant="outline" className={`status-badge ${runMode}`}><span /> {runMode === 'coze' ? 'Coze 实时运行' : '本地动态预览'}</Badge>
            <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
              <PopoverTrigger className="history-button" aria-label={`打开历史记录，共 ${history.length} 条`}>历史记录{history.length > 0 && <span className="history-count">{history.length}</span>}<ChevronDown size={15} /></PopoverTrigger>
              <PopoverContent className="history-popover" align="end" sideOffset={10}>
                <PopoverHeader className="history-popover-header">
                  <div><PopoverTitle>历史任务</PopoverTitle><PopoverDescription>点击任一任务，恢复当时的问题与完整结果。</PopoverDescription></div>
                  <span>{history.length} 条</span>
                </PopoverHeader>
                {history.length === 0 ? (
                  <Empty className="history-empty">
                    <EmptyHeader><EmptyMedia variant="icon"><Clock3 /></EmptyMedia><EmptyTitle>还没有历史任务</EmptyTitle><EmptyDescription>提交第一个营销问题后，会自动保存在这里。</EmptyDescription></EmptyHeader>
                  </Empty>
                ) : (
                  <ScrollArea className="history-scroll">
                    <div className="history-list">
                      {history.map((entry) => {
                        const step = Math.max(0, Math.min(WORKFLOW_STEPS.length - 1, entry.activeStep ?? 0));
                        return <button className={`history-entry ${activeHistoryId === entry.id ? 'current' : ''}`} key={entry.id} onClick={() => restoreHistory(entry)}>
                          <div className="history-entry-meta"><span>{formatHistoryDate(entry.createdAt)}</span><strong>{step === WORKFLOW_STEPS.length - 1 ? '已完成' : WORKFLOW_STEPS[step].label}</strong></div>
                          <p>{entry.brief}</p>
                          <div className="history-entry-footer"><span>{entry.runMode === 'coze' ? 'Coze Workflow' : '本地预览'}</span><span>查看任务 <ArrowUpRight size={13} /></span></div>
                          <i style={{ width: `${(step / (WORKFLOW_STEPS.length - 1)) * 100}%` }} />
                        </button>;
                      })}
                    </div>
                  </ScrollArea>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="content-grid">
          <section className="brief-panel">
            <div className="section-heading"><span>01</span><div><h2>描述这次营销任务</h2><p>包含地区、时间、产品和人群，证据越具体，结果越可靠。</p></div></div>
            <Textarea value={brief} onChange={(event) => setBrief(event.target.value)} className="brief-input" aria-label="营销任务描述" />
            <div className="input-footer">
              <label className="upload-control"><Upload size={17} /><span>{files.length ? `已添加 ${files.length} 份资料` : '添加参考资料'}</span><input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>
              <span className="helper-text">{files[0] ?? 'PDF、DOCX、XLSX 或链接'}</span>
              <Button onClick={runAnalysis} disabled={!brief.trim() || phase === 'analyzing'} className="discover-button">
                {phase === 'analyzing' ? <><LoaderCircle size={17} className="spin" />正在检索</> : <>开始发现 <ArrowUpRight size={17} /></>}
              </Button>
            </div>
          </section>

          <aside className="source-panel">
            <div className="source-title"><span>WORKFLOW SOURCES</span><strong>{phase === 'analyzing' ? 'RUNNING' : runMode === 'coze' ? 'CONNECTED' : 'PREVIEW'}</strong></div>
            {['需求理解与检索词', '知识库与历史 Campaign', '竞品近期动态', 'Top 3 机会分析'].map((source, index) => <div className="source-row" key={source}><span className="source-index">0{index + 1}</span><span>{source}</span><i className={phase === 'analyzing' ? 'pulse' : runMode === 'coze' ? '' : 'pending'} /></div>)}
            <p className="source-note">{runMode === 'coze' ? '结果来自已发布的 Coze Workflow。' : '当前为基于本次输入的动态预览；未连接的知识库证据会明确标记，不冒充真实召回。'}</p>
          </aside>
        </div>

        <section className={`results-section ${phase === 'analyzing' ? 'is-loading' : ''}`}>
          <div className="results-heading"><div><span className="results-kicker">{phase === 'ready' ? '待运行示例' : runMode === 'coze' ? 'COZE WORKFLOW RESULT' : 'DYNAMIC LOCAL PREVIEW'}</span><h2>Top 3 营销机会</h2></div><p>{runMode === 'coze' ? '根据 Coze 返回内容生成' : '根据当前问题动态生成，非知识库事实'}</p></div>
          {runError && <div className="run-notice"><strong>Coze 连接未完成</strong><span>{runError}</span></div>}
          <div className="opportunity-grid">
            {opportunities.map((item, index) => (
              <article className={`opportunity-card ${item.tone} ${selected === index && phase !== 'ready' ? 'selected' : ''}`} key={item.rank}>
                <div className="rank-line"><span>{item.rank}</span><strong>{item.score}<small>/100</small></strong></div>
                <h3>{item.title}</h3><div className="meta-list">{item.meta.map((tag) => <span key={tag}>{tag}</span>)}</div><p>{item.signal}</p>
                <div className="card-actions"><button onClick={() => setEvidenceIndex(index)}>查看证据 <ArrowUpRight size={15} /></button><button className="select-opportunity" onClick={() => { setSelected(index); setActiveStep(3); setPhase('refine'); }}><Check size={14} />选择</button></div>
              </article>
            ))}
          </div>
        </section>

        {(phase === 'refine' || phase === 'final') && (
          <section className="refine-panel">
            <div className="section-heading"><span>{phase === 'final' ? '03' : '02'}</span><div><h2>{phase === 'final' ? '最终机会方案' : '确认方案或提出修改'}</h2><p>已选择：{chosen.title}</p></div></div>
            {phase === 'refine' ? (
              <>
                <div className="selected-summary">
                  {chosen.combination.slice(0, 4).map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value}</strong></div>)}
                </div>
                <label className="feedback-label" htmlFor="feedback">修改意见 <span>选填</span></label>
                <Textarea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="例如：缩小到湖滨商圈，增加社交分享机制，预算控制在 30 万内……" className="feedback-input" />
                <div className="refine-actions">
                  <button className="text-action" onClick={() => { setActiveStep(2); setPhase('results'); }}><RotateCcw size={15} />重新选择</button>
                  <div className="confirm-actions">
                    <Button variant="outline" onClick={() => void completeWorkflow1('')} disabled={workflow1Loading} className="direct-confirm"><Check size={16} />{workflow1Loading ? '正在生成…' : '无修改，直接确认'}</Button>
                    <Button onClick={() => void completeWorkflow1(feedback)} disabled={!feedback.trim() || workflow1Loading} className="discover-button"><WandSparkles size={16} />{workflow1Loading ? '正在生成…' : '按意见优化'}</Button>
                  </div>
                </div>
              </>
            ) : (
              <article className="final-plan">
                <div className="final-status"><Database size={18} /><span>{feedback ? '已按用户意见优化' : '无修改，已保留原方案'}</span><Badge>机会指数 {feedback ? Math.min(92, chosen.score + 3) : chosen.score}/100</Badge></div>
                <h3>{chosen.title}</h3>
                {feedback && <div className="feedback-note"><strong>用户修改意见</strong><span>{feedback}</span></div>}
                <section className="report-section">
                  <div className="report-title"><span>01</span><h4>机会组合</h4></div>
                  <div className="combination-grid">{chosen.combination.map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value}</strong></div>)}</div>
                </section>
                <section className="report-section">
                  <div className="report-title"><span>02</span><h4>为什么现在值得做</h4></div>
                  <p className="report-copy">{chosen.reason}</p>
                </section>
                <div className="report-columns">
                  <section className="report-section">
                    <div className="report-title"><span>03</span><h4>证据与依据</h4></div>
                    <ul className="evidence-list">{chosen.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section className="report-section">
                    <div className="report-title"><span>04</span><h4>评分拆解</h4></div>
                    <div className="score-list full">{chosen.scores.map(([label, value]) => <div key={label as string}><span>{label}</span><div><i style={{ width: String(value) + '%' }} /></div><strong>{value}</strong></div>)}</div>
                  </section>
                </div>
                <section className="risk-block"><div className="report-title"><span>05</span><h4>主要风险</h4></div><p>{chosen.risk}</p></section>
                <section className="report-section"><div className="report-title"><span>06</span><h4>下一步验证建议</h4></div><ol className="next-steps">{chosen.nextSteps.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section>
                <footer className="report-footer"><span>Workflow 1 已完成，下一步将 plan 传入 Workflow 2 的 input</span><div className="report-footer-actions"><button className="text-action" onClick={() => { setActiveHistoryId(null); setActiveStep(0); setPhase('ready'); setFeedback(''); setCampaignPlans([]); setCampaignSelected(null); setCampaignResult(''); setCampaignDraft(''); setCampaignEditing(false); }}><RotateCcw size={15} />开始新任务</button><Button onClick={runWorkflow2} disabled={campaignLoading} className="discover-button">{campaignLoading ? <><LoaderCircle size={16} className="spin" />正在运行 Workflow 2</> : <> 进入 Campaign 方案设计 <ArrowUpRight size={16} /></>}</Button></div></footer>
                {(campaignPlans.length > 0 || campaignResult || campaignError) && (
                  <section className={'campaign-result ' + (campaignError ? 'error' : '')}>
                    <div className="campaign-result-header">
                      <div><div className="results-kicker">WORKFLOW 2 / MARKETING SOLUTION</div><h4>{campaignError ? 'Workflow 2 未完成' : campaignResult ? '最终可执行 Campaign 方案' : '请选择一套 Campaign 方案'}</h4></div>
                      {campaignResult && !campaignError && <div className="campaign-document-actions">
                        {campaignEditing ? <><Button variant="outline" onClick={() => { setCampaignDraft(campaignResult); setCampaignEditing(false); }}><X size={15} />取消</Button><Button onClick={saveCampaignEdits} disabled={!campaignDraft.trim()}><Save size={15} />保存修改</Button></> : <Button variant="outline" onClick={() => { setCampaignDraft(campaignResult); setCampaignEditing(true); }}><Pencil size={15} />编辑方案</Button>}
                        <Button onClick={downloadCampaign} disabled={campaignEditing}><Download size={15} />下载 Word 文档</Button>
                      </div>}
                    </div>
                    {campaignNotice && <div className="run-notice"><strong>本地动态运行</strong><span>{campaignNotice}</span></div>}
                    {campaignPlans.length > 0 && !campaignResult && <div className="campaign-plan-grid">{campaignPlans.slice(0, 3).map((plan, index) => <article className={campaignSelected === index ? 'active' : ''} key={index}><span>PLAN 0{index + 1}</span><pre>{plan}</pre><Button variant={campaignSelected === index ? 'default' : 'outline'} onClick={() => chooseCampaignPlan(index)} disabled={campaignLoading}>{campaignSelected === index ? '已选择' : '选择方案'}</Button></article>)}</div>}
                    {campaignSelected !== null && (campaignMode === 'preview' || workflow2Event) && !campaignResult && <div className="campaign-opinion"><label htmlFor="campaign-opinion">对所选 Campaign 的修改意见 <span>没有意见可留空</span></label><Textarea id="campaign-opinion" value={campaignOpinion} onChange={(event) => setCampaignOpinion(event.target.value)} placeholder="例如：降低预算、强化门店执行、调整核心指标……" /><Button onClick={finishCampaignPlan} disabled={campaignLoading}>{campaignLoading ? '正在生成…' : '生成最终执行方案'}</Button></div>}
                    {campaignError && <pre>{campaignError}</pre>}
                    {campaignResult && (campaignEditing ? <div className="campaign-editor-wrap"><label htmlFor="campaign-editor">编辑完整方案</label><Textarea id="campaign-editor" value={campaignDraft} onChange={(event) => setCampaignDraft(event.target.value)} className="campaign-editor" /><p>修改完成后请先保存，再下载最终 Word 文档。</p></div> : <pre>{campaignResult}</pre>)}
                  </section>
                )}
              </article>
            )}
          </section>
        )}
      </section>

      {evidenceIndex !== null && <div className="evidence-overlay" role="presentation" onMouseDown={() => setEvidenceIndex(null)}><aside className="evidence-sheet" role="dialog" aria-modal="true" aria-labelledby="evidence-title" onMouseDown={(event) => event.stopPropagation()}><button className="sheet-close" aria-label="关闭证据" onClick={() => setEvidenceIndex(null)}><X size={18} /></button><header className="sheet-header"><span className="results-kicker">EVIDENCE TRACE</span><h2 id="evidence-title">{opportunities[evidenceIndex].title}</h2><p>将事实、弱参考和推断分开呈现。</p></header><div className="sheet-body"><h4>为什么值得做</h4><p>{opportunities[evidenceIndex].reason}</p><h4>证据与依据</h4><ul>{opportunities[evidenceIndex].evidence.map((item) => <li key={item}>{item}</li>)}</ul><h4>评分拆解</h4><div className="score-list">{opportunities[evidenceIndex].scores.map(([label, value]) => <div key={label as string}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>)}</div></div></aside></div>}
    </main>
  );
}
