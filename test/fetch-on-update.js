import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { fetchOnUpdate } from "../src";

configure({ adapter: new Adapter() });

describe("Fetching on component props update", function() {
	behavesLikeBrowser();

	beforeEach(function() {
		const NakedComponent = props => {
			this.renderedProps = props;
			return <span>Hello, world</span>;
		};

		this.NakedComponent = NakedComponent;
	});

	describe("when rendering a component without specifying keys", function() {
		beforeEach(function() {
			this.callCount = 0;

			this.FetchingComponent = fetchOnUpdate(() => {
				this.callCount++;
			})(this.NakedComponent);
		});

		describe("for the first time", function() {
			beforeEach(function() {
				this.wrapper = mount(<this.FetchingComponent />);
			});

			it("should call the fetch function", function() {
				expect(this.callCount).to.equal(1);
			});

			it("should not pass status props to the component", function() {
				expect(this.renderedProps).to.be.ok;
				expect(Object.keys(this.renderedProps)).to.be.empty;
			});

			describe("and then setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not call the fetch function again", function() {
					expect(this.callCount).to.equal(1);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
					expect(Object.keys(this.renderedProps)).to.contain("hello");
				});
			});
		});
	});

	describe("when rendering a component while specifying keys", function() {
		beforeEach(function() {
			this.callCount = 0;

			this.FetchingComponent = fetchOnUpdate(
				() => {
					this.callCount++;
				},
				"name",
				"age"
			)(this.NakedComponent);
		});

		describe("for the first time", function() {
			beforeEach(function() {
				this.wrapper = mount(<this.FetchingComponent name="Homer Simpson" />);
			});

			it("should call the fetch function", function() {
				expect(this.callCount).to.equal(1);
			});

			it("should not pass status props to the component", function() {
				expect(this.renderedProps).to.be.ok;
				expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
				expect(Object.keys(this.renderedProps)).to.contain("name");
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ name: "Marge Simpson" });
				});

				it("should call the fetch function again", function() {
					expect(this.callCount).to.equal(2);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
					expect(Object.keys(this.renderedProps)).to.contain("name");
				});
			});

			describe("and then setting a previously unspecified keyed prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ age: 42 });
				});

				it("should call the fetch function again", function() {
					expect(this.callCount).to.equal(2);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("2");
					expect(Object.keys(this.renderedProps)).to.contain("name");
					expect(Object.keys(this.renderedProps)).to.contain("age");
				});
			});

			describe("and then setting arbitrary props on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ hello: "world" });
				});

				it("should not call the fetch function again", function() {
					expect(this.callCount).to.equal(1);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("2");
					expect(Object.keys(this.renderedProps)).to.contain("name");
					expect(Object.keys(this.renderedProps)).to.contain("hello");
				});
			});
		});
	});

	describe("when rendering a component while specifying a deep key", function() {
		beforeEach(function() {
			this.callCount = 0;

			this.FetchingComponent = fetchOnUpdate(() => {
				this.callCount++;
			}, "user.name.first")(this.NakedComponent);
		});

		describe("for the first time", function() {
			beforeEach(function() {
				const user = {
					name: {
						first: "Homer",
						last: "Simpson"
					}
				};

				this.wrapper = mount(<this.FetchingComponent user={user} />);
			});

			it("should call the fetch function", function() {
				expect(this.callCount).to.equal(1);
			});

			it("should not pass status props to the component", function() {
				expect(this.renderedProps).to.be.ok;
				expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
				expect(Object.keys(this.renderedProps)).to.contain("user");
			});

			describe("and then setting a keyed nested prop on the component", function() {
				beforeEach(function() {
					const user = {
						name: {
							first: "Marge",
							last: "Simpson"
						}
					};

					this.wrapper.setProps({ user });
				});

				it("should call the fetch function again", function() {
					expect(this.callCount).to.equal(2);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
					expect(Object.keys(this.renderedProps)).to.contain("user");
				});
			});

			describe("and then setting arbitrary deep props on the component", function() {
				beforeEach(function() {
					const user = {
						name: {
							first: "Homer",
							last: "Jenkins"
						}
					};

					this.wrapper.setProps({ user });
				});

				it("should not call the fetch function again", function() {
					expect(this.callCount).to.equal(1);
				});

				it("should not pass status props to the component", function() {
					expect(this.renderedProps).to.be.ok;
					expect(Object.keys(this.renderedProps)).to.have.lengthOf("1");
					expect(Object.keys(this.renderedProps)).to.contain("user");
				});
			});
		});
	});

	describe("when rendering a component without a fetch function", function() {
		beforeEach(function() {
			this.FetchingComponent = fetchOnUpdate(
				({ id }) => ({
					url: `http://example.com/api/bananas/${id}`
				}),
				"id"
			)(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent id={4} />);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/4");
		});

		it("should pass status props to the component", function() {
			expect(this.renderedProps).to.be.ok;
			expect(this.renderedProps.isLoading).to.be.true;
			expect(this.renderedProps.isLoaded).to.be.false;
			expect(this.renderedProps.error).to.not.be.ok;

			expect(this.renderedProps.data).to.not.be.ok;
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
				expect(this.renderedProps.isLoading).to.be.false;
				expect(this.renderedProps.isLoaded).to.be.true;
				expect(this.renderedProps.error).to.not.be.ok;

				expect(this.renderedProps.data).to.be.ok;
				expect(this.renderedProps.data).to.have.lengthOf(2);
				expect(this.renderedProps.data[0]).to.equal("ripe banana");
				expect(this.renderedProps.data[1]).to.equal("green banana");
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

				it("should pass status props to the component as loading but still persisting previously loaded data", function() {
					expect(this.renderedProps).to.be.ok;
					expect(this.renderedProps.isLoading).to.be.true;
					expect(this.renderedProps.isLoaded).to.be.true;
					expect(this.renderedProps.error).to.not.be.ok;

					expect(this.renderedProps.data).to.be.ok;
					expect(this.renderedProps.data).to.have.lengthOf(2);
					expect(this.renderedProps.data[0]).to.equal("ripe banana");
					expect(this.renderedProps.data[1]).to.equal("green banana");
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
				expect(this.renderedProps.isLoading).to.be.false;
				expect(this.renderedProps.isLoaded).to.be.false;
				expect(this.renderedProps.error).to.equal("Not today, buddy");

				expect(this.renderedProps.data).to.not.be.ok;
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
					expect(this.renderedProps.isLoading).to.be.true;
					expect(this.renderedProps.isLoaded).to.be.false;
					expect(this.renderedProps.error).to.not.be.ok;

					expect(this.renderedProps.data).to.not.be.ok;
				});
			});
		});
	});

	describe("when rendering a component without a fetch function while specifying a data key", function() {
		beforeEach(function(done) {
			this.FetchingComponent = fetchOnUpdate(({ id }) => ({
				url: `http://example.com/api/bananas/${id}`,
				key: "bananas"
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent id={4} />);

			this.requests.pop().resolve({
				status: 200,
				statusText: "OK",
				json: async () => ["ripe banana", "green banana"]
			});

			setTimeout(done, 10);
		});

		it("should pass status props using key to the component", function() {
			expect(this.renderedProps).to.be.ok;
			expect(this.renderedProps.isLoading).to.be.false;
			expect(this.renderedProps.isLoaded).to.be.true;
			expect(this.renderedProps.error).to.not.be.ok;

			expect(this.renderedProps.bananas).to.be.ok;
			expect(this.renderedProps.bananas).to.have.lengthOf(2);
		});
	});

	describe("when rendering a component without a fetch function with a data manipulation function", function() {
		beforeEach(function(done) {
			this.FetchingComponent = fetchOnUpdate(({ id }) => ({
				url: `http://example.com/api/bananas/${id}`,
				key: "bananas",
				onData: bananas => bananas.map(str => str.replace(" banana", ""))
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
			const { bananas } = this.renderedProps;

			expect(bananas).to.be.ok;
			expect(bananas).to.have.lengthOf(2);
			expect(bananas).to.contain("ripe");
			expect(bananas).to.contain("green");
		});
	});
});
