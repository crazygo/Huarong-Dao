// Main application entry point

document.addEventListener('DOMContentLoaded', () => {
    // Show instructions at start
    const instructionsElement = document.getElementById('instructions');
    if (instructionsElement) {
        instructionsElement.style.display = 'block';
    }
    
    // Initialize the game
    const game = new HuarongGame();
    
    // If no instructions are shown, start the game immediately
    if (!instructionsElement) {
        game.initializeGame();
    }
}); 