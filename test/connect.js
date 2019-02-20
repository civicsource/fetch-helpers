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

			expect(bananas.isFetching).to.be.true;
			expect(bananas.isFetched).to.be.false;
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

				expect(bananas.isFetching).to.be.false;
				expect(bananas.isFetched).to.be.true;
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

				expect(bananas.isFetching).to.be.false;
				expect(bananas.isFetched).to.be.false;
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

			expect(bananas.isFetching).to.be.true;
			expect(bananas.isFetched).to.be.false;
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

				expect(bananas.isFetching).to.be.false;
				expect(bananas.isFetched).to.be.true;
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

					expect(bananas.isFetching).to.be.true;
					expect(bananas.isFetched).to.be.true;
					expect(bananas.error).to.not.be.ok;

					expect(bananas.data).to.be.ok;
					expect(bananas.data).to.have.lengthOf(2);
					expect(bananas.data[0]).to.equal("ripe banana");
					expect(bananas.data[1]).to.equal("green banana");
				});

				describe("with another successful server response", function() {
					beforeEach(function(done) {
						this.requests.pop().resolve({
							status: 200,
							statusText: "OK",
							json: async () => ["purple banana", "orange banana"]
						});

						setTimeout(done, 10);
					});

					it("should pass newly loaded data", function() {
						expect(this.renderedProps).to.be.ok;

						const { bananas } = this.renderedProps;
						expect(bananas).to.be.ok;

						expect(bananas.isFetching).to.be.false;
						expect(bananas.isFetched).to.be.true;
						expect(bananas.error).to.not.be.ok;

						expect(bananas.data).to.be.ok;
						expect(bananas.data).to.have.lengthOf(2);
						expect(bananas.data[0]).to.equal("purple banana");
						expect(bananas.data[1]).to.equal("orange banana");
					});
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

				expect(bananas.isFetching).to.be.false;
				expect(bananas.isFetched).to.be.false;
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

					expect(bananas.isFetching).to.be.true;
					expect(bananas.isFetched).to.be.false;
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

	describe("when rendering a component with an async data manipulation function", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(({ id }) => ({
				bananas: {
					url: `http://example.com/api/bananas/${id}`,
					onData: bananas =>
						new Promise(resolve =>
							resolve(bananas.map(str => str.replace(" banana", "")))
						)
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

		it("should await manipulation of the data before passing to the component", function() {
			const {
				bananas: { data }
			} = this.renderedProps;

			expect(data).to.be.ok;
			expect(data).to.have.lengthOf(2);
			expect(data).to.contain("ripe");
			expect(data).to.contain("green");
		});
	});

	describe("when rendering a component with an async data manipulation function that returns a promise", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(({ id }) => ({
				bananas: {
					url: `http://example.com/api/bananas/${id}`,
					onData: bananas =>
						new Promise(resolve =>
							resolve(
								new Promise(resolve =>
									resolve(bananas.map(str => str.replace(" banana", "")))
								)
							)
						)
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

		it("should await manipulation of the data before passing to the component", function() {
			const {
				bananas: { data }
			} = this.renderedProps;

			expect(data).to.be.ok;
			expect(data).to.have.lengthOf(2);
			expect(data).to.contain("ripe");
			expect(data).to.contain("green");
		});
	});

	describe("when rendering a component with an async data manipulation function that throws an exception", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(({ id }) => ({
				bananas: {
					url: `http://example.com/api/bananas/${id}`,
					onData: () => {
						return new Promise(resolve =>
							resolve(
								new Promise(resolve =>
									resolve(
										new Promise(() => {
											throw { message: "wow you messed up" };
										})
									)
								)
							)
						);
					}
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

		it("should await manipulation of the data before passing to the component", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananas } = this.renderedProps;
			expect(bananas).to.be.ok;

			expect(bananas.isFetching).to.be.false;
			expect(bananas.isFetched).to.be.false;
			expect(bananas.error).to.equal("wow you messed up");

			expect(bananas.data).to.not.be.ok;
		});
	});

	describe("when rendering a component with a completion function", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(() => ({
				todoList: `http://example.com/api/items/`,
				addItem: desc => ({
					newItem: {
						url: `http://example.com/api/items/`,
						method: "POST",
						body: JSON.stringify({ desc }),
						onComplete: ({ todoList, newItem }) => {
							if (!todoList || !newItem) return;
							return { todoList: [...todoList, newItem] };
						}
					}
				})
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent id={4} />);

			this.requests.pop().resolve({
				status: 200,
				statusText: "OK",
				json: async () => ["do code", "eat food"]
			});

			setTimeout(done, 10);
		});

		it("should load the original data", function() {
			const {
				todoList: { data }
			} = this.renderedProps;

			expect(data).to.be.ok;
			expect(data).to.have.lengthOf(2);
			expect(data).to.contain("do code");
			expect(data).to.contain("eat food");
		});

		it("should set the load status", function() {
			const { todoList } = this.renderedProps;

			expect(todoList.isFetching).to.be.false;
			expect(todoList.isFetched).to.be.true;
			expect(todoList.error).to.not.be.ok;
		});

		describe("and then calling the lazy function", function() {
			beforeEach(function(done) {
				this.renderedProps.addItem("watch tv");

				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: async () => "Watch TV"
				});

				setTimeout(done, 10);
			});

			it("should run the manipulation function on the returned data key", function() {
				const {
					todoList: { data }
				} = this.renderedProps;

				expect(data).to.be.ok;
				expect(data).to.have.lengthOf(3);
				expect(data).to.contain("do code");
				expect(data).to.contain("eat food");
				expect(data).to.contain("Watch TV");
			});

			it("should not modify the manipulatd data load status", function() {
				const { todoList } = this.renderedProps;

				expect(todoList.isFetching).to.be.false;
				expect(todoList.isFetched).to.be.true;
				expect(todoList.error).to.not.be.ok;
			});

			it("should not change the key that was not returned", function() {
				const { newItem } = this.renderedProps;

				expect(newItem.isFetching).to.be.false;
				expect(newItem.isFetched).to.be.true;
				expect(newItem.error).to.not.be.ok;
				expect(newItem.data).to.equal("Watch TV");
			});
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

			expect(bananas.isFetching).to.be.false;
			expect(bananas.isFetched).to.be.true;
			expect(bananas.error).to.not.be.ok;
			expect(bananas.data).to.not.be.ok;
		});
	});

	describe("when rendering a component with a lazy function", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(() => ({
				saveBanana: name => ({
					bananaSaveResult: {
						url: `http://example.com/api/bananas/`,
						method: "POST",
						body: JSON.stringify({ name })
					}
				})
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);
		});

		it("should not make a fetch API request", function() {
			expect(this.requests.length).to.equal(0);
		});

		it("should pass lazy function as prop", function() {
			expect(this.renderedProps).to.be.ok;
			const { saveBanana } = this.renderedProps;
			expect(saveBanana).to.be.a("function");
		});

		it("should not pass anything for save results", function() {
			expect(this.renderedProps).to.be.ok;
			const { bananaSaveResult } = this.renderedProps;
			expect(bananaSaveResult).to.not.be.ok;
		});

		describe("and then invoking the lazy function", function() {
			beforeEach(function() {
				this.renderedProps.saveBanana("Bob");
			});

			it("should make a fetch API request", function() {
				expect(this.requests.length).to.equal(1);

				const req = this.requests[0];

				expect(req.url).to.equal("http://example.com/api/bananas/");
				expect(req.method).to.equal("POST");
				expect(req.body).to.equal('{"name":"Bob"}');
			});

			it("should pass status props to the component", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananaSaveResult } = this.renderedProps;
				expect(bananaSaveResult).to.be.ok;

				expect(bananaSaveResult.isFetching).to.be.true;
				expect(bananaSaveResult.isFetched).to.be.false;
				expect(bananaSaveResult.error).to.not.be.ok;

				expect(bananaSaveResult.data).to.not.be.ok;
			});
		});
	});

	describe("when rendering a component with a reset", function() {
		beforeEach(function(done) {
			this.FetchingComponent = connect(() => ({
				saveBanana: name => ({
					bananaSaveResult: {
						url: `http://example.com/api/bananas/`,
						method: "POST",
						body: JSON.stringify({ name }),
						reset: 100
					}
				})
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent />);

			this.renderedProps.saveBanana("Bob");

			this.requests.pop().resolve({
				status: 200,
				statusText: "OK",
				json: async () => ({ name: "Bob" })
			});

			setTimeout(done, 10);
		});

		it("should pass status props to the component", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananaSaveResult } = this.renderedProps;
			expect(bananaSaveResult).to.be.ok;

			expect(bananaSaveResult.isFetching).to.be.false;
			expect(bananaSaveResult.isFetched).to.be.true;
			expect(bananaSaveResult.error).to.not.be.ok;

			expect(bananaSaveResult.data).to.deep.equal({ name: "Bob" });
		});

		describe("and then waiting the reset threshold time", function() {
			beforeEach(function(done) {
				setTimeout(done, 110);
			});

			it("should clear status props to the component", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananaSaveResult } = this.renderedProps;
				expect(bananaSaveResult).to.be.ok;

				expect(bananaSaveResult.isFetching).to.be.false;
				expect(bananaSaveResult.isFetched).to.be.false;
				expect(bananaSaveResult.error).to.not.be.ok;

				expect(bananaSaveResult.data).to.not.be.ok;
			});
		});

		describe("and then triggering another fetch before the reset threshold time", function() {
			beforeEach(function(done) {
				setTimeout(() => {
					this.renderedProps.saveBanana("Homer");
					done();
				}, 80);
			});

			it("should mark status as refetching", function() {
				expect(this.renderedProps).to.be.ok;

				const { bananaSaveResult } = this.renderedProps;
				expect(bananaSaveResult).to.be.ok;

				expect(bananaSaveResult.isFetching).to.be.true;
				expect(bananaSaveResult.isFetched).to.be.true;
				expect(bananaSaveResult.error).to.not.be.ok;

				expect(bananaSaveResult.data).to.deep.equal({ name: "Bob" });
			});

			describe("and then waiting enough time for the original reset but not enough time for the next reset", function() {
				beforeEach(function(done) {
					setTimeout(done, 25);
				});

				it("should not reset data", function() {
					expect(this.renderedProps).to.be.ok;

					const { bananaSaveResult } = this.renderedProps;
					expect(bananaSaveResult).to.be.ok;

					expect(bananaSaveResult.isFetching).to.be.true;
					expect(bananaSaveResult.isFetched).to.be.true;
					expect(bananaSaveResult.error).to.not.be.ok;

					expect(bananaSaveResult.data).to.deep.equal({ name: "Bob" });
				});
			});

			describe("and then receiving data and waiting past the original reset time", function() {
				beforeEach(function(done) {
					this.requests.pop().resolve({
						status: 200,
						statusText: "OK",
						json: async () => ({ name: "Homer" })
					});

					setTimeout(done, 25);
				});

				it("should not reset data", function() {
					expect(this.renderedProps).to.be.ok;

					const { bananaSaveResult } = this.renderedProps;
					expect(bananaSaveResult).to.be.ok;

					expect(bananaSaveResult.isFetching).to.be.false;
					expect(bananaSaveResult.isFetched).to.be.true;
					expect(bananaSaveResult.error).to.not.be.ok;

					expect(bananaSaveResult.data).to.deep.equal({ name: "Homer" });
				});

				describe("and then waiting for the next reset threshold time", function() {
					beforeEach(function(done) {
						setTimeout(done, 110);
					});

					it("should clear status props to the component", function() {
						expect(this.renderedProps).to.be.ok;

						const { bananaSaveResult } = this.renderedProps;
						expect(bananaSaveResult).to.be.ok;

						expect(bananaSaveResult.isFetching).to.be.false;
						expect(bananaSaveResult.isFetched).to.be.false;
						expect(bananaSaveResult.error).to.not.be.ok;

						expect(bananaSaveResult.data).to.not.be.ok;
					});
				});
			});
		});
	});

	describe("when rendering a component while disabling fetch", function() {
		beforeEach(function() {
			this.FetchingComponent = connect(() => ({
				bananas: "http://example.com/api/bananas/"
			}))(this.NakedComponent);

			this.wrapper = mount(<this.FetchingComponent disableFetch />);
		});

		it("should not make a fetch API request", function() {
			expect(this.requests.length).to.equal(0);
		});

		it("should not pass status props to the component", function() {
			expect(this.renderedProps).to.be.ok;

			const { bananaSaveResult } = this.renderedProps;
			expect(bananaSaveResult).to.not.be.ok;
		});
	});
});
