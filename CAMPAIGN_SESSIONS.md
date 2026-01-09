# Campaign Sessions

Campaign sessions allow players to connect and share roll results in real-time using peer-to-peer connections.

## Important: Works Across Networks/Internet

**This feature works for remote play, not just LAN!** The P2P connections use STUN servers for NAT traversal, allowing players to connect from anywhere on the internet. No server hosting or port forwarding required for basic functionality.

## Getting Started

### For Game Masters (GMs)

1. Navigate to the **Campaigns** tab in the header
2. Click **Create Campaign**
3. Give your campaign a name
4. (Optional) Associate a character as the GM
5. Click **Start Campaign** to begin hosting
6. Share the 6-character session code with your players
7. The campaign stays saved - you can stop and restart it later with the same configuration

### For Players

1. Open your character sheet
2. Click the **Connect to Campaign** button in the character header
3. Enter the 6-character session code from your GM
4. Click **Connect**
5. Your rolls will now be shared with all connected players
6. The connection persists as you navigate between pages

## Features

- **Real-time Roll Sharing**: All skill roll results are automatically broadcast to connected players
- **Campaign Management**: GMs can save campaigns and reuse session codes
- **Separate GM Screen**: GMs manage campaigns from the dedicated Campaigns page
- **Session Persistence**: Your connection persists as you navigate between pages
- **No Server Required**: Uses WebRTC for direct peer-to-peer connections
- **Works Across Networks**: Not limited to LAN - works for remote play over the internet
- **Easy Session Codes**: Share simple 6-character codes to let players join

## Features in Detail

### Campaign Management (GMs)
GMs can create, save, and manage multiple campaigns from the Campaigns page. Each campaign:
- Has a unique name and optional GM character association
- Can be started/stopped to host sessions
- Retains its configuration for reuse
- Generates a new session code each time it's started

### Player Connection
Players connect from their character sheet using a simple button in the header. The connection:
- Shows a status indicator when connected
- Persists across page navigation
- Automatically broadcasts all skill rolls

### Activity Log
Displays the most recent 100 roll results from all connected players, including:
- Player name
- Skill rolled
- Roll result and total
- Success level (Critical, Success, Mixed, Fail, Miff)
- Timestamp

### Session Persistence
Your session connection is saved in your browser and will automatically reconnect if you:
- Navigate between pages (e.g., view different characters)
- Refresh the page
- Close and reopen the browser tab (within 24 hours)

## Technical Notes

- Sessions expire after 24 hours of inactivity
- Uses STUN servers for connection establishment (no data passes through any server)
- All communication is peer-to-peer for privacy
- Requires modern browser with WebRTC support

## Troubleshooting

**Can't connect to session?**
- Make sure you entered the session code correctly (6 characters)
- Check that the GM's session is still active
- Try refreshing the page and rejoining

**Not seeing other players' rolls?**
- Make sure you're connected to the same session
- Check the player list to see who is connected
- The GM needs to be online for players to see each other

**Session code not working?**
- Session codes are case-sensitive (use uppercase)
- Sessions expire after 24 hours
- GM may need to create a new session

## Privacy & Security

- All connections are peer-to-peer (no central server)
- No data is stored on external servers
- Session codes are temporary and expire after 24 hours
- Only roll results and character names are shared
