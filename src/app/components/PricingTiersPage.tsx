'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin, type PriceTier, type PricingRule, type AdjustmentType, type Product } from '../context/AdminContext';
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Package, Tag, Layers, DollarSign, Percent, Lock, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateEffectivePrice, getTierCoverage, formatRuleDescription, isSkuVisible as checkSkuVisible } from '../utils/pricingUtils';

type TierTab = 'audit' | 'visibility' | 'rules';

export function PricingTiersPage() {
    const {
        priceTiers, categories, subcategories, products,
        pricingRules, addPricingRule, updatePricingRule, deletePricingRule,
        addPriceTier, updatePriceTier
    } = useAdmin();

    const [showForm, setShowForm] = useState(false);
    const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
    const [expandedTier, setExpandedTier] = useState<string | null>(null);
    const [tierTab, setTierTab] = useState<TierTab>('audit');

    const [formData, setFormData] = useState({ name: '', description: '' });
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
    const [activeVisibilityTab, setActiveVisibilityTab] = useState<'categories' | 'subcategories' | 'skus'>('categories');

    const [showRuleForm, setShowRuleForm] = useState(false);
    const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
    const [ruleFormTierId, setRuleFormTierId] = useState<string>('');
    const [ruleFormData, setRuleFormData] = useState({
        level: 'category' as 'category' | 'subcategory' | 'sku',
        targetId: '',
        adjustmentType: 'fixed' as AdjustmentType,
        adjustmentOp: 'add' as 'add' | 'subtract',
        adjustmentValue: 0,
    });

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setSelectedCategories(new Set()); setSelectedSubcategories(new Set()); setSelectedSkus(new Set());
        setEditingTier(null); setShowForm(false);
    };

    const resetRuleForm = () => {
        setRuleFormData({ level: 'category', targetId: '', adjustmentType: 'fixed', adjustmentOp: 'add', adjustmentValue: 0 });
        setEditingRule(null); setShowRuleForm(false); setRuleFormTierId('');
    };

    const handleEdit = (tier: PriceTier) => {
        setEditingTier(tier);
        setFormData({ name: tier.name, description: tier.description });
        setSelectedCategories(new Set(tier.includedCategoryIds || []));
        setSelectedSubcategories(new Set(tier.includedSubcategoryIds || []));
        setSelectedSkus(new Set(tier.includedSkuIds || []));
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Tier name is required'); return; }
        const tierData = {
            name: formData.name, description: formData.description,
            includedCategoryIds: Array.from(selectedCategories), includedSubcategoryIds: Array.from(selectedSubcategories),
            includedSkuIds: Array.from(selectedSkus), items: editingTier?.items || [],
        };
        if (editingTier) { updatePriceTier(editingTier.id, tierData); toast.success('Tier updated successfully'); }
        else { addPriceTier(tierData); toast.success('Tier created successfully'); }
        resetForm();
    };

    const handleAddRule = (tierId: string) => {
        setRuleFormTierId(tierId);
        setRuleFormData({ level: 'category', targetId: '', adjustmentType: 'fixed', adjustmentOp: 'add', adjustmentValue: 0 });
        setEditingRule(null); setShowRuleForm(true);
    };

    const quickAddRule = (tierId: string, level: 'category' | 'subcategory' | 'sku', targetId: string) => {
        setRuleFormTierId(tierId);
        setRuleFormData({ level, targetId, adjustmentType: 'fixed', adjustmentOp: 'add', adjustmentValue: 0 });
        setEditingRule(null); setShowRuleForm(true);
    };

    const handleEditRule = (rule: PricingRule) => {
        setRuleFormTierId(rule.tierId);
        setRuleFormData({ level: rule.level, targetId: rule.targetId, adjustmentType: rule.adjustmentType, adjustmentOp: rule.adjustmentOp, adjustmentValue: rule.adjustmentValue });
        setEditingRule(rule); setShowRuleForm(true);
    };

    const handleRuleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleFormData.targetId) { toast.error('Please select a target'); return; }
        const ruleData = { tierId: ruleFormTierId, level: ruleFormData.level, targetId: ruleFormData.targetId, adjustmentType: ruleFormData.adjustmentType, adjustmentOp: ruleFormData.adjustmentOp, adjustmentValue: ruleFormData.adjustmentValue };
        if (editingRule) { updatePricingRule(editingRule.id, ruleData); toast.success('Rule updated'); }
        else { addPricingRule(ruleData); toast.success('Rule added'); }
        resetRuleForm();
    };

    const toggleSelection = (id: string, set: Set<string>, setFn: (s: Set<string>) => void) => {
        const newSet = new Set(set);
        if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
        setFn(newSet);
    };

    const getTierRules = (tierId: string) => pricingRules.filter(r => r.tierId === tierId);
    const getTargetName = (level: string, targetId: string) => {
        if (level === 'category') return categories.find(c => c.id === targetId)?.name || targetId;
        if (level === 'subcategory') return subcategories.find(s => s.id === targetId)?.name || targetId;
        return products.find(i => i.id === targetId)?.name || targetId;
    };
    const formatRule = (rule: PricingRule) => {
        if (rule.adjustmentType === 'constant') return `₹${rule.adjustmentValue} (fixed)`;
        const sign = rule.adjustmentOp === 'add' ? '+' : '-';
        const unit = rule.adjustmentType === 'percent' ? '%' : '₹';
        return `Base ${sign} ${unit === '₹' ? '₹' : ''}${rule.adjustmentValue}${unit === '%' ? '%' : ''}`;
    };
    const computeCoverage = (tier: PriceTier) => {
        const visibility = { includedCategoryIds: tier.includedCategoryIds || [], includedSubcategoryIds: tier.includedSubcategoryIds || [], includedSkuIds: tier.includedSkuIds || [] };
        const skuInfos = products.map(item => ({ id: item.id, categoryId: item.categoryId, subcategoryId: item.subcategoryId, basePrice: item.basePrice || 0 }));
        return getTierCoverage(skuInfos, tier.id, visibility, pricingRules);
    };
    const getOrphanedRules = (tier: PriceTier) => {
        const visibility = { includedCategoryIds: tier.includedCategoryIds || [], includedSubcategoryIds: tier.includedSubcategoryIds || [], includedSkuIds: tier.includedSkuIds || [] };
        return pricingRules.filter(r => {
            if (r.tierId !== tier.id) return false;
            if (r.level === 'category') return !visibility.includedCategoryIds.includes(r.targetId);
            if (r.level === 'subcategory') return !visibility.includedSubcategoryIds.includes(r.targetId);
            if (r.level === 'sku') return !visibility.includedSkuIds.includes(r.targetId);
            return false;
        });
    };
    const hasRuleFor = (tierId: string, level: string, targetId: string) => pricingRules.some(r => r.tierId === tierId && r.level === level && r.targetId === targetId);
    const ruleTargets = useMemo(() => {
        if (ruleFormData.level === 'category') return categories;
        if (ruleFormData.level === 'subcategory') return subcategories;
        return products;
    }, [ruleFormData.level, categories, subcategories, products]);

    const computeAuditData = (tier: PriceTier) => {
        const visibility = { includedCategoryIds: tier.includedCategoryIds || [], includedSubcategoryIds: tier.includedSubcategoryIds || [], includedSkuIds: tier.includedSkuIds || [] };
        return products.map(item => {
            const firstPrice = item.basePrice || 0;
            const skuInfo = { id: item.id, categoryId: item.categoryId, subcategoryId: item.subcategoryId, basePrice: firstPrice };
            const result = calculateEffectivePrice(skuInfo, tier.id, visibility, pricingRules);
            let ruleFormula = '-';
            if (result.ruleApplied) {
                const r = result.ruleApplied;
                if (r.adjustmentType === 'constant') { ruleFormula = `₹${r.adjustmentValue}`; }
                else { const sign = r.adjustmentOp === 'add' ? '+' : '-'; const unit = r.adjustmentType === 'percent' ? '%' : '₹'; ruleFormula = `Base ${sign}${unit === '₹' ? '₹' : ''}${r.adjustmentValue}${unit === '%' ? '%' : ''}`; }
            }
            return { ...item, ...result, basePriceNum: firstPrice, ruleFormula, categoryName: categories.find(c => c.id === item.categoryId)?.name || '-' };
        }).filter(row => row.isVisible || row.hasRule);
    };

    const getVisibleSkuCount = (tier: PriceTier) => {
        const catIds = new Set(tier.includedCategoryIds || []);
        const subIds = new Set(tier.includedSubcategoryIds || []);
        const skuIds = new Set(tier.includedSkuIds || []);
        return products.filter(item => catIds.has(item.categoryId) || (item.subcategoryId && subIds.has(item.subcategoryId)) || skuIds.has(item.id)).length;
    };

    return (
        <>
            <style>{`
                .pt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .pt-title { font-size: 20px; font-weight: 600; }
                .pt-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
                .pt-btn-add { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #16a34a; color: white; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
                .pt-btn-add:hover { background: #15803d; }
                .pt-info-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af; }
                .pt-info-banner strong { font-weight: 700; }
                .pt-tiers-list { display: flex; flex-direction: column; gap: 16px; }
                .pt-empty { background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; padding: 32px; text-align: center; color: #6b7280; }
                .pt-tier-card { background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; }
                .pt-tier-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; cursor: pointer; transition: background 0.15s; }
                .pt-tier-header:hover { background: #f9fafb; }
                .pt-tier-left { display: flex; align-items: center; gap: 12px; }
                .pt-tier-toggle { color: #9ca3af; background: none; border: none; }
                .pt-tier-name { font-weight: 600; color: #111827; }
                .pt-tier-desc { font-size: 13px; color: #6b7280; }
                .pt-tier-right { display: flex; align-items: center; gap: 16px; }
                .pt-coverage-badge { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
                .pt-coverage-green { background: #dcfce7; color: #15803d; }
                .pt-coverage-yellow { background: #fef9c3; color: #854d0e; }
                .pt-coverage-red { background: #fee2e2; color: #b91c1c; }
                .pt-orphan-badge { display: flex; align-items: center; gap: 4px; color: #d97706; font-size: 12px; }
                .pt-tier-stats { text-align: right; }
                .pt-tier-stats-sku { font-size: 13px; font-weight: 500; color: #111827; }
                .pt-tier-stats-detail { font-size: 12px; color: #9ca3af; }
                .pt-btn-edit { padding: 8px; color: #2563eb; background: transparent; border: none; cursor: pointer; border-radius: 8px; }
                .pt-btn-edit:hover { background: #eff6ff; }
                .pt-expanded { border-top: 1px solid #e5e7eb; }
                .pt-tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
                .pt-tab { padding: 8px 16px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 4px; border: none; cursor: pointer; background: transparent; color: #6b7280; border-bottom: 2px solid transparent; }
                .pt-tab-active { border-bottom-color: #16a34a; color: #16a34a; background: white; }
                .pt-tab-content { padding: 16px; }
                .pt-audit-note { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
                .pt-audit-table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
                .pt-audit-table { width: 100%; font-size: 13px; border-collapse: collapse; }
                .pt-audit-thead { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
                .pt-audit-th { padding: 12px; font-weight: 500; text-align: left; }
                .pt-audit-th-center { text-align: center; }
                .pt-audit-th-right { text-align: right; }
                .pt-audit-tbody tr { border-bottom: 1px solid #f3f4f6; }
                .pt-audit-row-warn { background: #fffbeb; }
                .pt-audit-td { padding: 12px; }
                .pt-audit-td-name { font-weight: 500; }
                .pt-audit-td-gray { color: #6b7280; }
                .pt-audit-td-center { text-align: center; }
                .pt-audit-td-right { text-align: right; }
                .pt-audit-td-price { font-weight: 500; }
                .pt-rule-source { font-size: 12px; padding: 2px 8px; border-radius: 4px; }
                .pt-rule-purple { background: #f3e8ff; color: #6b21a8; }
                .pt-rule-blue { background: #dbeafe; color: #1e40af; }
                .pt-rule-green { background: #dcfce7; color: #166534; }
                .pt-rule-gray { background: #f3f4f6; color: #6b7280; }
                .pt-rule-formula { margin-left: 8px; font-size: 12px; color: #9ca3af; }
                .pt-warn-text { color: #d97706; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; }
                .pt-vis-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
                .pt-vis-title { font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
                .pt-vis-list { display: flex; flex-direction: column; gap: 4px; }
                .pt-vis-none { font-size: 13px; color: #9ca3af; font-style: italic; }
                .pt-vis-item { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #1f2937; background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
                .pt-vis-add-btn { display: flex; align-items: center; gap: 4px; color: #d97706; background: none; border: none; cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px; }
                .pt-vis-add-btn:hover { color: #b45309; background: #fffbeb; }
                .pt-rules-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .pt-rules-desc { font-size: 13px; color: #6b7280; }
                .pt-btn-add-rule { display: flex; align-items: center; gap: 4px; padding: 4px 12px; font-size: 13px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .pt-btn-add-rule:hover { background: #15803d; }
                .pt-rules-empty { text-align: center; padding: 24px; color: #6b7280; background: #f9fafb; border-radius: 8px; font-size: 13px; }
                .pt-rules-list { display: flex; flex-direction: column; gap: 8px; }
                .pt-rule-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .pt-rule-item-default { background: #f9fafb; }
                .pt-rule-item-orphan { background: #fffbeb; border-color: #fde68a; }
                .pt-rule-left { display: flex; align-items: center; gap: 12px; }
                .pt-rule-target { font-weight: 500; font-size: 13px; display: flex; align-items: center; gap: 8px; }
                .pt-rule-target-cap { text-transform: capitalize; }
                .pt-rule-formula-text { font-size: 12px; color: #9ca3af; }
                .pt-orphan-label { font-size: 12px; color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
                .pt-rule-actions { display: flex; gap: 4px; }
                .pt-btn-rule-edit { padding: 4px; color: #2563eb; background: none; border: none; cursor: pointer; border-radius: 4px; }
                .pt-btn-rule-edit:hover { background: #dbeafe; }
                .pt-btn-rule-delete { padding: 4px; color: #dc2626; background: none; border: none; cursor: pointer; border-radius: 4px; }
                .pt-btn-rule-delete:hover { background: #fee2e2; }
                .pt-orphan-section { margin-top: 16px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }
                .pt-orphan-title { display: flex; align-items: center; gap: 8px; color: #b45309; font-weight: 500; font-size: 13px; margin-bottom: 8px; }
                .pt-orphan-desc { font-size: 12px; color: #d97706; }
                .pt-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
                .pt-modal { background: white; border-radius: 8px; padding: 24px; max-width: 768px; width: 100%; margin: 16px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
                .pt-modal-sm { max-width: 448px; }
                .pt-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .pt-modal-title { font-size: 20px; font-weight: 600; }
                .pt-modal-title-sm { font-size: 18px; font-weight: 600; }
                .pt-modal-close { color: #6b7280; background: none; border: none; cursor: pointer; }
                .pt-modal-close:hover { color: #374151; }
                .pt-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .pt-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
                .pt-input, .pt-select { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; }
                .pt-input:focus, .pt-select:focus { box-shadow: 0 0 0 2px rgba(22,163,74,0.3); border-color: #16a34a; }
                .pt-vis-tabs { border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; display: flex; gap: 16px; }
                .pt-vis-tab { padding: 8px 16px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.15s; border: none; background: transparent; cursor: pointer; color: #6b7280; font-size: 14px; }
                .pt-vis-tab-active { border-bottom-color: #16a34a; color: #16a34a; }
                .pt-vis-scroll { flex: 1; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
                .pt-vis-scroll-item { display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
                .pt-vis-scroll-item:hover { background: #f9fafb; }
                .pt-vis-scroll-selected { background: #f0fdf4; }
                .pt-vis-item-name { font-weight: 500; }
                .pt-vis-item-desc { font-size: 13px; color: #9ca3af; }
                .pt-vis-item-badge { margin-left: auto; font-size: 12px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; }
                .pt-modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 16px; }
                .pt-btn-cancel { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 14px; }
                .pt-btn-cancel:hover { background: #f9fafb; }
                .pt-btn-save { padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
                .pt-btn-save:hover { background: #15803d; }
                .pt-form-section { margin-bottom: 16px; }
                .pt-adj-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
                .pt-adj-btn { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; background: white; }
                .pt-adj-btn:hover { background: #f9fafb; }
                .pt-adj-btn-active { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
                .pt-adj-btn span { text-transform: capitalize; }
                .pt-op-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .pt-op-btn { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; background: white; }
                .pt-op-btn:hover { background: #f9fafb; }
                .pt-op-btn-active { border-color: #16a34a; background: #f0fdf4; }
            `}</style>

            <div>
                <div className="pt-header">
                    <div>
                        <h2 className="pt-title">Pricing Tiers</h2>
                        <p className="pt-subtitle">Catalog visibility & pricing rules per tier</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="pt-btn-add"><Plus style={{ width: 16, height: 16 }} /> Add Tier</button>
                </div>

                <div className="pt-info-banner">
                    <strong>Tier = Commercial Contract.</strong> Controls visibility + pricing adjustments.
                    Priority: SKU Rule &gt; Subcategory Rule &gt; Category Rule &gt; Base Price.
                </div>

                <div className="pt-tiers-list">
                    {priceTiers.length === 0 ? (
                        <div className="pt-empty">No pricing tiers defined. Click "Add Tier" to create one.</div>
                    ) : (
                        priceTiers.map(tier => {
                            const isExpanded = expandedTier === tier.id;
                            const tierRules = getTierRules(tier.id);
                            const coverage = computeCoverage(tier);
                            const orphanedRules = getOrphanedRules(tier);
                            const coveragePercent = coverage.visibleCount > 0 ? Math.round((coverage.coveredCount / coverage.visibleCount) * 100) : 0;

                            return (
                                <div key={tier.id} className="pt-tier-card">
                                    <div className="pt-tier-header" onClick={() => { setExpandedTier(isExpanded ? null : tier.id); setTierTab('audit'); }}>
                                        <div className="pt-tier-left">
                                            <button className="pt-tier-toggle">{isExpanded ? <ChevronDown style={{ width: 20, height: 20 }} /> : <ChevronRight style={{ width: 20, height: 20 }} />}</button>
                                            <div><h3 className="pt-tier-name">{tier.name}</h3><p className="pt-tier-desc">{tier.description}</p></div>
                                        </div>
                                        <div className="pt-tier-right">
                                            {coverage.visibleCount > 0 && (
                                                <div className={`pt-coverage-badge ${coveragePercent === 100 ? 'pt-coverage-green' : coveragePercent >= 80 ? 'pt-coverage-yellow' : 'pt-coverage-red'}`}>
                                                    {coverage.coveredCount}/{coverage.visibleCount} covered ({coveragePercent}%)
                                                </div>
                                            )}
                                            {orphanedRules.length > 0 && (<div className="pt-orphan-badge"><AlertTriangle style={{ width: 12, height: 12 }} /> {orphanedRules.length} orphaned</div>)}
                                            <div className="pt-tier-stats"><div className="pt-tier-stats-sku">{getVisibleSkuCount(tier)} SKUs visible</div><div className="pt-tier-stats-detail">{(tier.includedCategoryIds?.length || 0)} cats, {(tier.includedSubcategoryIds?.length || 0)} subs, {(tier.includedSkuIds?.length || 0)} explicit</div></div>
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(tier); }} className="pt-btn-edit"><Edit2 style={{ width: 16, height: 16 }} /></button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="pt-expanded">
                                            <div className="pt-tabs">
                                                <button onClick={() => setTierTab('audit')} className={`pt-tab ${tierTab === 'audit' ? 'pt-tab-active' : ''}`}><Eye style={{ width: 16, height: 16 }} /> Audit</button>
                                                <button onClick={() => setTierTab('visibility')} className={`pt-tab ${tierTab === 'visibility' ? 'pt-tab-active' : ''}`}>Visibility</button>
                                                <button onClick={() => setTierTab('rules')} className={`pt-tab ${tierTab === 'rules' ? 'pt-tab-active' : ''}`}>Pricing Rules ({tierRules.length})</button>
                                            </div>

                                            <div className="pt-tab-content">
                                                {tierTab === 'audit' && (
                                                    <div>
                                                        <p className="pt-audit-note">Complete catalog view with effective prices. ⚠️ = integrity issue.</p>
                                                        <div className="pt-audit-table-wrap">
                                                            <table className="pt-audit-table">
                                                                <thead className="pt-audit-thead">
                                                                    <tr><th className="pt-audit-th">SKU</th><th className="pt-audit-th">Category</th><th className="pt-audit-th pt-audit-th-center">Visible</th><th className="pt-audit-th">Rule Source</th><th className="pt-audit-th pt-audit-th-right">Base</th><th className="pt-audit-th pt-audit-th-right">Effective</th><th className="pt-audit-th pt-audit-th-center">Status</th></tr>
                                                                </thead>
                                                                <tbody className="pt-audit-tbody">
                                                                    {computeAuditData(tier).map(row => (
                                                                        <tr key={row.id} className={row.integrityIssue !== 'none' ? 'pt-audit-row-warn' : ''}>
                                                                            <td className="pt-audit-td pt-audit-td-name">{row.name}</td>
                                                                            <td className="pt-audit-td pt-audit-td-gray">{row.categoryName}</td>
                                                                            <td className="pt-audit-td pt-audit-td-center">{row.isVisible ? <CheckCircle style={{ width: 16, height: 16, color: '#16a34a', display: 'inline' }} /> : <XCircle style={{ width: 16, height: 16, color: '#9ca3af', display: 'inline' }} />}</td>
                                                                            <td className="pt-audit-td">
                                                                                <span className={`pt-rule-source ${row.ruleSource === 'sku' ? 'pt-rule-purple' : row.ruleSource === 'subcategory' ? 'pt-rule-blue' : row.ruleSource === 'category' ? 'pt-rule-green' : 'pt-rule-gray'}`}>{row.ruleSource === 'base' ? 'Base' : row.ruleSource.charAt(0).toUpperCase() + row.ruleSource.slice(1)}</span>
                                                                                <span className="pt-rule-formula">{row.ruleFormula}</span>
                                                                            </td>
                                                                            <td className="pt-audit-td pt-audit-td-right pt-audit-td-gray">₹{(row.basePriceNum || 0).toFixed(2)}</td>
                                                                            <td className="pt-audit-td pt-audit-td-right pt-audit-td-price">{row.isVisible ? `₹${row.price.toFixed(2)}` : '-'}</td>
                                                                            <td className="pt-audit-td pt-audit-td-center">
                                                                                {row.integrityIssue === 'visible_no_rule' && (<span className="pt-warn-text"><AlertTriangle style={{ width: 12, height: 12 }} /> No rule</span>)}
                                                                                {row.integrityIssue === 'rule_but_hidden' && (<span className="pt-warn-text"><AlertTriangle style={{ width: 12, height: 12 }} /> Hidden</span>)}
                                                                                {row.integrityIssue === 'none' && row.isVisible && (<CheckCircle style={{ width: 16, height: 16, color: '#22c55e', display: 'inline' }} />)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {tierTab === 'visibility' && (
                                                    <div className="pt-vis-grid">
                                                        <div>
                                                            <h4 className="pt-vis-title"><Tag style={{ width: 16, height: 16 }} /> Categories</h4>
                                                            <div className="pt-vis-list">
                                                                {(tier.includedCategoryIds || []).length === 0 ? (<span className="pt-vis-none">None</span>) : (
                                                                    (tier.includedCategoryIds || []).map(catId => (
                                                                        <div key={catId} className="pt-vis-item">
                                                                            <span>{categories.find(c => c.id === catId)?.name || catId}</span>
                                                                            {!hasRuleFor(tier.id, 'category', catId) && (
                                                                                <button onClick={() => quickAddRule(tier.id, 'category', catId)} className="pt-vis-add-btn" title="Add pricing rule"><AlertTriangle style={{ width: 12, height: 12 }} /><Plus style={{ width: 12, height: 12 }} /></button>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="pt-vis-title"><Layers style={{ width: 16, height: 16 }} /> Subcategories</h4>
                                                            <div className="pt-vis-list">
                                                                {(tier.includedSubcategoryIds || []).length === 0 ? (<span className="pt-vis-none">None</span>) : (
                                                                    (tier.includedSubcategoryIds || []).map(subId => (
                                                                        <div key={subId} className="pt-vis-item">
                                                                            <span>{subcategories.find(s => s.id === subId)?.name || subId}</span>
                                                                            {!hasRuleFor(tier.id, 'subcategory', subId) && (
                                                                                <button onClick={() => quickAddRule(tier.id, 'subcategory', subId)} className="pt-vis-add-btn" title="Add pricing rule"><AlertTriangle style={{ width: 12, height: 12 }} /><Plus style={{ width: 12, height: 12 }} /></button>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="pt-vis-title"><Package style={{ width: 16, height: 16 }} /> Explicit SKUs</h4>
                                                            <div className="pt-vis-list">
                                                                {(tier.includedSkuIds || []).length === 0 ? (<span className="pt-vis-none">None</span>) : (
                                                                    (tier.includedSkuIds || []).map(skuId => (
                                                                        <div key={skuId} className="pt-vis-item">
                                                                            <span>{products.find(i => i.id === skuId)?.name || skuId}</span>
                                                                            {!hasRuleFor(tier.id, 'sku', skuId) && (
                                                                                <button onClick={() => quickAddRule(tier.id, 'sku', skuId)} className="pt-vis-add-btn" title="Add pricing rule"><AlertTriangle style={{ width: 12, height: 12 }} /><Plus style={{ width: 12, height: 12 }} /></button>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {tierTab === 'rules' && (
                                                    <div>
                                                        <div className="pt-rules-header">
                                                            <p className="pt-rules-desc">Pricing adjustments for this tier</p>
                                                            <button onClick={() => handleAddRule(tier.id)} className="pt-btn-add-rule"><Plus style={{ width: 12, height: 12 }} /> Add Rule</button>
                                                        </div>

                                                        {tierRules.length === 0 ? (
                                                            <div className="pt-rules-empty">No rules defined. Using base prices for all visible SKUs.</div>
                                                        ) : (
                                                            <div className="pt-rules-list">
                                                                {tierRules.map(rule => {
                                                                    const isOrphaned = orphanedRules.some(o => o.id === rule.id);
                                                                    return (
                                                                        <div key={rule.id} className={`pt-rule-item ${isOrphaned ? 'pt-rule-item-orphan' : 'pt-rule-item-default'}`}>
                                                                            <div className="pt-rule-left">
                                                                                {rule.adjustmentType === 'constant' ? <Lock style={{ width: 16, height: 16, color: '#7c3aed' }} /> : rule.adjustmentType === 'percent' ? <Percent style={{ width: 16, height: 16, color: '#2563eb' }} /> : <DollarSign style={{ width: 16, height: 16, color: '#16a34a' }} />}
                                                                                <div>
                                                                                    <div className="pt-rule-target"><span className="pt-rule-target-cap">{rule.level}:</span> {getTargetName(rule.level, rule.targetId)} {isOrphaned && <span className="pt-orphan-label">⚠️ Hidden</span>}</div>
                                                                                    <div className="pt-rule-formula-text">{formatRule(rule)}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="pt-rule-actions">
                                                                                <button onClick={() => handleEditRule(rule)} className="pt-btn-rule-edit"><Edit2 style={{ width: 12, height: 12 }} /></button>
                                                                                <button onClick={() => { deletePricingRule(rule.id); toast.success('Rule deleted'); }} className="pt-btn-rule-delete"><Trash2 style={{ width: 12, height: 12 }} /></button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {orphanedRules.length > 0 && (
                                                            <div className="pt-orphan-section">
                                                                <div className="pt-orphan-title"><AlertTriangle style={{ width: 16, height: 16 }} /> {orphanedRules.length} Orphaned Rule{orphanedRules.length > 1 ? 's' : ''} (target not visible)</div>
                                                                <p className="pt-orphan-desc">These rules apply to categories/SKUs that are not included in this tier's visibility. Consider removing them or adding the targets to visibility.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Add/Edit Tier Modal */}
                {showForm && (
                    <div className="pt-modal-backdrop">
                        <div className="pt-modal">
                            <div className="pt-modal-header">
                                <h3 className="pt-modal-title">{editingTier ? 'Edit' : 'Add'} Pricing Tier</h3>
                                <button onClick={resetForm} className="pt-modal-close"><X style={{ width: 20, height: 20 }} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div className="pt-form-row">
                                    <div><label className="pt-label">Tier Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pt-input" placeholder="e.g., Premium HORECA" required /></div>
                                    <div><label className="pt-label">Description</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="pt-input" placeholder="e.g., High-end hotels and restaurants" /></div>
                                </div>

                                <div className="pt-vis-tabs">
                                    {['categories', 'subcategories', 'skus'].map(tab => (
                                        <button key={tab} type="button" onClick={() => setActiveVisibilityTab(tab as any)} className={`pt-vis-tab ${activeVisibilityTab === tab ? 'pt-vis-tab-active' : ''}`}>
                                            {tab === 'categories' ? `Categories (${selectedCategories.size})` : tab === 'subcategories' ? `Subcategories (${selectedSubcategories.size})` : `SKUs (${selectedSkus.size})`}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-vis-scroll">
                                    {activeVisibilityTab === 'categories' && categories.map(cat => (
                                        <label key={cat.id} className={`pt-vis-scroll-item ${selectedCategories.has(cat.id) ? 'pt-vis-scroll-selected' : ''}`}>
                                            <input type="checkbox" checked={selectedCategories.has(cat.id)} onChange={() => toggleSelection(cat.id, selectedCategories, setSelectedCategories)} style={{ accentColor: '#16a34a' }} />
                                            <div><div className="pt-vis-item-name">{cat.name}</div><div className="pt-vis-item-desc">{cat.description}</div></div>
                                            <span className="pt-vis-item-badge">{products.filter(i => i.categoryId === cat.id).length} items</span>
                                        </label>
                                    ))}
                                    {activeVisibilityTab === 'subcategories' && subcategories.map(sub => (
                                        <label key={sub.id} className={`pt-vis-scroll-item ${selectedSubcategories.has(sub.id) ? 'pt-vis-scroll-selected' : ''}`}>
                                            <input type="checkbox" checked={selectedSubcategories.has(sub.id)} onChange={() => toggleSelection(sub.id, selectedSubcategories, setSelectedSubcategories)} style={{ accentColor: '#16a34a' }} />
                                            <div><div className="pt-vis-item-name">{sub.name}</div><div className="pt-vis-item-desc">{categories.find(c => c.id === sub.categoryId)?.name}</div></div>
                                        </label>
                                    ))}
                                    {activeVisibilityTab === 'skus' && products.map(item => (
                                        <label key={item.id} className={`pt-vis-scroll-item ${selectedSkus.has(item.id) ? 'pt-vis-scroll-selected' : ''}`}>
                                            <input type="checkbox" checked={selectedSkus.has(item.id)} onChange={() => toggleSelection(item.id, selectedSkus, setSelectedSkus)} style={{ accentColor: '#16a34a' }} />
                                            <div><div className="pt-vis-item-name">{item.name}</div><div className="pt-vis-item-desc">{categories.find(c => c.id === item.categoryId)?.name}</div></div>
                                        </label>
                                    ))}
                                </div>

                                <div className="pt-modal-footer">
                                    <button type="button" onClick={resetForm} className="pt-btn-cancel">Cancel</button>
                                    <button type="submit" className="pt-btn-save">{editingTier ? 'Update' : 'Create'} Tier</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Rule Modal */}
                {showRuleForm && (
                    <div className="pt-modal-backdrop">
                        <div className="pt-modal pt-modal-sm">
                            <div className="pt-modal-header">
                                <h3 className="pt-modal-title-sm">{editingRule ? 'Edit' : 'Add'} Pricing Rule</h3>
                                <button onClick={resetRuleForm} className="pt-modal-close"><X style={{ width: 20, height: 20 }} /></button>
                            </div>

                            <form onSubmit={handleRuleSubmit}>
                                <div className="pt-form-section">
                                    <label className="pt-label">Apply To</label>
                                    <select value={ruleFormData.level} onChange={(e) => setRuleFormData({ ...ruleFormData, level: e.target.value as any, targetId: '' })} className="pt-select">
                                        <option value="category">Category</option><option value="subcategory">Subcategory</option><option value="sku">Individual SKU</option>
                                    </select>
                                </div>
                                <div className="pt-form-section">
                                    <label className="pt-label">Target</label>
                                    <select value={ruleFormData.targetId} onChange={(e) => setRuleFormData({ ...ruleFormData, targetId: e.target.value })} className="pt-select" required>
                                        <option value="">Select {ruleFormData.level}</option>
                                        {ruleTargets.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                    </select>
                                </div>
                                <div className="pt-form-section">
                                    <label className="pt-label">Adjustment Type</label>
                                    <div className="pt-adj-grid">
                                        {(['fixed', 'percent', 'constant'] as AdjustmentType[]).map(type => (
                                            <button key={type} type="button" onClick={() => setRuleFormData({ ...ruleFormData, adjustmentType: type })} className={`pt-adj-btn ${ruleFormData.adjustmentType === type ? 'pt-adj-btn-active' : ''}`}>
                                                {type === 'fixed' && <DollarSign style={{ width: 16, height: 16 }} />}
                                                {type === 'percent' && <Percent style={{ width: 16, height: 16 }} />}
                                                {type === 'constant' && <Lock style={{ width: 16, height: 16 }} />}
                                                <span>{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {ruleFormData.adjustmentType !== 'constant' && (
                                    <div className="pt-form-section">
                                        <label className="pt-label">Operation</label>
                                        <div className="pt-op-grid">
                                            {(['add', 'subtract'] as const).map(op => (
                                                <button key={op} type="button" onClick={() => setRuleFormData({ ...ruleFormData, adjustmentOp: op })} className={`pt-op-btn ${ruleFormData.adjustmentOp === op ? 'pt-op-btn-active' : ''}`}>
                                                    {op === 'add' ? '+ Add' : '- Subtract'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="pt-form-section">
                                    <label className="pt-label">{ruleFormData.adjustmentType === 'constant' ? 'Fixed Price (₹)' : ruleFormData.adjustmentType === 'percent' ? 'Percentage (%)' : 'Amount (₹)'}</label>
                                    <input type="number" min="0" step="0.01" value={ruleFormData.adjustmentValue} onChange={(e) => setRuleFormData({ ...ruleFormData, adjustmentValue: parseFloat(e.target.value) || 0 })} className="pt-input" required />
                                </div>
                                <div className="pt-modal-footer">
                                    <button type="button" onClick={resetRuleForm} className="pt-btn-cancel">Cancel</button>
                                    <button type="submit" className="pt-btn-save">{editingRule ? 'Update' : 'Add'} Rule</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
