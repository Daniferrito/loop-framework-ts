// import tileset from '../assets/world_tileset_horizontal_animations.png';
import tileset from '../assets/World_TileSet.png';
import hero from '../assets/s_SB_Hero_0.png';
import pathMarkers from '../assets/path_markers.png';

const marginSize = 2;
const tileSize = 16;
const totalTileSize = tileSize + 2*marginSize;

const xSize = 40;
const ySize = 40;

function SVGDefs() {
  return (
    <defs>
      {
        Array.from({length: ySize}, (_, i) => i).map((y) => {
          return Array.from({length: xSize}, (_, i) => i).map((x) => {
            const id = x + y * xSize;
            if (id === 0) {
              return null;
            }
            return (
              <pattern key={`${id}`} id={`${id}`} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize} viewBox={`${x*totalTileSize + marginSize} ${y*totalTileSize + marginSize} ${tileSize} ${tileSize}`}>
                <image href={tileset}/>
              </pattern>
            );
          });
        }).flat()
      }
      <pattern  id={`hero`} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize} viewBox={`${0} ${0} ${tileSize} ${tileSize}`}>
        <image href={hero}/>
      </pattern>
      {
        Array.from({length: 10}, (_, i) => i).map((i) => {
          return (
            <pattern key={`path-${i}`} id={`path-${i}`} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize} viewBox={`${i * tileSize} ${0} ${tileSize} ${tileSize}`}>
              <image href={pathMarkers}/>
            </pattern>
          );
        })
      }
    </defs>
  );
}

export default SVGDefs;