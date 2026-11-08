import assert from "node:assert/strict";
import departments from "../app/web/src/data/uruguay-departments.geojson.json";
import { type CountryFeature } from "../app/web/src/game/mapData";
import { createInitialGameState, createGameReducer, TOTAL_TURNS } from "../app/web/src/game/gameEngine";

const features = departments.features as CountryFeature[];
const expected = ['AR','CA','CL','CO','DU','FD','FS','LA','MA','MO','PA','RN','RO','RV','SA','SJ','SO','TA','TT'].map(code => `UY-${code}`);
assert.deepEqual(features.map(f => f.properties.isoA3).sort(), expected.sort());
assert.equal(new Set(features.map(f => f.properties.name)).size, 19);
for (const feature of features) {
  assert.equal(feature.properties.parentIso, 'URY');
  const points = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates.flat() : feature.geometry.coordinates.flat(2);
  assert.ok(points.length >= 4);
  for (const [lng, lat] of points) {
    assert.ok(Number.isFinite(lng) && lng >= -59 && lng <= -53);
    assert.ok(Number.isFinite(lat) && lat >= -36 && lat <= -30);
  }
}
const reducer = createGameReducer(features);
let state = createInitialGameState(features);
assert.equal(new Set([state.targetIso, ...state.remainingTargetIsos]).size, TOTAL_TURNS);
for (let turn = 0; turn < TOTAL_TURNS; turn++) {
  assert.equal(state.activePlayerIndex, turn % 2);
  const target = state.targetIso!;
  const guess = turn % 2 === 0 ? target : expected.find(code => code !== target)!;
  state = reducer(state, {type:'SUBMIT_GUESS', iso:guess});
  assert.equal(state.lastGuessStatus, turn % 2 === 0 ? 'correct' : 'incorrect');
  state = reducer(state, {type:'NEXT_TURN'});
}
assert.equal(state.phase, 'complete');
assert.deepEqual(state.players.map(p => [p.score,p.shotsTaken]), [[5,5],[0,5]]);
console.log('Validated all 19 Uruguay departments, coordinate ranges, unique targets, alternating turns, scores, and match completion.');
