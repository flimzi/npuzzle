import random
import heapq
import math
import sys
from collections import defaultdict, deque, Counter
from itertools import combinations


class Problem(object):
    """The abstract class for a formal problem. A new domain subclasses this,
    overriding `actions` and `results`, and perhaps other methods.
    The default heuristic is 0 and the default action cost is 1 for all states.
    When yiou create an instance of a subclass, specify `initial`, and `goal` states 
    (or give an `is_goal` method) and perhaps other keyword args for the subclass."""

    def __init__(self, initial=None, goal=None, **kwds): 
        self.__dict__.update(initial=initial, goal=goal, **kwds) 
        
    def actions(self, state):        raise NotImplementedError
    def result(self, state, action): raise NotImplementedError
    def is_goal(self, state):        return state == self.goal
    def action_cost(self, s, a, s1): return 1
    def h(self, node):               return 0
    
    def __str__(self):
        return '{}({!r}, {!r})'.format(
            type(self).__name__, self.initial, self.goal)
    

class Node:
    "A Node in a search tree."
    def __init__(self, state, parent=None, action=None, path_cost=0):
        self.__dict__.update(state=state, parent=parent, action=action, path_cost=path_cost)

    def __repr__(self): return '<{}>'.format(self.state)
    def __len__(self): return 0 if self.parent is None else (1 + len(self.parent))
    def __lt__(self, other): return self.path_cost < other.path_cost
    
    
failure = Node('failure', path_cost=math.inf) # Indicates an algorithm couldn't find a solution.
cutoff  = Node('cutoff',  path_cost=math.inf) # Indicates iterative deepening search was cut off.

def expand(problem, node):
    "Expand a node, generating the children nodes."
    s = node.state
    for action in problem.actions(s):
        s1 = problem.result(s, action)
        cost = node.path_cost + problem.action_cost(s, action, s1)
        yield Node(s1, node, action, cost)
        

def path_actions(node):
    "The sequence of actions to get to this node."
    if node.parent is None:
        return []  
    return path_actions(node.parent) + [node.action]


def path_states(node):
    "The sequence of states to get to this node."
    if node in (cutoff, failure, None): 
        return []
    return path_states(node.parent) + [node.state]

def path_nodes(node):
    if node is None:
        return []
    return path_nodes(node.parent) + [node]
    
FIFOQueue = deque

LIFOQueue = list

class PriorityQueue:
    """A queue in which the item with minimum f(item) is always popped first."""

    def __init__(self, items=(), key=lambda x: x): 
        self.key = key
        self.items = [] # a heap of (score, item) pairs
        for item in items:
            self.add(item)
         
    def add(self, item):
        """Add item to the queuez."""
        pair = (self.key(item), item)
        # print(pair) # i dont really know how this works beacuse 
        heapq.heappush(self.items, pair)

    def pop(self):
        """Pop and return the item with min f(item) value."""
        return heapq.heappop(self.items)[1]
    
    def top(self): return self.items[0][1]

    def __len__(self): return len(self.items)

def best_first_search(problem, f):
    "Search nodes with minimum f(node) value first."
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached = {problem.initial: node}

    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        
        # print(list(expand(problem, node)))
        # x = 1

        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure

def g(n): return n.path_cost

def astar_search(problem, h=None):
    """Search nodes with minimum f(n) = g(n) + h(n)."""
    h = h or problem.h
    # here g is the path cost of node so i think with every node the that cost increases because it is added to the previous one
    return best_first_search(problem, f=lambda n: g(n) + h(n))

