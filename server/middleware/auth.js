import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

export default async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação obrigatória' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(403).json({ error: 'Formato de token inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Sua conta está bloqueada' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'O token expirou',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}
