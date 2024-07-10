# Loop framework

## What is this?
This is a framework for creating loop games.

### What is a loop game?
A loop game is a game where a character (or maybe multiple characters) interacts with the world, following a list of predefined actions, or instructions. Once the list is complete, or the character runs out of resources to continue the loop, the loop ands, and the next loop starts, either with more knowledge about the world, or (more commonly) buffs to make the actions easier, so they can progress further into the game.

### What are some exmples of loop games?
Games listed in chronological order
* [Idle loops](http://stopsign.github.io/idleLoops/) 

Originally created by StopSign. There are many other versions of the game, with expanded content, like the [Omsi version](https://omsi6.github.io/loops/), and the [Lloyd version](https://lloyd-delacroix.github.io/omsi-loops/) (which is itself based on the Omsi version)

The first loop game, and the one that inspired the rest. In it, the character reverts back in time once they run out of mana, but they keep knowledge of the world, what actions are worth it, and faster stat increase for the next loops, which make actions cheaper.

* [Cavernous](https://nucaranlaeg.github.io/incremental/Cavernous/)
* [Cavernous II](https://nucaranlaeg.github.io/incremental/CavernousII/)

The first loop game with a 2D map. In it, the character reverts back in time once they run out of mana, but any mana they have gathered is kept, so next loops can get further, to gather even more mana.

* [Stuck in time](https://store.steampowered.com/app/1814010/Stuck_In_Time/)

Originally named Loop Hero, the first loop game that looks like a normal game, with graphics, music, and a story. In it, the character reverts back in time once they run out of mana (I'm seeing a trend here), but they keep knowledge of the world, and familiarity doing actions, which make the actions cheaper the next time they are performed.

This is the game that inspired me to create this framework.

## How does the framework work?
In the framework, you define multiple things:
* Actions (which will be what the caracter(s) can do)
* Map (which will be the world the character(s) will interact with, costs, and consequences)
* Character(s) (which will be the character(s) that will perform the actions)
* Global things.

First, we need to speak about persistent data, and volatile data, called loop data here. A lot of different things in this framework can have game data. This data is divided into two categories: persistent data, and loop data. Persistent data is data that is kept between loops, and loop data is data that is reset every loop. Persistent data is also the only data that is stored in the savefile, while loop data gets reset every time.

Then, we will speak about the actions, and how are they resolved. Each action has a cost (which depends on the action itself, what the action is acting on, and the character itself performing the action). Each time the game is progressed, each character will get progress in their action by how much the game was advanced. Once the progress equals the cost of the action, the action is resolved, and the character that completed the action will start with the next action in the list.

Each action has three steps it goes through:
* Start: Triggered when the action is started, and no progress has been made yet.
* Progress: Triggered every time the action is being progressed. It also triggers when the action finishes, so it will be called at least once.
* Complete: Triggered when the action is finished, and the progress equals the cost.

Next, the map. The map is a 4D grid, with axis called j, i, y, and x, respectively. You probably will not need all of them, so just put every layer you dont need as a fixed index of 0. Each cell in the 4D grid contains an array of tiles, and each tile contains its own information.

Each tile has a lot of configurations that can be set-up.
* Enabled: If the tile is not enabled, it will be ignored by the game.
* Cost: Per-action. The cost of the tile. If a cost is not defined, then the action cannot be performed on that tile, and the next tile on the list will be checked. The first cost that is defined will be the one used, and the defining tile will be the target of the action.
* Normal callbacks: Per-action. Callbacks that will be triggered on each of the three steps of the action being performed, but only for the tile that is the target.
* Always callbacks: Per-action. Callbacks that will be triggered on each of the three steps of the action being performed, for all the tiles in the cell, even if they are not the target.
* Persistent data
* Loop data

Then, the characters. Each character has:
* Enabled: If the character is not enabled, it will be ignored by the game.
* Position: The position of the character in the map. This is a 4D position, with the same axis as the map.
* Actions: The list of actions the character can perform.
* Action List: The list of actions the character is currently performing, and the progress through them.
* Action List progress: The progress through the current action and through the action list.
* Default cost: Per-action. Same as tile cost, and used if none of the tiles in the cell have a cost defined.
* Default normal callbacks: Per-action. Same as tile normal callbacks, and used if the tile does not have a normal callback defined.
* Always normal callbacks: Per-action. Same as tile always callbacks, and always used.
* Default generic callbacks: One for all action types. Same as normal callbacks, but this are not per action.
* Always generic callbacks: One for all action types. Same as always callbacks, but this are not per action.
* Persistent data
* Loop data

Finally, the global things. This is a list of things that are not related to any specific character or tile. These are:
* Initializer function: A function that is called when the game is started, and is used to set-up the game. This is called BEFORE the persistent data is loaded, and should setup the rest of the state as if there was no previous state.
* onDataLoad function: A function that is called after the persistent data is loaded, and should be loaded to modify anything that is calculated from the persistent data.
* onLoopEnd function: A function that is called after the loop ends, before the persistent data is extracted.
* Global actions: The list of actions that can be performed by any character.
* Default cost: Per-action. Same as character default cost, and used if none of the tiles in the cell have a cost defined, and the character also does not have one. If no cost is defined here, then the action cannot be performed on that cell.
* Default normal callbacks: Per-action. Same as character default normal callbacks, and used if the tile does not have a normal callback defined, and the character also does not have one.
* Always normal callbacks: Per-action. Same as character always normal callbacks, and always used.
* Default generic callbacks: One for all action types. Same as normal callbacks, but this are not per action.
* Always generic callbacks: One for all action types. Same as always callbacks, but this are not per action.
* Persistent data
* Loop data

## How is this all used by the framework?

Lets see a simple example of a few ticks of a game.
First, lets define the map. In this example, it will contain a two cells, situated at 0,0,0,0 and 0,0,0,1 with a single tile each.
There will be a single character, situated at 0,0,0,0, with a single action with key "move" in its action list.

The first step that will happen is that the initializer function will be called. and that will set-up all the rest of the game.

We have no data to load, so the onDataLoad function will be skipped.

The controller, outside the framework, will ask the game to progress by 1.

The game will check the only character's action cost for the current action. To do that, it will check the tiles at the cell 0,0,0,0, and try to call the cost function associated with the action "move" of the only tile in the cell. In this case, the cost function will return 2.5. As we already have a cost, no other tiles, player or global costs will be checked.

As the current progress through the action is 0, first, the onStartAction for the "move" action will be called for the tile. As that does not exist, the ones for the character and global will be attempted, but none of those exist. Then, the generic onStartAction for the player, and the generic onStartAction for the game will be attempted. The same will be attempted for the onAlwaysStartAction and the generic variants.

Then, the progress will be increased by 1.

Next, the onProgressAction for the "move" action will be called for the tile. As that does not exist, the ones for the character and global will be attempted, but none of those exist. Then generic onProgressAction, normal onAlwaysProgressAction, and generic onAlwaysProgressAction.

As the action has not been completed, there is nothing else to do, so the game will return, notifying the controller that the game has progressed by 1, but is not yet complete.

Quicker now

The controller will ask the game to progress by 1 again.

The cost is checked again, and the cost is still 2.5.

No onStart, because the action has already started.

The progress will be increased by 1 again.

The onProgress and onAlwaysProgress will be called again.

Game returns again.

The controller will ask the game to progress by 1 again.

The cost is checked again, and the cost is still 2.5.

Because the progress would overshoot the cost, the game will advance by 0.5, then 0.5 again.

The onProgress and onAlwaysProgress will be called again.

The onComplete for the "move" action will be called for the tile. As that does not exist, the ones for the character and global will be attempted. In this case, the global onComplete exists, and calling it will change the position of the character to 0,0,0,1. Because one of the variant was called, the next ones (the generic ones) will not be attempted. The onAlwaysComplete and the generic variants are still called.

The game will check if the character has any more actions to perform, to attempt to advance the remaining 0.5.

The character has no more actions, so the game will return, notifying the controller that the game has progressed by 0.5, and the cause of returning is no more actions in the queue for at least one character.


## How do I actually use this?

Lets see some examples by implementing features of the games mentioned above.
TODO: Add code examples.

### Reducing mana when advancing time

Define a mana variable in the global persistent data.

Then, simply define a generic global onProgressAction that reduces the available mana by the progress.

If at any point the mana is less than 0, then throw an error to notify the need to restart TODO: define those errors.

This can also be done at the character level.

### Moving the character

We already saw this in the example above. 

Position is already tracked by default, so simply define a move action and set the global onCompleteAction for move to change the position of the character.

### Keeping knowledge of the world (Idle loops)

The discovery is shown per zone, so it could be a tile property. Or, because there are not too many of them, it could be a global property.

Then, simply define an onCompleteAction for the tiles where discovery is progressed for the actions that increase them (like wander), which modifies the value.

### Keeping mana between loops (Cavernous and Stuck in time)

The discovery is per tile, so simply define a global onCompleteAction for the move action that sets the moved-to tile as discovered. Then, in the case of Stuck in time, do the same for nearby tiles with whatever dark magic formula is used there.