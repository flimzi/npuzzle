# abstraction levels
 
1. the grid is going to be NxN and there is going to be a css transition on the tiles to move to other places when data changes
    data can be represented easiest by a array of ints (i think 1d array is better for algorithm but function api could also accept 2d arrays for convenience)
2. user can drag one tile to another only if the destination is a empty tile
3. user can shuffle and solve the puzzle in which case a sequence of array transformations is sent over and the animations play out

# design
would be nice to find the mockups i was doing back then i think on the old hdd

not sure what the background should be but maybe a low-opacity solved image?
the "game area" like page title and buttons would be placed on a glass panel
the background image could slowly move around zoomed in

another idea would be to construct a gradient eminating from the grid that is based on the averaged color of image and position of tiles

would be nice if the tiles were a bit 3d so that you could see their edges a bit

when solved by a computer (which i guess could be abortable), the tiles should swiftly move into place without snapping

when user drags a tile with mouse or touch there should be visible feedback that the tle is moving if pulled into the right direction and then snap into the empty tile afte some distance
and be left there upon stop dragging

there are also going to be clicks when snapping (entering a empty tile)

upon completion a nice font SOLVED! would appear in the center and ideally the letters would drop in consecutively and after a short while 
a menu would roll down with time to complete and maybe a button to continue upon of which pressing
the SOLVED! text would quickly float and fade away

simulteaonusl the grid tiles would snap together to hide the borders and it the image would
    either glisten from one top left corner to bottom right one
    or the tiles would jump upward like a wave from top left corner to bottom right

simulaneously the picture would get zoomed out a bit and pivoted in 3d slighlly

# implementation details

i could defineelty use css  to make the image the size of the gridthen use css functions to cut out the diffeent tiles and make them snap to the grid but i dont know how to do that last part yet
because moving the grid tiles directly wont work but they are going to be the base for the actual movable tiles

co jakbysmy zrobili dla piece mozliwe wartosci pozycji jakie moze przyjac czyli pozycje tiles i zrobili transform na position
wtedy mouse albo finger drag w kierunku wolnego tile by to wsunelo tam a przy shuffle wszystkie pieces by mogly byc poprawnie animowane (i guess this should work)
we need more information so i think grid and tile and piece should be classes
we need grid size and for every tile and piece we need at least the row and column index
the indexes would facilitate moving pieces to other tiles on the grid (for shuffling just one index would suffice but for user interaction)
we need a quick way to find out to which tile the movement is headed

shuffling should eventually be a algorithm that indefinetely makes random legal moves until stopped
also when doing the random flying shuffle we need to make sure the resulting state is actually solvable

eventually if we need more accurate feedback the user draggin mechanism should be a freely moving piece from one tile to the next and physics based somehow with the movement inertia?