import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Tooltip, Space, message } from 'antd';
import { ShoppingCartOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LikeButton from './LikeButton';
import { useAuth } from '../AuthContext';
import { useCart } from '../context/CartContext';

const { Text, Title } = Typography;

export default function TemplateCard({ template, onEdit, isAdmin }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleCardClick = () => {
    navigate(`/products/${template.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(template.id);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    // Дополнительная проверка на случай, если кнопка всё же активна
    if (!template.stock || template.stock <= 0) {
      message.error(t('products.outOfStock') || 'Out of stock');
      return;
    }
    setAdding(true);
    try {
      await addToCart(template, 1);
      message.success(t('cart.addedSuccess') || `${template.name} added to cart!`);
      window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('cart.addError') || 'Failed to add to cart';
      message.error(errorMsg);
      setAdding(false);
    }
  };

  const isOutOfStock = !template.stock || template.stock <= 0;

  return (
    <Card
      hoverable
      className="product-card"
      onClick={handleCardClick}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      cover={
        <div style={{ position: 'relative' }}>
          {template.imageUrl ? (
            <div
              className="product-image"
              style={{
                height: '200px',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundImage: `url(${template.imageUrl})`
              }}
            />
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
              <ShoppingCartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            </div>
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <LikeButton productId={template.id} initialCount={template.likesCount} />
          </div>
        </div>
      }
    >
      <div className="product-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title level={5} style={{ margin: 0, flex: 1 }} ellipsis={{ rows: 1 }}>
            {template.title}
          </Title>
          <Text strong style={{ color: '#52c41a', fontSize: '16px', marginLeft: '8px' }}>
            ${template.price || 0}
          </Text>
        </div>

        <div style={{ margin: '8px 0' }}>
          <Tag color="blue">{template.category?.name || t('products.noCategory')}</Tag>
          {template.stock !== undefined && (
            <Tag color={template.stock > 0 ? 'green' : 'red'} style={{ marginLeft: 5 }}>
              {template.stock > 0 ? `${template.stock} left` : t('products.outOfStock')}
            </Tag>
          )}
        </div>

        <Text type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: '12px', marginBottom: 'auto' }}>
          {template.description || t('products.noDescription')}
        </Text>
      </div>

      <div className="product-footer" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Tooltip title={t('common.view')}>
              <Button shape="circle" icon={<EyeOutlined />} onClick={handleCardClick} />
            </Tooltip>
            {isAdmin && (
              <Tooltip title={t('common.edit')}>
                <Button shape="circle" icon={<EditOutlined />} onClick={handleEdit} />
              </Tooltip>
            )}
          </Space>

          {token && (
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              loading={adding}
              disabled={isOutOfStock}
              className="add-to-cart-button"
            >
              {isOutOfStock ? (t('products.outOfStock') || 'Out of stock') : (t('products.buy') || 'Comprar')}
            </Button>
          )}
        </div>
      </div>

      {template.tags?.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {template.tags.slice(0, 2).map(tag => (
            <Tag key={tag.id || tag} style={{ fontSize: '10px' }}>
              {tag.name || tag}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
}
