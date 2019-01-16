import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { connect } from "../src";

configure({ adapter: new Adapter() });

describe("Connecting a component to fetch", function() {
	behavesLikeBrowser();

	beforeEach(function() {
		const NakedComponent = props => {
			this.renderedProps = props;
			return <span>Hello, world</span>;
		};

		this.NakedComponent = NakedComponent;
	});

	describe("when rendering a component with just a URL", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(() => ({
				bananas: "http://example.com/api/bananas/"
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/");
		});

		it("should set default accept & content headers", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(Object.keys(req.headers)).to.have.lengthOf(2);

			expect(req.headers["Accept"]).to.equal("application/json");
			expect(req.headers["Content-Type"]).to.equal("application/json");
		});

		it("should pass status props to the component", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananas } = this.renderedProps;
			expect(bananas).to.be.ok;

			expect(bananas.isLoading).to.be.true;
			expect(bananas.isLoaded).to.be.false;
			expect(bananas.error).to.not.be.ok;

			expect(bananas.data).to.not.be.ok;
		});

		describe("with a successful server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: async () => ["ripe banana", "green banana"]
				});

				setTimeout(done, 10);
			});

			it("should pass status props to the component as loaded", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananas } = this.renderedProps;
				expect(bananas).to.be.ok;

				expect(bananas.isLoading).to.be.false;
				expect(bananas.isLoaded).to.be.true;
				expect(bananas.error).to.not.be.ok;

				expect(bananas.data).to.be.ok;
				expect(bananas.data).to.have.lengthOf(2);
				expect(bananas.data[0]).to.equal("ripe banana");
				expect(bananas.data[1]).to.equal("green banana");
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});

		describe("with a failure server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "OK",
					json: async () => ({
						message: "Not today, buddy"
					})
				});

				setTimeout(done, 10);
			});

			it("should pass status props to the component as errored", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananas } = this.renderedProps;
				expect(bananas).to.be.ok;

				expect(bananas.isLoading).to.be.false;
				expect(bananas.isLoaded).to.be.false;
				expect(bananas.error).to.equal("Not today, buddy");

				expect(bananas.data).to.not.be.ok;
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});
	});

	describe("when rendering a component with keys", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(({ id }) => ({
				bananas: {
					url: `http://example.com/api/bananas/${id}`,
					keys: ["id"]
				}
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent id={4} />);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/4");
		});

		it("should pass status props to the component", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananas } = this.renderedProps;
			expect(bananas).to.be.ok;

			expect(bananas.isLoading).to.be.true;
			expect(bananas.isLoaded).to.be.false;
			expect(bananas.error).to.not.be.ok;

			expect(bananas.data).to.not.be.ok;
		});

		describe("with a successful server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: async () => ["ripe banana", "green banana"]
				});

				setTimeout(done, 10);
			});

			it("should pass status props to the component as loaded", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananas } = this.renderedProps;
				expect(bananas).to.be.ok;

				expect(bananas.isLoading).to.be.false;
				expect(bananas.isLoaded).to.be.true;
				expect(bananas.error).to.not.be.ok;

				expect(bananas.data).to.be.ok;
				expect(bananas.data).to.have.lengthOf(2);
				expect(bananas.data[0]).to.equal("ripe banana");
				expect(bananas.data[1]).to.equal("green banana");
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ id: 69 });
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/69"
					);
				});

				it("should pass status props to the component as loading and still pass previously loaded data", function() {
					expect(this.renderedProps).to.be.ok;

					const { bananas } = this.renderedProps;
					expect(bananas).to.be.ok;

					expect(bananas.isLoading).to.be.true;
					expect(bananas.isLoaded).to.be.true;
					expect(bananas.error).to.not.be.ok;

					expect(bananas.data).to.be.ok;
					expect(bananas.data).to.have.lengthOf(2);
					expect(bananas.data[0]).to.equal("ripe banana");
					expect(bananas.data[1]).to.equal("green banana");
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});

		describe("with a failure server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "OK",
					json: async () => ({
						message: "Not today, buddy"
					})
				});

				setTimeout(done, 10);
			});

			it("should pass status props to the component as errored", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananas } = this.renderedProps;
				expect(bananas).to.be.ok;

				expect(bananas.isLoading).to.be.false;
				expect(bananas.isLoaded).to.be.false;
				expect(bananas.error).to.equal("Not today, buddy");

				expect(bananas.data).to.not.be.ok;
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ id: 420 });
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/420"
					);
				});

				it("should pass status props to the component as loading and no longer errored", function() {
					expect(this.renderedProps).to.be.ok;

					const { bananas } = this.renderedProps;
					expect(bananas).to.be.ok;

					expect(bananas.isLoading).to.be.true;
					expect(bananas.isLoaded).to.be.false;
					expect(bananas.error).to.not.be.ok;

					expect(bananas.data).to.not.be.ok;
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});
	});

	describe("when rendering a component with a data manipulation function", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(({ id }) => ({
				bananas: {
					url: `http://example.com/api/bananas/${id}`,
					onData: bananas => bananas.map(str => str.replace(" banana", ""))
				}
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent id={4} />);

			this.requests.pop().resolve({
				status: 200,
				statusText: "OK",
				json: async () => ["ripe banana", "green banana"]
			});

			setTimeout(done, 10);
		});

		it("should manipulate the data before passing to the component", function() {
			const {
				bananas: { data }
			} = this.renderedProps;

			expect(data).to.be.ok;
			expect(data).to.have.lengthOf(2);
			expect(data).to.contain("ripe");
			expect(data).to.contain("green");
		});
	});

	describe("when rendering a component with a bearer token", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(() => ({
				bananas: {
					url: `http://example.com/api/bananas/`,
					bearerToken: "poop"
				}
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);
		});

		it("should set default accept & content headers", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;

			expect(req.headers["Authorization"]).to.equal("Bearer poop");
		});
	});

	describe("when rendering a component with specific headers", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(() => ({
				bananas: {
					url: `http://example.com/api/bananas/`,
					headers: {
						Authorization: "wha",
						Accept: "text/plain",
						"Content-Type": "text/plain"
					}
				}
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);
		});

		it("should set headers on the request", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(Object.keys(req.headers)).to.have.lengthOf(3);

			expect(req.headers["Authorization"]).to.equal("wha");
			expect(req.headers["Accept"]).to.equal("text/plain");
			expect(req.headers["Content-Type"]).to.equal("text/plain");
		});
	});

	describe("when rendering a component that returns a 204", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(() => ({
				bananas: `http://example.com/api/bananas/`
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);

			this.requests.pop().resolve({
				status: 204,
				statusText: "No Content"
			});

			setTimeout(done, 10);
		});

		it("should pass null data with status props", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananas } = this.renderedProps;
			expect(bananas).to.be.ok;

			expect(bananas.isLoading).to.be.false;
			expect(bananas.isLoaded).to.be.true;
			expect(bananas.error).to.not.be.ok;
			expect(bananas.data).to.not.be.ok;
		});
	});

	describe("when rendering a component with a lazy function", function() {});
});
