import type { ShellParamsType } from '../types';
import { escape } from './helpers';
import { page_styles } from './styles';
import { colors } from './tokens';

const keys_icon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 5 7 8 4 11"/><line x1="9" y1="11" x2="12" y2="11"/>
</svg>`;

const favicon = '/favicon.svg';

const shell = ({ title, description, email, role, team, body }: ShellParamsType) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${colors.bg}">
  ${description ? `<meta name="description" content="${escape(description)}">` : ''}
  <title>${escape(title)}</title>
  <link rel="icon" href="${favicon}" type="image/svg+xml">
  <style>${page_styles}</style>
</head>
<body>
  <header><nav>
    <a href="/dashboard" class="brand">postplan</a>
    <span class="actions">
      <a href="/cli/auth" class="icon-link" title="keys">${keys_icon}</a>
      <span class="identity">
        <span class="avatar" tabindex="0">${escape(email[0] ?? '')}</span>
        <span class="dropdown">
          <span class="dropdown-email">${escape(email)}</span>
          ${role === 'admin' ? '<a href="/admin" class="dropdown-link">admin</a>' : ''}
          ${team ? `<a href="https://${escape(team)}/cdn-cgi/access/logout" class="dropdown-link signout">sign out</a>` : ''}
        </span>
      </span>
    </span>
  </nav></header>
  <main>
    ${body}
  </main>
</body>
</html>`;

const standalone = (title: string, description: string, styles: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${colors.bg}">
  <meta name="description" content="${escape(description)}">
  <title>${escape(title)}</title>
  <link rel="icon" href="${favicon}" type="image/svg+xml">
  <style>${styles}</style>
</head>
<body>
  ${body}
</body>
</html>`;

export { shell, standalone };
