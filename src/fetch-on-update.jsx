import React, { Component } from "react";
import { get, set } from "lodash";
import shallowEqual from "shallowequal";

export default function fetchOnUpdate(fn, ...keys) {
	return DecoratedComponent =>
		class FetchOnUpdateDecorator extends Component {
			componentWillMount() {
				fn(this.props);
			}

			componentDidUpdate(prevProps) {
				const params = mapParams(keys, this.props);
				const prevParams = mapParams(keys, prevProps);

				if (!shallowEqual(params, prevParams)) {
					fn(this.props);
				}
			}

			render() {
				return <DecoratedComponent {...this.props} />;
			}
		};
}

function mapParams(paramKeys, params) {
	if (paramKeys.length < 1) return params;

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
