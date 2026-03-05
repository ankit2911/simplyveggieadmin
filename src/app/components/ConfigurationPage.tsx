'use client';

import React, { useState, useRef } from 'react';
import { useAdmin, Unit, Category, Subcategory } from '../context/AdminContext';
import { Plus, Trash2, Edit2, Check, X, Tag, Ruler, ChevronRight, Eye, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigurationPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'units' | 'website'>('categories');
    const {
        units, addUnit, deleteUnit,
        categories, addCategory, deleteCategory,
        subcategories, addSubcategory, deleteSubcategory
    } = useAdmin();

    const [newCatName, setNewCatName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [newSubName, setNewSubName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitSymbol, setNewUnitSymbol] = useState('');

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        await addCategory({ name: newCatName, description: '' });
        setNewCatName('');
    };

    const handleAddSubcategory = async () => {
        if (!selectedCatId || !newSubName.trim()) return;
        await addSubcategory({ name: newSubName, categoryId: selectedCatId, description: '' });
        setNewSubName('');
    };

    const handleAddUnit = async () => {
        if (!newUnitName.trim() || !newUnitSymbol.trim()) return;
        await addUnit({ name: newUnitName, symbol: newUnitSymbol });
        setNewUnitName('');
        setNewUnitSymbol('');
    };

    return (
        <>
            <style>{`
                .cfg-page { }
                .cfg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .cfg-title { font-size: 20px; font-weight: 700; color: #1f2937; }
                .cfg-tabs { display: flex; gap: 16px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; margin-bottom: 24px; }
                .cfg-tab { padding: 8px 16px; white-space: nowrap; display: flex; align-items: center; gap: 8px; font-weight: 500; border: none; background: transparent; cursor: pointer; transition: all 0.15s; color: #6b7280; border-bottom: 2px solid transparent; }
                .cfg-tab:hover { color: #374151; }
                .cfg-tab-active { border-bottom-color: #16a34a; color: #15803d; }
                .cfg-tab-divider { border-left: 1px solid #e5e7eb; margin: 0 8px; height: 24px; align-self: center; }
                .cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                @media (max-width: 768px) { .cfg-grid { grid-template-columns: 1fr; } }
                .cfg-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; height: 600px; display: flex; flex-direction: column; }
                .cfg-card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
                .cfg-add-row { display: flex; gap: 8px; margin-bottom: 16px; }
                .cfg-input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-size: 14px; }
                .cfg-input:focus { box-shadow: 0 0 0 2px rgba(22,163,74,0.3); border-color: #16a34a; }
                .cfg-btn-plus { padding: 8px; background: #16a34a; color: white; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; }
                .cfg-btn-plus:hover { background: #15803d; }
                .cfg-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                .cfg-list-item { padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
                .cfg-list-item-default { background: #f9fafb; }
                .cfg-list-item-default:hover { background: #f3f4f6; }
                .cfg-list-item-selected { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
                .cfg-list-item-name { font-weight: 500; }
                .cfg-list-item-actions { display: flex; align-items: center; gap: 8px; }
                .cfg-btn-delete { color: #9ca3af; background: transparent; border: none; cursor: pointer; }
                .cfg-btn-delete:hover { color: #ef4444; }
                .cfg-empty-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #9ca3af; padding: 32px; }
                .cfg-empty-icon { width: 48px; height: 48px; background: #f9fafb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
                .cfg-empty-title { font-size: 14px; font-weight: 500; color: #111827; margin-bottom: 4px; }
                .cfg-empty-text { font-size: 12px; color: #9ca3af; }
                .cfg-sub-item { padding: 12px; background: #f9fafb; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f3f4f6; }
                .cfg-sub-name { color: #374151; }
                .cfg-units-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
                .cfg-units-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }
                @media (max-width: 768px) { .cfg-units-grid { grid-template-columns: 1fr; } }
                .cfg-btn-add-unit { padding: 8px 16px; background: #16a34a; color: white; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; }
                .cfg-btn-add-unit:hover { background: #15803d; }
                .cfg-table { width: 100%; text-align: left; border-collapse: collapse; }
                .cfg-thead { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
                .cfg-th { padding: 12px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
                .cfg-th-right { text-align: right; }
                .cfg-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
                .cfg-tbody tr:hover { background: #f9fafb; }
                .cfg-td { padding: 12px; }
                .cfg-td-name { font-weight: 500; color: #1f2937; }
                .cfg-td-symbol { font-family: ui-monospace, monospace; font-size: 13px; color: #2563eb; }
                .cfg-symbol-badge { background: #eff6ff; padding: 4px 8px; border-radius: 4px; border: 1px solid #dbeafe; }
                .cfg-td-right { text-align: right; }
                .cfg-btn-delete-unit { color: #9ca3af; background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 4px; }
                .cfg-btn-delete-unit:hover { color: #dc2626; background: #fef2f2; }
            `}</style>

            <div className="cfg-page">
                <div className="cfg-header">
                    <h1 className="cfg-title">Configuration</h1>
                </div>

                <div className="cfg-tabs">
                    <button onClick={() => setActiveTab('categories')} className={`cfg-tab ${activeTab === 'categories' ? 'cfg-tab-active' : ''}`}>
                        <Tag size={18} /> Categories & Subcategories
                    </button>
                    <button onClick={() => setActiveTab('units')} className={`cfg-tab ${activeTab === 'units' ? 'cfg-tab-active' : ''}`}>
                        <Ruler size={18} /> Units
                    </button>
                    <div className="cfg-tab-divider"></div>
                    <button onClick={() => setActiveTab('website')} className={`cfg-tab ${activeTab === 'website' ? 'cfg-tab-active' : ''}`}>
                        Website Content
                    </button>
                </div>

                {activeTab === 'categories' && (
                    <div className="cfg-grid">
                        <div className="cfg-card">
                            <h3 className="cfg-card-title">Parent Categories</h3>
                            <div className="cfg-add-row">
                                <input type="text" placeholder="New Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="cfg-input" />
                                <button onClick={handleAddCategory} className="cfg-btn-plus"><Plus size={20} /></button>
                            </div>
                            <div className="cfg-list">
                                {categories.map(cat => (
                                    <div key={cat.id} onClick={() => setSelectedCatId(cat.id)} className={`cfg-list-item ${selectedCatId === cat.id ? 'cfg-list-item-selected' : 'cfg-list-item-default'}`}>
                                        <span className="cfg-list-item-name">{cat.name}</span>
                                        <div className="cfg-list-item-actions">
                                            {selectedCatId === cat.id && <ChevronRight size={16} />}
                                            <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="cfg-btn-delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="cfg-card">
                            <h3 className="cfg-card-title">{selectedCatId ? `Subcategories for "${categories.find(c => c.id === selectedCatId)?.name}"` : 'Select a Category'}</h3>
                            {selectedCatId ? (
                                <>
                                    <div className="cfg-add-row">
                                        <input type="text" placeholder="New Subcategory Name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="cfg-input" />
                                        <button onClick={handleAddSubcategory} className="cfg-btn-plus"><Plus size={20} /></button>
                                    </div>
                                    <div className="cfg-list">
                                        {subcategories.filter(sub => sub.categoryId === selectedCatId).map(sub => (
                                            <div key={sub.id} className="cfg-sub-item">
                                                <span className="cfg-sub-name">{sub.name}</span>
                                                <button onClick={() => deleteSubcategory(sub.id)} className="cfg-btn-delete"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {subcategories.filter(sub => sub.categoryId === selectedCatId).length === 0 && (
                                            <div className="cfg-empty-center">
                                                <div className="cfg-empty-icon"><Tag style={{ width: 24, height: 24, color: '#d1d5db' }} /></div>
                                                <p className="cfg-empty-title">No subcategories</p>
                                                <p className="cfg-empty-text">Add a subcategory to get started</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="cfg-empty-center">
                                    <Tag size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                                    <p style={{ color: '#6b7280', fontWeight: 500 }}>Select a Category</p>
                                    <p style={{ fontSize: 13 }}>Click on a parent category to manage its subcategories</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'units' && (
                    <div className="cfg-units-card">
                        <h3 className="cfg-card-title">Measurement Units</h3>
                        <div className="cfg-units-grid">
                            <input type="text" placeholder="Unit Name (e.g. Kilogram)" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="cfg-input" />
                            <input type="text" placeholder="Symbol (e.g. kg)" value={newUnitSymbol} onChange={(e) => setNewUnitSymbol(e.target.value)} className="cfg-input" />
                            <button onClick={handleAddUnit} className="cfg-btn-add-unit"><Plus size={18} /> Add Unit</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="cfg-table">
                                <thead className="cfg-thead">
                                    <tr>
                                        <th className="cfg-th">Name</th>
                                        <th className="cfg-th">Symbol</th>
                                        <th className="cfg-th cfg-th-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="cfg-tbody">
                                    {units.map(unit => (
                                        <tr key={unit.id}>
                                            <td className="cfg-td cfg-td-name">{unit.name}</td>
                                            <td className="cfg-td cfg-td-symbol"><span className="cfg-symbol-badge">{unit.symbol}</span></td>
                                            <td className="cfg-td cfg-td-right">
                                                <button onClick={() => deleteUnit(unit.id)} className="cfg-btn-delete-unit"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {units.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ padding: 32, textAlign: 'center' }}>
                                                <div className="cfg-empty-center" style={{ height: 'auto' }}>
                                                    <div className="cfg-empty-icon"><Ruler style={{ width: 24, height: 24, color: '#9ca3af' }} /></div>
                                                    <p className="cfg-empty-title">No Units Defined</p>
                                                    <p className="cfg-empty-text">Add measurement units like kg, g, pcs</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'website' && <WebsiteContentSection />}
            </div>
        </>
    );
}

function WebsiteContentSection() {
    const { websiteLinks, updateWebsiteLinks, partners, addPartner, updatePartner, deletePartner, banners, addBanner, updateBanner, deleteBanner } = useAdmin();
    const [linksForm, setLinksForm] = useState(websiteLinks);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [partnerForm, setPartnerForm] = useState({ id: '', name: '', imageUrl: '', websiteUrl: '' });
    const [isEditingPartner, setIsEditingPartner] = useState(false);
    const partnerFileInputRef = useRef<HTMLInputElement>(null);
    const [bannerForm, setBannerForm] = useState({ id: '', name: '', imageUrl: '', linkUrl: '', order: '1' });
    const [isEditingBanner, setIsEditingBanner] = useState(false);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setImg: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { toast.error("File size should be less than 2MB"); return; }
            const reader = new FileReader();
            reader.onloadend = () => { setImg(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handlePartnerSubmit = () => {
        if (!partnerForm.name || !partnerForm.imageUrl) return toast.error('Name & Image required');
        if (isEditingPartner) { updatePartner(partnerForm.id, { name: partnerForm.name, imageUrl: partnerForm.imageUrl, websiteUrl: partnerForm.websiteUrl }); toast.success('Partner updated'); }
        else { addPartner({ name: partnerForm.name, imageUrl: partnerForm.imageUrl, websiteUrl: partnerForm.websiteUrl }); toast.success('Partner added'); }
        resetPartnerForm();
    };

    const editPartner = (p: any) => { setPartnerForm({ id: p.id, name: p.name, imageUrl: p.imageUrl, websiteUrl: p.websiteUrl }); setIsEditingPartner(true); };
    const resetPartnerForm = () => { setPartnerForm({ id: '', name: '', imageUrl: '', websiteUrl: '' }); setIsEditingPartner(false); if (partnerFileInputRef.current) partnerFileInputRef.current.value = ''; };

    const handleBannerSubmit = () => {
        if (!bannerForm.name || !bannerForm.imageUrl) return toast.error('Name & Image required');
        if (isEditingBanner) { updateBanner(bannerForm.id, { name: bannerForm.name, imageUrl: bannerForm.imageUrl, linkUrl: bannerForm.linkUrl, order: parseInt(bannerForm.order) || 1 }); toast.success('Banner updated'); }
        else { addBanner({ name: bannerForm.name, imageUrl: bannerForm.imageUrl, linkUrl: bannerForm.linkUrl, order: parseInt(bannerForm.order) || 1 }); toast.success('Banner added'); }
        resetBannerForm();
    };

    const editBanner = (b: any) => { setBannerForm({ id: b.id, name: b.name, imageUrl: b.imageUrl, linkUrl: b.linkUrl, order: b.order.toString() }); setIsEditingBanner(true); };
    const resetBannerForm = () => { setBannerForm({ id: '', name: '', imageUrl: '', linkUrl: '', order: '1' }); setIsEditingBanner(false); if (bannerFileInputRef.current) bannerFileInputRef.current.value = ''; };

    return (
        <>
            <style>{`
                .ws-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                @media (max-width: 1024px) { .ws-grid { grid-template-columns: 1fr; } }
                .ws-col { display: flex; flex-direction: column; gap: 32px; }
                .ws-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
                .ws-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .ws-card-title { font-size: 18px; font-weight: 700; color: #1f2937; }
                .ws-editing-badge { font-size: 12px; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }
                .ws-form-area { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #f3f4f6; }
                .ws-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .ws-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; outline: none; }
                .ws-input:focus { box-shadow: 0 0 0 2px rgba(22,163,74,0.3); border-color: #16a34a; }
                .ws-input-full { width: 100%; }
                .ws-file-label { display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px; }
                .ws-file-row { display: flex; gap: 8px; }
                .ws-file-preview { width: 40px; height: 40px; border: 1px solid #e5e7eb; border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .ws-file-preview img { width: 100%; height: 100%; object-fit: contain; }
                .ws-form-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; }
                .ws-btn-cancel { padding: 6px 12px; color: #6b7280; background: transparent; border: none; font-size: 13px; cursor: pointer; border-radius: 4px; }
                .ws-btn-cancel:hover { background: #e5e7eb; }
                .ws-btn-blue { padding: 6px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
                .ws-btn-blue:hover { background: #1d4ed8; }
                .ws-btn-purple { padding: 6px 16px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
                .ws-btn-purple:hover { background: #6d28d9; }
                .ws-btn-green-full { width: 100%; padding: 8px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px; }
                .ws-btn-green-full:hover { background: #15803d; }
                .ws-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px; text-transform: capitalize; }
                .ws-table-wrap { border: 1px solid #f3f4f6; border-radius: 8px; overflow: hidden; }
                .ws-table { width: 100%; text-align: left; font-size: 13px; border-collapse: collapse; }
                .ws-thead { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
                .ws-th { padding: 12px; color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
                .ws-th-center { text-align: center; }
                .ws-th-right { text-align: right; }
                .ws-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
                .ws-tbody tr:hover { background: #f9fafb; }
                .ws-td { padding: 8px 12px; }
                .ws-td-center { text-align: center; }
                .ws-td-right { text-align: right; }
                .ws-img-thumb { width: 32px; height: 32px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 2px; }
                .ws-img-thumb img { width: 100%; height: 100%; object-fit: contain; }
                .ws-img-banner { width: 48px; height: 24px; margin: 0 auto; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .ws-img-banner img { width: 100%; height: 100%; object-fit: cover; }
                .ws-td-name { font-weight: 500; color: #111827; }
                .ws-td-link { font-size: 12px; color: #3b82f6; text-decoration: none; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
                .ws-td-link:hover { text-decoration: underline; }
                .ws-td-order { font-weight: 700; color: #9ca3af; font-size: 12px; }
                .ws-action-group { display: flex; justify-content: flex-end; gap: 4px; opacity: 0; transition: opacity 0.15s; }
                .ws-tbody tr:hover .ws-action-group { opacity: 1; }
                .ws-btn-action { padding: 6px; color: #9ca3af; background: transparent; border: none; cursor: pointer; border-radius: 4px; }
                .ws-btn-action:hover { background: #f3f4f6; }
                .ws-btn-view:hover { color: #2563eb; background: #eff6ff; }
                .ws-btn-edit:hover { color: #16a34a; background: #f0fdf4; }
                .ws-btn-delete:hover { color: #dc2626; background: #fef2f2; }
                .ws-btn-view-purple:hover { color: #7c3aed; background: #f5f3ff; }
                .ws-empty { padding: 24px; text-align: center; color: #9ca3af; }
                .ws-empty-icon { width: 40px; height: 40px; background: #f9fafb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
                .ws-empty-text { font-size: 13px; }
                .ws-img-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
                .ws-img-modal-inner { position: relative; max-width: 896px; max-height: 90vh; }
                .ws-img-modal-close { position: absolute; top: -40px; right: 0; color: white; background: none; border: none; cursor: pointer; }
                .ws-img-modal-close:hover { color: #d1d5db; }
                .ws-img-modal img { max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
                .ws-banner-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; display: flex; flex-direction: column; height: 100%; }
                .ws-banner-row { display: flex; gap: 12px; }
                .ws-input-order { width: 80px; text-align: center; }
            `}</style>

            <div className="ws-grid">
                {/* Left Column */}
                <div className="ws-col">
                    {/* Links */}
                    <div className="ws-card">
                        <h3 className="ws-card-title">Footer Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {['aboutUs', 'privacyPolicy', 'termsConditions'].map((key) => (
                                <div key={key}>
                                    <label className="ws-label">{key.replace(/([A-Z])/g, ' $1').trim()} URL</label>
                                    <input type="text" value={(linksForm as any)[key]} onChange={e => setLinksForm({ ...linksForm, [key]: e.target.value })} className="ws-input" />
                                </div>
                            ))}
                            <button onClick={() => { updateWebsiteLinks(linksForm); toast.success('Links updated'); }} className="ws-btn-green-full">Save Links</button>
                        </div>
                    </div>

                    {/* Partners */}
                    <div className="ws-card">
                        <div className="ws-card-header">
                            <h3 className="ws-card-title">Our Partners</h3>
                            {isEditingPartner && <span className="ws-editing-badge">Editing Mode</span>}
                        </div>

                        <div className="ws-form-area">
                            <div className="ws-form-grid">
                                <input placeholder="Partner Name" value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} className="ws-input" />
                                <input placeholder="Website Link (Optional)" value={partnerForm.websiteUrl} onChange={e => setPartnerForm({ ...partnerForm, websiteUrl: e.target.value })} className="ws-input" />
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label className="ws-file-label">Logo Image (Rec: 200x200px, Max: 2MB)</label>
                                <div className="ws-file-row">
                                    <input ref={partnerFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, (url) => setPartnerForm(prev => ({ ...prev, imageUrl: url })))} style={{ flex: 1, fontSize: 13 }} />
                                    {partnerForm.imageUrl && (<div className="ws-file-preview"><img src={partnerForm.imageUrl} alt="Preview" /></div>)}
                                </div>
                            </div>
                            <div className="ws-form-actions">
                                {isEditingPartner && (<button onClick={resetPartnerForm} className="ws-btn-cancel">Cancel</button>)}
                                <button onClick={handlePartnerSubmit} className="ws-btn-blue">{isEditingPartner ? 'Update Partner' : 'Add Partner'}</button>
                            </div>
                        </div>

                        <div className="ws-table-wrap">
                            <table className="ws-table">
                                <thead className="ws-thead">
                                    <tr>
                                        <th className="ws-th ws-th-center" style={{ width: 48 }}><ImageIcon size={16} /></th>
                                        <th className="ws-th">Partner Details</th>
                                        <th className="ws-th ws-th-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="ws-tbody">
                                    {partners.map(p => (
                                        <tr key={p.id}>
                                            <td className="ws-td ws-td-center"><div className="ws-img-thumb"><img src={p.imageUrl} alt="" /></div></td>
                                            <td className="ws-td">
                                                <div className="ws-td-name">{p.name}</div>
                                                {p.websiteUrl && (<a href={p.websiteUrl} target="_blank" rel="noreferrer" className="ws-td-link">{p.websiteUrl} <ExternalLink size={10} /></a>)}
                                            </td>
                                            <td className="ws-td ws-td-right">
                                                <div className="ws-action-group">
                                                    <button onClick={() => setViewImage(p.imageUrl)} className="ws-btn-action ws-btn-view"><Eye size={16} /></button>
                                                    <button onClick={() => editPartner(p)} className="ws-btn-action ws-btn-edit"><Edit2 size={16} /></button>
                                                    <button onClick={() => deletePartner(p.id)} className="ws-btn-action ws-btn-delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {partners.length === 0 && (
                                        <tr><td colSpan={3} className="ws-empty">
                                            <div className="ws-empty-icon"><ImageIcon style={{ width: 20, height: 20, color: '#d1d5db' }} /></div>
                                            <span className="ws-empty-text">No partners yet</span>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Banners */}
                <div className="ws-banner-card">
                    <div className="ws-card-header">
                        <h3 className="ws-card-title">Homepage Banners</h3>
                        {isEditingBanner && <span className="ws-editing-badge">Editing Mode</span>}
                    </div>

                    <div className="ws-form-area">
                        <div className="ws-banner-row">
                            <input placeholder="Banner Name" value={bannerForm.name} onChange={e => setBannerForm({ ...bannerForm, name: e.target.value })} className="ws-input" style={{ flex: 1 }} />
                            <input type="number" placeholder="Order" value={bannerForm.order} onChange={e => setBannerForm({ ...bannerForm, order: e.target.value })} className="ws-input ws-input-order" />
                        </div>
                        <input placeholder="Link URL (Optional)" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="ws-input" style={{ width: '100%', marginTop: 12 }} />
                        <div style={{ marginTop: 12 }}>
                            <label className="ws-file-label">Banner Image (Rec: 1200x400px, Max: 2MB)</label>
                            <div className="ws-file-row">
                                <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, (url) => setBannerForm(prev => ({ ...prev, imageUrl: url })))} style={{ flex: 1, fontSize: 13 }} />
                                {bannerForm.imageUrl && (<div className="ws-file-preview"><img src={bannerForm.imageUrl} alt="Preview" style={{ objectFit: 'cover' }} /></div>)}
                            </div>
                        </div>
                        <div className="ws-form-actions">
                            {isEditingBanner && (<button onClick={resetBannerForm} className="ws-btn-cancel">Cancel</button>)}
                            <button onClick={handleBannerSubmit} className="ws-btn-purple">{isEditingBanner ? 'Update Banner' : 'Add Banner'}</button>
                        </div>
                    </div>

                    <div className="ws-table-wrap" style={{ flex: 1 }}>
                        <table className="ws-table">
                            <thead className="ws-thead">
                                <tr>
                                    <th className="ws-th ws-th-center" style={{ width: 48 }}>Ord</th>
                                    <th className="ws-th ws-th-center" style={{ width: 64 }}>Img</th>
                                    <th className="ws-th">Banner Details</th>
                                    <th className="ws-th ws-th-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="ws-tbody">
                                {banners.sort((a, b) => a.order - b.order).map(b => (
                                    <tr key={b.id}>
                                        <td className="ws-td ws-td-center ws-td-order">#{b.order}</td>
                                        <td className="ws-td ws-td-center"><div className="ws-img-banner"><img src={b.imageUrl} alt="" /></div></td>
                                        <td className="ws-td">
                                            <div className="ws-td-name">{b.name}</div>
                                            {b.linkUrl && (<a href={b.linkUrl} target="_blank" rel="noreferrer" className="ws-td-link">Link <ExternalLink size={10} /></a>)}
                                        </td>
                                        <td className="ws-td ws-td-right">
                                            <div className="ws-action-group">
                                                <button onClick={() => setViewImage(b.imageUrl)} className="ws-btn-action ws-btn-view-purple"><Eye size={16} /></button>
                                                <button onClick={() => editBanner(b)} className="ws-btn-action ws-btn-edit"><Edit2 size={16} /></button>
                                                <button onClick={() => deleteBanner(b.id)} className="ws-btn-action ws-btn-delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {banners.length === 0 && (
                                    <tr><td colSpan={4} className="ws-empty">
                                        <div className="ws-empty-icon"><ImageIcon style={{ width: 20, height: 20, color: '#d1d5db' }} /></div>
                                        <span className="ws-empty-text">No banners configured</span>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {viewImage && (
                <div className="ws-img-modal" onClick={() => setViewImage(null)}>
                    <div className="ws-img-modal-inner">
                        <button onClick={() => setViewImage(null)} className="ws-img-modal-close"><X size={24} /></button>
                        <img src={viewImage} alt="Preview" />
                    </div>
                </div>
            )}
        </>
    );
}
