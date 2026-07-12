import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, user } = useTelegram();
  const [profile, setProfile] = useState(null);
  const isAdmin = [5082384607, 1005121723].includes(user?.id) || profile?.is_admin;

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadArticle = () => {
    setLoading(true);
    api.getArticle(id)
      .then(a => {
        setArticle(a);
        setEditData({
          title: a.title,
          short_description: a.short_description,
          content: a.content,
          photo_url: a.photo_url
        });
        
        // Auto open edit mode if edit=true in query params
        const params = new URLSearchParams(window.location.search);
        if (params.get('edit') === 'true') {
          setIsEditing(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getProfile().then(setProfile).catch(console.error);
    loadArticle();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      haptic.impact('medium');
      await api.adminUpdateArticle(id, editData);
      haptic.success();
      setIsEditing(false);
      loadArticle();
    } catch (e) {
      console.error(e);
      haptic.error();
      alert('Ошибка при сохранении статьи');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы действительно хотите удалить эту статью?')) return;
    try {
      setSaving(true);
      haptic.impact('heavy');
      await api.adminDeleteArticle(id);
      haptic.success();
      alert('Статья удалена!');
      navigate('/');
    } catch (e) {
      console.error(e);
      haptic.error();
      alert('Ошибка при удалении статьи');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '70vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Статья не найдена</h2>
        <button className="secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>На главную</button>
      </div>
    );
  }

  return (
    <div className="page-transition" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text)' }}>Статья</span>
        <div style={{ width: '24px' }}>
          {isAdmin && !isEditing && (
            <button className="icon-btn" onClick={() => { haptic.impact('light'); setIsEditing(true); }} style={{ color: 'var(--gold)' }}>
              <Edit2 size={18} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="container" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Название статьи:</label>
            <input 
              className="input-field" 
              value={editData.title || ''} 
              onChange={e => setEditData({ ...editData, title: e.target.value })} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Краткое описание:</label>
            <input 
              className="input-field" 
              value={editData.short_description || ''} 
              onChange={e => setEditData({ ...editData, short_description: e.target.value })} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Фото статьи:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <input 
                className="input-field" 
                placeholder="Вставьте ссылку на фото..."
                value={editData.photo_url || ''} 
                onChange={e => setEditData({ ...editData, photo_url: e.target.value })} 
                style={{ width: '100%', marginBottom: 0 }}
              />
              
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <label 
                  style={{
                    flex: 1,
                    background: 'rgba(201, 168, 76, 0.1)',
                    border: '1px dashed var(--gold)',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'var(--gold)',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        setUploadingPhoto(true);
                        haptic.impact('light');
                        const res = await api.adminUploadImage(file);
                        if (res && res.ok && res.url) {
                          setEditData(prev => ({ ...prev, photo_url: res.url }));
                          haptic.success();
                        } else {
                          throw new Error('Upload failed');
                        }
                      } catch (err) {
                        console.error(err);
                        haptic.error();
                        alert('Ошибка при загрузке фото');
                      } finally {
                        setUploadingPhoto(false);
                      }
                    }}
                  />
                  <span>{uploadingPhoto ? 'Загрузка...' : '📁 Выбрать файл'}</span>
                </label>
                
                {editData.photo_url && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.impact('light');
                      setEditData(prev => ({ ...prev, photo_url: '' }));
                    }}
                    style={{
                      background: 'rgba(255, 77, 77, 0.1)',
                      border: '1px solid #ff4d4d',
                      color: '#ff4d4d',
                      borderRadius: '8px',
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Очистить
                  </button>
                )}
              </div>

              {editData.photo_url && (
                <div style={{ marginTop: '0.3rem', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={editData.photo_url} alt="Превью" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Текст статьи:</label>
            <textarea 
              className="input-field" 
              value={editData.content || ''} 
              onChange={e => setEditData({ ...editData, content: e.target.value })} 
              style={{ width: '100%', height: '250px', resize: 'vertical', lineHeight: '1.4' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button className="primary" onClick={handleSave} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Check size={18} /> {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button className="secondary" onClick={() => setIsEditing(false)} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <X size={18} /> Отмена
              </button>
            </div>
            <button className="secondary" onClick={handleDelete} disabled={saving} style={{ border: '1px solid #ff4d4d', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: 0 }}>
              <Trash2 size={18} /> Удалить статью
            </button>
          </div>
        </div>
      ) : (
        <div>
          {article.photo_url && (
            <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
              <img src={article.photo_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(0deg, #0D2818, transparent)' }}></div>
            </div>
          )}

          <div className="container" style={{ marginTop: article.photo_url ? '-1.5rem' : '1rem', position: 'relative', zIndex: 2 }}>
            <div className="glass-card" style={{ padding: '1.5rem 1.2rem' }}>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '0.8rem', lineHeight: '1.3' }}>{article.title}</h1>
              
              {article.short_description && (
                <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text)', borderLeft: '3px solid var(--gold)', paddingLeft: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  {article.short_description}
                </p>
              )}

              <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {article.content.split('\n').map((para, idx) => {
                  if (!para.trim()) return null;
                  
                  // Check if this is a heading or bullet point
                  let content = para;
                  let isHeading = false;
                  let isBullet = false;
                  
                  if (content.startsWith('**') && content.endsWith('**')) {
                    content = content.replace(/\*\*/g, '');
                    isHeading = true;
                  } else if (content.startsWith('•') || content.startsWith('-')) {
                    content = content.substring(1).trim();
                    isBullet = true;
                  }
                  
                  // Replace @username with a clickable link
                  const parts = content.split(/(@[a-zA-Z0-9_]{5,32})/g);
                  const renderedContent = parts.map((part, pIdx) => {
                    if (part.startsWith('@')) {
                      const username = part.substring(1);
                      return (
                        <a 
                          key={pIdx} 
                          href={`https://t.me/${username}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--gold)', textDecoration: 'underline', fontWeight: 'bold' }}
                          onClick={(e) => {
                            if (window.Telegram?.WebApp?.openTelegramLink) {
                              e.preventDefault();
                              window.Telegram.WebApp.openTelegramLink(`https://t.me/${username}`);
                            }
                          }}
                        >
                          {part}
                        </a>
                      );
                    }
                    return part;
                  });

                  if (isHeading) {
                    return <strong key={idx} style={{ color: 'var(--gold)', display: 'block', fontSize: '1.05rem', marginTop: '0.5rem' }}>{renderedContent}</strong>;
                  }
                  if (isBullet) {
                    return <div key={idx} style={{ paddingLeft: '1rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}>•</span>{renderedContent}</div>;
                  }
                  
                  return <p key={idx}>{renderedContent}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
