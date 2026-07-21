import { useMemo } from 'react';
import type { IProduct } from '../types/webapp.ts';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  useProductsQuery,
  useCategoriesQuery,
  useToggleProductMutation,
  useDeleteProductMutation,
} from '../api/gallery';
import { useProfileQuery } from '../api/clients';
import { useTelegram } from '../hooks/useTelegram';
import Edit2Icon from '../assets/icons/pen.svg'
import Trash2Icon from '../assets/icons/trash-2.svg'
import PlusIcon from '../assets/icons/plus.svg'
import EyeIcon from '../assets/icons/eye.svg'
import EyeOffIcon from '../assets/icons/eye-off.svg'

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, haptic } = useTelegram();
  const { data: profile } = useProfileQuery();
  const { data: categoryList = [], isPending: categoriesLoading } = useCategoriesQuery();
  const { data: products = [], isPending: productsLoading, refetch } = useProductsQuery();
  const toggleMutation = useToggleProductMutation();
  const deleteMutation = useDeleteProductMutation();

  const activeCategory = searchParams.get('cat');
  const isAdmin = (user?.id != null && [5082384607, 1005121723].includes(user.id)) || profile?.is_admin;
  const loading = categoriesLoading || productsLoading;

  const categories = useMemo(
    () => [{ name: 'Все', slug: '' }, { name: 'Акции', slug: 'sale' }, ...categoryList],
    [categoryList],
  );

  const grouped = products.reduce<Record<string, IProduct[]>>((acc, p) => {
    const cat = p.category_name || 'Прочее';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="container page-transition" data-testid="catalog-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">Атлас работ</span>
          <h1 style={{ marginTop: '0.4rem' }}>Каталог <em>букетов</em></h1>
        </div>
      </div>

      <div className="filter-bar" data-testid="filter-bar">
        {categories.map(c => (
          <button
            key={c.slug || 'all'}
            className={`chip ${c.slug === (activeCategory || '') ? 'active' : ''}`}
            onClick={() => { haptic.impact('light'); setSearchParams(c.slug ? { cat: c.slug } : {}); }}
            data-testid={`filter-${c.slug || 'all'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="responsive-products-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '4/5', marginBottom: '0.6rem' }} />
              <div className="skeleton" style={{ height: '14px', width: '75%', marginBottom: '0.4rem' }} />
              <div className="skeleton" style={{ height: '12px', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--ink-soft)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2.2rem', color: 'var(--wine)', marginBottom: '0.6rem' }}>
            пусто
          </div>
          <div style={{ width: '44px', height: '1px', background: 'var(--champagne-lo)', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9rem' }}>В этой категории пока нет букетов.<br/>Загляните позже — коллекция обновляется каждую неделю.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {Object.entries(grouped).map(([categoryName, catProducts]) => (
            <div key={categoryName} data-testid={`cat-section-${categoryName}`}>
              <div className="section-heading">
                <h2><em>{categoryName}</em></h2>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  {String(catProducts.length).padStart(2, '0')} работ
                </span>
              </div>

              <div className="responsive-products-grid" style={{ marginTop: 0 }}>
                {catProducts.map(p => (
                  <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }} data-testid={`product-${p.id}`}>
                    <div className="product-card" style={{ position: 'relative', opacity: p.in_stock ? 1 : 0.55 }}>
                      {isAdmin && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
                          <button
                            className="icon-btn-copy"
                            onClick={async (e) => {
                              e.preventDefault(); e.stopPropagation();
                              try {
                                haptic.impact('medium');
                                await toggleMutation.mutateAsync(p.id);
                                await refetch();
                                haptic.success();
                              } catch (err) { console.error(err); }
                            }}
                            title={p.in_stock ? 'Скрыть' : 'Показать'}
                          >
                            {p.in_stock ? <EyeIcon width={13} height={13} /> : <EyeOffIcon width={13} height={13} />}
                          </button>
                          <button className="icon-btn-edit"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); haptic.impact('medium'); navigate(`/product/${p.id}?edit=true`); }}>
                            <Edit2Icon width={13} height={13} />
                          </button>
                          <button className="icon-btn-delete"
                            onClick={async (e) => {
                              e.preventDefault(); e.stopPropagation();
                              if (window.confirm('Удалить букет из каталога?')) {
                                try {
                                  haptic.impact('heavy');
                                  await deleteMutation.mutateAsync(p.id);
                                  await refetch();
                                  haptic.success();
                                } catch (err) { console.error(err); }
                              }
                            }}>
                            <Trash2Icon width={13} height={13} />
                          </button>
                        </div>
                      )}

                      <div className="thumb">
                        {p.photo_url
                          ? <img src={p.photo_url} alt={p.name} loading="lazy" />
                          : <div style={{display:'grid', placeItems:'center', width:'100%', height:'100%', color:'var(--ink-soft)', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'1.4rem'}}>f.f</div>}
                        {p.is_sale && (
                          <div style={{
                            position: 'absolute', top: '10px', left: '10px',
                            background: 'var(--wine)', color: 'var(--ivory)',
                            fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
                            letterSpacing: '0.2em', padding: '0.35rem 0.6rem',
                            borderRadius: '999px', fontWeight: 600
                          }}>
                            −{p.discount_percent}%
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="name">{p.name}</div>
                        <div className="price" style={{ marginTop: '0.35rem' }}>
                          {p.is_sale && p.old_price_display && <span className="old-price">{p.old_price_display}</span>}
                          {p.price_display}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {isAdmin && (() => {
                  const catObj = categories.find(c => c.name === categoryName);
                  const catSlug = catObj ? catObj.slug : (catProducts[0]?.category_slug || '');
                  return (
                    <Link
                      to={`/admin?tab=products&add=true&cat_slug=${catSlug}&cat_name=${categoryName}`}
                      style={{ textDecoration: 'none' }}
                      data-testid="admin-add-product"
                    >
                      <div style={{
                        aspectRatio: '4/5',
                        border: '1px dashed var(--champagne)',
                        background: 'var(--champagne-tint)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--wine)', cursor: 'pointer'
                      }}>
                        <PlusIcon width={22} height={22} strokeWidth={1.4} />
                        <span style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: '0.5rem', fontWeight: 600 }}>
                          Добавить
                        </span>
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
