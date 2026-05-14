/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Product likes management (favorites)
 */

import express from 'express';
import prisma from '../prismaClient.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /likes/status/{productId}:
 *   get:
 *     summary: Get like status for current user and total likes count for a product
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Like status and count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked: { type: boolean }
 *                 count: { type: integer }
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Server error
 */
router.get('/status/:productId', authenticate, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }

    const userId = req.user.id;

    const [like, count] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_productId: { userId, productId }
        }
      }),
      prisma.like.count({ where: { productId } })
    ]);

    res.json({ liked: !!like, count });
  } catch (error) {
    console.error('Erro ao obter status do like:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /likes/toggle/{productId}:
 *   post:
 *     summary: Toggle like on a product (add or remove)
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked: { type: boolean }
 *                 count: { type: integer }
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Server error
 */
router.post('/toggle/:productId', authenticate, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }

    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    let liked;
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: { userId, productId }
      });
      liked = true;
    }

    const count = await prisma.like.count({ where: { productId } });

    res.json({ liked, count });
  } catch (error) {
    console.error('Erro ao alternar like:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /likes/user:
 *   get:
 *     summary: Get all liked products for current user
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of liked products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   name: { type: string }
 *                   price: { type: number }
 *                   imageUrl: { type: string }
 *                   brand: { type: string }
 *                   stock: { type: integer }
 *       500:
 *         description: Server error
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const items = likes.map(like => ({
      id: like.product.id,
      name: like.product.name,
      title: like.product.name,
      price: like.product.price,
      brand: like.product.brand,
      imageUrl: like.product.imageUrl,
      stock: like.product.stock,
      description: like.product.description,
      category: like.product.category,
      likesCount: like.product.likes ? like.product.likes.length : 0
    }));
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar likes do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
