import express from 'express';
import prisma from '../prismaClient.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Получить корзину текущего пользователя (без изменения stock)
router.get('/', authenticate, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    const items = cartItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      brand: item.product.brand,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      stock: item.product.stock
    }));
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Добавить товар (или увеличить количество) – резервируем со склада
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    // Начинаем транзакцию, чтобы изменения stock и корзины были атомарными
    await prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user.id,
            productId: Number(productId)
          }
        }
      });

      let newQuantity;
      if (existing) {
        newQuantity = existing.quantity + quantity;
        if (newQuantity > product.stock + existing.quantity) {
          throw new Error('Not enough stock');
        }
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQuantity }
        });
      } else {
        newQuantity = quantity;
        await tx.cartItem.create({
          data: {
            userId: req.user.id,
            productId: Number(productId),
            quantity: newQuantity
          }
        });
      }

      // Уменьшаем stock на добавляемое количество
      await tx.product.update({
        where: { id: Number(productId) },
        data: { stock: { decrement: quantity } }
      });
    });

    // Вернуть обновлённую корзину
    const updatedCart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    const items = updatedCart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      brand: item.product.brand,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      stock: item.product.stock
    }));
    res.json(items);
  } catch (error) {
    console.error(error);
    const message = error.message === 'Not enough stock' ? error.message : 'Failed to add to cart';
    res.status(500).json({ error: message });
  }
});

// Обновить количество товара – корректируем резервирование
router.put('/update', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) return res.status(400).json({ error: 'Product ID and quantity required' });
    if (quantity < 1) return res.status(400).json({ error: 'Quantity must be >=1' });

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user.id,
            productId: Number(productId)
          }
        }
      });
      if (!cartItem) throw new Error('Item not in cart');

      const oldQuantity = cartItem.quantity;
      if (quantity > oldQuantity) {
        const extra = quantity - oldQuantity;
        if (product.stock < extra) throw new Error('Not enough stock');
        // Уменьшаем stock на дополнительное количество
        await tx.product.update({
          where: { id: Number(productId) },
          data: { stock: { decrement: extra } }
        });
      } else if (quantity < oldQuantity) {
        const decrease = oldQuantity - quantity;
        // Возвращаем на склад
        await tx.product.update({
          where: { id: Number(productId) },
          data: { stock: { increment: decrease } }
        });
      }

      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity }
      });
    });

    const updatedCart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    const items = updatedCart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      brand: item.product.brand,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      stock: item.product.stock
    }));
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to update cart' });
  }
});

// Удалить товар из корзины – вернуть на склад
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

    await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user.id,
            productId
          }
        }
      });
      if (!cartItem) return;

      // Возвращаем на склад
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: cartItem.quantity } }
      });

      await tx.cartItem.delete({
        where: { id: cartItem.id }
      });
    });

    const updatedCart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    const items = updatedCart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      brand: item.product.brand,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      stock: item.product.stock
    }));
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Очистить корзину – вернуть все товары на склад
router.delete('/clear', authenticate, async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({ where: { userId: req.user.id } });
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
    });
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
