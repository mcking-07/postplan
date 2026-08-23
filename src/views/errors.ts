import { standalone } from './layout';
import { not_found_styles } from './styles';

const render_not_found = () => standalone('not found', 'page not found.', not_found_styles, `
  <div class="not-found">
    <h1>404</h1>
    <p>page not found.</p>
    <a href="/">← postplan</a>
  </div>
`);

export { render_not_found };
