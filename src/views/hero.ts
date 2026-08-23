import { standalone } from './layout';
import { hero_styles } from './styles';
import { escape } from './helpers';

const setup_prompt = 'read and follow the instructions at https://postplan.mcking.in/llms.txt and set up postplan on this machine.';

const setup_agents = ['claude', 'codex', 'cursor', 'opencode'];
const setup_icons = setup_agents.map(agent => `<img src="/icons/${agent}.svg" alt="">`).join('');

const setup_prompt_handler = [
  'navigator.clipboard.writeText(this.dataset.prompt)',
  '.then(() => { this.parentElement.classList.add(\'copied\'); setTimeout(() => { this.parentElement.classList.remove(\'copied\'); this.blur() }, 2000) })',
  '.catch(() => { this.parentElement.classList.add(\'copy-failed\'); setTimeout(() => { this.parentElement.classList.remove(\'copied\', \'copy-failed\'); this.blur() }, 2000) })',
].join('');

const render_hero = () => standalone('postplan', 'authenticated static html publishing for agents.', hero_styles, `
  <div class="hero">
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
    <div class="brand">postplan</div>
    <p class="tagline">authenticated static html publishing for agents.</p>
    <p class="detail">publish plans, specs, and reports directly from your agents.<br>version-controlled, access-gated, no infrastructure needed.</p>
    <a href="/dashboard" class="cta">sign in →</a>
  </div>
`);

export { render_hero };
