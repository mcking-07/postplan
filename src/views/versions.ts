import type { DraftVersionType, VersionsParamsType } from '../types';
import { escape, format_bytes, format_date } from './helpers';
import { shell } from './layout';

const commit_cell = (version: DraftVersionType) => {
  if (!version.git_commit_subject) return '';

  return `<span class="tip">${escape(version.git_commit_subject)}</span>`;
};

const ref_tip = (version: DraftVersionType) => {
  const parts: string[] = [];
  if (version.git_branch) parts.push(version.git_branch);
  if (version.git_dirty) parts.push('(dirty)');

  return parts.join(' ');
};

const ref_cell = (version: DraftVersionType) => {
  if (!version.git_commit_sha && !version.git_branch) return '';

  const sha = version.git_commit_sha ? escape(version.git_commit_sha.slice(0, 7)) : '';
  const branch = version.git_branch ? ` ${escape(version.git_branch)}` : '';
  const dirty = version.git_dirty ? ' *' : '';

  return `<span class="tip">${sha}${branch}${dirty}</span>`;
};

const version_item = (version: DraftVersionType, base: string, id: string) => `<tr>
  <td><a href="${base}/d/${escape(id)}/version/${version.version_number}" target="_blank" rel="noopener noreferrer">v${version.version_number}</a></td>
  <td class="dim"${version.git_commit_subject ? ` data-tip="${escape(version.git_commit_subject)}"` : ''}>${commit_cell(version)}</td>
  <td class="dim"${ref_tip(version) ? ` data-tip="${escape(ref_tip(version))}"` : ''}>${ref_cell(version)}</td>
  <td class="dim">${format_bytes(version.file_size)}</td>
  <td class="dim">${format_date(version.created_at)}</td>
</tr>`;

const render_versions = ({ id, title, description, rows, base, email, role, team }: VersionsParamsType) => {
  const body = `
    <h1>${escape(title)}</h1>
    ${description ? `<div class="desc">${escape(description)}</div>` : ''}
    <p class="url"><a href="${base}/d/${id}" target="_blank" rel="noopener noreferrer">${escape(`${base}/d/${id}`)}</a></p>
    <table class="versions">
      <thead><tr><th>Version</th><th>Commit</th><th>Ref</th><th>Size</th><th>Published</th></tr></thead>
      <tbody>
        ${rows.map(version => version_item(version, base, id)).join('')}
      </tbody>
    </table>
  `;

  return shell({ title: 'postplan versions', description: `version history for ${title}.`, email, role, team, body });
};

export { render_versions };
