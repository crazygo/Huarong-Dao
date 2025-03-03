// AI module for game suggestions

class GameAI {
    constructor(blockManager) {
        this.blockManager = blockManager;
        this.visitedStates = new Set(); // To avoid cycles in search
        this.solution = null; // Cached solution path
        this.currentStateIndex = -1; // Index in solution path
    }

    // Update AI suggestions
    updateSuggestion(forceUpdate = false) {
        // Get current board state
        const currentState = this.getBoardState();
        
        // Calculate solution if we don't have one or if forced update is requested
        if (!this.solution || forceUpdate || this.currentStateIndex === -1) {
            console.log("Calculating solution path...");
            this.solution = this.findSolutionPath();
            this.visitedStates.clear(); // Clear cache after finding solution
            
            // Find current state in solution
            this.currentStateIndex = this.findCurrentStateInSolution(currentState);
        } else {
            // Update our position in the solution path
            this.currentStateIndex = this.findCurrentStateInSolution(currentState);
        }
        
        // If we found a solution and know our current position
        if (this.solution && this.solution.length > 0 && this.currentStateIndex !== -1) {
            console.log(`Current state index in solution: ${this.currentStateIndex}/${this.solution.length - 1}`);
            
            // Get next move from solution path
            if (this.currentStateIndex < this.solution.length - 1) {
                const nextState = this.solution[this.currentStateIndex + 1];
                const nextMove = nextState.lastMove;
                
                // Find all possible valid moves
                const allValidMoves = this.blockManager.findAllValidMoves();
                
                // Sort moves, prioritizing the next move from solution
                allValidMoves.forEach(move => {
                    if (nextMove && 
                        move.blockId === nextMove.blockId && 
                        move.direction === nextMove.direction) {
                        move.priority = 100; // Highest priority for solution move
                    } else {
                        // Fallback to heuristic calculation for other moves
                        this.calculateMovePriority(move);
                    }
                });
                
                // Sort moves by priority (highest first)
                allValidMoves.sort((a, b) => b.priority - a.priority);
                return allValidMoves;
            }
        }
        
        // Fallback to heuristic if no solution found or at end of solution
        const validMoves = this.blockManager.findAllValidMoves();
        validMoves.forEach(move => this.calculateMovePriority(move));
        validMoves.sort((a, b) => b.priority - a.priority);
        return validMoves;
    }
    
    // Calculate move priority using heuristics
    calculateMovePriority(move) {
        // Get the Cao Cao block
        const caocao = this.blockManager.blocks.find(block => block.id === 'caocao');
        
        // Base priority
        let priority = 0;
        
        if (move.blockId === 'caocao') {
            // Cao Cao moves
            if (move.newY > caocao.y) {
                priority += 10; // Moving toward exit (down)
            } else if (move.newX === 1 && move.newY === caocao.y) {
                priority += 5; // Moving to center horizontally
            } else {
                priority += 2; // Other Cao Cao moves
            }
        } else {
            // Other blocks
            const block = this.blockManager.blocks.find(b => b.id === move.blockId);
            
            // Check if block is in Cao Cao's path to exit
            const isBlockingCaoCao = (caocao.y < 3) && (block.y > caocao.y) && 
                ((block.x <= 1 && block.x + block.width > 1) || 
                (block.x <= 2 && block.x + block.width > 2));
            
            if (isBlockingCaoCao) {
                // Moving a blocking piece is good
                if ((move.newY < block.y) || // Moving up
                    (move.newX >= 3 || move.newX + block.width <= 1)) { // Moving out of way horizontally
                    priority += 8;
                }
            }
            
            // Prioritize moves that create space near Cao Cao
            if ((Math.abs(move.newX - caocao.x) <= 1 || Math.abs(move.newX - (caocao.x + 1)) <= 1) && 
                (Math.abs(move.newY - caocao.y) <= 1 || Math.abs(move.newY - (caocao.y + 1)) <= 1)) {
                priority += 3;
            }
        }
        
        // Avoid moving pieces back and forth
        if (this.isRepeatingMove(move)) {
            priority -= 5;
        }
        
        move.priority = priority;
    }
    
