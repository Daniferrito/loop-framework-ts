import { useEffect, useMemo, useRef, useState } from 'react';
import { SITCell, SITFullTile, SitActionTypes, getFamiliarityLevel, initialState } from 'logic/src/stuck-in-time/stuck-in-time.ts';
import { useElementSize } from "@mantine/hooks";
import './Game.css'
import Draggable from './utils/Draggable';
import SVGDefs from './utils/SVGDefs';
import { Action } from 'logic/src';

function Game() {
  const { ref, width, height } = useElementSize();
  const svgRef = useRef<SVGSVGElement>(null);
  const layoutRef = useRef<SVGGElement>(null);
  const [gameState, setGameState] = useState(initialState({ randomFamiliarity: false }));
  // const forceUpdate = useForceUpdate();
  const [showUnknownEntities, setShowUnknownEntities] = useState(false);
  const [selected, setSelected] = useState<{ x: number, y: number, tile: SITFullTile, cell: SITCell } | null>(null);
  // const [time, setTime] = useState(0);

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

  const path = useMemo(() => {
    console.log("Calculating paths...")
    return gameState.getPaths()
  }, [gameState]);

  const addAction = (characterIndex: number, actionId: number) => {
    console.log("Adding action", actionId)
    setGameState((oldState) => {
      const newState = oldState.clone();
      newState.characters[characterIndex].actionList.actions.push({
        id: actionId,
        global: true,
        repetitions: 1
      } as Action);
      return newState
    });

    // setGameState({ ...gameState });
    // forceUpdate();
    // setTime((oldTime) => oldTime + 1);
  };

  const clearActionList = () => {
    console.log("Clearing action list")
    setGameState((oldState) => {
      const newState = oldState.clone();
      gameState.characters[0].actionList.actions = [];
      return newState
    });
  }

  const advanceTime = () => {
    setGameState((oldState) => {
      const newState = oldState.clone();
      const nextActions = newState.getNextActions();
      const leastManaToComplete = nextActions.reduce((acc, next) => Math.min(acc, next.remainingCost), Infinity);
      newState.advanceState(leastManaToComplete);
      return newState
    });
  }

  const restartGame = () => {
    setGameState(initialState({ randomFamiliarity: false }));
  }

  const nextLoop = () => {
    setGameState((oldState) => {
      const newState = oldState.clone();
      newState.resetLoop();
      newState.characters.forEach((character, index) => {
        character.actionList.actions = oldState.characters[index].actionList.actions;
      });
      return newState
    });
  }

  const onClick = (x: number, y: number, tile: SITFullTile, cell: SITCell) => () => {
    console.log(x, y, tile);
    setSelected(old => {
      if (old?.x === x && old?.y === y) {
        return null;
      }
      return { x, y, tile, cell };
    });
  }

  return (
    <>
      <div ref={ref} className="GameContainer" >
        {/* <Canvas width={width} height={height} draw={draw} ref={canvasRef}/>
        <Draggable targetRef={canvasRef} startOffset={{ x: 500, y: 500 }} setOffsetScale={setOffsetScale}/> */}
        <svg width={width} height={height} viewBox={`${0} ${0} ${width} ${height}`} ref={svgRef}>
          <g ref={layoutRef}>
            <g id="grid">
              {gameState.tileMap.cells[0][0].map((row, y) => (
                row.map((cell, x) => {
                  return (
                    <g key={`${x}-${y}`} transform={`translate(${x * 16}, ${y * 16})`}>
                      {cell.tiles.toReversed().map((tile, i) => {
                        const options = tile.loopData.options;
                        const tileDefinition = gameState.tileMap.tileDefinitions[tile.id];
                        const id = tileDefinition.definitionLoopData.id;
                        // const fill = showUnknownEntities ? (tileDefinition.name.startsWith("Unknown") ? `fuchsia` : `url(#${id})`) : `url(#${id})`;
                        const fill = `url(#${id})`
                        const fullTile: SITFullTile = { ...tile, ...tileDefinition };
                        return (
                          <g
                            key={`${x}-${y}-${i}`}
                            transform-origin='8 8'
                            transform={`scale(${options.flippedX ? -1 : 1}, ${options.flippedY ? -1 : 1}) rotate(${options.rotate90 ? -90 : 0})`}
                            onClick={onClick(x, y, fullTile, cell)}
                          >
                            <rect
                              x={0}
                              y={0}
                              width={16}
                              height={16}
                              fill={fill}
                            />
                            {
                              showUnknownEntities && (tileDefinition.name.startsWith("Unknown")) && (
                                <rect
                                  x={0}
                                  y={0}
                                  width={16}
                                  height={16}
                                  fill={`transparent`}
                                  stroke='fuchsia'
                                />
                              )
                            }
                          </g>
                        );
                      })}
                    </g>
                  )
                })))}
            </g>
            <g style={{ pointerEvents: 'none' }}>
              {path.map((path) =>
                path.path.map((pathSegment, i) => {
                  // console.log(path, pathSegment)
                  return (
                    <g key={`character-${path.characterIndex}-pathSegment-${i}`} transform={`translate(${pathSegment.position.x * 16}, ${pathSegment.position.y * 16})`}>
                      <rect
                        x={0}
                        y={0}
                        width={16}
                        height={16}
                        fill={`url(#path-${9})`}
                      />
                    </g>
                  );
                }
                ))}
            </g>
            <g
              key={`player`}
              transform={`translate(${gameState.characters[0].position.x * 16}, ${gameState.characters[0].position.y * 16})`}

              style={{ pointerEvents: 'none' }}
            >
              <rect
                x={0}
                y={0}
                width={16}
                height={16}
                fill={`url(#hero)`}
              />
            </g>
            {
              selected && (
                <g
                  key={`selected`}
                  transform={`translate(${selected.x * 16}, ${selected.y * 16})`}
                  style={{ pointerEvents: 'none' }}>
                  <rect
                    x={0}
                    y={0}
                    width={16}
                    height={16}
                    stroke='white'
                    fill={`transparent`}
                  />
                  <g
                    transform={`translate(16, 0)`}
                    // stroke='white'
                    fill={`black`}
                  >
                    <rect x={0} y={0} width={16 * 7} height={16 * 2.5 * selected.cell.tiles.length} fill='#00000088' stroke='black' />
                    {selected.cell.tiles.map((tile, i) => {
                      const tileDefinition = gameState.tileMap.tileDefinitions[tile.id];
                      const fullTile: SITFullTile = { ...tile, ...tileDefinition };
                      return (

                        <g transform={`translate(2, ${2 + i * 36})`} key={`${selected.x}-${selected.y}-${i}`}>
                          <text x={0} y={8} fontSize={8} fill='white'>
                            {fullTile.name} - {selected.x}, {selected.y}
                          </text>
                          {
                            SitActionTypes
                              .map((actionType) => ({ actionType, cost: fullTile.cost?.[actionType]?.({ state: gameState, character: gameState.characters[0], action: { id: 0, name: "", type: actionType, data: {}, global: true, repetitions: 1 }, target: fullTile, targetPos: { i: 0, j: 0, x: selected.x, y: selected.y } }) }))
                              .filter(({ cost }) => cost !== undefined && cost !== Infinity)
                              .map(({ actionType, cost }, i) => (
                                <text key={i} x={0} y={8 + 6 + 6 * i} fontSize={6} fill='white'>
                                  {actionType}: {cost} ({fullTile.persistentData.familiarity[actionType] ?? 0} familiarity, lvl {getFamiliarityLevel(fullTile.persistentData.familiarity[actionType] ?? 0)})
                                </text>
                              ))
                          }
                        </g>
                      )
                    })}
                  </g>
                </g>
              )
            }
          </g>
          <Draggable targetRef={svgRef} startOffset={{ x: -2666, y: -2327 }} startScale={337.5} setOffsetScale={({ offset, scale }) => {
            if (!layoutRef.current) {
              return;
            }
            layoutRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale}%)`;
          }} />
          <SVGDefs />
        </svg>
        {/* <div className='InterfaceContainer'> */}
        <div className='DataContainer'>
          <div>
            {`Mana: ${gameState.loopData.mana.current} / ${gameState.loopData.mana.max}`}
          </div>
          <div>
            {JSON.stringify(gameState.loopData, null, 2)}
          </div>
          <div>
            {JSON.stringify(gameState.persistentData, null, 2)}
          </div>
          <div>
            {JSON.stringify(gameState.characters[0].actionList, null, 2)}
          </div>
        </div>
        <div className='ActionListEditorContainer'>
          <div className='ActionListButtons'>
            {
              Object.entries(gameState.possibleActions ?? {}).map(([id, action], i) => (
                <button key={i} onClick={() => addAction(0, parseInt(id))}>{action.name}</button>
              ))
            }
            <button onClick={() => clearActionList()}>Clear list</button>
            <button onClick={() => restartGame()}>Restart Game</button>
            <button onClick={() => nextLoop()}>Next Loop</button>
            <button onClick={() => advanceTime()}>Advance Time</button>
          </div>
          <div className='ActionListContainer'>
            <ul>
              {path[0].path.map((pathSegment, i) => {
                return <div key={i}>
                  {pathSegment.actionName} - ({pathSegment.position.x}, {pathSegment.position.y}) - {pathSegment.actionCost} ({pathSegment.totalCost})
                    
                  </div>
              })}
            </ul>
          </div>
        </div>
        {/* </div> */}

      </div>
    </>
  )
}

//441
//481

//268435897
//268435937
export default Game
