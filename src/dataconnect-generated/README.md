# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListGames*](#listgames)
  - [*GetUserScores*](#getuserscores)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*AddScore*](#addscore)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListGames
You can execute the `ListGames` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listGames(): QueryPromise<ListGamesData, undefined>;

interface ListGamesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGamesData, undefined>;
}
export const listGamesRef: ListGamesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listGames(dc: DataConnect): QueryPromise<ListGamesData, undefined>;

interface ListGamesRef {
  ...
  (dc: DataConnect): QueryRef<ListGamesData, undefined>;
}
export const listGamesRef: ListGamesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listGamesRef:
```typescript
const name = listGamesRef.operationName;
console.log(name);
```

### Variables
The `ListGames` query has no variables.
### Return Type
Recall that executing the `ListGames` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGamesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListGamesData {
  games: ({
    id: UUIDString;
    title: string;
    genre?: string | null;
  } & Game_Key)[];
}
```
### Using `ListGames`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listGames } from '@dataconnect/generated';


// Call the `listGames()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGames();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGames(dataConnect);

console.log(data.games);

// Or, you can use the `Promise` API.
listGames().then((response) => {
  const data = response.data;
  console.log(data.games);
});
```

### Using `ListGames`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGamesRef } from '@dataconnect/generated';


// Call the `listGamesRef()` function to get a reference to the query.
const ref = listGamesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGamesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.games);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.games);
});
```

## GetUserScores
You can execute the `GetUserScores` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserScores(): QueryPromise<GetUserScoresData, undefined>;

interface GetUserScoresRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserScoresData, undefined>;
}
export const getUserScoresRef: GetUserScoresRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserScores(dc: DataConnect): QueryPromise<GetUserScoresData, undefined>;

interface GetUserScoresRef {
  ...
  (dc: DataConnect): QueryRef<GetUserScoresData, undefined>;
}
export const getUserScoresRef: GetUserScoresRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserScoresRef:
```typescript
const name = getUserScoresRef.operationName;
console.log(name);
```

### Variables
The `GetUserScores` query has no variables.
### Return Type
Recall that executing the `GetUserScores` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserScoresData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserScoresData {
  scores: ({
    game?: {
      title: string;
    };
      scoreValue: number;
      submittedAt: TimestampString;
  })[];
}
```
### Using `GetUserScores`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserScores } from '@dataconnect/generated';


// Call the `getUserScores()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserScores();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserScores(dataConnect);

console.log(data.scores);

// Or, you can use the `Promise` API.
getUserScores().then((response) => {
  const data = response.data;
  console.log(data.scores);
});
```

### Using `GetUserScores`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserScoresRef } from '@dataconnect/generated';


// Call the `getUserScoresRef()` function to get a reference to the query.
const ref = getUserScoresRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserScoresRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.scores);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.scores);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## AddScore
You can execute the `AddScore` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addScore(vars: AddScoreVariables): MutationPromise<AddScoreData, AddScoreVariables>;

interface AddScoreRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddScoreVariables): MutationRef<AddScoreData, AddScoreVariables>;
}
export const addScoreRef: AddScoreRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addScore(dc: DataConnect, vars: AddScoreVariables): MutationPromise<AddScoreData, AddScoreVariables>;

interface AddScoreRef {
  ...
  (dc: DataConnect, vars: AddScoreVariables): MutationRef<AddScoreData, AddScoreVariables>;
}
export const addScoreRef: AddScoreRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addScoreRef:
```typescript
const name = addScoreRef.operationName;
console.log(name);
```

### Variables
The `AddScore` mutation requires an argument of type `AddScoreVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddScoreVariables {
  gameId: UUIDString;
  scoreValue: number;
}
```
### Return Type
Recall that executing the `AddScore` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddScoreData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddScoreData {
  score_insert: Score_Key;
}
```
### Using `AddScore`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addScore, AddScoreVariables } from '@dataconnect/generated';

// The `AddScore` mutation requires an argument of type `AddScoreVariables`:
const addScoreVars: AddScoreVariables = {
  gameId: ..., 
  scoreValue: ..., 
};

// Call the `addScore()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addScore(addScoreVars);
// Variables can be defined inline as well.
const { data } = await addScore({ gameId: ..., scoreValue: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addScore(dataConnect, addScoreVars);

console.log(data.score_insert);

// Or, you can use the `Promise` API.
addScore(addScoreVars).then((response) => {
  const data = response.data;
  console.log(data.score_insert);
});
```

### Using `AddScore`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addScoreRef, AddScoreVariables } from '@dataconnect/generated';

// The `AddScore` mutation requires an argument of type `AddScoreVariables`:
const addScoreVars: AddScoreVariables = {
  gameId: ..., 
  scoreValue: ..., 
};

// Call the `addScoreRef()` function to get a reference to the mutation.
const ref = addScoreRef(addScoreVars);
// Variables can be defined inline as well.
const ref = addScoreRef({ gameId: ..., scoreValue: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addScoreRef(dataConnect, addScoreVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.score_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.score_insert);
});
```

