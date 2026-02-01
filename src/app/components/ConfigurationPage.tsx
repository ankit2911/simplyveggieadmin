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

    // --- Category State ---
    const [newCatName, setNewCatName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [newSubName, setNewSubName] = useState('');

    // --- Unit State ---
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitSymbol, setNewUnitSymbol] = useState('');

    // --- Handlers ---
    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        addCategory({ name: newCatName, description: '' });
        setNewCatName('');
        toast.success('Category added');
    };

    const handleAddSubcategory = () => {
        if (!selectedCatId || !newSubName.trim()) return;
        addSubcategory({ name: newSubName, categoryId: selectedCatId, description: '' });
        setNewSubName('');
        toast.success('Subcategory added');
    };

    const handleAddUnit = () => {
        if (!newUnitName.trim() || !newUnitSymbol.trim()) return;
        addUnit({ name: newUnitName, symbol: newUnitSymbol });
        setNewUnitName('');
        setNewUnitSymbol('');
        toast.success('Unit added');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Configuration</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-2 px-4 whitespace-nowrap flex items-center gap-2 font-medium transition-colors ${activeTab === 'categories'
                        ? 'border-b-2 border-green-600 text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Tag size={18} />
                    Categories & Subcategories
                </button>
                <button
                    onClick={() => setActiveTab('units')}
                    className={`pb-2 px-4 whitespace-nowrap flex items-center gap-2 font-medium transition-colors ${activeTab === 'units'
                        ? 'border-b-2 border-green-600 text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Ruler size={18} />
                    Units
                </button>
                <div className="border-l border-gray-200 mx-2 h-6 self-center hidden md:block"></div>
                <button
                    onClick={() => setActiveTab('website')}
                    className={`pb-2 px-4 whitespace-nowrap flex items-center gap-2 font-medium transition-colors ${activeTab === 'website'
                        ? 'border-b-2 border-green-600 text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Website Content
                </button>
            </div>

            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Categories Column */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Parent Categories</h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="New Category Name"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <button
                                onClick={handleAddCategory}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCatId(cat.id)}
                                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-all ${selectedCatId === cat.id
                                        ? 'bg-green-50 border-green-200 border text-green-800'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                        }`}
                                >
                                    <span className="font-medium">{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        {selectedCatId === cat.id && <ChevronRight size={16} />}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subcategories Column */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                            {selectedCatId
                                ? `Subcategories for "${categories.find(c => c.id === selectedCatId)?.name}"`
                                : 'Select a Category'
                            }
                        </h3>

                        {selectedCatId ? (
                            <>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="New Subcategory Name"
                                        value={newSubName}
                                        onChange={(e) => setNewSubName(e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                    <button
                                        onClick={handleAddSubcategory}
                                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {subcategories
                                        .filter(sub => sub.categoryId === selectedCatId)
                                        .map(sub => (
                                            <div key={sub.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
                                                <span className="text-gray-700">{sub.name}</span>
                                                <button
                                                    onClick={() => deleteSubcategory(sub.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    }
                                    {subcategories.filter(sub => sub.categoryId === selectedCatId).length === 0 && (
                                        <div className="text-center text-gray-400 py-10 italic">
                                            No subcategories defined
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Tag size={48} className="mb-4 opacity-20" />
                                <p>Select a parent category to manage its subcategories</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'units' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Measurement Units</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <input
                            type="text"
                            placeholder="Unit Name (e.g. Kilogram)"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Symbol (e.g. kg)"
                            value={newUnitSymbol}
                            onChange={(e) => setNewUnitSymbol(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <button
                            onClick={handleAddUnit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Add Unit
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Symbol</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.map(unit => (
                                    <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{unit.name}</td>
                                        <td className="p-3 font-mono text-sm text-blue-600 bg-blue-50 w-fit rounded px-2">{unit.symbol}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => deleteUnit(unit.id)}
                                                className="text-gray-400 hover:text-red-500 bg-transparent p-2 rounded hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'website' && <WebsiteContentSection />}
        </div>
    );
}

function WebsiteContentSection() {
    const {
        websiteLinks, updateWebsiteLinks,
        partners, addPartner, updatePartner, deletePartner,
        banners, addBanner, updateBanner, deleteBanner
    } = useAdmin();

    const [linksForm, setLinksForm] = useState(websiteLinks);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // --- Partner State ---
    const [partnerForm, setPartnerForm] = useState({ id: '', name: '', imageUrl: '', websiteUrl: '' });
    const [isEditingPartner, setIsEditingPartner] = useState(false);
    const partnerFileInputRef = useRef<HTMLInputElement>(null);

    // --- Banner State ---
    const [bannerForm, setBannerForm] = useState({ id: '', name: '', imageUrl: '', linkUrl: '', order: '1' });
    const [isEditingBanner, setIsEditingBanner] = useState(false);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    // --- Helpers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setImg: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size should be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImg(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Partner Handlers ---
    const handlePartnerSubmit = () => {
        if (!partnerForm.name || !partnerForm.imageUrl) return toast.error('Name & Image required');

        if (isEditingPartner) {
            updatePartner(partnerForm.id, {
                name: partnerForm.name,
                imageUrl: partnerForm.imageUrl,
                websiteUrl: partnerForm.websiteUrl
            });
            toast.success('Partner updated');
        } else {
            addPartner({
                name: partnerForm.name,
                imageUrl: partnerForm.imageUrl,
                websiteUrl: partnerForm.websiteUrl
            });
            toast.success('Partner added');
        }
        resetPartnerForm();
    };

    const editPartner = (p: any) => {
        setPartnerForm({ id: p.id, name: p.name, imageUrl: p.imageUrl, websiteUrl: p.websiteUrl });
        setIsEditingPartner(true);
    };

    const resetPartnerForm = () => {
        setPartnerForm({ id: '', name: '', imageUrl: '', websiteUrl: '' });
        setIsEditingPartner(false);
        if (partnerFileInputRef.current) partnerFileInputRef.current.value = '';
    };

    // --- Banner Handlers ---
    const handleBannerSubmit = () => {
        if (!bannerForm.name || !bannerForm.imageUrl) return toast.error('Name & Image required');

        if (isEditingBanner) {
            updateBanner(bannerForm.id, {
                name: bannerForm.name,
                imageUrl: bannerForm.imageUrl,
                linkUrl: bannerForm.linkUrl,
                order: parseInt(bannerForm.order) || 1
            });
            toast.success('Banner updated');
        } else {
            addBanner({
                name: bannerForm.name,
                imageUrl: bannerForm.imageUrl,
                linkUrl: bannerForm.linkUrl,
                order: parseInt(bannerForm.order) || 1
            });
            toast.success('Banner added');
        }
        resetBannerForm();
    };

    const editBanner = (b: any) => {
        setBannerForm({ id: b.id, name: b.name, imageUrl: b.imageUrl, linkUrl: b.linkUrl, order: b.order.toString() });
        setIsEditingBanner(true);
    };

    const resetBannerForm = () => {
        setBannerForm({ id: '', name: '', imageUrl: '', linkUrl: '', order: '1' });
        setIsEditingBanner(false);
        if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- Left Column: Links & Partners --- */}
            <div className="space-y-8">
                {/* Links Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Footer Links</h3>
                    <div className="space-y-4">
                        {['aboutUs', 'privacyPolicy', 'termsConditions'].map((key) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()} URL
                                </label>
                                <input
                                    type="text"
                                    value={(linksForm as any)[key]}
                                    onChange={e => setLinksForm({ ...linksForm, [key]: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => { updateWebsiteLinks(linksForm); toast.success('Links updated'); }}
                            className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            Save Links
                        </button>
                    </div>
                </div>

                {/* Partners Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Our Partners</h3>
                        {isEditingPartner && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Editing Mode</span>}
                    </div>

                    {/* Add/Edit Partner Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="Partner Name"
                                value={partnerForm.name}
                                onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                className="p-2 border rounded-lg text-sm w-full"
                            />
                            <input
                                placeholder="Website Link (Optional)"
                                value={partnerForm.websiteUrl}
                                onChange={e => setPartnerForm({ ...partnerForm, websiteUrl: e.target.value })}
                                className="p-2 border rounded-lg text-sm w-full"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Logo Image (Rec: 200x200px, Max: 2MB)</label>
                            <div className="flex gap-2">
                                <input
                                    ref={partnerFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, (url) => setPartnerForm(prev => ({ ...prev, imageUrl: url })))}
                                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {partnerForm.imageUrl && (
                                    <div className="w-10 h-10 border rounded bg-white flex items-center justify-center overflow-hidden">
                                        <img src={partnerForm.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            {isEditingPartner && (
                                <button onClick={resetPartnerForm} className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded text-sm">Cancel</button>
                            )}
                            <button onClick={handlePartnerSubmit} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                {isEditingPartner ? 'Update Partner' : 'Add Partner'}
                            </button>
                        </div>
                    </div>

                    {/* Partners List (Compact) */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 w-12 text-center text-gray-500"><ImageIcon size={16} /></th>
                                    <th className="p-3 text-gray-600 font-semibold">Partner Details</th>
                                    <th className="p-3 text-right text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {partners.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 group">
                                        <td className="p-2 text-center">
                                            <div className="w-8 h-8 mx-auto bg-white border rounded flex items-center justify-center overflow-hidden">
                                                <img src={p.imageUrl} alt="" className="w-full h-full object-contain" />
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="font-medium text-gray-900">{p.name}</div>
                                            {p.websiteUrl && (
                                                <a href={p.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                    {p.websiteUrl} <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setViewImage(p.imageUrl)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => editPartner(p)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deletePartner(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {partners.length === 0 && (
                                    <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">No partners yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- Right Column: Banners --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Homepage Banners</h3>
                    {isEditingBanner && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Editing Mode</span>}
                </div>

                {/* Add/Edit Banner Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 space-y-3">
                    <div className="flex gap-3">
                        <input
                            placeholder="Banner Name"
                            value={bannerForm.name}
                            onChange={e => setBannerForm({ ...bannerForm, name: e.target.value })}
                            className="flex-1 p-2 border rounded-lg text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Order"
                            value={bannerForm.order}
                            onChange={e => setBannerForm({ ...bannerForm, order: e.target.value })}
                            className="w-20 p-2 border rounded-lg text-sm text-center"
                        />
                    </div>
                    <input
                        placeholder="Link URL (Optional)"
                        value={bannerForm.linkUrl}
                        onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                    />

                    {/* Image Upload */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Banner Image (Rec: 1200x400px, Max: 2MB)</label>
                        <div className="flex gap-2">
                            <input
                                ref={bannerFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, (url) => setBannerForm(prev => ({ ...prev, imageUrl: url })))}
                                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                            {bannerForm.imageUrl && (
                                <div className="w-10 h-10 border rounded bg-white flex items-center justify-center overflow-hidden">
                                    <img src={bannerForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        {isEditingBanner && (
                            <button onClick={resetBannerForm} className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded text-sm">Cancel</button>
                        )}
                        <button onClick={handleBannerSubmit} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                            {isEditingBanner ? 'Update Banner' : 'Add Banner'}
                        </button>
                    </div>
                </div>

                {/* Banners List (Compact) */}
                <div className="border rounded-lg overflow-hidden flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 w-12 text-center text-gray-500">Ord</th>
                                <th className="p-3 w-16 text-center text-gray-500">Img</th>
                                <th className="p-3 text-gray-600 font-semibold">Banner Details</th>
                                <th className="p-3 text-right text-gray-600 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {banners.sort((a, b) => a.order - b.order).map(b => (
                                <tr key={b.id} className="hover:bg-gray-50 group">
                                    <td className="p-2 text-center font-bold text-gray-500">#{b.order}</td>
                                    <td className="p-2 text-center">
                                        <div className="w-12 h-6 mx-auto bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
                                            <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <div className="font-medium text-gray-900">{b.name}</div>
                                        {b.linkUrl && (
                                            <a href={b.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                Link <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setViewImage(b.imageUrl)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => editBanner(b)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {banners.length === 0 && (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">No banners configured.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Preview Modal */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
                        <button onClick={() => setViewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
                            <X size={24} />
                        </button>
                        <img src={viewImage} alt="Preview" className="max-w-full max-h-[80vh] rounded shadow-2xl" />
                    </div>
                </div>
            )}
        </div>
    );
}
