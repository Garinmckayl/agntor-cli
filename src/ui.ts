import chalk from 'chalk';
import boxen from 'boxen';

const MAX_WIDTH = 75;

function wrapText(text: string, width: number): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.length <= width) return line;
      const words = line.split(' ');
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        if (current.length + word.length + 1 > width && current.length > 0) {
          lines.push(current);
          current = word;
        } else {
          current = current ? current + ' ' + word : word;
        }
      }
      if (current) lines.push(current);
      return lines.join('\n');
    })
    .join('\n');
}

const ICONS = {
  shield: '\uD83D\uDEE1\uFE0F',  // 🛡️
  lock: '\uD83D\uDD12',           // 🔒
  warning: '\u26A0\uFE0F',        // ⚠️
  fire: '\uD83D\uDD25',           // 🔥
  check: '\u2713',                 // ✓
  cross: '\u2717',                 // ✗
  brain: '\uD83E\uDDE0',          // 🧠
  mag: '\uD83D\uDD0D',            // 🔍
  key: '\uD83D\uDD11',            // 🔑
  ticket: '\uD83C\uDFAB',         // 🎫
  globe: '\uD83C\uDF10',          // 🌐
  money: '\uD83D\uDCB0',          // 💰
  skull: '\uD83D\uDC80',           // 💀
  sparkle: '\u2728',               // ✨
  block: '\uD83D\uDED1',          // 🛑
  pass: '\uD83D\uDFE2',           // 🟢
  target: '\u25CE',                // ◎
};

export function printBanner(): void {
  const banner = boxen(
    chalk.bold.red('agntor') + chalk.bold.white('-cli') +
      chalk.dim(' \u2014 Security scanner for AI agent systems\n') +
      chalk.dim('Powered by @agntor/sdk + GitHub Copilot CLI ') + chalk.dim(ICONS.shield),
    {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'red',
    }
  );
  console.log(banner);
}

export function printCopilotStatus(available: boolean): void {
  if (available) {
    console.log(
      chalk.dim('   ') +
        chalk.green(`${ICONS.check} GitHub Copilot CLI detected`) +
        chalk.dim(' \u2014 AI-powered explanations enabled ') +
        chalk.green(ICONS.brain)
    );
  } else {
    console.log(
      chalk.dim('   ') +
        chalk.yellow(`${ICONS.warning} GitHub Copilot CLI not found`) +
        chalk.dim(' \u2014 scan results only, no AI explanations')
    );
    console.log(
      chalk.dim('     Install: ') +
        chalk.cyan('gh extension install github/gh-copilot')
    );
  }
  console.log();
}

export function printSectionHeader(icon: string, title: string, subtitle?: string): void {
  console.log(
    chalk.bold.white(`   ${icon} ${title}`) +
      (subtitle ? chalk.dim(` \u2014 ${subtitle}`) : '')
  );
  console.log();
}

export function printGuardResult(
  classification: string,
  violations: string[],
  input: string
): void {
  const isBlocked = classification === 'block';
  const icon = isBlocked ? ICONS.block : ICONS.pass;
  const color = isBlocked ? chalk.red : chalk.green;
  const label = isBlocked ? 'BLOCKED' : 'PASS';

  console.log(
    chalk.dim('   ') +
      color.bold(`${icon} ${label}`) +
      chalk.dim(` \u2014 Prompt Injection Scan`)
  );
  console.log();

  if (isBlocked && violations.length > 0) {
    console.log(chalk.dim('   Violations detected:'));
    for (const v of violations) {
      console.log(chalk.red(`     ${ICONS.cross} ${v}`));
    }
    console.log();
  }

  // Show truncated input
  const preview = input.length > 80 ? input.substring(0, 80) + '...' : input;
  console.log(chalk.dim('   Input: ') + chalk.white(`"${preview}"`));
  console.log();
}

export function printRedactResult(
  redacted: string,
  findings: Array<{ type: string; span: [number, number] }>
): void {
  const count = findings.length;
  const icon = count > 0 ? ICONS.key : ICONS.pass;
  const color = count > 0 ? chalk.yellow : chalk.green;

  console.log(
    chalk.dim('   ') +
      color.bold(`${icon} ${count} secret(s) found`) +
      chalk.dim(' \u2014 Redaction Scan')
  );
  console.log();

  if (count > 0) {
    // Group by type
    const types: Record<string, number> = {};
    for (const f of findings) {
      types[f.type] = (types[f.type] || 0) + 1;
    }
    for (const [type, num] of Object.entries(types)) {
      console.log(chalk.yellow(`     ${ICONS.warning} ${type}`) + chalk.dim(` (${num}x)`));
    }
    console.log();
    console.log(chalk.dim('   Redacted output:'));
    const preview = redacted.length > 200 ? redacted.substring(0, 200) + '...' : redacted;
    console.log(chalk.white(`     ${preview}`));
    console.log();
  }
}

