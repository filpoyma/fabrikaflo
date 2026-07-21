// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg'
import Edit2Icon from '../assets/icons/pen.svg'
import CheckIcon from '../assets/icons/check.svg'
import XIcon from '../assets/icons/x.svg'
import Trash2Icon from '../assets/icons/trash-2.svg'
import UploadIcon from '../assets/icons/upload.svg'
import { api } from '../api';
import { useProfileQuery } from '../api/clients';
import { useAdminUploadImageMutation } from '../api/admin';
import { useTelegram } from '../hooks/useTelegram';

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, user } = useTelegram();
  const { data: profile } = useProfileQuery();
  const uploadImageMutation = useAdminUploadImageMutation();
  const isAdmin = [5082384607, 1005121723].includes(user?.id) || profile?.is_admin;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadArticle = () => {
    setLoading(true);
    api.getArticle(id)
      .then(a => {
        setArticle(a);
        setEditData({ title: a.title, short_description: a.short_description, content: a.content, photo_url: a.photo_url });
        const params = new URLSearchParams(window.location.search);
        if (params.get('edit') === 'true') setIsEditing(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArticle();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true); haptic.impact('medium');
      await api.adminUpdateArticle(id, editData);
      haptic.success(); setIsEditing(false); loadArticle();
    } catch (e) { console.error(e); haptic.error(); alert('Ошибка при сохранении статьи'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить эту заметку?')) return;
    try {
      setSaving(true); haptic.impact('heavy');
      await api.adminDeleteArticle(id);
      haptic.success(); alert('Заметка удалена'); navigate('/');
    } catch (e) { console.error(e); haptic.error(); alert('Ошибка при удалении'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  if (!article) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2.4rem', color: 'var(--wine)' }}>404</div>
        <div style={{ width: '44px', height: '1px', background: 'var(--champagne-lo)', margin: '1rem auto' }} />
        <h2 style={{ marginTop: '0.4rem' }}>Заметка не <em>найдена</em></h2>
        <button className="secondary" onClick={() => navigate('/')} style={{ marginTop: '1.6rem' }}>На главную</button>
      </div>
    );
  }

  return (
    <div className="page-transition" data-testid="article-page">
      <div style={{ position: 'fixed', top: '14px', left: '14px', zIndex: 100 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'rgba(253, 251, 247, 0.9)', backdropFilter: 'blur(10px)' }} data-testid="back-btn">
          <ArrowLeftIcon width={18} height={18} strokeWidth={1.5} />
        </button>
      </div>
      {isAdmin && !isEditing && (
        <div style={{ position: 'fixed', top: '14px', right: '14px', zIndex: 100 }}>
          <button className="icon-btn" onClick={() => { haptic.impact('light'); setIsEditing(true); }} style={{ background: 'rgba(253, 251, 247, 0.9)', backdropFilter: 'blur(10px)', color: 'var(--wine)' }}>
            <Edit2Icon width={16} height={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="container" style={{ paddingTop: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="page-title">
            <div>
              <span className="eyebrow">Редактирование</span>
              <h1 style={{ marginTop: '0.4rem' }}>Заметка</h1>
            </div>
          </div>
          <div>
            <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Название</label>
            <input value={editData.title || ''} onChange={e => setEditData({ ...editData, title: e.target.value })} />
          </div>
          <div>
            <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Подзаголовок</label>
            <input value={editData.short_description || ''} onChange={e => setEditData({ ...editData, short_description: e.target.value })} />
          </div>
          <div>
            <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Фото</label>
            <input placeholder="Ссылка на фото…" value={editData.photo_url || ''} onChange={e => setEditData({ ...editData, photo_url: e.target.value })} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', border: '1px dashed var(--champagne)', background: 'var(--champagne-tint)', color: 'var(--wine)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                try {
                  setUploadingPhoto(true); haptic.impact('light');
                  const res = await uploadImageMutation.mutateAsync(file);
                  if (res && res.ok && res.url) { setEditData(prev => ({ ...prev, photo_url: res.url })); haptic.success(); }
                  else throw new Error('UploadIcon failed');
                } catch (err) { console.error(err); haptic.error(); alert('Ошибка загрузки'); }
                finally { setUploadingPhoto(false); }
              }} />
              <UploadIcon width={14} height={14} strokeWidth={1.5} />
              <span>{uploadingPhoto ? 'Загрузка…' : 'Выбрать файл'}</span>
            </label>
            {editData.photo_url && (
              <div style={{ marginTop: '0.8rem', width: '100%', aspectRatio: '2/1', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <img src={editData.photo_url} alt="Превью" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div>
            <label className="eyebrow" style={{ color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Текст</label>
            <textarea value={editData.content || ''} onChange={e => setEditData({ ...editData, content: e.target.value })} style={{ minHeight: '240px', lineHeight: 1.6, fontFamily: 'var(--font-display)', fontSize: '1rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                <CheckIcon width={14} height={14} strokeWidth={1.6} /> {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button className="secondary" onClick={() => setIsEditing(false)} disabled={saving} style={{ flex: 1 }}>
                <XIcon width={14} height={14} strokeWidth={1.6} /> Отмена
              </button>
            </div>
            <button className="tertiary" onClick={handleDelete} disabled={saving} style={{ color: 'var(--error)', alignSelf: 'flex-start' }}>
              <Trash2Icon width={13} height={13} strokeWidth={1.5} /> удалить заметку
            </button>
          </div>
        </div>
      ) : (
        <div>
          {article.photo_url && (
            <div style={{ width: '100%', aspectRatio: '3/2', maxHeight: '55vh', overflow: 'hidden', background: 'var(--cream)' }}>
              <img src={article.photo_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div className="container" style={{ maxWidth: '680px', paddingTop: article.photo_url ? '2.5rem' : '3.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="eyebrow" style={{ color: 'var(--champagne-lo)' }}>Заметка · fabrika.flo</span>
              <h1 style={{ marginTop: '0.6rem', fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1.15 }}>
                {article.title}
              </h1>
              <div style={{ width: '44px', height: '1px', background: 'var(--champagne-lo)', margin: '1.4rem auto 0' }} />
            </div>

            {article.short_description && (
              <p style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300,
                fontSize: '1.2rem', lineHeight: 1.55, color: 'var(--ink)',
                textAlign: 'center', marginBottom: '2.6rem', maxWidth: '52ch', marginInline: 'auto'
              }}>
                {article.short_description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', fontSize: '1rem', lineHeight: 1.75, color: 'var(--ink)' }}>
              {article.content.split('\n').map((para, idx) => {
                if (!para.trim()) return null;
                let content = para, isHeading = false, isBullet = false;
                if (content.startsWith('**') && content.endsWith('**')) { content = content.replace(/\*\*/g, ''); isHeading = true; }
                else if (content.startsWith('•') || content.startsWith('-')) { content = content.substring(1).trim(); isBullet = true; }

                const parts = content.split(/(@[a-zA-Z0-9_]{5,32})/g);
                const rendered = parts.map((part, pIdx) => {
                  if (part.startsWith('@')) {
                    const username = part.substring(1);
                    return (
                      <a key={pIdx} href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer"
                         style={{ color: 'var(--wine)', textDecoration: 'none', borderBottom: '1px solid var(--wine)', fontWeight: 500 }}
                         onClick={(e) => {
                           if (window.Telegram?.WebApp?.openTelegramLink) { e.preventDefault(); window.Telegram.WebApp.openTelegramLink(`https://t.me/${username}`); }
                         }}>{part}</a>
                    );
                  }
                  return part;
                });

                if (isHeading) return (
                  <h3 key={idx} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '1.35rem', color: 'var(--wine)', marginTop: '1.5rem' }}>
                    {rendered}
                  </h3>
                );
                if (isBullet) return (
                  <div key={idx} style={{ paddingLeft: '1.4rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--champagne-lo)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>—</span>
                    {rendered}
                  </div>
                );
                return <p key={idx} style={{ color: 'var(--ink)' }}>{rendered}</p>;
              })}
            </div>

            <div className="hairline" aria-hidden="true" style={{ marginTop: '3rem' }}>
              <span className="dot" /> <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'0.9rem', color:'var(--ink-soft)'}}>f.f</span> <span className="dot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
