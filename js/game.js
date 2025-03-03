// Core game logic

class HuarongGame {
    constructor() {
        // DOM elements
        this.boardElement = document.getElementById('board');
        this.moveCounterElement = document.getElementById('moveCounter');
        this.resetBtn = document.getElementById('resetBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.getHintBtn = document.getElementById('getHintBtn');
        this.aiThinking = document.getElementById('aiThinking');
        this.aiMoves = document.getElementById('aiMoves');
        this.moveHistory = document.getElementById('moveHistory');
        
        // Game state
        this.moves = 0;
        this.moveHistoryList = [];
        
        // Initialize managers
        this.blockManager = new BlockManager(this.boardElement);
        this.ai = new GameAI(this.blockManager);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    // Initialize the game
    initializeGame() {
        // Clear the board and reset game state
        this.blockManager.clearBoard();
        
        // Reset game state
        this.moves = 0;
        this.moveHistoryList = [];
        this.moveCounterElement.textContent = '0';
        if (this.moveHistory) {
            this.moveHistory.innerHTML = '';
        }
        
        // Initialize blocks
        this.blockManager.initializeBlocks();
        
        // Update AI suggestion
        this.updateAISuggestion();
    }
    
    // Set up event listeners for the game
    setupEventListeners() {
        // Board click event for moving blocks
        this.boardElement.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.initializeGame());
        }
        
        // Hint button
        if (this.hintBtn) {
            this.hintBtn.addEventListener('click', () => this.showHint());
        }
        
        // Get AI hint button
        if (this.getHintBtn) {
            this.getHintBtn.addEventListener('click', () => this.updateAISuggestion(true));
        }
        
        // Start game button
        const startGameBtn = document.getElementById('startGame');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                document.getElementById('instructions').style.display = 'none';
                this.initializeGame();
            });
        }
    }
    
    // Handle board click events
    handleBoardClick(e) {
        if (!this.blockManager.selectedBlock) return;
        
        // Calculate grid position from click
        const rect = this.boardElement.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / UNIT_SIZE);
        const y = Math.floor((e.clientY - rect.top) / UNIT_SIZE);
        
        console.log(`Clicked at grid position: (${x}, ${y})`);
        
        // Try to move in the direction of the click
        this.tryMoveBlockTowards(x, y);
    }
    
    // Try to move the selected block towards a target position
    tryMoveBlockTowards(targetX, targetY) {
        if (!this.blockManager.selectedBlock) return;
        
        const block = this.blockManager.selectedBlock;
        const blockRight = block.x + block.width - 1;
        const blockBottom = block.y + block.height - 1;
        
        // Check all directions
        for (const dir of DIRECTIONS) {
            const newX = block.x + dir.dx;
            const newY = block.y + dir.dy;
            
            let shouldTryMove = false;
            
            // Check if target is in the direction we're testing
            if (dir.dx > 0 && targetX > blockRight) shouldTryMove = true;  // Target is to the right
            if (dir.dx < 0 && targetX < block.x) shouldTryMove = true;     // Target is to the left
            if (dir.dy > 0 && targetY > blockBottom) shouldTryMove = true; // Target is below
            if (dir.dy < 0 && targetY < block.y) shouldTryMove = true;     // Target is above
            
            if (shouldTryMove && this.blockManager.isValidMove(block, newX, newY)) {
                console.log(`Moving ${block.name} to (${newX}, ${newY})`);
                this.moveBlock(block, newX, newY);
                return true;
            }
        }
        
        console.log("No valid move found in that direction");
        return false;
    }
    
    // Handle keyboard press events
    handleKeyPress(e) {
        if (!this.blockManager.selectedBlock) return;
        
        let newX = this.blockManager.selectedBlock.x;
        let newY = this.blockManager.selectedBlock.y;
        
        switch (e.key) {
            case 'ArrowRight':
                newX += 1;
                break;
            case 'ArrowLeft':
                newX -= 1;
                break;
            case 'ArrowDown':
                newY += 1;
                break;
            case 'ArrowUp':
                newY -= 1;
                break;
            default:
                return;
        }
        
        if (this.blockManager.isValidMove(this.blockManager.selectedBlock, newX, newY)) {
            this.moveBlock(this.blockManager.selectedBlock, newX, newY);
        }
    }
    
    // Move a block and update game state
    moveBlock(block, newX, newY) {
        // Move the block
        const moveInfo = this.blockManager.moveBlock(block, newX, newY);
        
        // Add to move history
        const moveDesc = `${this.moves + 1}. ${block.name} ${moveInfo.direction}`;
        this.moveHistoryList.push(moveDesc);
        
        if (this.moveHistory) {
            const moveEntry = document.createElement('p');
            moveEntry.textContent = moveDesc;
            this.moveHistory.appendChild(moveEntry);
            this.moveHistory.scrollTop = this.moveHistory.scrollHeight;
        }
        
        // Update moves counter
        this.moves++;
        this.moveCounterElement.textContent = this.moves;
        
        // Update AI suggestion after move
        this.updateAISuggestion();
        
        // Reset selection after move
        block.element.classList.remove('selected');
        this.blockManager.selectedBlock = null;
        
        // Check if Cao Cao has reached the exit
        this.checkWin();
    }
    
    // Check if the game has been won
    checkWin() {
        const caocao = this.blockManager.blocks.find(block => block.id === 'caocao');
        if (caocao.x === 1 && caocao.y === 3) {
            setTimeout(() => {
                const winDiv = document.createElement('div');
                winDiv.style.position = 'absolute';
                winDiv.style.top = '50%';
                winDiv.style.left = '50%';
                winDiv.style.transform = 'translate(-50%, -50%)';
                winDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
                winDiv.style.color = 'white';
                winDiv.style.padding = '20px';
                winDiv.style.borderRadius = '10px';
                winDiv.style.zIndex = '100';
                winDiv.style.textAlign = 'center';
                winDiv.innerHTML = `
                    <h2>恭喜！</h2>
                    <p>你用了 ${this.moves} 步完成了华容道！</p>
                    <button id="playAgain" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">再玩一次</button>
                `;
                this.boardElement.appendChild(winDiv);
                
                document.getElementById('playAgain').addEventListener('click', () => {
                    this.boardElement.removeChild(winDiv);
                    this.initializeGame();
                });
            }, 300);
        }
    }
    
    // Show a hint to the player
    showHint() {
        const hintDiv = document.createElement('div');
        hintDiv.style.position = 'absolute';
        hintDiv.style.top = '50%';
        hintDiv.style.left = '50%';
        hintDiv.style.transform = 'translate(-50%, -50%)';
        hintDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        hintDiv.style.color = 'white';
        hintDiv.style.padding = '20px';
        hintDiv.style.borderRadius = '10px';
        hintDiv.style.zIndex = '100';
        hintDiv.style.textAlign = 'center';
        hintDiv.innerHTML = `
            <h3>游戏提示</h3>
            <p>目标是让曹操（红色大方块）移动到最下方的出口。</p>
            <p>你需要滑动其他块来为曹操让路。</p>
            <p>尝试先把两个小卒移开，为大块腾出空间。</p>
            <button id="closeHint" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">关闭提示</button>
        `;
        this.boardElement.appendChild(hintDiv);
        
        document.getElementById('closeHint').addEventListener('click', () => {
            this.boardElement.removeChild(hintDiv);
        });
    }
    
    // Update AI suggestion
    updateAISuggestion(forceUpdate = false) {
        if (!this.aiThinking || !this.aiMoves) return;
        
        // Show thinking animation
        this.aiThinking.style.display = 'flex';
        this.aiThinking.innerHTML = '<div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div><span>AI 正在分析最优路径...</span>';
        this.aiMoves.style.display = 'none';
        
        // Use setTimeout to create a small delay to show the thinking animation
        setTimeout(() => {
            const startTime = performance.now();
            const validMoves = this.ai.updateSuggestion(forceUpdate);
            const endTime = performance.now();
            const calcTime = Math.round(endTime - startTime);
            
            // Generate suggestions
            this.aiThinking.style.display = 'none';
            this.aiMoves.style.display = 'block';
            this.aiMoves.innerHTML = '';
            
            if (validMoves.length === 0) {
                this.aiMoves.innerHTML = '<p>当前没有可行的移动。</p>';
                return;
            }
            
            // Display suggestions header
            const header = document.createElement('div');
            
            // Add solution status if available
            if (this.ai.solution && this.ai.solution.length > 0 && this.ai.currentStateIndex !== -1) {
                const remainingMoves = this.ai.solution.length - this.ai.currentStateIndex - 1;
                header.innerHTML = `
                    <h4 style="margin-top: 0;">推荐操作顺序 (已找到解法)</h4>
                    <div class="solution-progress">
                        <span>距离目标还需 <strong>${remainingMoves}</strong> 步</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, (this.ai.currentStateIndex / (this.ai.solution.length - 1)) * 100)}%"></div>
                        </div>
                    </div>
                `;
            } else {
                header.innerHTML = '<h4 style="margin-top: 0;">推荐操作</h4>';
            }
            
            this.aiMoves.appendChild(header);
            
            // Show calculation time for debugging
            if (calcTime > 100) {
                const calcTimeDiv = document.createElement('div');
                calcTimeDiv.className = 'calc-time';
                calcTimeDiv.textContent = `计算用时: ${calcTime}ms`;
                this.aiMoves.appendChild(calcTimeDiv);
            }
            
            // Get sequence of moves from solution path
            const moveSequence = this.ai.getNextMovesSequence();
            
            if (moveSequence.length > 0) {
                // Display sequence of moves from solution
                const sequenceContainer = document.createElement('div');
                sequenceContainer.className = 'move-sequence';
                
                // Add sequence header
                const sequenceHeader = document.createElement('div');
                sequenceHeader.className = 'sequence-header';
                sequenceHeader.innerHTML = `
                    <h5>连续操作建议 (${moveSequence.length}步)</h5>
                    <p class="sequence-note">按顺序执行以下操作以达到最佳结果:</p>
                `;
                sequenceContainer.appendChild(sequenceHeader);
                
                // Add each move in sequence
                moveSequence.forEach((move, index) => {
                    const block = this.blockManager.blocks.find(b => b.id === move.blockId);
                    const posDesc = `位置(${block.x},${block.y})`;
                    
                    const moveElement = document.createElement('div');
                    moveElement.className = 'move-guide sequence-move';
                    
                    // Show move information
                    moveElement.innerHTML = `
                        <div class="move-step">${index + 1}</div>
                        <div class="move-details">
                            <div class="move-block-name">${move.blockName}</div>
                            <div class="move-info">
                                <span class="move-position">[${posDesc}]</span>
                                <span class="move-arrow">→</span>
                                <span class="move-direction">${move.direction}</span>
                            </div>
                        </div>
                    `;
                    
                    sequenceContainer.appendChild(moveElement);
                });
                
                this.aiMoves.appendChild(sequenceContainer);
            } else {
                // No solution found, show top 3 moves based on heuristics
                const topMoves = validMoves.slice(0, 3);
                
                const movesHeader = document.createElement('div');
                movesHeader.innerHTML = '<h5>建议移动</h5>';
                this.aiMoves.appendChild(movesHeader);
                
                // Find the block positions for the suggestions
                topMoves.forEach((move, index) => {
                    const block = this.blockManager.blocks.find(b => b.id === move.blockId);
                    const posDesc = `位置(${block.x},${block.y})`;
                    
                    const moveElement = document.createElement('div');
                    moveElement.className = 'move-guide';
                    
                    // Show move information
                    moveElement.innerHTML = `
                        <span class="suggested-move">${index + 1}</span>
                        <span>${move.blockName}</span>
                        <span class="move-position">[${posDesc}]</span>
                        <span class="move-arrow">→</span>
                        <span>${move.direction}</span>
                    `;
                    this.aiMoves.appendChild(moveElement);
                });
            }
        }, 500);
    }
} 