import React, { Component } from "react";
import { get, set, isString } from "lodash";
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

					if (item) {
						this.doFetch(key, item);
					}
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
							this.doFetch(key, item);
						}
					}
				}
			}
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
				response = await parseJSON(response);

				if (onData) {
					response = onData(response);
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
