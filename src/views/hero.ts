import { standalone } from './layout';
import { hero_styles } from './styles';
import { escape } from './helpers';

const setup_prompt = 'read and follow the instructions at https://postplan.mcking.in/llms.txt and set up postplan on this machine.';

const setup_agents = ['claude', 'codex', 'cursor', 'opencode'];
const setup_icons = setup_agents.map(agent => `<img src="/icons/${agent}.svg" alt="${agent}">`).join('');

const setup_prompt_handler = [
  'navigator.clipboard.writeText(this.dataset.prompt)',
  '.then(() => { this.parentElement.classList.add(\'copied\'); setTimeout(() => { this.parentElement.classList.remove(\'copied\'); this.blur() }, 2000) })',
  '.catch(() => { this.parentElement.classList.add(\'copy-failed\'); setTimeout(() => { this.parentElement.classList.remove(\'copied\', \'copy-failed\'); this.blur() }, 2000) })',
].join('');

const structured_data = {
  '@context': 'https://schema.org',
  '@type': ['SoftwareApplication', 'WebApplication'],
  'name': 'postplan',
  'description': 'authenticated artifact publishing for agents.',
  'url': 'https://postplan.mcking.in',
  'image': 'https://postplan.mcking.in/og-image.png',
  'screenshot': 'https://postplan.mcking.in/og-image.png',
  'applicationCategory': 'DeveloperApplication',
  'operatingSystem': 'Any',
  'softwareVersion': '1.0.0',
  'license': 'https://opensource.org/licenses/MIT',
  'keywords': ['postplan', 'artifact publishing', 'ai agents', 'cloudflare workers'],
  'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
  'author': { '@type': 'Person', 'name': 'Mohammed Muzammil Anwar', 'url': 'https://github.com/mcking-07' },
};

const render_hero = () => standalone('postplan', 'authenticated artifact publishing for agents.', hero_styles, `
  <div class="hero">
    <a href="https://github.com/mcking-07/postplan" class="source" target="_blank" rel="noopener noreferrer"><img src="/icons/github.svg" alt="github"></a>
    <div class="setup-wrap">
      <span id="setup-prompt-tooltip" class="setup-tooltip setup-tooltip-hover" role="status">copies a setup prompt for your ai coding tool.</span>
      <span class="setup-tooltip setup-tooltip-click" role="status">setup prompt copied.</span>
      <span class="setup-tooltip setup-tooltip-failure" role="status">failed to copy setup prompt</span>
      <button type="button" class="setup-prompt" data-prompt="${escape(setup_prompt)}" aria-describedby="setup-prompt-tooltip" onclick="${escape(setup_prompt_handler)}">
        <span>onboard your agents to postplan</span>
        <span class="setup-icons" aria-hidden="true">
          ${setup_icons}
        </span>
      </button>
    </div>
    <h1 class="brand">postplan</h1>
    <p class="tagline">authenticated artifact publishing for agents.</p>
    <p class="detail">publish plans, reports, and interactive demos directly from your agents.<br>version-controlled, access-gated, sandboxed, no infrastructure needed.</p>
    <a href="/dashboard" class="cta">sign in →</a>
  </div>
  <script type="application/ld+json">${JSON.stringify(structured_data)}</script>
`);

export { render_hero };
