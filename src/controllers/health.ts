import { loggerFor, responsify } from '../common';
import { services } from '../services';

const logger = loggerFor('controllers/health');

class HealthController {
  private get_service = () => services.resolve('service:health');

  check = async () => {
    const service = this.get_service();
    const response = await service.check();

    logger.info(`health check: ${response.status}`);
    const status = response.status === 'healthy' ? 200 : 503;

    return responsify({ status, body: response });
  };
}

export { HealthController };
