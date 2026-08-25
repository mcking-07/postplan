import { describe, expect, it } from 'vitest';
import { inbound, outbound } from '../../src/common';

describe('transform', () => {
  it('converts nested camelCase payloads to snake_case', () => {
    expect(inbound({ draftId: 'draft', metadata: { gitCommitSha: 'sha' }, entries: [{ fileSize: 10 }] })).toEqual({ draft_id: 'draft', metadata: { git_commit_sha: 'sha' }, entries: [{ file_size: 10 }] });
  });

  it('converts nested snake_case payloads to camelCase', () => {
    expect(outbound({ draft_id: 'draft', metadata: { git_commit_sha: 'sha' }, entries: [{ file_size: 10 }] })).toEqual({ draftId: 'draft', metadata: { gitCommitSha: 'sha' }, entries: [{ fileSize: 10 }] });
  });
});
