import { CFF2_PRIVATE_DICT_OPS } from '../otf/cff_common.js';
import { addIssue } from './advanced-common.js';

const VARIABLE = Symbol('CFF2 Private DICT blended value');
const blendable = new Set([6, 7, 10, 11, 0x0c0c, 0x0c0d]);
const scalar = new Set([10, 11, 19, 0x0c09, 0x0c0a, 0x0c0b, 0x0c11, 0x0c12]);
const pairs = new Map([[6, 14], [7, 10], [8, 14], [9, 10]]);
const operators = new Map(Object.entries(CFF2_PRIVATE_DICT_OPS).map(([op, name]) => [name, Number(op)]));

/**
 * Validate the ordered operand program, retaining symbolic blend results.
 * No variation coordinates or hint rasterization are needed to determine
 * cardinalities, legal blend destinations or the inherited CharString vsindex.
 */
export function validateCff2PrivateDictionary(dictionary, store, ctx, path) {
	let entries = dictionary.privateDictEntries;
	if (!entries?.length) {
		if (dictionary.privateDict?.blend !== undefined) {
			addIssue(ctx.issues, 'warning', 'CFF_CONTEXT_UNSUPPORTED',
				'An unordered Private DICT blend projection has lost its operand program; recover the original ordered entries.',
				ctx.location(path));
			return null;
		}
		entries = [];
		const fields = Object.entries(dictionary.privateDict ?? {});
		ctx.limits.consume(fields.length);
		for (const [name, value] of fields) {
			if (!operators.has(name)) {
				ctx.unsupported(`${path}.${name}`, 'Unknown Private DICT field is not interpreted.');
				continue;
			}
			entries.push({ operator: operators.get(name), operands: Array.isArray(value) ? value : [value] });
		}
	}
	const stack = [], values = new Map();
	let vsindex = 0, hasPrivateVsindex = false, regionCount;
	const regionCounts = new Map();
	const regions = (at) => {
		if (regionCounts.has(vsindex)) return regionCounts.get(vsindex);
		if (!store) {
			addIssue(ctx.issues, 'error', 'CFF_VARIATION_CONTEXT_MISSING',
				'Private DICT vsindex/blend requires a CFF2 VariationStore.', ctx.location(at));
			return null;
		}
		const data = store.itemVariationData?.[vsindex];
		if (!Number.isInteger(vsindex) || vsindex < 0 || !data) {
			addIssue(ctx.issues, 'error', 'CFF_VSINDEX_OUT_OF_RANGE',
				`Private DICT vsindex ${vsindex} does not select an ItemVariationData subtable.`, ctx.location(at));
			return null;
		}
		const allRegions = store.variationRegionList?.regions;
		const indices = data.regionIndexes;
		ctx.limits.consume(indices?.length ?? 0);
		if (store.format !== 1 || !Array.isArray(allRegions) || !Array.isArray(indices) ||
			data.itemCount !== 0 || data.wordDeltaCount !== 0 ||
			indices.some((index) => !Number.isInteger(index) || index < 0 || index >= allRegions.length)) {
			addIssue(ctx.issues, 'error', 'CFF_VARIATION_CONTEXT_INVALID',
				'CFF2 Private DICT region references or ItemVariationData fields are invalid.', ctx.location(at));
			return null;
		}
		regionCounts.set(vsindex, indices.length);
		return indices.length;
	};
	ctx.limits.consume(entries.length);
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i], at = `${path}.entries.${i}`, operands = entry.operands ?? [];
		ctx.limits.consume(operands.length);
		if (stack.length + operands.length > 513) {
			addIssue(ctx.issues, 'error', 'CFF_STACK_OVERFLOW',
				'Private DICT operand stack exceeds the CFF2 maximum of 513, including results of previous blends.', ctx.location(at));
			return null;
		}
		if (operands.some((operand) => !Number.isFinite(operand))) {
			addIssue(ctx.issues, 'error', 'CFF_INVALID_NUMBER',
				'Private DICT contains a non-finite or nonnumeric operand.', ctx.location(at));
			return null;
		}
		stack.push(...operands);
		const op = entry.operator;
		if (op === 23) {
			const count = stack.pop();
			if (!Number.isInteger(count) || count < 1) {
				addIssue(ctx.issues, 'error', 'CFF_BLEND_INVALID_COUNT',
					'Private DICT blend requires a positive, unblended integer count.', ctx.location(at));
				return null;
			}
			regionCount = regions(at);
			if (regionCount === null) return null;
			const needed = count * (regionCount + 1);
			if (needed > stack.length) {
				addIssue(ctx.issues, 'error', 'CFF_STACK_UNDERFLOW',
					`Private DICT blend needs ${needed} values for ${regionCount} regions but has ${stack.length}.`, ctx.location(at));
				return null;
			}
			// A repeated blend can consume earlier symbolic values, including
			// higher-order interpolation, without knowing their numeric values.
			stack.length -= needed;
			for (let n = 0; n < count; n++) stack.push(VARIABLE);
			continue;
		}
		if (op === 22) {
			if (stack.length !== 1 || !Number.isInteger(stack[0]) || stack[0] < 0) {
				addIssue(ctx.issues, 'error', 'CFF_INVALID_OPERAND_COUNT',
					'Private DICT vsindex requires one unblended nonnegative integer.', ctx.location(at));
				return null;
			}
			vsindex = stack.pop();
			hasPrivateVsindex = true;
			regionCount = regions(at);
			if (regionCount === null) return null;
			continue;
		}
		if (!CFF2_PRIVATE_DICT_OPS[op]) {
			ctx.unsupported(at, `Unrecognized Private DICT operator ${op} is ignored and clears its operand stack.`);
			stack.length = 0;
			continue;
		}
		const count = stack.length;
		if ((scalar.has(op) && count !== 1) ||
			(pairs.has(op) && (count % 2 !== 0 || count > pairs.get(op))) ||
			((op === 0x0c0c || op === 0x0c0d) && count > 12)) {
			addIssue(ctx.issues, 'error', 'CFF_INVALID_OPERAND_COUNT',
				`Private DICT operator ${op} has invalid operand count ${count} after blend evaluation.`, ctx.location(at));
			return null;
		}
		if (!blendable.has(op) && stack.includes(VARIABLE)) {
			addIssue(ctx.issues, 'error', 'CFF_PRIVATE_DICT_BLEND_FORBIDDEN',
				`Private DICT operator ${op} does not permit blended operands.`, ctx.location(at));
			return null;
		}
		if (op === 19 && (!Number.isInteger(stack[0]) || stack[0] <= 0)) {
			addIssue(ctx.issues, 'error', 'CFF_INVALID_OPERAND_COUNT',
				'Local Subrs offset must be a positive, unblended integer.', ctx.location(at));
			return null;
		}
		values.set(op, stack.splice(0));
	}
	if (stack.length) {
		addIssue(ctx.issues, 'error', 'CFF_PRIVATE_DICT_TRAILING_VALUES',
			'Private DICT ends with blended operands that were never assigned to a key.', ctx.location(path));
		return null;
	}
	return { vsindex, hasPrivateVsindex, blendRegionCount: regionCount, values };
}
