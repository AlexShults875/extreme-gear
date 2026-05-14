import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  Skeleton,
  Typography,
  Input,
  Space,
  Empty,
  Pagination,
  Checkbox,
  Slider,
  Layout
} from 'antd';
import { SearchOutlined, FilterOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { templatesApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/TemplatePage.css';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const queryParams = new URLSearchParams(location.search);
  const [search, setSearch] = useState(queryParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: pageSize,
          search: search.trim() || undefined,
        };

        const response = await templatesApi.getPublicTemplatesPaginated(params);
        setProducts(response.templates);
        setTotal(response.total);
      } catch (err) {
        console.error('Catalog load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [currentPage, pageSize, search]);

  return (
    <Layout className={`templates-page ${darkMode ? 'dark' : 'light'}`} style={{ background: 'transparent' }}>
      <Sider width={280} breakpoint="lg" collapsedWidth="0" className="catalog-sider">
        <div className="filter-section">
          <Title level={4}><FilterOutlined /> {t('catalog.filters') || 'FILTERS'}</Title>

          <div className="filter-group">
            <Text strong>{t('catalog.categories') || 'CATEGORIES'}</Text>
            <Checkbox.Group style={{ width: '100%', marginTop: '10px' }}>
              <Space direction="vertical">
                <Checkbox value="skates">{t('templates.catSkateboards')}</Checkbox>
                <Checkbox value="longs">{t('templates.catLongboards')}</Checkbox>
                <Checkbox value="protection">{t('templates.catProtection')}</Checkbox>
                <Checkbox value="apparel">{t('templates.catApparel')}</Checkbox>
              </Space>
            </Checkbox.Group>
          </div>

          <div className="filter-group" style={{ marginTop: '30px' }}>
            <Text strong>{t('catalog.priceRange') || 'PRICE RANGE'}</Text>
            <Slider range defaultValue={[0, 1000]} max={1000} tipFormatter={(v) => `$${v}`} />
          </div>
        </div>
      </Sider>

      <Content className="catalog-content">
        <div className="page-header">
          <Title level={2} className="page-title">{t('templates.pageTitle')}</Title>
          <Input
            placeholder={t('templates.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="catalog-search"
            allowClear
            size="large"
          />
        </div>

        {loading ? (
          <Row gutter={[20, 20]}>
            {[...Array(8)].map((_, i) => (
              <Col key={i} xs={24} sm={12} lg={6}>
                <Skeleton active vertical paragraph={{ rows: 4 }} />
              </Col>
            ))}
          </Row>
        ) : products.length > 0 ? (
          <>
            <Row gutter={[20, 20]} className="templates-grid">
              {products.map(product => (
                <Col key={product.id} xs={24} sm={12} lg={6}>
                  <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="product-image-wrapper">
                      <img src={product.imageUrl || 'https://via.placeholder.com/300?text=Extreme+Gear'} alt={product.title} />
                      <div className="product-overlay">
                        <Button icon={<ShoppingCartOutlined />} type="primary" className="buy-button">
                          {t('templates.quickAdd')}
                        </Button>
                      </div>
                    </div>
                    <div className="product-info">
                      <Text className="product-brand">{product.topic || t('templates.defaultBrand')}</Text>
                      <Title level={5} className="product-name">{product.title}</Title>
                      <Text className="product-price">$ {product.price || "89.00"}</Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            <div className="pagination-container">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(p, s) => { setCurrentPage(p); setPageSize(s); }}
                showSizeChanger
                className="templates-pagination"
              />
            </div>
          </>
        ) : (
          <Empty description={t('templates.noResults')} />
        )}
      </Content>
    </Layout>
  );
}
