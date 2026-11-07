import { FontFlux } from '../font_flux.js';
import { handleQualityWorkerMessage } from './workflow-worker-runtime.js';

self.onmessage = ({ data }) => {
	self.onmessage = null;
	void handleQualityWorkerMessage(data, (message) => self.postMessage(message), () => FontFlux);
};