export function printSettlementResult(
  classification: string,
  riskScore: number,
  riskFactors: string[],
  reasoning: string
): void {
  const isBlocked = classification === 'block';
  const icon = isBlocked ? ICONS.skull : ICONS.pass;
  const color = isBlocked ? chalk.red : chalk.green;
  const label = isBlocked ? 'BLOCKED \u2014 Suspected Scam' : 'PASS \u2014 Transaction Appears Safe';

  console.log(
    chalk.dim('   ') + color.bold(`${icon} ${label}`)
  );
  console.log();

  // Risk score bar
  const barWidth = 30;
  const filled = Math.round(riskScore * barWidth);
  const empty = barWidth - filled;
  const barColor = riskScore >= 0.7 ? chalk.red : riskScore >= 0.4 ? chalk.yellow : chalk.green;
  const bar = barColor('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(empty));
  console.log(
    chalk.dim('   Risk Score: ') + bar + chalk.dim(` ${(riskScore * 100).toFixed(0)}%`)
  );
  console.log();

  if (riskFactors.length > 0) {
    console.log(chalk.dim('   Risk Factors:'));
    for (const f of riskFactors) {
      console.log(chalk.red(`     ${ICONS.warning} ${f}`));
    }
    console.log();
  }
}

export function printTicketResult(
  payload: Record<string, any>,
  valid: boolean,
  errorCode?: string
): void {
  const icon = valid ? ICONS.ticket : ICONS.block;
  const color = valid ? chalk.green : chalk.red;
  const label = valid ? 'VALID' : `INVALID \u2014 ${errorCode || 'Unknown error'}`;

  console.log(
    chalk.dim('   ') + color.bold(`${icon} ${label}`) + chalk.dim(' \u2014 Audit Ticket')
  );
  console.log();

  if (payload) {
    const level = payload.audit_level || 'Unknown';
    const levelColor = level === 'Platinum' ? chalk.magenta
      : level === 'Gold' ? chalk.yellow
      : level === 'Silver' ? chalk.white
      : chalk.dim;

    console.log(chalk.dim('   Agent:       ') + chalk.white(payload.sub || 'N/A'));
    console.log(chalk.dim('   Audit Level: ') + levelColor.bold(level));
    console.log(chalk.dim('   Issuer:      ') + chalk.white(payload.iss || 'N/A'));

    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const expired = expDate < now;
      console.log(
        chalk.dim('   Expires:     ') +
          (expired ? chalk.red(`${expDate.toISOString()} (EXPIRED)`) : chalk.green(expDate.toISOString()))
      );
    }

    if (payload.constraints) {
      const c = payload.constraints;
      console.log();
      console.log(chalk.dim('   Constraints:'));
      console.log(chalk.dim('     Max op value:    ') + chalk.white(`$${c.max_op_value || 'unlimited'}`));
      console.log(chalk.dim('     Kill switch:     ') +
        (c.kill_switch_active ? chalk.red.bold('ACTIVE \u2014 Agent is frozen') : chalk.green('inactive'))
      );
      if (c.allowed_mcp_servers?.length > 0) {
        console.log(chalk.dim('     MCP allowlist:   ') + chalk.white(c.allowed_mcp_servers.join(', ')));
      }
      if (c.max_ops_per_hour) {
        console.log(chalk.dim('     Rate limit:      ') + chalk.white(`${c.max_ops_per_hour}/hr`));
      }
      if (c.requires_x402_payment) {
        console.log(chalk.dim('     x402 required:   ') + chalk.yellow('yes'));
      }
    }
    console.log();
  }
}

export function printSsrfResult(url: string, safe: boolean, reason?: string): void {
  const icon = safe ? ICONS.globe : ICONS.block;
  const color = safe ? chalk.green : chalk.red;
  const label = safe ? 'SAFE' : 'BLOCKED';

  console.log(
    chalk.dim('   ') + color.bold(`${icon} ${label}`) +
      chalk.dim(' \u2014 ') + chalk.white(url)
  );
  if (!safe && reason) {
    console.log(chalk.red(`     ${reason}`));
  }
}

export function printExplanation(title: string, explanation: string): void {
  if (!explanation) return;
  const box = boxen(wrapText(explanation, MAX_WIDTH - 6), {
    title: chalk.cyan.bold(`${ICONS.brain} ${title}`),
    titleAlignment: 'left',
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 1, left: 3, right: 0 },
    borderStyle: 'round',
    borderColor: 'cyan',
  });
  console.log(box);
}

export function printFullScanHeader(input: string): void {
  const preview = input.length > 60 ? input.substring(0, 60) + '...' : input;
  const box = boxen(
    chalk.bold.white('Full Security Scan\n\n') +
      chalk.dim('Input: ') + chalk.white(`"${preview}"`),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 3, right: 0 },
      borderStyle: 'round',
      borderColor: 'red',
    }
  );
  console.log(box);
}

export function printDivider(): void {
  console.log(chalk.dim('   ' + '\u2500'.repeat(60)));
  console.log();
}

export function printFooter(): void {
  console.log(
    chalk.dim('   Powered by @agntor/sdk + GitHub Copilot CLI')
  );
  console.log();
}

export function printInfo(message: string): void {
  console.log(chalk.dim(`   ${ICONS.check} ${message}`));
}

export function printError(message: string): void {
  console.log(chalk.red(`   ${ICONS.cross} ${message}`));
}
