import { CreateUserData, ListGamesData, AddScoreData, AddScoreVariables, GetUserScoresData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListGames(options?: useDataConnectQueryOptions<ListGamesData>): UseDataConnectQueryResult<ListGamesData, undefined>;
export function useListGames(dc: DataConnect, options?: useDataConnectQueryOptions<ListGamesData>): UseDataConnectQueryResult<ListGamesData, undefined>;

export function useAddScore(options?: useDataConnectMutationOptions<AddScoreData, FirebaseError, AddScoreVariables>): UseDataConnectMutationResult<AddScoreData, AddScoreVariables>;
export function useAddScore(dc: DataConnect, options?: useDataConnectMutationOptions<AddScoreData, FirebaseError, AddScoreVariables>): UseDataConnectMutationResult<AddScoreData, AddScoreVariables>;

export function useGetUserScores(options?: useDataConnectQueryOptions<GetUserScoresData>): UseDataConnectQueryResult<GetUserScoresData, undefined>;
export function useGetUserScores(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserScoresData>): UseDataConnectQueryResult<GetUserScoresData, undefined>;
