import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddScoreData {
  score_insert: Score_Key;
}

export interface AddScoreVariables {
  gameId: UUIDString;
  scoreValue: number;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface Game_Key {
  id: UUIDString;
  __typename?: 'Game_Key';
}

export interface GetUserScoresData {
  scores: ({
    game?: {
      title: string;
    };
      scoreValue: number;
      submittedAt: TimestampString;
  })[];
}

export interface ListGamesData {
  games: ({
    id: UUIDString;
    title: string;
    genre?: string | null;
  } & Game_Key)[];
}

export interface Score_Key {
  id: UUIDString;
  __typename?: 'Score_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListGamesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGamesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListGamesData, undefined>;
  operationName: string;
}
export const listGamesRef: ListGamesRef;

export function listGames(): QueryPromise<ListGamesData, undefined>;
export function listGames(dc: DataConnect): QueryPromise<ListGamesData, undefined>;

interface AddScoreRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddScoreVariables): MutationRef<AddScoreData, AddScoreVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddScoreVariables): MutationRef<AddScoreData, AddScoreVariables>;
  operationName: string;
}
export const addScoreRef: AddScoreRef;

export function addScore(vars: AddScoreVariables): MutationPromise<AddScoreData, AddScoreVariables>;
export function addScore(dc: DataConnect, vars: AddScoreVariables): MutationPromise<AddScoreData, AddScoreVariables>;

interface GetUserScoresRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserScoresData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserScoresData, undefined>;
  operationName: string;
}
export const getUserScoresRef: GetUserScoresRef;

export function getUserScores(): QueryPromise<GetUserScoresData, undefined>;
export function getUserScores(dc: DataConnect): QueryPromise<GetUserScoresData, undefined>;

