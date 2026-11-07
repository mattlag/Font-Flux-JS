import { FontFlux as Core } from '../../src/font_flux.js';

let heldOptions;
function hold(phase, options) {
	if (options.holdPhase !== phase) return;
	const state = new Int32Array(options.coordination);
	Atomics.store(state, 0, 1);
	Atomics.notify(state, 0);
	Atomics.wait(state, 1, 0);
}

export class FontFlux extends Core {
	static inspect(input, options) {
		hold('decode', options);
		Core.open(input, { faceIndex: options.faceIndex });
		hold('traversal', options);
		return Core.inspect(input);
	}

	static planRepairs(input, requests, options) {
		heldOptions = options;
		hold('planning', options);
		return Core.planRepairs(input, requests);
	}

	static async applyRepairs(input, plan) {
		hold('verification', heldOptions);
		return Core.applyRepairs(input, plan);
	}

	async preflight(options) {
		hold('preflight', options);
		return super.preflight(options);
	}
}
