import assert from "node:assert/strict";
import { administrativeDatasets } from "../app/web/src/game/administrativeData";
import { getCountryName } from "../app/web/src/game/countryNames";
import { createGameReducer, createInitialGameState, TOTAL_TURNS } from "../app/web/src/game/gameEngine";

const expected = {
  uruguay: {parent: 'URY', codes: 'AR CA CL CO DU FD FS LA MA MO PA RN RO RV SA SJ SO TA TT', prefix: 'UY'},
  argentina: {parent: 'ARG', codes: 'A B C D E F G H J K L M N P Q R S T U V W X Y Z', prefix: 'AR'},
  brazil: {parent: 'BRA', codes: 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO', prefix: 'BR'},
  usa: {parent: 'USA', codes: 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY', prefix: 'US'}
};
for (const country of Object.keys(administrativeDatasets) as (keyof typeof administrativeDatasets)[]) {
  const regions = administrativeDatasets[country];
  const spec = expected[country];
  const codes = spec.codes.split(' ').map(code => `${spec.prefix}-${code}`);
  assert.deepEqual(regions.map(f => f.properties.isoA3).sort(), codes.sort());
  assert.equal(new Set(regions.map(f => getCountryName(f.properties.isoA3, 'es'))).size, regions.length);
  for (const feature of regions) {
    assert.equal(feature.properties.parentIso, spec.parent);
    for (const lang of ['es','en'] as const) assert.notEqual(getCountryName(feature.properties.isoA3, lang), feature.properties.isoA3);
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    assert.ok(polygons.length);
    for (const polygon of polygons) for (const ring of polygon) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring[0], ring[ring.length-1]);
      for (const [lng,lat] of ring) assert.ok(Number.isFinite(lng) && Number.isFinite(lat) && lng>=-190 && lng<=180 && lat>=-90 && lat<=90);
    }
  }
  if (country === 'usa') {
    const alaska = regions.find(f => f.properties.isoA3 === 'US-AK')!;
    const coords = alaska.geometry.type === 'Polygon' ? alaska.geometry.coordinates.flat() : alaska.geometry.coordinates.flat(2);
    assert.ok(Math.max(...coords.map(p => p[0])) - Math.min(...coords.map(p => p[0])) < 60, 'Alaska must not span the entire world');
  }
  const reducer = createGameReducer(regions);
  let state = createInitialGameState(regions);
  assert.equal(new Set([state.targetIso, ...state.remainingTargetIsos]).size, TOTAL_TURNS);
  for (let turn = 0; turn < TOTAL_TURNS; turn++) {
    assert.equal(state.activePlayerIndex, turn % 2);
    const iso = turn % 2 === 0 ? state.targetIso! : codes.find(code => code !== state.targetIso)!;
    state = reducer(state, {type:'SUBMIT_GUESS', iso});
    assert.equal(state.lastGuessStatus, turn % 2 === 0 ? 'correct' : 'incorrect');
    state = reducer(state, {type:'NEXT_TURN'});
  }
  assert.equal(state.phase,'complete');
  assert.deepEqual(state.players.map(p => [p.score,p.shotsTaken]), [[5,5],[0,5]]);
  console.log(`${country}: ${regions.length} unique divisions, names, geometry, scores and ten-turn match passed`);
}
