const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'anti2',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const listGamesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGames');
}
listGamesRef.operationName = 'ListGames';
exports.listGamesRef = listGamesRef;

exports.listGames = function listGames(dc) {
  return executeQuery(listGamesRef(dc));
};

const addScoreRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddScore', inputVars);
}
addScoreRef.operationName = 'AddScore';
exports.addScoreRef = addScoreRef;

exports.addScore = function addScore(dcOrVars, vars) {
  return executeMutation(addScoreRef(dcOrVars, vars));
};

const getUserScoresRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserScores');
}
getUserScoresRef.operationName = 'GetUserScores';
exports.getUserScoresRef = getUserScoresRef;

exports.getUserScores = function getUserScores(dc) {
  return executeQuery(getUserScoresRef(dc));
};
