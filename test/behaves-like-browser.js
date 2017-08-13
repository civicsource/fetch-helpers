import { JSDOM } from "jsdom";

export default function() {
	// inspired by https://semaphoreci.com/community/tutorials/testing-react-components-with-enzyme-and-mocha

	beforeEach(function() {
		this.exposedProperties = ["document", "window", "navigator"];

		const dom = new JSDOM("<!DOCTYPE html><p>Hello world</p>");
		global.document = dom.window.document;

		global.window = dom.window;

		global.navigator = {
			userAgent: "node.js"
		};

		Object.keys(document.defaultView).forEach(property => {
			if (typeof global[property] === "undefined") {
				this.exposedProperties.push(property);
				global[property] = document.defaultView[property];
			}
		});

		this.requests = [];

		global.fetch = url =>
			new Promise((resolve, reject) => {
				this.requests.push({ url, resolve, reject });
			});
	});

	afterEach(function() {
		this.exposedProperties.forEach(property => {
			delete global[property];
		});
	});
}