    // Check if a move seems to be repeating (going back and forth)
    isRepeatingMove(move) {
        // This would need move history tracking to implement properly
        return false;
    }
    
    // Find current state in solution path
    findCurrentStateInSolution(currentState) {
        if (!this.solution) return -1;
        
        for (let i = 0; i < this.solution.length; i++) {
            if (this.solution[i].boardState === currentState) {
                return i;
            }
        }
        
        return -1; // Not found in solution
    }
    
    // Find solution path using BFS (breadth-first search)
    findSolutionPath() {
        // Reset visited states
        this.visitedStates = new Set();
        
        // Get initial state
        const initialState = {
            boardState: this.getBoardState(),
            blocks: JSON.parse(JSON.stringify(this.blockManager.blocks)),
            emptySpaces: JSON.parse(JSON.stringify(this.blockManager.emptySpaces)),
            path: [], // List of states leading to this state
            lastMove: null // Last move that led to this state
        };
        
        // Queue for BFS
        const queue = [initialState];
        this.visitedStates.add(initialState.boardState);
        
        // Maximum number of states to explore
        const MAX_STATES = 20000; // Increased from 5000 to 20000
        let statesExplored = 0;
        
        while (queue.length > 0 && statesExplored < MAX_STATES) {
            const state = queue.shift();
            statesExplored++;
            
            // Check if this is the goal state
            const caocao = state.blocks.find(block => block.id === 'caocao');
            if (caocao.x === 1 && caocao.y === 3) {
                console.log(`Solution found in ${state.path.length} steps!`);
                return [initialState, ...state.path, state];
            }
            
            // Find all valid moves from this state
            const validMoves = [];
            state.blocks.forEach(block => {
                DIRECTIONS.forEach(dir => {
                    const newX = block.x + dir.dx;
                    const newY = block.y + dir.dy;
                    
                    // Check if move is valid using a temporary block manager
                    if (this.isValidMoveInState(state, block, newX, newY)) {
                        validMoves.push({
                            blockId: block.id,
                            blockName: block.name,
                            direction: dir.name,
                            newX: newX,
                            newY: newY
                        });
                    }
                });
            });
            
            // Prioritize moves based on heuristics to search more efficiently
            validMoves.sort((a, b) => {
                // Prioritize Cao Cao moving toward exit
                if (a.blockId === 'caocao' && a.newY > state.blocks.find(b => b.id === 'caocao').y) return -1;
                if (b.blockId === 'caocao' && b.newY > state.blocks.find(b => b.id === 'caocao').y) return 1;
                
                // Prioritize moving blocks out of Cao Cao's path
                const caocaoBlock = state.blocks.find(b => b.id === 'caocao');
                const aBlock = state.blocks.find(b => b.id === a.blockId);
                const bBlock = state.blocks.find(b => b.id === b.blockId);
                
                const aIsBlocking = aBlock.y > caocaoBlock.y && 
                    ((aBlock.x <= 1 && aBlock.x + aBlock.width > 1) || 
                    (aBlock.x <= 2 && aBlock.x + aBlock.width > 2));
                
                const bIsBlocking = bBlock && bBlock.y > caocaoBlock.y && 
                    ((bBlock.x <= 1 && bBlock.x + bBlock.width > 1) || 
                    (bBlock.x <= 2 && bBlock.x + bBlock.width > 2));
                
                if (aIsBlocking && !bIsBlocking) return -1;
                if (!aIsBlocking && bIsBlocking) return 1;
                
                return 0;
            });
            
            // Apply each move to create new states
            for (const move of validMoves) {
                // Create a new state by applying the move
                const newState = this.applyMoveToState(state, move);
                
                // Check if this state has been visited before
                if (!this.visitedStates.has(newState.boardState)) {
                    // Add to visited states
                    this.visitedStates.add(newState.boardState);
                    
                    // Add to queue
                    queue.push(newState);
                }
            }
        }
        
        console.log(`Explored ${statesExplored} states, no solution found within limit.`);
        return null; // No solution found within the limit
    }
    
