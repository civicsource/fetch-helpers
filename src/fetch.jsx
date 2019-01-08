import { Component } from "react";
import { isFunction } from "lodash";
import shallowEqual from "shallowequal";

import checkStatus from "./check-status";
import parseJSON from "./parse-json";

export default class Fetch extends Component {
	state = {};

	componentDidMount() {
		this.doFetch();
	}

	componentDidUpdate(prevProps) {
		if (!shallowEqual(this.props, prevProps)) {
			this.doFetch();
		}
	}

	async doFetch() {
		const { url, onData, ...opts } = this.props;

		this.setState(({ isLoaded }) => ({
			isLoading: true,
			isLoaded: !!isLoaded, // if this is first time we are fetching, need to set isLoaded to a bool
			error: null
		}));

		try {
			let response = await fetch(url, opts);

			response = await checkStatus(response);
			response = await parseJSON(response);

			if (isFunction(onData)) {
				response = onData(response);
			}

			this.setState({
				data: response,
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

	render() {
		if (!isFunction(this.props.children)) {
			return null;
		}

		return this.props.children({
			...this.props,
			...this.state
		});
	}
}
