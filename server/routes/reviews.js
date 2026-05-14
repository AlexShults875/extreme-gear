/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews management
 */

import express from 'express';
import prisma from '../prismaClient.js';
import authenticate from '../middleware/auth.js';
import {
  productIdBodyRule,
  ratingRule,
  handleValidationErrors,
} from '../validators/index.js';

const router = express.Router();

// POST /reviews (без изменений)
router.post('/',
  authenticate,
  productIdBodyRule(),
  ratingRule(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { productId, text, rating } = req.body;
      const productExists = await prisma.product.findUnique({
        where: { id: Number(productId) }
      });
      if (!productExists) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      const validatedRating = Math.max(1, Math.min(5, Number(rating) || 5));
      const review = await prisma.review.create({
        data: {
          productId: Number(productId),
          authorId: req.user.id,
          text: text ? text.trim() : '',
          rating: validatedRating
        },
        include: {
          author: {
            select: { name: true, avatar: true }
          }
        }
      });
      res.status(201).json(review);
    } catch (error) {
      console.error('🔥 Erro ao salvar avaliação:', error);
      res.status(500).json({ error: 'Não foi possível salvar a avaliação' });
    }
  }
);

// GET /reviews/product/:productId (без изменений)
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }
    const reviews = await prisma.review.findMany({
      where: { productId: productId },
      include: {
        author: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error('🔥 Erro ao obter avaliações:', error);
    res.status(500).json({ error: 'Erro no servidor ao obter avaliações' });
  }
});

// PUT /reviews/:id – обновить отзыв (только автор или ADMIN)
router.put('/:id',
  authenticate,
  ratingRule(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);
      if (isNaN(reviewId)) return res.status(400).json({ error: 'ID da avaliação inválido' });

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { author: true }
      });
      if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });

      // Проверка прав: автор или ADMIN
      const isAuthor = review.authorId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'Você não tem permissão para editar esta avaliação' });
      }

      const { text, rating } = req.body;
      const validatedRating = rating !== undefined ? Math.max(1, Math.min(5, Number(rating))) : review.rating;
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          text: text !== undefined ? text.trim() : review.text,
          rating: validatedRating
        },
        include: {
          author: {
            select: { name: true, avatar: true }
          }
        }
      });
      res.json(updatedReview);
    } catch (error) {
      console.error('🔥 Erro ao atualizar avaliação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /reviews/:id – удалить отзыв (только автор или ADMIN)
router.delete('/:id',
  authenticate,
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);
      if (isNaN(reviewId)) return res.status(400).json({ error: 'ID da avaliação inválido' });

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { author: true }
      });
      if (!review) return res.status(404).json({ error: 'Avaliação não encontrada' });

      const isAuthor = review.authorId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir esta avaliação' });
      }

      await prisma.review.delete({ where: { id: reviewId } });
      res.json({ message: 'Avaliação excluída com sucesso' });
    } catch (error) {
      console.error('🔥 Erro ao excluir avaliação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
