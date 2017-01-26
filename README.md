# Fetch Helpers

> Response handlers and helpers to parse JSON and deal with HTTP errors when using the [browser fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

[See here for a polyfill](https://github.com/github/fetch) if you are using the fetch API in a browser that doesn't support it yet.

## Install

```
npm install fetch-helpers --save
```

## Usage

### `checkStatus(response)`

[Read here](https://github.com/github/fetch#handling-http-error-statuses) for the inspiration for this function. It will reject fetch requests on any non-2xx response. It differs from the example in that it will try to parse a JSON body from the non-200 response and will set any `message` field (if it exists) from the JSON body as the error message.

```js
import { checkStatus } from "fetch-helpers";

//given a 400 Bad Request response with a JSON body of:
//{ "message": "Invalid arguments. Try again.", "someOtherThing": 42 }

fetch("/data", {
	method: "GET",
	headers: {
		Accept: "application/json"
	}
})
.then(checkStatus)
.catch(err => {
	console.log(err.message); //Invalid Arguments. Try again.
	console.log(err.response.statusText); //Bad Request
	console.log(err.response.jsonBody); //{ "message": "Invalid arguments. Try again.", "someOtherThing": 42 }
});
```

It will try to look for a `message` field first, and then an `exceptionMessage` falling back to the `statusText` if neither one exist or if the response body is not JSON.

### `parseJSON(response)`

A simple response handler that will simply parse the response body as JSON.

```js
import { parseJSON } from "fetch-helpers";

//given a 400 Bad Request response with a JSON body of:
//{ "message": "Invalid arguments. Try again.", "someOtherThing": 42 }

fetch("/data", {
	method: "GET",
	headers: {
		Accept: "application/json"
	}
})
.then(parseJSON)
.then(json => console.log(json));
```

### `batchFetch(keyName, performFetch, { maxBatchSize, timeout })`

A utility to allow easily batching `fetch` requests. Calling code calls the function as if it will make a single request while, internally, it will wait a predetermined amount of time before actually making the request.

```js
import { batchFetch } from "fetch-helpers";

const getItem = batchFetch("itemId", chunk => fetch(`http://example.com/api/items/${chunk.join(",")}/`, {
	method: "GET"
}));

for (let i = 1; i <= 10; i++) {
	getItem(i).then(item => console.log(`item with id ${item.itemId} retrieved from the server`));
}
```

The above example will make one request to the URL `http://example.com/api/items/1,2,3,4,5,6,7,8,9,10/` but resolve all promises separately so that calling code is none-the-wiser that its requests have been batched into one. The `keyName` (in this case `itemId`) must be returned from the server in the results as that is how `batchFetch` matches what promises to resolve/reject.

The default batch size is 10 and the default timeout is 100ms. Both can be overridden:

```js
const getItem = batchFetch("itemId", chunk => fetch(`http://example.com/api/items/${chunk.join(",")}/`, {
	method: "GET"
}), {
	maxBatchSize: 30,
	timeout = 300
});
```

Any extra parameters passed to the resulting function will be passed to the `performFetch` function:

```js
const getItem = batchFetch("itemId", (chunk, method) => fetch(`http://example.com/api/items/${chunk.join(",")}/`, {
	method: method
}));

getItem(42, "GET");
getItem(13, "GET");
getItem(69, "GET");
getItem(420, "GET"); // the last one wins (as far as the extra params passed to performFetch)
```

## Build Locally

After cloning this repo, run:

```
npm install
npm run compile
```

This will build the `src` into `lib` using babel.