    // Check if a move is valid in a given state
    isValidMoveInState(state, block, newX, newY) {
        // Check if new position is within the board
        if (newX < 0 || newY < 0 || newX + block.width > GRID_WIDTH || newY + block.height > GRID_HEIGHT) {
            return false;
        }
        
        // Check if new position conflicts with other blocks
        for (let y = newY; y < newY + block.height; y++) {
            for (let x = newX; x < newX + block.width; x++) {
                let positionEmpty = false;
                
                // Check if position is empty or is part of the current block
                if (x >= block.x && x < block.x + block.width && 
                    y >= block.y && y < block.y + block.height) {
                    positionEmpty = true;
                } else {
                    // Check if position is in emptySpaces
                    for (let empty of state.emptySpaces) {
                        if (empty.x === x && empty.y === y) {
                            positionEmpty = true;
                            break;
                        }
                    }
                }
                
                if (!positionEmpty) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Apply a move to a state and return the new state
    applyMoveToState(state, move) {
        // Deep copy the state
        const newState = {
            blocks: JSON.parse(JSON.stringify(state.blocks)),
            emptySpaces: JSON.parse(JSON.stringify(state.emptySpaces)),
            path: [...state.path, state],
            lastMove: move
        };
        
        // Find the block to move
        const blockIndex = newState.blocks.findIndex(b => b.id === move.blockId);
        const block = newState.blocks[blockIndex];
        
        // Update empty spaces
        for (let y = block.y; y < block.y + block.height; y++) {
            for (let x = block.x; x < block.x + block.width; x++) {
                newState.emptySpaces.push({ x, y });
            }
        }
        
        // Remove new position from empty spaces
        newState.emptySpaces = newState.emptySpaces.filter(space => {
            return !(space.x >= move.newX && space.x < move.newX + block.width && 
                    space.y >= move.newY && space.y < move.newY + block.height);
        });
        
        // Update block position
        block.x = move.newX;
        block.y = move.newY;
        
        // Calculate new board state
        newState.boardState = this.getBoardStateFromBlocks(newState.blocks);
        
        return newState;
    }
    
    // Get board state from a list of blocks
    getBoardStateFromBlocks(blocks) {
        // Create a 2D array of the board state
        let boardState = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(' '));
        
        // Fill in the blocks
        blocks.forEach(block => {
            const id = this.getShortId(block.id);
            for (let y = block.y; y < block.y + block.height; y++) {
                for (let x = block.x; x < block.x + block.width; x++) {
                    boardState[y][x] = id;
                }
            }
        });
        
        // Convert to string
        return boardState.map(row => row.join('')).join('');
    }
    
    // Get current board state as a string
    getBoardState() {
        return this.getBoardStateFromBlocks(this.blockManager.blocks);
    }
    
    // Get short ID for board state representation
    getShortId(id) {
        switch(id) {
            case 'caocao': return 'C';
            case 'guanyu': return 'G';
            case 'zhangfei': return 'Z';
            case 'zhaoyun': return 'Y';
            case 'huangzhong': return 'H';
            case 'machao': return 'M';
            case 'zu1': return 'Z1'; // Right-top pawn
            case 'zu2': return 'Z2'; // Left-middle pawn
            case 'zu3': return 'Z3'; // Middle-bottom pawn
            case 'zu4': return 'Z4'; // Right-bottom pawn
            default: return id[0].toUpperCase();
        }
    }
    
    // Get next moves sequence (up to 3 consecutive moves)
    getNextMovesSequence() {
        if (!this.solution || this.solution.length === 0 || this.currentStateIndex === -1) {
            return [];
        }
        
        // Get up to 3 next moves from solution path
        const moveSequence = [];
        let index = this.currentStateIndex;
        
        // Get up to 3 moves from the solution path
        while (index < this.solution.length - 1 && moveSequence.length < 3) {
            index++;
            const nextState = this.solution[index];
            if (nextState && nextState.lastMove) {
                const block = this.blockManager.blocks.find(b => b.id === nextState.lastMove.blockId);
                if (block) {
                    moveSequence.push({
                        blockId: nextState.lastMove.blockId,
                        blockName: block.name,
                        direction: nextState.lastMove.direction,
                        newX: nextState.lastMove.newX,
                        newY: nextState.lastMove.newY,
                        moveNumber: moveSequence.length + 1
                    });
                }
            }
        }
        
        return moveSequence;
    }
} 