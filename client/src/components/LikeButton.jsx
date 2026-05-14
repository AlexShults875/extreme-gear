import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Spin, message } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import { likesApi } from '../api';
import { useTranslation } from 'react-i18next';

export default function LikeButton({ productId, initialCount }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!productId || !user) return;

      try {
        setLoading(true);
        const response = await likesApi.getLikeStatus(productId);
        setLiked(response.liked);
      } catch (err) {
        console.error('Erro ao obter status do like:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeStatus();
  }, [user, productId]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      message.info(t('likes.loginRequired') || 'Faça login para adicionar aos favoritos');
      return;
    }

    if (!productId) return;

    try {
      setLoading(true);
      const response = await likesApi.toggleLike(productId);
      setLiked(response.liked);

      if (response.liked) {
        message.success(t('likes.added') || 'Adicionado aos favoritos');
      }
    } catch (err) {
      console.error('Erro ao alternar like:', err);
      message.error(t('likes.updateError') || 'Falha ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const tooltipText = !user
    ? (t('likes.loginRequired') || 'Faça login na sua conta')
    : liked
      ? (t('likes.unlike') || 'Remover dos favoritos')
      : (t('likes.like') || 'Adicionar aos favoritos');

  return (
    <div className="like-button-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Tooltip title={tooltipText}>
        <Button
          type="text"
          shape="circle"
          icon={
            loading ? (
              <Spin size="small" />
            ) : liked ? (
              <HeartFilled style={{ color: '#ff4d4f', fontSize: '20px' }} />
            ) : (
              <HeartOutlined style={{ fontSize: '20px' }} />
            )
          }
          onClick={handleLike}
          disabled={loading}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        />
      </Tooltip>
    </div>
  );
}
