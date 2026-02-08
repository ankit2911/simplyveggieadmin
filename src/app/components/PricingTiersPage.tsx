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

    // Form state for tier
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
    const [activeVisibilityTab, setActiveVisibilityTab] = useState<'categories' | 'subcategories' | 'skus'>('categories');

    // Rule form state
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

    // Helpers
    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setSelectedCategories(new Set());
        setSelectedSubcategories(new Set());
        setSelectedSkus(new Set());
        setEditingTier(null);
        setShowForm(false);
    };

    const resetRuleForm = () => {
        setRuleFormData({
            level: 'category',
            targetId: '',
            adjustmentType: 'fixed',
            adjustmentOp: 'add',
            adjustmentValue: 0,
        });
        setEditingRule(null);
        setShowRuleForm(false);
        setRuleFormTierId('');
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
        if (!formData.name.trim()) {
            toast.error('Tier name is required');
            return;
        }

        const tierData = {
            name: formData.name,
            description: formData.description,
            includedCategoryIds: Array.from(selectedCategories),
            includedSubcategoryIds: Array.from(selectedSubcategories),
            includedSkuIds: Array.from(selectedSkus),
            items: editingTier?.items || [],
        };

        if (editingTier) {
            updatePriceTier(editingTier.id, tierData);
            toast.success('Tier updated successfully');
        } else {
            addPriceTier(tierData);
            toast.success('Tier created successfully');
        }
        resetForm();
    };

    const handleAddRule = (tierId: string) => {
        setRuleFormTierId(tierId);
        setRuleFormData({
            level: 'category',
            targetId: '',
            adjustmentType: 'fixed',
            adjustmentOp: 'add',
            adjustmentValue: 0,
        });
        setEditingRule(null);
        setShowRuleForm(true);
    };

    // Quick add rule with pre-populated level and target
    const quickAddRule = (tierId: string, level: 'category' | 'subcategory' | 'sku', targetId: string) => {
        setRuleFormTierId(tierId);
        setRuleFormData({
            level,
            targetId,
            adjustmentType: 'fixed',
            adjustmentOp: 'add',
            adjustmentValue: 0,
        });
        setEditingRule(null);
        setShowRuleForm(true);
    };

    const handleEditRule = (rule: PricingRule) => {
        setRuleFormTierId(rule.tierId);
        setRuleFormData({
            level: rule.level,
            targetId: rule.targetId,
            adjustmentType: rule.adjustmentType,
            adjustmentOp: rule.adjustmentOp,
            adjustmentValue: rule.adjustmentValue,
        });
        setEditingRule(rule);
        setShowRuleForm(true);
    };

    const handleRuleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleFormData.targetId) {
            toast.error('Please select a target');
            return;
        }

        const ruleData = {
            tierId: ruleFormTierId,
            level: ruleFormData.level,
            targetId: ruleFormData.targetId,
            adjustmentType: ruleFormData.adjustmentType,
            adjustmentOp: ruleFormData.adjustmentOp,
            adjustmentValue: ruleFormData.adjustmentValue,
        };

        if (editingRule) {
            updatePricingRule(editingRule.id, ruleData);
            toast.success('Rule updated');
        } else {
            addPricingRule(ruleData);
            toast.success('Rule added');
        }
        resetRuleForm();
    };

    const toggleSelection = (id: string, set: Set<string>, setFn: (s: Set<string>) => void) => {
        const newSet = new Set(set);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
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

    // Compute coverage for a tier
    const computeCoverage = (tier: PriceTier) => {
        const visibility = {
            includedCategoryIds: tier.includedCategoryIds || [],
            includedSubcategoryIds: tier.includedSubcategoryIds || [],
            includedSkuIds: tier.includedSkuIds || [],
        };
        const skuInfos = products.map(item => {
            const firstPrice = item.basePrice || 0;
            return {
                id: item.id,
                categoryId: item.categoryId,
                subcategoryId: item.subcategoryId,
                basePrice: firstPrice,
            };
        });
        return getTierCoverage(skuInfos, tier.id, visibility, pricingRules);
    };

    // Get orphaned rules for a tier
    const getOrphanedRules = (tier: PriceTier) => {
        const visibility = {
            includedCategoryIds: tier.includedCategoryIds || [],
            includedSubcategoryIds: tier.includedSubcategoryIds || [],
            includedSkuIds: tier.includedSkuIds || [],
        };
        return pricingRules.filter(r => {
            if (r.tierId !== tier.id) return false;
            if (r.level === 'category') return !visibility.includedCategoryIds.includes(r.targetId);
            if (r.level === 'subcategory') return !visibility.includedSubcategoryIds.includes(r.targetId);
            if (r.level === 'sku') return !visibility.includedSkuIds.includes(r.targetId);
            return false;
        });
    };

    // Check if a category/subcategory has a rule for this tier
    const hasRuleFor = (tierId: string, level: string, targetId: string) => {
        return pricingRules.some(r => r.tierId === tierId && r.level === level && r.targetId === targetId);
    };

    // Targets for rule form
    const ruleTargets = useMemo(() => {
        if (ruleFormData.level === 'category') return categories;
        if (ruleFormData.level === 'subcategory') return subcategories;
        return products;
    }, [ruleFormData.level, categories, subcategories, products]);

    // Compute audit data for a tier - only SKUs that are visible OR have a rule
    const computeAuditData = (tier: PriceTier) => {
        const visibility = {
            includedCategoryIds: tier.includedCategoryIds || [],
            includedSubcategoryIds: tier.includedSubcategoryIds || [],
            includedSkuIds: tier.includedSkuIds || [],
        };

        const tierRulesLocal = pricingRules.filter(r => r.tierId === tier.id);

        return products.map(item => {
            const firstPrice = item.basePrice || 0;
            const skuInfo = {
                id: item.id,
                categoryId: item.categoryId,
                subcategoryId: item.subcategoryId,
                basePrice: firstPrice,
            };
            const result = calculateEffectivePrice(skuInfo, tier.id, visibility, pricingRules);
            // Format the rule
            let ruleFormula = '-';
            if (result.ruleApplied) {
                const r = result.ruleApplied;
                if (r.adjustmentType === 'constant') {
                    ruleFormula = `₹${r.adjustmentValue}`;
                } else {
                    const sign = r.adjustmentOp === 'add' ? '+' : '-';
                    const unit = r.adjustmentType === 'percent' ? '%' : '₹';
                    ruleFormula = `Base ${sign}${unit === '₹' ? '₹' : ''}${r.adjustmentValue}${unit === '%' ? '%' : ''}`;
                }
            }
            return {
                ...item,
                ...result,
                basePriceNum: firstPrice,
                ruleFormula,
                categoryName: categories.find(c => c.id === item.categoryId)?.name || '-',
            };
        }).filter(row => row.isVisible || row.hasRule); // Only show relevant SKUs
    };

    // Get visible SKU count
    const getVisibleSkuCount = (tier: PriceTier) => {
        const catIds = new Set(tier.includedCategoryIds || []);
        const subIds = new Set(tier.includedSubcategoryIds || []);
        const skuIds = new Set(tier.includedSkuIds || []);
        return products.filter(item =>
            catIds.has(item.categoryId) || (item.subcategoryId && subIds.has(item.subcategoryId)) || skuIds.has(item.id)
        ).length;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold">Pricing Tiers</h2>
                    <p className="text-gray-600 mt-1">Catalog visibility & pricing rules per tier</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Tier
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>Tier = Commercial Contract.</strong> Controls visibility + pricing adjustments.
                    Priority: SKU Rule &gt; Subcategory Rule &gt; Category Rule &gt; Base Price.
                </p>
            </div>

            {/* Tiers List */}
            <div className="space-y-4">
                {priceTiers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                        No pricing tiers defined. Click "Add Tier" to create one.
                    </div>
                ) : (
                    priceTiers.map(tier => {
                        const isExpanded = expandedTier === tier.id;
                        const tierRules = getTierRules(tier.id);
                        const coverage = computeCoverage(tier);
                        const orphanedRules = getOrphanedRules(tier);
                        const coveragePercent = coverage.visibleCount > 0 ? Math.round((coverage.coveredCount / coverage.visibleCount) * 100) : 0;

                        return (
                            <div key={tier.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => { setExpandedTier(isExpanded ? null : tier.id); setTierTab('audit'); }}
                                >
                                    <div className="flex items-center gap-3">
                                        <button className="text-gray-400">
                                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        </button>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                                            <p className="text-sm text-gray-600">{tier.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Coverage Badge - only show if there are visible SKUs */}
                                        {coverage.visibleCount > 0 && (
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${coveragePercent === 100 ? 'bg-green-100 text-green-700' :
                                                coveragePercent >= 80 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {coverage.coveredCount}/{coverage.visibleCount} covered ({coveragePercent}%)
                                            </div>
                                        )}
                                        {orphanedRules.length > 0 && (
                                            <div className="flex items-center gap-1 text-amber-600 text-xs">
                                                <AlertTriangle className="w-3 h-3" />
                                                {orphanedRules.length} orphaned
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">{getVisibleSkuCount(tier)} SKUs visible</div>
                                            <div className="text-xs text-gray-500">
                                                {(tier.includedCategoryIds?.length || 0)} cats, {(tier.includedSubcategoryIds?.length || 0)} subs, {(tier.includedSkuIds?.length || 0)} explicit
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(tier); }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Tabs */}
                                        <div className="flex border-b bg-gray-50">
                                            <button
                                                onClick={() => setTierTab('audit')}
                                                className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${tierTab === 'audit' ? 'border-b-2 border-green-600 text-green-600 bg-white' : 'text-gray-600'}`}
                                            >
                                                <Eye className="w-4 h-4" /> Audit
                                            </button>
                                            <button
                                                onClick={() => setTierTab('visibility')}
                                                className={`px-4 py-2 text-sm font-medium ${tierTab === 'visibility' ? 'border-b-2 border-green-600 text-green-600 bg-white' : 'text-gray-600'}`}
                                            >
                                                Visibility
                                            </button>
                                            <button
                                                onClick={() => setTierTab('rules')}
                                                className={`px-4 py-2 text-sm font-medium ${tierTab === 'rules' ? 'border-b-2 border-green-600 text-green-600 bg-white' : 'text-gray-600'}`}
                                            >
                                                Pricing Rules ({tierRules.length})
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="p-4">
                                            {/* AUDIT TAB */}
                                            {tierTab === 'audit' && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        Complete catalog view with effective prices. ⚠️ = integrity issue.
                                                    </p>
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 border-b">
                                                                <tr>
                                                                    <th className="text-left p-3 font-medium">SKU</th>
                                                                    <th className="text-left p-3 font-medium">Category</th>
                                                                    <th className="text-center p-3 font-medium">Visible</th>
                                                                    <th className="text-left p-3 font-medium">Rule Source</th>
                                                                    <th className="text-right p-3 font-medium">Base</th>
                                                                    <th className="text-right p-3 font-medium">Effective</th>
                                                                    <th className="text-center p-3 font-medium">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {computeAuditData(tier).map(row => (
                                                                    <tr key={row.id} className={row.integrityIssue !== 'none' ? 'bg-amber-50' : ''}>
                                                                        <td className="p-3 font-medium">{row.name}</td>
                                                                        <td className="p-3 text-gray-600">{row.categoryName}</td>
                                                                        <td className="p-3 text-center">
                                                                            {row.isVisible ? (
                                                                                <CheckCircle className="w-4 h-4 text-green-600 inline" />
                                                                            ) : (
                                                                                <XCircle className="w-4 h-4 text-gray-400 inline" />
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <span className={`text-xs px-2 py-0.5 rounded ${row.ruleSource === 'sku' ? 'bg-purple-100 text-purple-700' :
                                                                                row.ruleSource === 'subcategory' ? 'bg-blue-100 text-blue-700' :
                                                                                    row.ruleSource === 'category' ? 'bg-green-100 text-green-700' :
                                                                                        'bg-gray-100 text-gray-600'
                                                                                }`}>
                                                                                {row.ruleSource === 'base' ? 'Base' : row.ruleSource.charAt(0).toUpperCase() + row.ruleSource.slice(1)}
                                                                            </span>
                                                                            <span className="ml-2 text-xs text-gray-500">{row.ruleFormula}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right text-gray-600">₹{(row.basePriceNum || 0).toFixed(2)}</td>
                                                                        <td className="p-3 text-right font-medium">
                                                                            {row.isVisible ? `₹${row.price.toFixed(2)}` : '-'}
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            {row.integrityIssue === 'visible_no_rule' && (
                                                                                <span className="text-amber-600 flex items-center justify-center gap-1 text-xs">
                                                                                    <AlertTriangle className="w-3 h-3" /> No rule
                                                                                </span>
                                                                            )}
                                                                            {row.integrityIssue === 'rule_but_hidden' && (
                                                                                <span className="text-amber-600 flex items-center justify-center gap-1 text-xs">
                                                                                    <AlertTriangle className="w-3 h-3" /> Hidden
                                                                                </span>
                                                                            )}
                                                                            {row.integrityIssue === 'none' && row.isVisible && (
                                                                                <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* VISIBILITY TAB */}
                                            {tierTab === 'visibility' && (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                            <Tag className="w-4 h-4" /> Categories
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {(tier.includedCategoryIds || []).length === 0 ? (
                                                                <span className="text-sm text-gray-400 italic">None</span>
                                                            ) : (
                                                                (tier.includedCategoryIds || []).map(catId => (
                                                                    <div key={catId} className="flex items-center justify-between text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                                                                        <span>{categories.find(c => c.id === catId)?.name || catId}</span>
                                                                        {!hasRuleFor(tier.id, 'category', catId) && (
                                                                            <button
                                                                                onClick={() => quickAddRule(tier.id, 'category', catId)}
                                                                                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1 rounded text-xs"
                                                                                title="Add pricing rule"
                                                                            >
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                            <Layers className="w-4 h-4" /> Subcategories
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {(tier.includedSubcategoryIds || []).length === 0 ? (
                                                                <span className="text-sm text-gray-400 italic">None</span>
                                                            ) : (
                                                                (tier.includedSubcategoryIds || []).map(subId => (
                                                                    <div key={subId} className="flex items-center justify-between text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                                                                        <span>{subcategories.find(s => s.id === subId)?.name || subId}</span>
                                                                        {!hasRuleFor(tier.id, 'subcategory', subId) && (
                                                                            <button
                                                                                onClick={() => quickAddRule(tier.id, 'subcategory', subId)}
                                                                                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1 rounded text-xs"
                                                                                title="Add pricing rule"
                                                                            >
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                            <Package className="w-4 h-4" /> Explicit SKUs
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {(tier.includedSkuIds || []).length === 0 ? (
                                                                <span className="text-sm text-gray-400 italic">None</span>
                                                            ) : (
                                                                (tier.includedSkuIds || []).map(skuId => (
                                                                    <div key={skuId} className="flex items-center justify-between text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                                                                        <span>{products.find(i => i.id === skuId)?.name || skuId}</span>
                                                                        {!hasRuleFor(tier.id, 'sku', skuId) && (
                                                                            <button
                                                                                onClick={() => quickAddRule(tier.id, 'sku', skuId)}
                                                                                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1 rounded text-xs"
                                                                                title="Add pricing rule"
                                                                            >
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* RULES TAB */}
                                            {tierTab === 'rules' && (
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <p className="text-sm text-gray-600">Pricing adjustments for this tier</p>
                                                        <button
                                                            onClick={() => handleAddRule(tier.id)}
                                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                                        >
                                                            <Plus className="w-3 h-3" /> Add Rule
                                                        </button>
                                                    </div>

                                                    {tierRules.length === 0 ? (
                                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                                            No rules defined. Using base prices for all visible SKUs.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {tierRules.map(rule => {
                                                                const isOrphaned = orphanedRules.some(o => o.id === rule.id);
                                                                return (
                                                                    <div key={rule.id} className={`flex items-center justify-between p-3 rounded-lg border ${isOrphaned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            {rule.adjustmentType === 'constant' ? (
                                                                                <Lock className="w-4 h-4 text-purple-600" />
                                                                            ) : rule.adjustmentType === 'percent' ? (
                                                                                <Percent className="w-4 h-4 text-blue-600" />
                                                                            ) : (
                                                                                <DollarSign className="w-4 h-4 text-green-600" />
                                                                            )}
                                                                            <div>
                                                                                <div className="font-medium text-sm flex items-center gap-2">
                                                                                    <span className="capitalize">{rule.level}:</span> {getTargetName(rule.level, rule.targetId)}
                                                                                    {isOrphaned && <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">⚠️ Hidden</span>}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">{formatRule(rule)}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => handleEditRule(rule)}
                                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                            >
                                                                                <Edit2 className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { deletePricingRule(rule.id); toast.success('Rule deleted'); }}
                                                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Orphaned Rules Section */}
                                                    {orphanedRules.length > 0 && (
                                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                {orphanedRules.length} Orphaned Rule{orphanedRules.length > 1 ? 's' : ''} (target not visible)
                                                            </div>
                                                            <p className="text-xs text-amber-600">
                                                                These rules apply to categories/SKUs that are not included in this tier's visibility.
                                                                Consider removing them or adding the targets to visibility.
                                                            </p>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{editingTier ? 'Edit' : 'Add'} Pricing Tier</h3>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tier Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="e.g., Premium HORECA"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="e.g., High-end hotels and restaurants"
                                    />
                                </div>
                            </div>

                            <div className="border-b mb-4">
                                <div className="flex gap-4">
                                    {['categories', 'subcategories', 'skus'].map(tab => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveVisibilityTab(tab as any)}
                                            className={`px-4 py-2 font-medium border-b-2 transition ${activeVisibilityTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'}`}
                                        >
                                            {tab === 'categories' ? `Categories (${selectedCategories.size})` :
                                                tab === 'subcategories' ? `Subcategories (${selectedSubcategories.size})` :
                                                    `SKUs (${selectedSkus.size})`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-lg">
                                {activeVisibilityTab === 'categories' && (
                                    <div className="divide-y">
                                        {categories.map(cat => (
                                            <label key={cat.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedCategories.has(cat.id) ? 'bg-green-50' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.has(cat.id)}
                                                    onChange={() => toggleSelection(cat.id, selectedCategories, setSelectedCategories)}
                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                />
                                                <div>
                                                    <div className="font-medium">{cat.name}</div>
                                                    <div className="text-sm text-gray-500">{cat.description}</div>
                                                </div>
                                                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {products.filter(i => i.categoryId === cat.id).length} items
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {activeVisibilityTab === 'subcategories' && (
                                    <div className="divide-y">
                                        {subcategories.map(sub => (
                                            <label key={sub.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedSubcategories.has(sub.id) ? 'bg-green-50' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubcategories.has(sub.id)}
                                                    onChange={() => toggleSelection(sub.id, selectedSubcategories, setSelectedSubcategories)}
                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                />
                                                <div>
                                                    <div className="font-medium">{sub.name}</div>
                                                    <div className="text-sm text-gray-500">{categories.find(c => c.id === sub.categoryId)?.name}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {activeVisibilityTab === 'skus' && (
                                    <div className="divide-y">
                                        {products.map(item => (
                                            <label key={item.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedSkus.has(item.id) ? 'bg-green-50' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSkus.has(item.id)}
                                                    onChange={() => toggleSelection(item.id, selectedSkus, setSelectedSkus)}
                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                />
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{categories.find(c => c.id === item.categoryId)?.name}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    {editingTier ? 'Update' : 'Create'} Tier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Rule Modal */}
            {showRuleForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingRule ? 'Edit' : 'Add'} Pricing Rule</h3>
                            <button onClick={resetRuleForm} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRuleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Apply To</label>
                                <select
                                    value={ruleFormData.level}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, level: e.target.value as any, targetId: '' })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="category">Category</option>
                                    <option value="subcategory">Subcategory</option>
                                    <option value="sku">Individual SKU</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Target</label>
                                <select
                                    value={ruleFormData.targetId}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, targetId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                >
                                    <option value="">Select {ruleFormData.level}</option>
                                    {ruleTargets.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['fixed', 'percent', 'constant'] as AdjustmentType[]).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setRuleFormData({ ...ruleFormData, adjustmentType: type })}
                                            className={`p-2 border rounded-lg text-sm flex flex-col items-center gap-1 ${ruleFormData.adjustmentType === type ? 'border-green-600 bg-green-50 text-green-700' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {type === 'fixed' && <DollarSign className="w-4 h-4" />}
                                            {type === 'percent' && <Percent className="w-4 h-4" />}
                                            {type === 'constant' && <Lock className="w-4 h-4" />}
                                            <span className="capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {ruleFormData.adjustmentType !== 'constant' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Operation</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['add', 'subtract'] as const).map(op => (
                                            <button
                                                key={op}
                                                type="button"
                                                onClick={() => setRuleFormData({ ...ruleFormData, adjustmentOp: op })}
                                                className={`p-2 border rounded-lg text-sm ${ruleFormData.adjustmentOp === op ? 'border-green-600 bg-green-50' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                {op === 'add' ? '+ Add' : '- Subtract'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {ruleFormData.adjustmentType === 'constant' ? 'Fixed Price (₹)' :
                                        ruleFormData.adjustmentType === 'percent' ? 'Percentage (%)' : 'Amount (₹)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={ruleFormData.adjustmentValue}
                                    onChange={(e) => setRuleFormData({ ...ruleFormData, adjustmentValue: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4 border-t">
                                <button type="button" onClick={resetRuleForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    {editingRule ? 'Update' : 'Add'} Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
