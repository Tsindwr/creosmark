/**
 * Command Manager Service
 * Implements the Command Pattern for undo functionality on character sheet
 * 
 * Manages a queue of commands that can be undone. The queue is cleared:
 * - On browser session refresh (not persisted)
 * - When switching to a different character
 */

/**
 * Base Command class
 */
class Command {
  /**
   * Execute the command
   */
  execute() {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Undo the command
   */
  undo() {
    throw new Error('undo() must be implemented by subclass');
  }
}

/**
 * Command for changing stress on a potential track
 */
class StressCommand extends Command {
  constructor(trackId, statName, oldValue, newValue, saveCallback) {
    super();
    this.trackId = trackId;
    this.statName = statName;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.saveCallback = saveCallback;
  }

  execute() {
    const track = document.getElementById(this.trackId);
    if (track) {
      track._isUndoing = true;
      track.setAttribute('stress', this.newValue);
      track._isUndoing = false;
      if (this.saveCallback) {
        this.saveCallback(this.statName, this.newValue, parseInt(track.getAttribute('resistance')));
      }
    }
  }

  undo() {
    const track = document.getElementById(this.trackId);
    if (track) {
      track._isUndoing = true;
      track.setAttribute('stress', this.oldValue);
      track._isUndoing = false;
      if (this.saveCallback) {
        this.saveCallback(this.statName, this.oldValue, parseInt(track.getAttribute('resistance')));
      }
    }
  }
}

/**
 * Command for changing resistance on a potential track
 */
class ResistanceCommand extends Command {
  constructor(trackId, statName, oldValue, newValue, saveCallback) {
    super();
    this.trackId = trackId;
    this.statName = statName;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.saveCallback = saveCallback;
  }

  execute() {
    const track = document.getElementById(this.trackId);
    if (track) {
      track._isUndoing = true;
      track.setAttribute('resistance', this.newValue);
      track._isUndoing = false;
      if (this.saveCallback) {
        this.saveCallback(this.statName, parseInt(track.getAttribute('stress')), this.newValue);
      }
    }
  }

  undo() {
    const track = document.getElementById(this.trackId);
    if (track) {
      track._isUndoing = true;
      track.setAttribute('resistance', this.oldValue);
      track._isUndoing = false;
      if (this.saveCallback) {
        this.saveCallback(this.statName, parseInt(track.getAttribute('stress')), this.oldValue);
      }
    }
  }
}

/**
 * Command Manager
 * Manages the command queue and undo operations
 */
class CommandManager {
  constructor() {
    this.commandQueue = [];
    this.currentCharacterId = null;
    this.listeners = new Set();
  }

  /**
   * Set the current character ID
   * Clears the command queue when character changes
   */
  setCharacter(characterId) {
    if (this.currentCharacterId !== characterId) {
      this.clear();
      this.currentCharacterId = characterId;
    }
  }

  /**
   * Execute and add a command to the queue
   */
  executeCommand(command) {
    command.execute();
    this.commandQueue.push(command);
    this.notifyListeners();
  }

  /**
   * Undo the last command
   * @returns {boolean} True if undo was performed, false if queue is empty
   */
  undo() {
    if (this.commandQueue.length === 0) {
      return false;
    }

    const command = this.commandQueue.pop();
    command.undo();
    this.notifyListeners();
    return true;
  }

  /**
   * Check if there are commands to undo
   * @returns {boolean} True if commands exist in queue
   */
  canUndo() {
    return this.commandQueue.length > 0;
  }

  /**
   * Get the number of commands in the queue
   * @returns {number} Number of commands
   */
  getQueueSize() {
    return this.commandQueue.length;
  }

  /**
   * Clear all commands from the queue
   */
  clear() {
    this.commandQueue = [];
    this.notifyListeners();
  }

  /**
   * Add a listener for queue changes
   * @param {Function} callback - Called when queue changes
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove a listener
   * @param {Function} callback - The callback to remove
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.canUndo(), this.getQueueSize());
      } catch (error) {
        console.error('Error in command manager listener:', error);
      }
    });
  }

  /**
   * Create a stress command
   */
  createStressCommand(trackId, statName, oldValue, newValue, saveCallback) {
    return new StressCommand(trackId, statName, oldValue, newValue, saveCallback);
  }

  /**
   * Create a resistance command
   */
  createResistanceCommand(trackId, statName, oldValue, newValue, saveCallback) {
    return new ResistanceCommand(trackId, statName, oldValue, newValue, saveCallback);
  }
}

// Export singleton instance
const commandManager = new CommandManager();
export default commandManager;
