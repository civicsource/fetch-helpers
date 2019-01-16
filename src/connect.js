import React, { Component } from "react";
import { get, set, isString, isFunction } from "lodash";
import shallowEqual from "shallowequal";

import checkStatus from "./check-status";
import parseJSON from "./parse-json";

const connect = fn => DecoratedComponent =>
	class FetchOnUpdateDecorator extends Component {
		state = {};

		componentDidMount() {
			const itemsToFetch = fn(this.props);

			if (itemsToFetch) {
				for (let key in itemsToFetch) {
					const item = itemsToFetch[key];
					this.processItem(key, item);
				}
			}
		}

		componentDidUpdate(prevProps) {
			const itemsToFetch = fn(this.props);

			if (itemsToFetch) {
				for (let key in itemsToFetch) {
					const item = itemsToFetch[key];
					const keys = get(item, "keys");

					// if they didn't specify any keys, we effectively only run the fetch function once on init
					if (keys && keys.length) {
						const params = mapParams(keys, this.props);
						const prevParams = mapParams(keys, prevProps);

						if (!shallowEqual(params, prevParams)) {
							this.processItem(key, item);
						}
					}
				}
			}
		}

		processItem(key, item) {
			if (!item) return;

			if (isFunction(item)) {
				this.createLazyFunc(key, item);
			} else {
				this.doFetch(key, item);
			}
		}

		createLazyFunc(key, lazyFn) {
			this.setState({
				[key]: (...args) => {
					const result = lazyFn(...args);
					if (result) {
						for (let subkey in result) {
							const item = result[subkey];
							this.processItem(subkey, item);
						}
					}
				}
			});
		}

		async doFetch(key, item) {
			let { url, onData, bearerToken, ...opts } = item;

			if (!url && isString(item)) {
				url = item;
			}

			let { headers, ...otherOpts } = opts;
			headers = headers || {};

			if (!headers["Accept"]) {
				headers["Accept"] = "application/json";
			}

			if (!headers["Content-Type"]) {
				headers["Content-Type"] = "application/json";
			}

			if (bearerToken) {
				headers["Authorization"] = `Bearer ${bearerToken}`;
			}

			this.setState(prevState => ({
				[key]: {
					data: get(prevState, `${key}.data`),
					isLoading: true,
					isLoaded: !!get(prevState, `${key}.isLoaded`), // if this is first time we are fetching, need to set isLoaded to a bool
					error: null
				}
			}));

			try {
				let response = await fetch(url, { ...otherOpts, headers });

				response = await checkStatus(response);

				if (response.status != 204) {
					response = await parseJSON(response);

					if (onData) {
						response = onData(response);
					}
				} else {
					// for 204 No Content, just return null data
					response = null;
				}

				this.setState({
					[key]: {
						data: response,
						isLoading: false,
						isLoaded: true,
						error: null
					}
				});
			} catch (ex) {
				this.setState(prevState => ({
					[key]: {
						data: prevState[key].data,
						isLoading: false,
						isLoaded: prevState[key].isLoaded,
						error: ex.message
					}
				}));
			}
		}

		render() {
			return <DecoratedComponent {...this.props} {...this.state} />;
		}
	};

export function mapParams(paramKeys, params) {
	const result = {};

	paramKeys.forEach(path => {
		const value = get(params, path);

		// move any nested paths to the root of the result
		// for the purpose of doing a shallow comparison
		path = path.replace(/\./g, "_");

		set(result, path, value);
	});

	return result;
}

export default connect;
