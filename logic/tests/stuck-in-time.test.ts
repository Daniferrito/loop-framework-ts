import { crushedGrass, initialState } from "../src/stuck-in-time/stuck-in-time";

describe(`initialState`, () => {
  it(`should return a state with a specific content`, () => {
    const options = { randomFamiliarity: true };
    const result = initialState(options);
    // expect(result).toMatchSnapshot();
    expect(result.tileMap.tiles[result.position.y][result.position.x].name).toEqual(crushedGrass().name);
  });
});