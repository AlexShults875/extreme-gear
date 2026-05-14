import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

export const emailRule = () => body('email')
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage('Email inválido')
  .normalizeEmail();

export const nameRule = () => body('name')
  .trim()
  .isLength({ min: 2 })
  .withMessage('Nome deve ter pelo menos 2 caracteres');

export const passwordRule = () => body('password')
  .isLength({ min: 8 })
  .withMessage('Senha deve ter pelo menos 8 caracteres');

export const optionalPasswordRule = () => body('newPassword')
  .optional()
  .isLength({ min: 8 })
  .withMessage('Nova senha deve ter pelo menos 8 caracteres');

export const productIdParamRule = () => param('id')
  .isInt({ min: 1 })
  .withMessage('ID do produto inválido');

export const productIdBodyRule = () => body('productId')
  .isInt({ min: 1 })
  .withMessage('ID do produto inválido');

export const ratingRule = () => body('rating')
  .optional()
  .isInt({ min: 1, max: 5 })
  .withMessage('Rating deve ser entre 1 e 5');

export const addressRule = () => body('address')
  .trim()
  .notEmpty()
  .withMessage('Endereço é obrigatório');

export const phoneRule = () => body('phone')
  .trim()
  .notEmpty()
  .withMessage('Telefone é obrigatório');

export const commentRule = () => body('comment')
  .optional()
  .trim();

export const totalRule = () => body('total')
  .isFloat({ min: 0 })
  .withMessage('Total deve ser um número positivo');

export const itemsRule = () => body('items')
  .isArray({ min: 1 })
  .withMessage('Items deve ser um array não vazio')
  .custom(items => {
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error('Cada item deve ter productId, quantity e price');
      }
      if (item.quantity < 1) throw new Error('Quantidade deve ser >= 1');
      if (item.price < 0) throw new Error('Preço deve ser >= 0');
    }
    return true;
  });

export const roleRule = () => body('role')
  .isIn(['ADMIN', 'CUSTOMER'])
  .withMessage('Função inválida');

export const isBlockedRule = () => body('isBlocked')
  .isBoolean()
  .withMessage('isBlocked deve ser booleano');

export const userIdParamRule = () => param('id')
  .isInt({ min: 1 })
  .withMessage('ID de usuário inválido');

export const searchQueryRule = () => query('search')
  .optional()
  .trim();

export const pageQueryRule = () => query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('Página deve ser um número inteiro positivo');

export const limitQueryRule = () => query('limit')
  .optional()
  .isInt({ min: 1, max: 100 })
  .withMessage('Limit deve ser entre 1 e 100');

export const categoryQueryRule = () => query('category')
  .optional()
  .trim();

export const brandQueryRule = () => query('brand')
  .optional()
  .trim();

export const minPriceQueryRule = () => query('minPrice')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('minPrice deve ser um número positivo');

export const maxPriceQueryRule = () => query('maxPrice')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('maxPrice deve ser um número positivo');

export const sortByQueryRule = () => query('sortBy')
  .optional()
  .isIn(['newest', 'price_asc', 'price_desc'])
  .withMessage('sortBy inválido');
