/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

import express from 'express';
import prisma from '../prismaClient.js';
import authenticate from '../middleware/auth.js';
import {
  itemsRule,
  totalRule,
  addressRule,
  phoneRule,
  commentRule,
  handleValidationErrors,
} from '../validators/index.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, total, address, phone]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer }
 *                     quantity: { type: integer, minimum: 1 }
 *                     price: { type: number }
 *               total: { type: number }
 *               address: { type: string }
 *               phone: { type: string }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error (empty cart, missing address/phone)
 *       500:
 *         description: Server error
 */
router.post('/',
  authenticate,
  itemsRule(),
  totalRule(),
  addressRule(),
  phoneRule(),
  commentRule(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { items, total, address, phone, comment } = req.body;

      // Проверка, что все товары есть в корзине (можно опционально)
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user.id }
      });
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Создаём заказ в транзакции (списание stock уже произошло при добавлении в корзину)
      const newOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: req.user.id,
            total: total,
            status: 'PENDING',
            address: address,
            phone: phone,
            comment: comment || null,
            items: {
              create: items.map(item => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
                price: item.price
              }))
            }
          },
          include: { items: true }
        });

        // Очищаем корзину пользователя (товары уже учтены на складе)
        await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

        // НЕ обновляем stock, потому что он уже уменьшен при добавлении в корзину
        return order;
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error('🔥 Erro ao criar pedido:', error);
      res.status(500).json({ error: 'Não foi possível finalizar o pedido' });
    }
  }
);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   total: { type: number }
 *                   status: { type: string }
 *                   address: { type: string }
 *                   phone: { type: string }
 *                   comment: { type: string }
 *                   createdAt: { type: string, format: date-time }
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         quantity: { type: integer }
 *                         price: { type: number }
 *                         product: { type: object }
 *       500:
 *         description: Server error
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter pedidos' });
  }
});

export default router;
