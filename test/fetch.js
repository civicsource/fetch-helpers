import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { Fetch } from "../src";

configure({ adapter: new Adapter() });

describe("Rendering the fetch component", function() {
	behavesLikeBrowser();

	describe("when rendering the component", function() {
		beforeEach(function() {
			this.wrapper = mount(
				<Fetch
					url="http://example.com/api/bananas/4"
					method="GET"
					headers={{ Accept: "application/json" }}
				>
					{props => {
						this.props = props;
						return <span>hello, world</span>;
					}}
				</Fetch>
			);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);

			const req = this.requests[0];

			expect(req.url).to.equal("http://example.com/api/bananas/4");
			expect(req.method).to.equal("GET");
			expect(req.headers.Accept).to.equal("application/json");
		});

		it("should pass status props to the component", function() {
			expect(this.props).to.be.ok;
			expect(this.props.isLoading).to.be.true;
			expect(this.props.isLoaded).to.be.false;
			expect(this.props.error).to.not.be.ok;

			expect(this.props.data).to.not.be.ok;
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
				expect(this.props).to.be.ok;
				expect(this.props.isLoading).to.be.false;
				expect(this.props.isLoaded).to.be.true;
				expect(this.props.error).to.not.be.ok;

				expect(this.props.data).to.be.ok;
				expect(this.props.data).to.have.lengthOf(2);
				expect(this.props.data[0]).to.equal("ripe banana");
				expect(this.props.data[1]).to.equal("green banana");
			});

			describe("and then setting a prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ url: "https://example.com/api/bananas/3" });
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"https://example.com/api/bananas/3"
					);
				});

				it("should pass status props to the component as loading but still persisting previously loaded data", function() {
					expect(this.props).to.be.ok;
					expect(this.props.isLoading).to.be.true;
					expect(this.props.isLoaded).to.be.true;
					expect(this.props.error).to.not.be.ok;

					expect(this.props.data).to.be.ok;
					expect(this.props.data).to.have.lengthOf(2);
					expect(this.props.data[0]).to.equal("ripe banana");
					expect(this.props.data[1]).to.equal("green banana");
				});
			});

			describe("and then setting a same prop on the component", function() {
				beforeEach(function() {
					// set prop to same value
					this.wrapper.setProps({ url: "http://example.com/api/bananas/4" });
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
				expect(this.props).to.be.ok;
				expect(this.props.isLoading).to.be.false;
				expect(this.props.isLoaded).to.be.false;
				expect(this.props.error).to.equal("Not today, buddy");

				expect(this.props.data).to.not.be.ok;
			});

			describe("and then setting a prop on the component", function() {
				beforeEach(function() {
					this.wrapper.setProps({ url: "https://example.com/api/bananas/3" });
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"https://example.com/api/bananas/3"
					);
				});

				it("should pass status props to the component as loading and no longer errored", function() {
					expect(this.props).to.be.ok;
					expect(this.props.isLoading).to.be.true;
					expect(this.props.isLoaded).to.be.false;
					expect(this.props.error).to.not.be.ok;

					expect(this.props.data).to.not.be.ok;
				});
			});
		});
	});
});
