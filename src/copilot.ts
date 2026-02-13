import { execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execFileAsync = promisify(execFile);

/**
 * Check if GitHub Copilot CLI is available.
 */
export async function isCopilotAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('gh', ['copilot', '--', '--version'], {
      timeout: 15000,
    });
    return stdout.includes('Copilot CLI');
  } catch {
    return false;
  }
}

/**
 * Ask Copilot CLI to process a prompt.
 */
async function askCopilot(prompt: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['copilot', '--', '-p', prompt],
      { timeout: 60000, maxBuffer: 1024 * 1024 }
    );
    return cleanOutput(stdout);
  } catch {
    return '';
  }
}

/**
 * Clean ANSI escape codes and usage stats from output.
 */
function cleanOutput(output: string): string {
  let cleaned = output
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\r/g, '');

  const markers = ['\nTotal usage est:', '\nAPI time spent:'];
  let earliest = cleaned.length;
  for (const marker of markers) {
    const idx = cleaned.indexOf(marker);
    if (idx !== -1 && idx < earliest) {
      earliest = idx;
    }
  }
  if (earliest < cleaned.length) {
    cleaned = cleaned.substring(0, earliest);
  }
  return cleaned.trim();
}

/**
 * Convert markdown to terminal-formatted text.
 */
function renderMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (/^#{1,3}\s/.test(line)) {
        return chalk.bold.white(line.replace(/^#{1,3}\s+/, ''));
      }
      line = line.replace(/\*\*([^*]+)\*\*/g, (_, c) => chalk.bold(c));
      line = line.replace(/`([^`]+)`/g, (_, c) => chalk.cyan(c));
      line = line.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, c) => chalk.dim(c));
      return line;
    })
    .join('\n');
}

/**
 * Ask Copilot CLI to explain prompt injection guard results.
 */
export async function explainGuardResult(
  input: string,
  violations: string[],
  classification: string
): Promise<string> {
  const prompt = `I'm a security analyst. An AI agent received this input: "${input.substring(0, 200)}". My prompt-injection scanner classified it as "${classification}" with these violations: ${violations.join(', ')}. Explain in plain English: 1) What attack technique was attempted, 2) Why it's dangerous for AI agents, 3) What could happen if it wasn't caught. Be concise and technical.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}

/**
 * Ask Copilot CLI to explain what secrets were found in text.
 */
export async function explainRedactResult(
  findingTypes: string[],
  count: number
): Promise<string> {
  const prompt = `I'm a security scanner for AI agents. I found ${count} secret(s) in agent communication: ${findingTypes.join(', ')}. Explain in plain English: 1) What each type of secret is, 2) Why it's dangerous if leaked by an AI agent, 3) How an attacker could exploit each one. Focus on crypto/blockchain risks where relevant. Be concise.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}

/**
 * Ask Copilot CLI to explain an audit ticket's constraints.
 */
export async function explainTicket(
  payload: Record<string, any>
): Promise<string> {
  const prompt = `I'm analyzing a JWT audit ticket for an AI agent system. Here's the decoded payload: ${JSON.stringify(payload, null, 2)}. Explain in plain English: 1) What audit level this agent has and what it means, 2) What constraints are placed on it, 3) Whether the kill switch state is concerning, 4) Any security observations about the configuration. Be concise.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}

/**
 * Ask Copilot CLI to explain settlement risk analysis.
 */
export async function explainSettlementRisk(
  meta: Record<string, any>,
  riskScore: number,
  riskFactors: string[],
  classification: string
): Promise<string> {
  const prompt = `I'm analyzing an x402 payment transaction between AI agents. Transaction: ${JSON.stringify(meta)}. Risk score: ${riskScore}/1.0. Classification: ${classification}. Risk factors: ${riskFactors.join(', ') || 'none'}. Explain in plain English: 1) Is this transaction safe and why, 2) What each risk factor means, 3) What an agent operator should do based on this result. Be concise and practical.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}

/**
 * Ask Copilot CLI to explain what a URL's SSRF risk is.
 */
export async function explainSsrfResult(
  url: string,
  safe: boolean,
  reason?: string
): Promise<string> {
  const prompt = `I'm checking if this URL is safe for an AI agent to access: "${url}". Result: ${safe ? 'SAFE' : 'BLOCKED'}${reason ? ` — Reason: ${reason}` : ''}. Explain in plain English: 1) What SSRF (Server-Side Request Forgery) is, 2) Why this URL was ${safe ? 'allowed' : 'blocked'}, 3) How SSRF attacks work against AI agent systems that fetch URLs. Be concise.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}

/**
 * Ask Copilot CLI to provide a full security analysis of text.
 */
export async function fullSecurityAnalysis(
  input: string,
  guardResult: { classification: string; violations: string[] },
  redactResult: { count: number; types: string[] },
  urls: string[],
  ssrfResults: { url: string; safe: boolean }[]
): Promise<string> {
  const prompt = `I ran a full security scan on AI agent input: "${input.substring(0, 300)}".
Results:
- Prompt injection: ${guardResult.classification} (violations: ${guardResult.violations.join(', ') || 'none'})
- Secrets found: ${redactResult.count} (types: ${redactResult.types.join(', ') || 'none'})
- URLs checked: ${ssrfResults.map(r => `${r.url} → ${r.safe ? 'safe' : 'BLOCKED'}`).join('; ') || 'none'}

Provide a brief overall threat assessment: What's the risk level (Low/Medium/High/Critical)? What's the most dangerous finding? What should the agent operator do? Be concise — 3-4 sentences max.`;
  const response = await askCopilot(prompt);
  return response ? renderMarkdown(response) : '';
}
