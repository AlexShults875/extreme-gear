import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Extreme Gear Shop API',
      version: '1.0.0',
      description: 'API для магазина экстремального снаряжения. Управление товарами, заказами, пользователями, отзывами и лайками.',
      contact: {
        name: 'Extreme Gear Team',
        email: 'support@extremegear.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Локальный сервер разработки',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // пути к файлам с JSDoc комментариями
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📚 Swagger documentation available at http://localhost:5000/api-docs');
};
