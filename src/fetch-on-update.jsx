import React, { Component, createContext } from "react";
import { get, set } from "lodash";
import shallowEqual from "shallowequal";

import checkStatus from "./check-status";
import parseJSON from "./parse-json";

// https://reactjs.org/docs/context.html
const Context = createContext(false);

const DisableFetchOnUpdate = ({ children }) => (
	<Context.Provider value>{children}</Context.Provider>
);

const fetchOnUpdate = (fn, ...keys) => DecoratedComponent => {
	class FetchOnUpdateDecorator extends Component {
		state = {};

		componentDidMount() {
			if (!this.props.disableFetch) {
				this.doFetch();
			}
		}

		componentDidUpdate(prevProps) {
			if (!this.props.disableFetch) {
				// if they didn't specify any keys, we effectively only run the fetch function once on init
				if (keys.length < 1) return;

				const params = mapParams(keys, this.props);
				const prevParams = mapParams(keys, prevProps);

				if (!shallowEqual(params, prevParams)) {
					this.doFetch();
				}
			}
		}

		async doFetch() {
			const result = fn(this.props);

			if (result) {
				const { url, key = "data", onData, ...opts } = result;

				// if they returned an object from the fetch function, let's do the fetch for them
				// otherwise we assume they did the fetch themselves
				this.setState(({ isLoaded }) => ({
					isLoading: true,
					isLoaded: !!isLoaded, // if this is first time we are fetching, need to set isLoaded to a bool
					error: null
				}));

				try {
					let response = await fetch(url, opts);

					response = await checkStatus(response);
					response = await parseJSON(response);

					if (onData) {
						response = onData(response);
					}

					this.setState({
						[key]: response,
						isLoaded: true,
						isLoading: false
					});
				} catch (ex) {
					this.setState({
						isLoading: false,
						error: ex.message
					});
				}
			}
		}

		render() {
			return <DecoratedComponent {...this.props} {...this.state} />;
		}
	}

	const FetcherWithContext = props => (
		<Context.Consumer>
			{disableFetch => (
				<FetchOnUpdateDecorator {...props} disableFetch={disableFetch} />
			)}
		</Context.Consumer>
	);

	return FetcherWithContext;
};

function mapParams(paramKeys, params) {
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

export default fetchOnUpdate;
export { DisableFetchOnUpdate };
