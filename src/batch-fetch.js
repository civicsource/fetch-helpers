import { get, debounce, chunk, keys, forEach } from "lodash";
import checkStatus from "./check-status";
import parseJSON from "./parse-json";

export default function batchFetch(
	keyName,
	performFetch,
	{ maxBatchSize = 10, timeout = 100 } = {}
) {
	let queue = {};

	const getDebounced = debounce((...extra) => {
		const thingsToFetch = queue;
		queue = {};

		const chunks = chunk(keys(thingsToFetch), maxBatchSize);

		const allChunks = chunks.map(chunk =>
			performFetch(chunk, ...extra)
				.then(checkStatus)
				.then(parseJSON)
				.then(
					items => {
						if (chunk.length == 1) {
							items = [items];
						}

						items.forEach(item => {
							const key = get(item, keyName);
							thingsToFetch[key].resolve(item);
							delete thingsToFetch[key];
						});
					},
					err => {
						forEach(chunk, key => {
							thingsToFetch[key].reject(err);
							delete thingsToFetch[key];
						});
					}
				)
		);

		// once they are all done (success or failure), reject any leftovers
		Promise.all(allChunks).then(() => {
			forEach(thingsToFetch, ({ reject }, key) => {
				const err = new Error(`Could not find '${key}' in batched results.`);

				// fake a 404 response to reject the leftovers with
				err.response = {
					status: 404,
					statusText: "Not Found"
				};

				reject(err);
			});
		});
	}, timeout);

	return function getBatch(key, ...extra) {
		let resolve = null;
		let reject = null;

		var promise = new Promise((rs, rj) => {
			resolve = rs;
			reject = rj;
		});

		queue[key] = { resolve, reject };
		getDebounced(...extra);

		return promise;
	};
}
