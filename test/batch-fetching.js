import { expect } from "chai";
import { uniq } from "lodash";

import { batchFetch } from "../src";

const ASYNC_TIMEOUT = 10, DEBOUNCE_TIMEOUT = 150;

describe("Batch fetching", function() {
	beforeEach(function () {
		this.requests = [];

		this.getBatchedUsers = batchFetch("username", chunk => new Promise((resolve, reject) => {
			this.requests.push({ chunk, resolve, reject });
		}));
	});

	describe("when getting multiple items in succession", function () {
		beforeEach(function (done) {
			this.promise1 = this.getBatchedUsers("homer.simpson");
			this.promise2 = this.getBatchedUsers("marge.simpson");
			this.promise3 = this.getBatchedUsers("bart.simpson");

			setTimeout(done, DEBOUNCE_TIMEOUT);
		});

		it("should make one batch request", function () {
			expect(this.requests).to.have.length(1);

			const req = this.requests[0];
			expect(req.chunk).to.have.length(3);
			expect(req.chunk).to.include("homer.simpson");
			expect(req.chunk).to.include("marge.simpson");
			expect(req.chunk).to.include("bart.simpson");
		});

		it("should return multiple different promises per batch call", function() {
			expect(this.promise1).to.be.ok;
			expect(this.promise2).to.be.ok;
			expect(this.promise3).to.be.ok;

			expect(uniq([
				this.promise1,
				this.promise2,
				this.promise3
			])).to.have.length(3);
		});

		describe("and then receiving a successful fetch response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve([{
						username: "homer.simpson",
						age: 42
					}, {
						username: "marge.simpson",
						age: 36
					}, {
						username: "bart.simpson",
						age: 9
					}]))
				});

				this.promise1.then(data => { this.homer = data; });
				this.promise2.then(data => { this.marge = data; });
				this.promise3.then(data => { this.bart = data; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should resolve each promise individually", function() {
				expect(this.homer).to.be.ok;
				expect(this.homer.username).to.equal("homer.simpson");
				expect(this.homer.age).to.equal(42);

				expect(this.marge).to.be.ok;
				expect(this.marge.username).to.equal("marge.simpson");
				expect(this.marge.age).to.equal(36);

				expect(this.bart).to.be.ok;
				expect(this.bart.username).to.equal("bart.simpson");
				expect(this.bart.age).to.equal(9);
			});
		});

		describe("and then receiving a successful fetch response without all items", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve([{
						username: "homer.simpson",
						age: 42
					}, {
						username: "marge.simpson",
						age: 36
					}]))
				});

				this.promise1.then(data => { this.homer = data; });
				this.promise2.then(data => { this.marge = data; });
				this.promise3.then(() => null, err => { this.bartFailure = err; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should resolve found user promises", function() {
				expect(this.homer).to.be.ok;
				expect(this.marge).to.be.ok;
			});

			it("should reject not-found user promises", function() {
				expect(this.bartFailure).to.be.ok;
				expect(this.bartFailure.message).to.include("bart.simpson");
			});

			it("should fake a 404 response for the not-found user", function() {
				expect(this.bartFailure).to.be.ok;
				expect(this.bartFailure.response).to.be.ok;
				expect(this.bartFailure.response.status).to.equal(404);
				expect(this.bartFailure.response.statusText).to.equal("Not Found");
			});
		});

		describe("and then receiving a failure fetch response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "Server Error",
					json: () => new Promise(resolve => resolve({
						message: "SHIT JUST WENT DOWN"
					}))
				});

				this.promise1.then(() => null, err => { this.homerFailure = err; });
				this.promise2.then(() => null, err => { this.margeFailure = err; });
				this.promise3.then(() => null, err => { this.bartFailure = err; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should reject all promises with the same error", function() {
				expect(this.homerFailure).to.be.ok;
				expect(this.margeFailure).to.be.ok;
				expect(this.bartFailure).to.be.ok;

				expect(this.homerFailure).to.equal(this.margeFailure);
				expect(this.margeFailure).to.equal(this.bartFailure);
			});

			it("should populate error message from fetch result", function() {
				expect(this.homerFailure.message).to.equal("SHIT JUST WENT DOWN");
			});

			it("should populate the response from the fetch result", function() {
				expect(this.homerFailure.response).to.be.ok;
				expect(this.homerFailure.response.status).to.equal(500);
				expect(this.homerFailure.response.statusText).to.equal("Server Error");
			});
		});
	});

	describe("when getting a single item", function () {
		beforeEach(function (done) {
			this.promise = this.getBatchedUsers("lisa.simpson");

			setTimeout(done, DEBOUNCE_TIMEOUT);
		});

		it("should make one batch request", function () {
			expect(this.requests).to.have.length(1);

			const req = this.requests[0];
			expect(req.chunk).to.have.length(1);
			expect(req.chunk).to.include("lisa.simpson");
		});

		it("should return a valid promise", function() {
			expect(this.promise).to.be.ok;
		});

		describe("and then receiving a successful fetch response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve({
						username: "lisa.simpson",
						age: 7
					}))
				});

				this.promise.then(data => { this.lisa = data; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should resolve the promise", function() {
				expect(this.lisa).to.be.ok;
				expect(this.lisa.username).to.equal("lisa.simpson");
				expect(this.lisa.age).to.equal(7);
			});
		});

		describe("and then receiving a failure fetch response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "Server Error",
					json: () => new Promise(resolve => resolve({
						message: "SHIT JUST WENT DOWN"
					}))
				});

				this.promise.then(() => null, err => { this.failure = err; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should reject the promise", function() {
				expect(this.failure).to.be.ok;

				expect(this.failure.message).to.equal("SHIT JUST WENT DOWN");

				expect(this.failure.response).to.be.ok;
				expect(this.failure.response.status).to.equal(500);
				expect(this.failure.response.statusText).to.equal("Server Error");
			});
		});
	});

	describe("when getting multiple items in succession over the batch limit", function () {
		beforeEach(function (done) {
			this.getBatchedUsers = batchFetch("username", chunk => new Promise((resolve, reject) => {
				this.requests.push({ chunk, resolve, reject });
			}), { maxBatchSize: 2 });

			this.promise1 = this.getBatchedUsers("homer.simpson");
			this.promise2 = this.getBatchedUsers("marge.simpson");
			this.promise3 = this.getBatchedUsers("bart.simpson");

			setTimeout(done, DEBOUNCE_TIMEOUT);
		});

		it("should make two batch requests", function () {
			expect(this.requests).to.have.length(2);

			const req1 = this.requests[0];
			expect(req1.chunk).to.have.length(2);
			expect(req1.chunk).to.include("homer.simpson");
			expect(req1.chunk).to.include("marge.simpson");

			const req2 = this.requests[1];
			expect(req2.chunk).to.include("bart.simpson");
		});

		it("should return multiple different promises per batch call", function() {
			expect(this.promise1).to.be.ok;
			expect(this.promise2).to.be.ok;
			expect(this.promise3).to.be.ok;

			expect(uniq([
				this.promise1,
				this.promise2,
				this.promise3
			])).to.have.length(3);
		});

		describe("and then receiving successful fetch responses", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve({
						username: "bart.simpson",
						age: 9
					}))
				});

				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve([{
						username: "homer.simpson",
						age: 42
					}, {
						username: "marge.simpson",
						age: 36
					}]))
				});

				this.promise1.then(data => { this.homer = data; });
				this.promise2.then(data => { this.marge = data; });
				this.promise3.then(data => { this.bart = data; });

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should resolve each promise individually", function() {
				expect(this.homer).to.be.ok;
				expect(this.homer.username).to.equal("homer.simpson");
				expect(this.homer.age).to.equal(42);

				expect(this.marge).to.be.ok;
				expect(this.marge.username).to.equal("marge.simpson");
				expect(this.marge.age).to.equal(36);

				expect(this.bart).to.be.ok;
				expect(this.bart.username).to.equal("bart.simpson");
				expect(this.bart.age).to.equal(9);
			});
		});

		describe("and then receiving successful fetch responses without all items", function() {
			beforeEach(function(done) {
				this.promise1.then(data => { this.homer = data; });
				this.promise2.then(() => null, err => { this.margeFailure = err; });
				this.promise3.then(data => { this.bart = data; });

				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve({
						username: "bart.simpson",
						age: 9
					}))
				});

				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: () => new Promise(resolve => resolve([{
						username: "homer.simpson",
						age: 42
					}]))
				});

				setTimeout(done, ASYNC_TIMEOUT);
			});

			it("should resolve found user promises", function() {
				expect(this.homer).to.be.ok;
				expect(this.bart).to.be.ok;
			});

			it("should reject not-found user promises", function() {
				expect(this.margeFailure).to.be.ok;
				expect(this.margeFailure.message).to.include("marge.simpson");
			});

			it("should fake a 404 response for the not-found user", function() {
				expect(this.margeFailure).to.be.ok;
				expect(this.margeFailure.response).to.be.ok;
				expect(this.margeFailure.response.status).to.equal(404);
				expect(this.margeFailure.response.statusText).to.equal("Not Found");
			});
		});

		describe("and then receiving failure fetch responses mixed with successful responses", function() {
			beforeEach(function(done) {
				this.promise1.then(data => { this.homer = data; });
				this.promise2.then(data => { this.marge = data; });
				this.promise3.then(() => null, err => { this.bartFailure = err; });

				this.requests.pop().resolve({
					status: 404,
					statusText: "Not Found",
					json: () => new Promise(resolve => resolve({
						message: "Couldn't find user bart.simpson"
					}))
				});

				setTimeout(() => {
					this.requests.pop().resolve({
						status: 200,
						statusText: "OK",
						json: () => new Promise(resolve => resolve([{
							username: "homer.simpson",
							age: 42
						}, {
							username: "marge.simpson",
							age: 36
						}]))
					});

					setTimeout(done, ASYNC_TIMEOUT);
				}, ASYNC_TIMEOUT);
			});

			it("should resolve found user promises", function() {
				expect(this.homer).to.be.ok;
				expect(this.marge).to.be.ok;
			});

			it("should reject failed fetch promise", function() {
				expect(this.bartFailure).to.be.ok;
				expect(this.bartFailure.message).to.equal("Couldn't find user bart.simpson");
			});

			it("should populate the response from the fetch result", function() {
				expect(this.bartFailure.response).to.be.ok;
				expect(this.bartFailure.response.status).to.equal(404);
				expect(this.bartFailure.response.statusText).to.equal("Not Found");
			});
		});
	});
});