/**
 * Campaign Storage Service
 * Handles campaign CRUD operations for localStorage
 */

class CampaignStorage {
  constructor() {
    this.storageKey = 'campaigns';
  }

  // Get all campaigns
  getCampaigns() {
    const campaignsJson = localStorage.getItem(this.storageKey);
    if (!campaignsJson) return [];
    
    try {
      const campaigns = JSON.parse(campaignsJson);
      return Array.isArray(campaigns) ? campaigns : [];
    } catch (e) {
      console.error('Failed to parse campaigns from localStorage:', e);
      return [];
    }
  }

  // Get single campaign by ID
  getCampaign(id) {
    const campaigns = this.getCampaigns();
    return campaigns.find(camp => camp.id === id) || null;
  }

  // Save/update campaign
  saveCampaign(campaign) {
    const campaigns = this.getCampaigns();
    
    // Generate ID if new campaign
    if (!campaign.id) {
      campaign.id = this._generateId();
      campaign.createdAt = new Date().toISOString();
    }
    
    campaign.updatedAt = new Date().toISOString();
    
    // Find and update or add new
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.push(campaign);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(campaigns));
    return campaign;
  }

  // Delete campaign
  deleteCampaign(id) {
    const campaigns = this.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  // Create default campaign
  createDefaultCampaign() {
    return {
      name: 'New Campaign',
      sessionCode: null,
      gmCharacterId: null,
      isActive: false,
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Set active campaign
  setActiveCampaign(id) {
    localStorage.setItem('active_campaign_id', id);
  }

  // Get active campaign ID
  getActiveCampaignId() {
    return localStorage.getItem('active_campaign_id');
  }

  // Generate unique ID
  _generateId() {
    return `camp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Create singleton instance
const campaignStorage = new CampaignStorage();
export default campaignStorage;
