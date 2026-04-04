import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const EXTRACTION_SPEC = {
  contract: {
    title: 'string (required)',
    contract_owner: 'string (required)',
    start_date: 'YYYY-MM-DD (required)',
    end_date: 'YYYY-MM-DD (required)',
    status: 'Draft|Under Review|Active|Expiring Soon|Expired|Terminated',
    external_reference_id: 'string',
    contract_type: 'string',
    description: 'string',
    effective_date: 'YYYY-MM-DD',
    signature_date: 'YYYY-MM-DD',
    termination_date: 'YYYY-MM-DD',
    initial_term_months: 'number',
    renewal_term_months: 'number',
    auto_renew: 'boolean',
    notice_period_days: 'number',
    contract_value: 'number',
    currency: 'string (ISO 4217)',
    billing_frequency: 'Monthly|Quarterly|Semi-Annual|Annual|One-Time|Usage-Based',
    payment_terms: 'string',
    cost_center_code: 'string',
    spend_category: 'string',
    price_escalation_terms: 'string',
    risk_tier: 'Low|Medium|High',
    data_classification: 'Public|Internal|Confidential|Restricted',
    insurance_required: 'boolean',
    soc2_required: 'boolean',
    dpa_required: 'boolean',
    compliance_exceptions: 'string',
    regulatory_tags: 'string',
    key_obligations: 'string',
    sla_terms: 'string',
    service_credits_terms: 'string',
    audit_rights: 'boolean',
    notes: 'string',
  },
  vendor: {
    legal_name: 'string (required)',
    dba_name: 'string',
    category: 'string',
    tax_id: 'string',
    website: 'string',
    primary_contact_name: 'string',
    primary_contact_email: 'string',
    primary_contact_phone: 'string',
    risk_tier: 'Low|Medium|High',
    country: 'string',
  },
  parent_contract_reference: 'string (id, external reference, or exact title)',
};

export function getExtractionSpec() {
  return EXTRACTION_SPEC;
}

export function getConfiguredProviders(): string[] {
  const providers: string[] = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  return providers;
}

export function computeChecksum(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function extractContractData(filePath: string, fileType: string, provider?: string): Promise<{ data: any; provider: string }> {
  const providers = getConfiguredProviders();
  const isPdf = fileType === 'application/pdf' || filePath.endsWith('.pdf');

  let selectedProvider = provider?.toLowerCase();
  if (!selectedProvider || selectedProvider === 'auto') {
    if (isPdf && providers.includes('anthropic')) {
      selectedProvider = 'anthropic';
    } else {
      selectedProvider = providers[0] || 'none';
    }
  }

  console.log('[OCR] Configured providers:', providers);
  console.log('[OCR] Selected provider:', selectedProvider);
  console.log('[OCR] File type:', fileType, '| File size:', fs.statSync(filePath).size, 'bytes');

  if (selectedProvider === 'none' || !providers.includes(selectedProvider!)) {
    throw new Error('No OCR provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
  }

  const fileData = fs.readFileSync(filePath);
  const base64 = fileData.toString('base64');
  const prompt = `Extract structured contract data from this document. Return ONLY valid JSON matching this schema:\n${JSON.stringify(EXTRACTION_SPEC, null, 2)}\n\nNormalize: dates to YYYY-MM-DD, booleans to true/false, risk tier to Low/Medium/High, currency amounts cleaned of formatting. Return a JSON object with keys: contract, vendor, parent_contract_reference.`;

  if (selectedProvider === 'openai') {
    return { data: await callOpenAI(base64, fileType, prompt, isPdf), provider: 'openai' };
  } else {
    return { data: await callAnthropic(base64, fileType, prompt, isPdf), provider: 'anthropic' };
  }
}

async function callOpenAI(base64: string, mimeType: string, prompt: string, isPdf: boolean): Promise<any> {
  const model = process.env.OPENAI_OCR_MODEL || 'gpt-4.1-mini';
  const imageContent = isPdf
    ? [{ type: 'text', text: '[PDF document provided as base64]' }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }]
    : [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }];

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...imageContent] }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status} ${await resp.text()}`);
  const json = await resp.json() as any;
  return JSON.parse(json.choices[0].message.content);
}

async function callAnthropic(base64: string, mimeType: string, prompt: string, isPdf: boolean): Promise<any> {
  const model = process.env.ANTHROPIC_OCR_MODEL || 'claude-opus-4-1';
  const mediaType = mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf';

  console.log('[OCR:Anthropic] Model:', model);
  console.log('[OCR:Anthropic] Key prefix:', process.env.ANTHROPIC_API_KEY!.substring(0, 12) + '...');

  const content: any[] = [];
  if (isPdf) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
  } else {
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
  }
  content.push({ type: 'text', text: prompt });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content }] }),
  });

  console.log('[OCR:Anthropic] Response status:', resp.status);

  if (!resp.ok) {
    const body = await resp.text();
    console.error('[OCR:Anthropic] Error:', body);
    throw new Error(`Anthropic API error: ${resp.status} ${body}`);
  }
  const json = await resp.json() as any;
  const text = json.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to extract JSON from Anthropic response');
  return JSON.parse(jsonMatch[0]);
}

export function saveUploadedFile(file: Express.Multer.File, contractId: string): string {
  const dir = path.join(__dirname, '..', 'uploads', 'contracts', contractId);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, file.originalname);
  fs.renameSync(file.path, dest);
  return dest;
}
