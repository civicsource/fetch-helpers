# Fetch Helpers

> Response handlers and helpers to parse JSON and deal with HTTP errors when using the [browser fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

[See here for a polyfill](https://github.com/github/fetch) if you are using the fetch API in a browser that doesn't support it yet.

## Install

```
npm install fetch-helpers --save
```

## API Reference

1. [`fetchOnUpdate`](#fetchonupdatefn-keys)
2. [`checkStatus`](#checkstatusresponse)
3. [`parseJSON`](#parsejsonresponse)
4. [`batchFetch`](#batchfetchkeyname-performfetch--maxbatchsize-timeout-)

### `fetchOnUpdate(fn, [...keys])`

This is a [HOC (higher order component)](https://facebook.github.io/react/docs/higher-order-components.html) that will reduce the amount of boilerplate you need when writing a component that will need to do data fetching on render. In general, you should strive to separate your components into [presentational & container components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0). In doing this, you can cleanly separate your presentation logic from your data-fetching logic. Here is an example:

```js
const UserProfile = ({ user }) => (
	<span title={user.username}>{user.email}</span>;
);

export default UserProfile;
```

This is a simple component that will display user information given a user object. We can use this in places where we already have the user object loaded and not have to worry about any unwanted network requests. However, there are a lot of places where we don't have the user object loaded (we just have a username or user ID) deep in the component tree and we also want to show user information. We can solve this by also including a "containerized" version of this component which wraps the component and takes a username to fetch the `User` and pass it down to the original component.

That might end up looking something like this:

```js
// add some more props to show loading statuses
const UserProfile = ({ user, isLoading, isLoaded, error }) => {
	if (error) {
		return <span>Error loading user: {error}</span>;
	}

	if (isLoading && !isLoaded) {
		return <span>Loading...</span>;
	}

	if (!isLoaded) {
		return null;
	}

	// we may still need to show a loading indicator if the user is loaded
	// but we are loading more data for the user, e.g. "refreshing the user"
	const loadingIndicator = isLoading ? <span>Loading...</span> : null;
	return <span title={user.username}>{user.email} {loadingIndicator}</span>;
};

export default class UserContainer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			isLoaded: false,
			error: null
		};
	}

	componentDidMount() {
		this.fetchUser();
	}

	fetchUser = async () => {
		this.setState({
			isLoading: true,
			error: null
		});

		try {
			let response = await fetch(`http://example.com/api/${this.props.username}`, {
				method: "GET"
			});

			response = await checkStatus(response);
			response = await parseJSON(response);

			this.setState({
				isLoaded: true,
				isLoading: false,
				user: response
			});
		} catch (ex) {
			this.setState({
				isLoading: false,
				error: ex.message
			});
		}
	};

	render() {
		return (
			<UserProfile {...this.props} {...this.state} />
		);
	}
};

```

That is a lot of boilerplate to load the data once the component mounts and doesn't even handle the case where the `username` prop changes after the component is mounted. `fetchOnUpdate` can reduce all of that to this equivalent code:

```js
import { fetchOnUpdate } from "fetch-helpers";

const UserProfileFetcher = fetchOnUpdate(({ username }) =>  ({
	url: `http://example.com/api/${username}`, // the URL to make a fetch request to
	key: "user", // the name of the prop to pass the parsed JSON data from the response as (default is 'data' if not specified)

	method: "GET" // any otherstandard fetch options
}))(UserProfile);

export default UserProfileFetcher;
```

The first argument is a function that takes the current props and should return an object describing how to fetch the requested data. `fetchOnUpdate` will generate the `isLoading`, `isLoaded`, & `error` statuses and pass that down to the wrapped component as props.

By default, it will only run the fetch when the component is initially mounted. Optionally, if your component takes more `props` and you want to fetch on certain prop updates (which is usually the case), you can pass a list of keys to `fetchOnUpdate`:

```js
const UserProfileFetcher = fetchOnUpdate(({ username }) =>  ({
	url: `http://example.com/api/${username}`,
	key: "user"
}), "username", "someOtherProp")(UserProfile);

export default UserProfileFetcher;
```

The second argument is the prop to monitor for changes and if that prop changes, it will run the fetch again. You can pass an arbitrary number of props to monitor for changes. Each prop can use object paths of arbitrary length: e.g. `user.username`; in which case the fetch will only run if the `username` field on `user` changes.

#### Advanced Usage

If your `fn` does not return an object describing how to fetch the data, it will assume that you are handling all that yourself. This is useful, for example, if you just want to trigger a redux action and retrieve loading statuses & such from the store:

```js
const UserProfileFetcher = fetchOnUpdate(({ username, fetchUser }) => {
	//this function will run on mount & whenever "username" changes
	fetchUser(username);
}, "username")(UserProfile);

// connect is from redux
const UserProfileContainer = connect((state, props) =>({
	user: state.users[props.username]
}), dispatch => ({
	fetchUser: username => dispatch(fetchUser(username))
}))(UserProfileFetcher);

export default UserProfileContainer;
```

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
