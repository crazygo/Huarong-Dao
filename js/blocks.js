// Block management module

class BlockManager {
    constructor(boardElement) {
        this.board = boardElement;
        this.blocks = [];
        this.emptySpaces = [];
        this.selectedBlock = null;
    }

    // Initialize blocks based on configuration
    initializeBlocks() {
        this.blocks = [];
        this.emptySpaces = [];
        
        // Find empty spaces
        let occupied = Array(GRID_WIDTH * GRID_HEIGHT).fill(false);
        initialBlocks.forEach(block => {
            for (let y = block.y; y < block.y + block.height; y++) {
                for (let x = block.x; x < block.x + block.width; x++) {
                    occupied[y * GRID_WIDTH + x] = true;
                }
            }
        });
        
        for (let i = 0; i < occupied.length; i++) {
            if (!occupied[i]) {
                let x = i % GRID_WIDTH;
                let y = Math.floor(i / GRID_WIDTH);
                this.emptySpaces.push({ x, y });
            }
        }
        
        // Create blocks
        initialBlocks.forEach(blockInfo => {
            this.createBlock(blockInfo);
        });
    }

    // Create a block on the board
    createBlock(blockInfo) {
        const block = document.createElement('div');
        block.className = 'block';
        block.id = blockInfo.id;
        block.style.width = (blockInfo.width * UNIT_SIZE) + 'px';
        block.style.height = (blockInfo.height * UNIT_SIZE) + 'px';
        block.style.backgroundColor = blockInfo.color;
        block.style.left = (blockInfo.x * UNIT_SIZE) + 'px';
        block.style.top = (blockInfo.y * UNIT_SIZE) + 'px';
        block.textContent = blockInfo.name;
        
        // Store block data
        const blockData = {
            element: block,
            id: blockInfo.id,
            name: blockInfo.name,
            width: blockInfo.width,
            height: blockInfo.height,
            x: blockInfo.x,
            y: blockInfo.y,
            color: blockInfo.color
        };
        
        this.blocks.push(blockData);
        
        // Add event listeners
        block.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from reaching the board
            
            // Deselect previous block if any
            if (this.selectedBlock) {
                this.selectedBlock.element.classList.remove('selected');
            }
            
            // If clicking the same block, deselect it
            if (this.selectedBlock === blockData) {
                this.selectedBlock = null;
                return;
            }
            
            // Select this block
            this.selectedBlock = blockData;
            // Highlight selected block
            block.classList.add('selected');
            
            console.log(`Selected block: ${blockData.name}`);
        });
        
        this.board.appendChild(block);
    }

    // Check if a move is valid
    isValidMove(block, newX, newY) {
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
                    for (let empty of this.emptySpaces) {
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

    // Move a block to a new position
    moveBlock(block, newX, newY) {
        // Update empty spaces
        for (let y = block.y; y < block.y + block.height; y++) {
            for (let x = block.x; x < block.x + block.width; x++) {
                this.emptySpaces.push({ x, y });
            }
        }
        
        // Remove new position from empty spaces
        this.emptySpaces = this.emptySpaces.filter(space => {
            return !(space.x >= newX && space.x < newX + block.width && 
                    space.y >= newY && space.y < newY + block.height);
        });
        
        // Determine direction
        let direction = "";
        if (newY < block.y) direction = "上";
        else if (newY > block.y) direction = "下";
        else if (newX < block.x) direction = "左";
        else if (newX > block.x) direction = "右";
        
        // Store the move information to be used by the Game class
        const moveInfo = {
            block: block,
            direction: direction,
            fromX: block.x,
            fromY: block.y,
            toX: newX,
            toY: newY
        };
        
        // Update block position
        block.x = newX;
        block.y = newY;
        block.element.style.left = (newX * UNIT_SIZE) + 'px';
        block.element.style.top = (newY * UNIT_SIZE) + 'px';
        
        // Return move info to be used by the game
        return moveInfo;
    }

    // Find all possible valid moves
    findAllValidMoves() {
        const validMoves = [];
        
        // For each block
        this.blocks.forEach(block => {
            // Try all four directions
            DIRECTIONS.forEach(dir => {
                const newX = block.x + dir.dx;
                const newY = block.y + dir.dy;
                
                if (this.isValidMove(block, newX, newY)) {
                    validMoves.push({
                        blockId: block.id,
                        blockName: block.name,
                        direction: dir.name,
                        newX: newX,
                        newY: newY,
                        priority: 0 // Will be calculated later
                    });
                }
            });
        });
        
        return validMoves;
    }

    // Clear board and reset blocks
    clearBoard() {
        // Clear the board except for the exit
        const exit = this.board.querySelector('.exit');
        while (this.board.firstChild) {
            this.board.removeChild(this.board.firstChild);
        }
        if (exit) {
            this.board.appendChild(exit);
        } else {
            // Create exit if it doesn't exist
            const exitDiv = document.createElement('div');
            exitDiv.className = 'exit';
            this.board.appendChild(exitDiv);
        }
    }
} 