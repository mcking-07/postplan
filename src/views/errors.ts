import { standalone } from './layout';
import { error_styles } from './styles';

const render_error = (status: number, message: string) => standalone(message, message, error_styles, `
  <div class="not-found">
    <h1>${status}</h1>
    <p>${message}</p>
    <a href="/">← postplan</a>
  </div>
`);

export { render_error };
