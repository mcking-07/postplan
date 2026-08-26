import { colors, fonts, layout, spacing } from './tokens';

const reset = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
`;

const base = `
  body {
    font-family: ${fonts.stack};
    font-size: ${fonts.body};
    line-height: ${layout.line_height};
    background: ${colors.bg};
    color: ${colors.text};
  }

  a { color: inherit; }
  a:hover { color: ${colors.white}; }
`;

const typography = `
  h1 {
    font-size: ${fonts.heading};
    font-weight: 600;
    color: ${colors.muted};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: ${spacing.gap};
  }

  h2 {
    font-size: ${fonts.subheading};
    font-weight: 600;
    color: ${colors.dim};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: ${spacing.gap};
    margin-top: 2rem;
  }

  h2:first-child { margin-top: 0; }

  .dim { color: ${colors.dim}; }
  .muted { color: ${colors.muted}; font-size: ${fonts.small}; }
  .warn { color: #c44; font-size: ${fonts.xs}; }
`;

const header = `
  header {
    padding: ${spacing.page_mobile} ${spacing.page};
  }

  header nav {
    max-width: ${layout.max_width};
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${colors.border};
    padding-bottom: ${spacing.page_mobile};
  }

  header .brand {
    font-weight: 700;
    font-size: 15px;
    color: ${colors.white};
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  header .actions {
    display: flex;
    align-items: center;
    gap: ${spacing.gap};
  }

  header .icon-link {
    display: flex;
    align-items: center;
  }

  header .icon-link img {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
    opacity: 0.5;
    transition: opacity 0.18s;
  }

  header .icon-link:hover img { opacity: 1; }

  header .identity {
    position: relative;
    cursor: default;
  }

  header .avatar {
    width: ${layout.avatar};
    height: ${layout.avatar};
    border-radius: 50%;
    background: ${colors.border};
    color: ${colors.muted};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${fonts.xs};
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  header .avatar:hover {
    background: ${colors.ghost};
    color: ${colors.text};
  }

  header .dropdown {
    display: none;
    position: absolute;
    right: 0;
    top: 36px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    padding: 8px 12px;
    z-index: 10;
    min-width: 180px;
  }

  header .identity:focus-within .dropdown { display: block; }

  header .dropdown-email {
    font-size: ${fonts.xs};
    color: ${colors.muted};
    display: block;
    padding-bottom: 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid ${colors.border};
  }

  header .dropdown-link {
    font-size: ${fonts.xs};
    color: #666;
    text-decoration: none;
    display: block;
    padding: 4px 0;
  }

  header .dropdown-link:hover { color: ${colors.text}; }

  header .dropdown-link.signout {
    padding-top: 4px;
  }

  header .dropdown-link.signout:hover { color: ${colors.red}; }
`;

const content = `
  main {
    max-width: ${layout.max_width};
    margin: 0 auto;
    padding: ${spacing.page};
  }
`;

const tables = `
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${fonts.small};
  }

  th {
    text-align: left;
    padding: ${spacing.gap_sm} 0;
    color: ${colors.muted};
    font-weight: 500;
    font-size: ${fonts.xxs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid ${colors.border};
  }

  td {
    padding: ${spacing.gap_sm} 0;
    border-bottom: 1px solid ${colors.surface};
    vertical-align: top;
  }

  td + td, th + th { padding-left: 1rem; }
  td a { text-decoration: underline; text-underline-offset: 2px; text-decoration-color: ${colors.ghost}; }
  td a:hover { text-decoration-color: ${colors.muted}; }

  table.versions { table-layout: fixed; }
  table.versions th:nth-child(1) { width: 70px; }
  table.versions th:nth-child(2) { width: 35%; }
  table.versions th:nth-child(3) { width: 20%; }
  table.versions th:nth-child(4) { width: 60px; }
  table.versions th:nth-child(5) { width: 130px; }
  table.versions td:nth-child(2) { position: relative; }

  table.versions td:nth-child(2) .tip {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: default;
  }

  table.versions td:nth-child(2)::after {
    content: attr(data-tip);
    display: none;
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 8px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    padding: 6px 10px;
    font-size: ${fonts.xs};
    color: ${colors.text};
    white-space: normal;
    max-width: 400px;
    z-index: 10;
    line-height: 1.4;
  }

  table.versions td:nth-child(2)[data-tip]:hover::after { display: block; }
  table.versions td:nth-child(4),
  table.versions td:nth-child(5) { white-space: nowrap; }
`;

const tags = `
  .tag {
    display: inline-block;
    font-size: ${fonts.xxs};
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 500;
  }

  .tag.admin { background: ${colors.amber_bg}; color: ${colors.amber}; }
  .tag.member { background: ${colors.surface}; color: #666; }
  .tag.disabled { background: ${colors.red_bg}; color: ${colors.red_tag}; }
  .tag.active { background: ${colors.green_bg}; color: ${colors.green}; }
`;

const buttons = `
  button, .btn {
    font-family: inherit;
    font-size: ${fonts.xs};
    padding: 4px 10px;
    border: 1px solid ${colors.ghost};
    background: ${colors.surface};
    color: ${colors.muted};
    cursor: pointer;
    transition: all 0.1s;
  }

  button:hover, .btn:hover {
    background: ${colors.border};
    color: ${colors.text};
    border-color: ${colors.dim};
  }

  button.primary {
    background: ${colors.text};
    color: ${colors.black};
    border-color: ${colors.text};
    font-weight: 600;
  }

  button.primary:hover {
    background: ${colors.white};
    border-color: ${colors.white};
  }

  button.danger {
    border-color: ${colors.red_border};
    color: ${colors.red};
    background: transparent;
  }

  button.danger:hover {
    background: ${colors.red_bg};
    border-color: ${colors.red_hover};
    color: ${colors.red_bright};
  }
`;

const forms = `
  input[type="text"] {
    font-family: inherit;
    font-size: ${fonts.small};
    padding: 4px 8px;
    background: ${colors.surface};
    border: 1px solid ${colors.ghost};
    color: ${colors.text};
    outline: none;
  }

  input[type="text"]::placeholder { color: ${colors.dim}; }
  input[type="text"]:focus { border-color: ${colors.muted}; }

  .row {
    display: flex;
    gap: ${spacing.gap_sm};
    align-items: center;
  }

  .row input[type="text"] { flex: 1; }
`;

const banners = `
  .banner {
    padding: ${spacing.gap} 1rem;
    margin-bottom: 1.5rem;
    font-size: ${fonts.small};
    border-left: 3px solid;
  }

  .banner.success {
    border-color: ${colors.green};
    background: ${colors.banner_green_bg};
    color: ${colors.green_text};
  }

  .banner.neutral {
    border-color: ${colors.muted};
    background: ${colors.surface};
    color: ${colors.muted};
  }
`;

const tokens = `
  .token-row {
    display: flex;
    gap: ${spacing.gap_sm};
    align-items: center;
    margin-top: ${spacing.gap_sm};
  }

  .token-display {
    flex: 1;
    font-family: inherit;
    font-size: ${fonts.small};
    background: #0a0a0a;
    padding: ${spacing.gap_sm} ${spacing.gap};
    word-break: break-all;
    color: ${colors.amber};
    border: 1px solid ${colors.border};
    outline: none;
  }

  .copy {
    font-family: inherit;
    font-size: ${fonts.xs};
    padding: 4px 10px;
    border: 1px solid ${colors.ghost};
    background: ${colors.surface};
    color: ${colors.muted};
    cursor: pointer;
    white-space: nowrap;
  }

  .copy:hover {
    background: ${colors.border};
    color: ${colors.text};
    border-color: ${colors.dim};
  }
`;

const components = `
  .nav { font-size: ${fonts.xs}; color: ${colors.muted}; margin-bottom: 1.5rem; }
  .nav a { color: ${colors.muted}; text-decoration: none; }
  .nav a:hover { color: ${colors.muted}; }

  .desc { font-size: ${fonts.xs}; color: #666; margin-bottom: ${spacing.gap}; }

  .url { font-size: ${fonts.xxs}; margin-bottom: 1.5rem; }
  .url a { color: ${colors.dim}; text-decoration: none; }
  .url a:hover { color: ${colors.white}; }

  .empty {
    color: ${colors.dim};
    padding: 1rem 0;
    font-size: ${fonts.small};
  }

  .item {
    padding: 0.625rem 0;
    border-bottom: 1px solid ${colors.surface};
  }

  .item:last-child { border-bottom: none; }

  .item .item-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }

  .item .title {
    color: ${colors.text};
    text-decoration: none;
    font-weight: 500;
  }

  .item .title:hover { color: ${colors.white}; }

  .item .meta {
    font-size: ${fonts.xs};
    color: ${colors.dim};
    margin-top: 2px;
  }

  .item .desc {
    font-size: ${fonts.xs};
    color: #666;
    margin-top: 2px;
  }

  .item .url {
    font-size: ${fonts.xxs};
    color: ${colors.ghost};
    margin-top: 2px;
  }

  .setup {
    margin-top: 1rem;
    padding: 1rem;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    font-size: ${fonts.xs};
    color: #666;
  }

  .setup code { color: ${colors.text}; }

  .stats {
    font-size: ${fonts.xs};
    color: ${colors.dim};
    margin-bottom: 1rem;
  }

  .disable-pop {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    gap: ${spacing.gap_sm};
    align-items: center;
    white-space: nowrap;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    padding: 0 8px;
    z-index: 10;
  }

  .disable-pop input { width: 220px; }

  .log-meta {
    font-size: ${fonts.xxs};
    color: ${colors.dim};
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const responsive = `
  @media (max-width: ${layout.breakpoint}) {
    header { padding: ${spacing.page_mobile}; }
    main { padding: ${spacing.page_mobile}; }

    .item .item-head {
      flex-direction: column;
      gap: 2px;
    }

    .row {
      flex-direction: column;
      align-items: stretch;
    }

    .row input[type="text"] { width: 100%; }

    table { font-size: ${fonts.xs}; }
    th, td { padding: ${spacing.gap_sm} 0; }

    table.versions { table-layout: auto; }
    table.versions th:nth-child(3),
    table.versions td:nth-child(3),
    table.versions th:nth-child(4),
    table.versions td:nth-child(4) { display: none; }

    .disable-pop {
      position: fixed;
      left: 0;
      right: 0;
      top: auto;
      bottom: 0;
      padding: ${spacing.page_mobile};
      flex-wrap: wrap;
    }

    .disable-pop input { width: 100%; }

    .token-row { flex-direction: column; }
    .token-display { width: 100%; }
  }
`;

const centered = `
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
  }
`;

const not_found = `
  .not-found h1 { font-size: 48px; font-weight: 700; color: ${colors.ghost}; margin-bottom: 0.5rem; }
  .not-found p { color: ${colors.muted}; margin-bottom: 1.5rem; }
  .not-found a { color: ${colors.dim}; text-decoration: none; font-size: ${fonts.small}; }
  .not-found a:hover { color: ${colors.text}; }
`;

const hero = `
  .hero { max-width: 640px; padding: 2rem; }

  .hero .brand {
    font-size: 24px;
    font-weight: 700;
    color: ${colors.white};
    letter-spacing: -0.02em;
    margin-bottom: 1.5rem;
  }

  .hero .tagline {
    font-size: ${fonts.body};
    color: ${colors.muted};
    margin-bottom: 1rem;
    line-height: 1.8;
  }

  .hero .detail {
    font-size: ${fonts.small};
    color: ${colors.dim};
    line-height: 1.8;
    margin-bottom: 2rem;
  }

  .hero .cta {
    display: inline-block;
    font-family: inherit;
    font-size: ${fonts.small};
    color: ${colors.text};
    text-decoration: none;
    border: 1px solid ${colors.ghost};
    padding: 6px 16px;
    transition: all 0.1s;
  }

  .hero .cta:hover {
    color: ${colors.white};
    border-color: ${colors.dim};
    background: ${colors.surface};
  }

  .hero .setup-wrap {
    position: relative;
    display: inline-block;
    margin-bottom: 2rem;
  }

  .hero .setup-prompt {
    appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    line-height: ${layout.line_height};
    padding: 6px 12px;
    border: 1px solid ${colors.border};
    border-radius: 999px;
    background: ${colors.bg};
    color: ${colors.text};
    font-family: inherit;
    font-size: ${fonts.small};
    white-space: nowrap;
    cursor: pointer;
  }

  .hero .setup-prompt:hover,
  .hero .setup-prompt:focus-visible {
    background: ${colors.surface};
    border-color: ${colors.dim};
    color: ${colors.white};
  }

  .hero .setup-icons {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .hero .setup-icons img {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
    opacity: 0.75;
  }

  .hero .setup-tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.5rem);
    display: none;
    width: max-content;
    max-width: min(90vw, 360px);
    padding: 4px 8px;
    transform: translateX(-50%);
    border: 1px solid ${colors.border};
    border-radius: 0.5rem;
    background: ${colors.surface};
    color: ${colors.text};
    font-size: ${fonts.xxs};
    white-space: nowrap;
  }

  @media (hover: hover) {
    .hero .setup-wrap:hover .setup-tooltip-hover {
      display: block;
    }
  }

  .hero .setup-wrap:has(.setup-prompt:focus-visible) .setup-tooltip-hover,
  .hero .setup-wrap.copied .setup-tooltip-click,
  .hero .setup-wrap.copy-failed .setup-tooltip-failure {
    display: block;
  }

  .hero .setup-wrap.copied .setup-tooltip-hover,
  .hero .setup-wrap.copy-failed .setup-tooltip-hover {
    display: none;
  }
`;

const error_styles = [reset, base, centered, not_found].join('\n');

const hero_styles = [reset, base, centered, hero].join('\n');

const page_styles = [reset, base, typography, header, content, tables, tags, buttons, forms, banners, tokens, components, responsive].join('\n');

export { error_styles, hero_styles, page_styles };
