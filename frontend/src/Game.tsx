import { useEffect, useRef, useState } from 'react';
import { initialState } from 'logic/src/stuck-in-time/stuck-in-time.ts';
import { useElementSize } from "@mantine/hooks";
import './Game.css'
import Draggable from './utils/Draggable';
import { EntityWithState, TileWithState } from 'logic/src/State';

function Game() {
  const { ref, width, height } = useElementSize();
  const layoutRef = useRef<SVGGElement>(null);
  // const [gameState] = useState(initialState({randomFamiliarity: false}));
  const gameState = initialState({randomFamiliarity: false});
  const [showUnknownEntities, setShowUnknownEntities] = useState(false);

  // When q is pressed, toggle showUnknownEntities
  
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'q') {
        setShowUnknownEntities((oldState) => !oldState);
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    }
  }, []);
  

  return (
    <>
      <div ref={ref} className="GameContainer" >
        <svg width={width} height={height} viewBox={`${0} ${0} ${width} ${height}`}>
          <g ref={layoutRef} >
          {gameState.tileMap.tiles.map((row, y) => {
            return row.map((tile, x) => {
              const eTile = tile as TileWithState<object, object> & {color: string, id: number, _id: number};
              return (
                <g key={`${x}-${y}`}>
                  <rect
                    x={x * 32}
                    y={y * 32}
                    width={32}
                    height={32}
                    fill={eTile.color}
                    onClick={() => {console.log(eTile._id, eTile.id, eTile.name, {x, y})}}
                  />
                  <text
                    x={x * 32 + 8}
                    y={y * 32 + 16}
                    fontSize={8}
                    fill="white"
                  > {eTile.id} </text>
                  {tile.entities.map((entity, i) => {
                    const eEntity = entity as EntityWithState<object, object> & {color: string, id: number, _id: number};
                    if (!showUnknownEntities && eEntity.id != null) {
                      return
                    }
                    return (
                      <g key={`${x}-${y}-${i}`}>
                      <rect
                        key={`${x}-${y}-${i}`}
                        x={x * 32 + 8}
                        y={y * 32 + 8}
                        width={16}
                        height={16}
                        fill={eEntity.color}
                        onClick={() => {console.log(eEntity._id, eEntity.id, eEntity.name, {x, y})}}
                      /> 
                      <text
                          x={x * 32 + 9}
                          y={y * 32 + 16}
                          fontSize={8}
                          fill="yellow"
                        > {eEntity.id || eEntity.name} </text>
                      </g>
                    );
                  })}
                </g>
              );
            });
          })}
          </g>
        <Draggable targetRef={layoutRef} startOffset={{ x: 500, y: 500 }} />
        </svg>
      </div>
    </>
  )
}

export default Game
