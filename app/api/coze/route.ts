export const runtime = 'nodejs';
export const maxDuration = 180;

type StreamResult = {
  status: 'interrupted' | 'completed';
  messages: Array<{ content: string; nodeTitle: string }>;
  eventId?: string;
  interruptType?: number;
};

function parseSSE(source: string): StreamResult {
  const messages: StreamResult['messages'] = [];
  let interrupted: Pick<StreamResult, 'eventId' | 'interruptType'> | undefined;

  for (const block of source.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const eventName = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
    const dataText = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
    if (!dataText) continue;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(dataText) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (eventName === 'Message' && typeof data.content === 'string') {
      messages.push({ content: data.content, nodeTitle: typeof data.node_title === 'string' ? data.node_title : '' });
    }
    if (eventName === 'Error') {
      throw new Error(typeof data.error_message === 'string' ? data.error_message : 'Coze Workflow 运行失败');
    }
    if (eventName === 'Interrupt') {
      const detail = data.interrupt_data as { event_id?: unknown; type?: unknown } | undefined;
      if (typeof detail?.event_id === 'string' && typeof detail.type === 'number') interrupted = { eventId: detail.event_id, interruptType: detail.type };
    }
  }

  return interrupted ? { status: 'interrupted', messages, ...interrupted } : { status: 'completed', messages };
}

async function callCoze(path: string, body: Record<string, unknown>) {
  const token = process.env.COZE_API_TOKEN;
  if (!token) throw new Error('Coze API token is not configured');
  const response = await fetch(`https://api.coze.cn${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(180000),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text || `Coze API HTTP ${response.status}`;
    try {
      const json = JSON.parse(text) as { msg?: string; message?: string };
      message = json.msg || json.message || message;
    } catch {}
    throw new Error(message);
  }
  return parseSSE(text);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: 'run' | 'resume'; workflow?: 1 | 2; query?: string; input?: string; files?: string[]; eventId?: string; interruptType?: number; answer?: string };
    const workflowNumber = body.workflow === 2 ? 2 : 1;
    const workflowId = workflowNumber === 2
      ? process.env.COZE_WORKFLOW_2_ID
      : process.env.COZE_WORKFLOW_1_ID || process.env.COZE_WORKFLOW_ID;
    if (!workflowId) throw new Error('Coze workflow ID is not configured');

    if (body.action === 'run') {
      const primaryInput = workflowNumber === 2 ? body.input : body.query;
      if (!primaryInput?.trim()) return Response.json({ error: workflowNumber === 2 ? '缺少 Workflow 1 生成的机会方案' : '请输入营销任务' }, { status: 400 });
      const parameters = workflowNumber === 2
        ? { input: primaryInput.trim(), file: body.files ?? [] }
        : { query: primaryInput.trim(), file: body.files ?? [] };
      const result = await callCoze('/v1/workflow/stream_run', { workflow_id: workflowId, parameters });
      return Response.json(result);
    }
    if (body.action === 'resume') {
      if (!body.eventId || typeof body.interruptType !== 'number') return Response.json({ error: '工作流中断信息不完整' }, { status: 400 });
      const result = await callCoze('/v1/workflow/stream_resume', { workflow_id: workflowId, event_id: body.eventId, interrupt_type: body.interruptType, resume_data: body.answer ?? '无' });
      return Response.json(result);
    }
    return Response.json({ error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '无法运行 Coze Workflow' }, { status: 500 });
  }
}
