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
});
