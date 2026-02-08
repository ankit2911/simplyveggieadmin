/**
 * Pricing Utilities
 * Centralized logic for calculating effective prices based on tier rules
 */

import { type PricingRule, type AdjustmentType } from '../context/AdminContext';

interface SkuInfo {
    id: string;
    categoryId: string;
    subcategoryId: string | null;
    basePrice: number; // Price per default unit
}

interface TierVisibility {
    includedCategoryIds: string[];
    includedSubcategoryIds: string[];
    includedSkuIds: string[];
}

export interface EffectivePriceResult {
    price: number;
    ruleApplied: PricingRule | null;
    ruleSource: 'sku' | 'subcategory' | 'category' | 'base';
    isVisible: boolean;
    hasRule: boolean;
    integrityIssue: 'none' | 'visible_no_rule' | 'rule_but_hidden';
}

/**
 * Check if a SKU is visible in a tier
 */
export function isSkuVisible(sku: SkuInfo, visibility: TierVisibility): boolean {
    return (
        visibility.includedCategoryIds.includes(sku.categoryId) ||
        (sku.subcategoryId ? visibility.includedSubcategoryIds.includes(sku.subcategoryId) : false) ||
        visibility.includedSkuIds.includes(sku.id)
    );
}

/**
 * Find the applicable pricing rule for a SKU in a tier
 * Priority: SKU > Subcategory > Category
 */
export function findApplicableRule(
    sku: SkuInfo,
    tierId: string,
    rules: PricingRule[]
): { rule: PricingRule | null; source: 'sku' | 'subcategory' | 'category' | 'base' } {
    // Check SKU-level rule first
    const skuRule = rules.find(
        r => r.tierId === tierId && r.level === 'sku' && r.targetId === sku.id
    );
    if (skuRule) return { rule: skuRule, source: 'sku' };

    // Check subcategory-level rule
    const subRule = rules.find(
        r => r.tierId === tierId && r.level === 'subcategory' && r.targetId === sku.subcategoryId
    );
    if (subRule) return { rule: subRule, source: 'subcategory' };

    // Check category-level rule
    const catRule = rules.find(
        r => r.tierId === tierId && r.level === 'category' && r.targetId === sku.categoryId
    );
    if (catRule) return { rule: catRule, source: 'category' };

    // No rule found - will use base price
    return { rule: null, source: 'base' };
}

/**
 * Apply a pricing rule to a base price
 */
export function applyRule(basePrice: number, rule: PricingRule): number {
    switch (rule.adjustmentType) {
        case 'constant':
            return rule.adjustmentValue;
        case 'fixed':
            return rule.adjustmentOp === 'add'
                ? basePrice + rule.adjustmentValue
                : basePrice - rule.adjustmentValue;
        case 'percent':
            const delta = basePrice * (rule.adjustmentValue / 100);
            return rule.adjustmentOp === 'add' ? basePrice + delta : basePrice - delta;
        default:
            return basePrice;
    }
}

/**
 * Calculate the effective price for a SKU in a specific tier
 * Returns price, rule info, visibility status, and integrity issues
 */
export function calculateEffectivePrice(
    sku: SkuInfo,
    tierId: string,
    visibility: TierVisibility,
    rules: PricingRule[]
): EffectivePriceResult {
    const isVisible = isSkuVisible(sku, visibility);
    const { rule, source } = findApplicableRule(sku, tierId, rules);
    const hasRule = rule !== null;

    // Calculate price
    const price = rule ? applyRule(sku.basePrice, rule) : sku.basePrice;

    // Determine integrity issue
    let integrityIssue: EffectivePriceResult['integrityIssue'] = 'none';
    if (isVisible && !hasRule) {
        integrityIssue = 'visible_no_rule';
    } else if (!isVisible && hasRule) {
        integrityIssue = 'rule_but_hidden';
    }

    return {
        price: Math.round(price * 100) / 100, // Round to 2 decimals
        ruleApplied: rule,
        ruleSource: source,
        isVisible,
        hasRule,
        integrityIssue,
    };
}

/**
 * Get coverage stats for a tier
 */
export function getTierCoverage(
    skus: SkuInfo[],
    tierId: string,
    visibility: TierVisibility,
    rules: PricingRule[]
): { visibleCount: number; coveredCount: number; orphanedRulesCount: number } {
    let visibleCount = 0;
    let coveredCount = 0;

    skus.forEach(sku => {
        const result = calculateEffectivePrice(sku, tierId, visibility, rules);
        if (result.isVisible) {
            visibleCount++;
            if (result.hasRule) coveredCount++;
        }
    });

    // Count orphaned rules (rules for hidden items)
    const orphanedRulesCount = rules.filter(r => {
        if (r.tierId !== tierId) return false;
        // Find if target is visible
        if (r.level === 'category') return !visibility.includedCategoryIds.includes(r.targetId);
        if (r.level === 'subcategory') return !visibility.includedSubcategoryIds.includes(r.targetId);
        if (r.level === 'sku') return !visibility.includedSkuIds.includes(r.targetId);
        return false;
    }).length;

    return { visibleCount, coveredCount, orphanedRulesCount };
}

/**
 * Format rule for display
 */
export function formatRuleDescription(rule: PricingRule | null): string {
    if (!rule) return 'Base Price';

    if (rule.adjustmentType === 'constant') {
        return `₹${rule.adjustmentValue} (fixed)`;
    }

    const sign = rule.adjustmentOp === 'add' ? '+' : '-';
    if (rule.adjustmentType === 'percent') {
        return `Base ${sign} ${rule.adjustmentValue}%`;
    }
    return `Base ${sign} ₹${rule.adjustmentValue}`;
}
