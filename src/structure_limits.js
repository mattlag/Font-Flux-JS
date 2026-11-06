import { DataReader } from './reader.js';

export const DEFAULT_STRUCTURE_LIMITS = Object.freeze({
	maxStructureDepth: 64,
	maxStructureNodes: 1000000,
});

export class StructureLimitError extends Error {}

/**
 * Per-table parsing work budget, not a byte or total-memory limit. Records,
 * array entries and graph visits consume work, including repeated references.
 * Depth counts nested lookup subtables or paint nodes, starting at one.
 */
export class StructureLimits {
	constructor(options = {}) {
		for (const [key, fallback] of Object.entries(DEFAULT_STRUCTURE_LIMITS)) {
			const value = options[key] === undefined ? fallback : options[key];
			if (!Number.isSafeInteger(value) || value < 1)
				throw new Error(`Invalid import limit: ${key}`);
			this[key] = value;
		}
		this.nodes = 0;
		this.active = new Set();
	}

	consume(count = 1) {
		if (!Number.isSafeInteger(count) || count < 0)
			throw new Error('Invalid structure node count.');
		if (count > this.maxStructureNodes - this.nodes)
			throw new StructureLimitError('Structure exceeds maxStructureNodes.');
		this.nodes += count;
	}

	checkDepth(depth) {
		if (depth > this.maxStructureDepth)
			throw new StructureLimitError('Structure exceeds maxStructureDepth.');
	}

	parse(key, callback) {
		if (this.active.has(key))
			throw new StructureLimitError(`Structure cycle detected at ${key}.`);
		this.checkDepth(this.active.size + 1);
		this.consume();
		this.active.add(key);
		try {
			return callback();
		} finally {
			this.active.delete(key);
		}
	}
}

export function consumeStructure(reader, count = 1) {
	reader.structureLimits?.consume(count);
}

export class StructureReader extends DataReader {
	constructor(bytes, options) {
		super(bytes);
		this.structureLimits = new StructureLimits(options);
	}

	array(method, count) {
		this.structureLimits.consume(count + 1);
		return super.array(method, count);
	}
}
