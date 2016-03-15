# Fetch Helpers

> Response handlers and helpers to parse JSON and deal with HTTP errors when using the browser fetch API

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
	console.log(err.response.body); //{ "message": "Invalid arguments. Try again.", "someOtherThing": 42 }
});
```

It will try to look for a `message` field first, and then an `exceptionMessage` falling back to the `statusText` if neither one exist.

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

## Build Locally

After cloning this repo, run:

```
npm install
npm run compile
```

This will build the `src` into `lib` using babel.
