# Copilot Instructions for Festival2

## Project Overview
Festival2 is an agent-based music festival simulation using HTML5 canvas and JavaScript.

## Code Organization
- **HTML**: `index.html` - Main entry point, minimal structure
- **CSS**: `css/styles.css` - All styling separated for browser caching
- **JavaScript**: Modular components in `js/` directory
  - `js/Agent.js` - Agent class representing festival attendees
  - `js/Simulation.js` - Simulation class managing the simulation loop
  - `js/main.js` - Application initialization and UI controls
- **Tests**: `tests/` directory - All test files

## Testing Requirements
This project has **strict test coverage requirements**:
- **80% line coverage** minimum across every source file
- **100% branch coverage** required across every source file
- No changes will be merged without meeting these requirements
- Use Jest for testing framework
- Mock DOM elements and canvas context as needed
- Test all branches (if/else, switch cases, ternary operators, etc.)

## Code Style
- Use ES6 classes and modules
- Frame-independent movement using deltaTime calculations
- Keep components small and focused
- Separate concerns (rendering, logic, state management)

## Development Guidelines
1. Always write tests before or alongside code changes
2. Run tests locally to verify coverage: `npm test -- --coverage`
3. Keep CSS separate from HTML for performance
4. Keep JavaScript modular for easier maintenance
5. Use meaningful variable and function names
6. Document complex logic with comments

## Screenshot Guidelines
**Important:** When including screenshots in PR comments or replies:
- Use screenshot URLs provided in the conversation context
- The conversation context provides pre-uploaded GitHub CDN URLs (github.com/user-attachments/assets/)
- Reference these URLs directly: `<img src="URL">`
- Do NOT use locally saved playwright screenshots as they won't display in comments
- The syntax (HTML vs Markdown) doesn't matter - the key is using conversation-provided URLs

## Testing Best Practices
- Test each class method individually
- Test edge cases and boundary conditions
- Test all conditional branches
- Mock external dependencies (canvas, DOM)
- Use descriptive test names
- Group related tests with describe blocks

## Performance Considerations
- External CSS files allow browser caching
- Modular JS enables code splitting if needed
- Frame-independent movement ensures consistent behavior
