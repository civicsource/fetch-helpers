import React, { Component } from "react";
import { get, set, isString, isFunction, reduce } from "lodash";
import shallowEqual from "shallowequal";

import checkStatus from "./check-status";
import parseJSON from "./parse-json";

const connect = fn => DecoratedComponent =>
	class FetchOnUpdateDecorator extends Component {
		state = {};

		componentDidMount() {
			if (this.props.disableFetch) return;

			const itemsToFetch = fn(this.props);

			if (itemsToFetch) {
				for (let key in itemsToFetch) {
					const item = itemsToFetch[key];
					this.processItem(key, item);
				}
			}
		}

		componentDidUpdate(prevProps) {
			if (this.props.disableFetch) return;

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

		componentWillUnMount() {
			for (let key in this.timers) {
				clearTimeout(this.timers[key]);
			}

			this.timers = {};
		}

		timers = {};

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
			let { url, onData, onComplete, bearerToken, reset, ...opts } = item;

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

			if (this.timers[key]) {
				// clear any pending reset
				clearTimeout(this.timers[key]);
				delete this.timers[key];
			}

			this.setState(prevState => ({
				[key]: {
					data: get(prevState, `${key}.data`),
					isFetching: true,
					isFetched: !!get(prevState, `${key}.isFetched`), // if this is first time we are fetching, need to set isFetched to a bool
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
						if (response.then) {
							response = await handleAsyncOnDatas(response);
						}
					}
				} else {
					// for 204 No Content, just return null data
					response = null;
				}

				this.setState(
					{
						[key]: {
							data: response,
							isFetching: false,
							isFetched: true,
							error: null
						}
					},
					() => {
						if (onComplete) {
							const data = reduce(
								Object.keys(this.state),
								(result, k) => ({
									...result,
									[k]: get(this.state, `${k}.data`)
								}),
								{}
							);

							const manipulatedData = onComplete(data);

							if (manipulatedData) {
								this.setState(prevState =>
									reduce(
										Object.keys(manipulatedData),
										(result, k) => ({
											...result,
											[k]: {
												...get(prevState, k, {}),
												data: manipulatedData[k]
											}
										}),
										{}
									)
								);
							}
						}
					}
				);

				if (reset) {
					this.timers[key] = setTimeout(() => {
						// reset the state
						this.setState({
							[key]: {
								data: null,
								isFetching: false,
								isFetched: false,
								error: null
							}
						});

						delete this.timers[key];
					}, reset);
				}
			} catch (ex) {
				this.setState(prevState => ({
					[key]: {
						data: prevState[key].data,
						isFetching: false,
						isFetched: prevState[key].isFetched,
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

const handleAsyncOnDatas = async response => {
	response = await response;
	if (response.then) {
		response = await handleAsyncOnDatas(response);
	}
	return response;
};

export default connect;
