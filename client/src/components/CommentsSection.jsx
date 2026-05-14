import React, { useState, useEffect } from 'react';
import {
  List,
  Avatar,
  Form,
  Button,
  Input,
  Typography,
  message,
  Divider,
  Rate,
  Space,
  Modal,
  Popconfirm
} from 'antd';
import { Comment } from '@ant-design/compatible';
import { UserOutlined, SendOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import { reviewsApi } from '../api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const styles = {
  commentsSection: {
    marginTop: '32px',
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: 'var(--card-bg, #fff)',
    border: '1px solid var(--border-color, #f0f0f0)',
    boxShadow: 'var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.05))',
  },
  commentList: {
    marginBottom: '32px',
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }
};

export default function CommentsSection({ productId }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  // Редактирование
  const [editingReview, setEditingReview] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const response = await reviewsApi.getByProductId(productId);
        setComments(response);
      } catch (err) {
        console.error('Erro ao buscar avaliações:', err);
        message.error(t('comments.loadError') || 'Falha ao carregar avaliações');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId, t]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.warning(t('comments.textRequired') || 'Por favor, escreva um comentário');
      return;
    }
    try {
      setSubmitting(true);
      const newReview = await reviewsApi.addToProduct({
        productId: productId,
        text: text.trim(),
        rating: rating,
      });
      setComments([newReview, ...comments]);
      setText('');
      setRating(5);
      message.success(t('comments.addSuccess') || 'Avaliação adicionada!');
    } catch (err) {
      console.error('Erro ao adicionar avaliação:', err);
      message.error(t('comments.addError') || 'Falha ao adicionar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setEditText(review.text || '');
    setEditRating(review.rating);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) {
      message.warning(t('comments.textRequired') || 'Por favor, escreva um comentário');
      return;
    }
    setUpdating(true);
    try {
      const updated = await reviewsApi.updateReview(editingReview.id, {
        text: editText.trim(),
        rating: editRating,
      });
      setComments(comments.map(c => c.id === editingReview.id ? updated : c));
      message.success(t('comments.updateSuccess') || 'Avaliação atualizada!');
      setEditModalVisible(false);
      setEditingReview(null);
    } catch (err) {
      console.error('Erro ao atualizar avaliação:', err);
      message.error(err.response?.data?.error || t('comments.updateError') || 'Falha ao atualizar');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await reviewsApi.deleteReview(reviewId);
      setComments(comments.filter(c => c.id !== reviewId));
      message.success(t('comments.deleteSuccess') || 'Avaliação excluída!');
    } catch (err) {
      console.error('Erro ao excluir avaliação:', err);
      message.error(err.response?.data?.error || t('comments.deleteError') || 'Falha ao excluir');
    }
  };

  const canEditDelete = (review) => {
    if (!user) return false;
    return review.authorId === user.id || user.role === 'ADMIN';
  };

  return (
    <div className="comments-section" style={styles.commentsSection}>
      <div style={styles.header}>
        <Title level={4} style={{ margin: 0 }}>
          {t('comments.title') || 'Avaliações'}
        </Title>
        <Text type="secondary">({comments.length})</Text>
      </div>

      <List
        loading={loading}
        style={styles.commentList}
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={item => (
          <li>
            <Comment
              author={<Text strong>{item.author?.name || 'Usuário'}</Text>}
              avatar={
                <Avatar
                  icon={<UserOutlined />}
                  src={item.author?.avatar}
                  style={{ backgroundColor: 'var(--primary-color)' }}
                />
              }
              content={
                <div>
                  <Rate disabled defaultValue={item.rating} />
                  <p style={{ marginTop: 8 }}>{item.text}</p>
                </div>
              }
              datetime={
                <Space>
                  <span>{moment(item.createdAt).fromNow()}</span>
                  {canEditDelete(item) && (
                    <>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(item)}
                      />
                      <Popconfirm
                        title={t('comments.deleteConfirm') || 'Tem certeza que deseja excluir esta avaliação?'}
                        onConfirm={() => handleDelete(item.id)}
                        okText={t('common.yes') || 'Sim'}
                        cancelText={t('common.no') || 'Não'}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </>
                  )}
                </Space>
              }
            />
          </li>
        )}
        locale={{ emptyText: t('comments.noComments') || 'Nenhuma avaliação ainda. Seja o primeiro!' }}
      />

      <Divider />

      {user ? (
        <div className="comment-form">
          <Form.Item label={t('comments.rating') || 'Sua avaliação'}>
            <Rate value={rating} onChange={setRating} />
          </Form.Item>
          <Form.Item>
            <TextArea
              rows={4}
              onChange={e => setText(e.target.value)}
              value={text}
              placeholder={t('comments.placeholder') || 'Compartilhe sua experiência com este equipamento...'}
              disabled={submitting}
            />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="submit"
              loading={submitting}
              onClick={handleSubmit}
              type="primary"
              icon={<SendOutlined />}
              disabled={!text.trim()}
              size="large"
            >
              {t('comments.addComment') || 'Publicar avaliação'}
            </Button>
          </Form.Item>
        </div>
      ) : (
        <Text type="secondary">
          {t('comments.loginToComment') || 'Faça login para deixar uma avaliação.'}
        </Text>
      )}

      <Modal
        title={t('comments.editTitle') || 'Editar avaliação'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            {t('common.cancel') || 'Cancelar'}
          </Button>,
          <Button key="submit" type="primary" loading={updating} onClick={handleEditSubmit}>
            {t('common.save') || 'Salvar'}
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label={t('comments.rating') || 'Avaliação'}>
            <Rate value={editRating} onChange={setEditRating} />
          </Form.Item>
          <Form.Item label={t('comments.text') || 'Comentário'}>
            <TextArea
              rows={4}
              value={editText}
              onChange={e => setEditText(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
