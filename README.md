# Royal Solitaire

A polished browser-based card game built with HTML, CSS, and JavaScript.

## Overview

`Royal Solitaire` is a simple turn-based card game that supports:

- Single-player mode: player vs computer
- Two-player mode: pass-and-play between two human players
- Card draw, discard, shuffle, and claim actions
- Winning hand detection and scoring
- Animated deal and discard effects with a rich casino-style UI

## Rules

### Game Setup

- Each player receives 3 cards at the start of the game.
- A standard 52-card deck is used.
- The deck is shuffled and displayed as the deck pile.

### Turn Flow

- On your turn, you can draw one card from the deck.
- After drawing, you must discard one card from your hand to return to the deck.
- The discarded card is randomly inserted back into the deck.
- Once the discard is complete, the turn passes to the next player.
- You may also shuffle the deck once per turn.
- If you do not want to draw, you may press `Pass Turn`.

### Claiming a Win

A player may attempt a claim if they have at least 3 cards in hand.

Valid winning 3-card combinations:

- `Three of a Kind` (any rank): 100 points
- `Three Aces`: 150 points (bonus win)
- `Royal Hand` (J, Q, K in any suit combination): 100 points
- `Straight` (three consecutive ranks, e.g. 5-6-7): 100 points

When a winning hand is detected after discarding, a prompt appears to claim victory.

### Computer AI

- The computer checks for a win before drawing.
- If no win exists, it draws a card, then discards the least valuable card.
- If the computer forms a winning hand after discarding, it claims automatically.

### End of Game

- After a successful claim, the score is awarded and the hands are redealt.
- At any point, players may end the game to display the final scoreboard.
- The higher score wins.

## Files

- `index.html` — HTML structure and game interface
- `style.css` — styling, animations, layout, responsive design
- `script.js` — game logic, interaction handlers, rendering, AI behavior

## Main Functions

### `selectMode(mode)`
Switches between single-player and two-player mode, updating the UI.

### `startGame()`
Initializes player data, resets the state, hides the overlay, and begins the deal animation.

### `initDeck()`
Builds a 52-card deck and shuffles it.

### `animateDeal()`
Deals cards to both players with flying card animation.

### `renderAll()`
Renders both players' hands, updates HUD values, and refreshes the deck state.

### `drawCard()`
Draws one card from the deck for the current player and enters discard mode.

### `discardCard(playerIdx, cardIdx)`
Discards a selected card back into the deck and checks for win conditions.

### `checkWin(hand)`
Inspect a hand for valid winning combinations of 3 cards.

### `attemptClaim()`
Allows a player to claim victory if a valid win exists.

### `computerTurn()`
Manages the AI turn sequence for the computer opponent.

### `shuffleDeck()`
Permits one shuffle per turn and provides visual feedback.

### `showScoreboard()`
Displays the final scores and winner at game end.

## Usage

1. Open `index.html` in your browser.
2. Choose a game mode.
3. Enter player names.
4. Press `Deal Cards` to start.
5. Use the buttons or keyboard shortcuts:
   - `D` to draw
   - `P` to pass
   - `C` to claim
   - `S` to shuffle

## Hosting on GitHub Pages

To host this project on GitHub Pages:

1. Create a GitHub repository named `ModernSollitare`.
2. Push this project to the repository.
3. Enable GitHub Pages from the repository settings.
4. Your hosted link will be:

`https://<your-github-username>.github.io/ModernSollitare`

Currently it is hosted and reference link is :: 
> Hosted link: `https://Dhannussh1.github.io/ModernSollitare`

