/**
 * Character Storage Service
 * Handles character CRUD operations for both localStorage and Supabase
 */

const MAX_LOCAL_CHARACTERS = 5;

class CharacterStorage {
  constructor() {
    this.storageType = 'local'; // 'local' or 'supabase'
    this.user = null;
  }

  // Initialize with user session if available
  async initialize() {
    // TODO: Check for Supabase session
    // For now, default to local storage
    this.storageType = 'local';
    return this.storageType;
  }

  // Get all characters
  async getCharacters() {
    if (this.storageType === 'local') {
      return this._getLocalCharacters();
    } else {
      return this._getSupabaseCharacters();
    }
  }

  // Get single character by ID
  async getCharacter(id) {
    if (this.storageType === 'local') {
      return this._getLocalCharacter(id);
    } else {
      return this._getSupabaseCharacter(id);
    }
  }

  // Save/update character
  async saveCharacter(character) {
    if (this.storageType === 'local') {
      return this._saveLocalCharacter(character);
    } else {
      return this._saveSupabaseCharacter(character);
    }
  }

  // Delete character
  async deleteCharacter(id) {
    if (this.storageType === 'local') {
      return this._deleteLocalCharacter(id);
    } else {
      return this._deleteSupabaseCharacter(id);
    }
  }

  // Set active character
  setActiveCharacter(id) {
    localStorage.setItem('active_character_id', id);
  }

  // Get active character ID
  getActiveCharacterId() {
    return localStorage.getItem('active_character_id');
  }

  // ============ Local Storage Methods ============

  _getLocalCharacters() {
    const charactersJson = localStorage.getItem('characters');
    if (!charactersJson) return [];
    
    try {
      const characters = JSON.parse(charactersJson);
      return Array.isArray(characters) ? characters : [];
    } catch (e) {
      console.error('Failed to parse characters from localStorage:', e);
      return [];
    }
  }

  _getLocalCharacter(id) {
    const characters = this._getLocalCharacters();
    return characters.find(char => char.id === id) || null;
  }

  _saveLocalCharacter(character) {
    const characters = this._getLocalCharacters();
    
    // Generate ID if new character
    if (!character.id) {
      // Check character limit for local storage
      if (characters.length >= MAX_LOCAL_CHARACTERS) {
        throw new Error(`Local storage limited to ${MAX_LOCAL_CHARACTERS} characters. Login for unlimited storage.`);
      }
      character.id = this._generateId();
      character.createdAt = new Date().toISOString();
    }
    
    character.updatedAt = new Date().toISOString();

    // Update or add character
    const index = characters.findIndex(char => char.id === character.id);
    if (index >= 0) {
      characters[index] = character;
    } else {
      characters.push(character);
    }

    localStorage.setItem('characters', JSON.stringify(characters));
    return character;
  }

  _deleteLocalCharacter(id) {
    const characters = this._getLocalCharacters();
    const filtered = characters.filter(char => char.id !== id);
    localStorage.setItem('characters', JSON.stringify(filtered));
    
    // Clear active character if it was deleted
    if (this.getActiveCharacterId() === id) {
      localStorage.removeItem('active_character_id');
    }
    
    return true;
  }

  _generateId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ============ Supabase Methods (Placeholder) ============

  async _getSupabaseCharacters() {
    // TODO: Implement Supabase queries
    console.warn('Supabase not implemented yet');
    return [];
  }

  async _getSupabaseCharacter(id) {
    // TODO: Implement Supabase queries
    console.warn('Supabase not implemented yet');
    return null;
  }

  async _saveSupabaseCharacter(character) {
    // TODO: Implement Supabase queries
    console.warn('Supabase not implemented yet');
    return character;
  }

  async _deleteSupabaseCharacter(id) {
    // TODO: Implement Supabase queries
    console.warn('Supabase not implemented yet');
    return true;
  }

  // ============ Migration Methods ============

  // Migrate current character data to new character object
  migrateCurrentCharacter() {
    const STATS = ['might', 'finesse', 'nerve', 'seep', 'instinct', 'wit', 'heart', 'tether'];
    
    // Check if there's already character data in old format
    const hasOldData = STATS.some(stat => localStorage.getItem(`character_${stat}`) !== null);
    
    if (!hasOldData) return null;

    // Build character object from old format
    const character = {
      name: 'Migrated Character',
      avatar: null,
      stats: {},
      stress: {},
      resistance: {}
    };

    // Migrate stats
    STATS.forEach(stat => {
      const value = localStorage.getItem(`character_${stat}`);
      const stress = localStorage.getItem(`character_${stat}_stress`);
      const resistance = localStorage.getItem(`character_${stat}_resistance`);
      
      if (value) character.stats[stat] = parseInt(value, 10);
      if (stress) character.stress[stat] = parseInt(stress, 10);
      if (resistance) character.resistance[stat] = parseInt(resistance, 10);
    });

    // Save as new character
    try {
      const saved = this._saveLocalCharacter(character);
      this.setActiveCharacter(saved.id);
      
      // Clear old format data
      STATS.forEach(stat => {
        localStorage.removeItem(`character_${stat}`);
        localStorage.removeItem(`character_${stat}_stress`);
        localStorage.removeItem(`character_${stat}_resistance`);
      });
      
      return saved;
    } catch (e) {
      console.error('Failed to migrate character:', e);
      return null;
    }
  }

  // Create default character
  createDefaultCharacter() {
    const character = {
      name: 'New Character',
      avatar: null,
      stats: {
        might: 10,
        finesse: 10,
        nerve: 10,
        seep: 10,
        instinct: 10,
        wit: 10,
        heart: 10,
        tether: 10
      },
      stress: {},
      resistance: {}
    };

    return this._saveLocalCharacter(character);
  }
}

// Export singleton instance
const characterStorage = new CharacterStorage();
export default characterStorage;