class EightPuzzle(Problem):
    """ The problem of sliding tiles numbered from 1 to 8 on a 3x3 board,
    where one of the squares is a blank, trying to reach a goal configuration.
    A board state is represented as a tuple of length 9, where the element at index i 
    represents the tile number at index i, or 0 if for the empty square, e.g. the goal:
        1 2 3
        4 5 6 ==> (1, 2, 3, 4, 5, 6, 7, 8, 0)
        7 8 _
    """

    # generally speaking here we should actually take width and height
    # make a tuple or whatever of ints width * height long from 0 to n
    # and initial should be provided by the code itself so that no discrepancies can exist
    # but we will also allow for specifying initial for ease of use and test
    def __init__(self, width, height, initial, goal):
        # these asserts should be search failure states in final product
        assert len(initial) == len(goal) == width * height
        assert sorted(initial) == sorted(goal)
        assert initial.count(0) == 1
        assert inversions(initial) % 2 == inversions(goal) % 2 # Parity check
        self.width, self.height = width, height
        self.initial, self.goal = initial, goal
    
    def actions(self, state):
        """The indexes of the squares that the blank can move to."""
        blank = state.index(0)
        x = blank % self.width
        y = blank // self.width
        adjacent = []

        if x > 0:
            adjacent.append(blank - 1)
        
        if x < self.width - 1:
            adjacent.append(blank + 1)

        if y > 0:
            adjacent.append(blank - self.width)

        if y < self.height - 1:
            adjacent.append(blank + self.width)

        return tuple(sorted(adjacent))
    
    def result(self, state, action):
        """Swap the blank with the square numbered `action`."""
        s = list(state)
        blank = state.index(0)
        s[action], s[blank] = s[blank], s[action]
        return tuple(s)
    
    def h1(self, node):
        """The misplaced tiles heuristic."""
        return hamming_distance(node.state, self.goal)
    
    def h2(self, node):
        """The Manhattan heuristic."""
        return calculate_manhattan_distance(self.width, self.height, node.state, self.goal)
    
    def h(self, node): return self.h2(node)
    

def manhattan_distance(tile, current_position, goal_position):
    """
    Calculate Manhattan distance for a single tile.
    """
    x1, y1 = current_position
    x2, y2 = goal_position[tile]
    return abs(x1 - x2) + abs(y1 - y2)

# this basically needs to for every (x, y) in initial add up their distance from the same value in goal
# which is pretty straighforward as proven by the code in npuzzle-master/heuristics.py
# i just need to make sure it works for uneven width and height
# but the problem may also be in the actions method which i rewrote
def calculate_manhattan_distance(width, height, initial, goal):
    """
    Calculate the total Manhattan distance between the current state and the goal state.
    
    Args:
        state (tuple): Current state of the puzzle.
        goal_state (tuple): Goal state of the puzzle.
        width (int): Width of the puzzle.
        height (int): Height of the puzzle.
        
    Returns:
        int: Total Manhattan distance.
    """
    total_distance = 0
    for i in range(height):
        for j in range(width):
            value = initial[i * width + j]
            if value != 0:  # Ignore the blank tile
                goal_i, goal_j = divmod(goal.index(value), width)
                total_distance += abs(i - goal_i) + abs(j - goal_j)
    return total_distance

def hamming_distance(A, B):
    "Number of positions where vectors A and B are different."
    return sum(a != b for a, b in zip(A, B))
    
def inversions(board):
    "The number of times a piece is a smaller number than a following piece."
    return sum((a > b and a != 0 and b != 0) for (a, b) in combinations(board, 2))
    
    
def board8(board, width, height):
    "A string representing an 8-puzzle board"
    if board == "failure":
        return "failure"

    fmt = height * (width * '{} ' + '\n')
    return fmt.format(*board).replace('0', '_')

# e1 = EightPuzzle((1, 4, 2, 0, 7, 5, 3, 6, 8))
# e2 = EightPuzzle((1, 2, 3, 4, 5, 6, 7, 8, 0))
# e3 = EightPuzzle((4, 0, 2, 5, 1, 3, 7, 8, 6))
# e4 = EightPuzzle((7, 2, 4, 5, 0, 6, 8, 3, 1))
# e5 = EightPuzzle((8, 6, 7, 2, 5, 4, 3, 0, 1))

e1 = EightPuzzle(3, 3, (1, 4, 2, 0, 7, 5, 3, 6, 8), (0, 1, 2, 3, 4, 5, 6, 7, 8))
# e1 = EightPuzzle(2, 3, (1, 0, 2, 3, 4, 5), (0, 1, 2, 3, 4, 5))

# for e in [e1, e2, e3, e4, e5]:
#     print('-------')
#     i = 0
#     for s in path_states(astar_search(e)):
#         i += 1
#         print(str(i) + ':')
#         print(board8(s))

i = 0

for n in path_nodes(astar_search(e1)):
    i += 1
    print('step ' + str(i) + ' (cost ' + str(n.path_cost) + ', action was ' + str(n.action) + '):')
    print(board8(n.state, 3, 3))
    

# na razie moze przepiszmy to co jest do javascript zeby mozna bylo latwiej wizualizowac
# teoretycznie mozliwosc innego width od height nie przeszkadza na razie ale trzeba bedzie zrobic testy
# chociaz jezeli actions() dziala poprawnie w takim sensie że 0 nie moze wyjsc poza ramy grida to nie powinny występować niedozwolone ruchy pomiędzy stanami