# Campaign Sessions

Campaign sessions allow players to connect and share roll results in real-time using peer-to-peer connections.

## Features

- **Real-time Roll Sharing**: All skill roll results are automatically broadcast to connected players
- **Session Persistence**: Your connection persists as you navigate between pages
- **No Server Required**: Uses WebRTC for direct peer-to-peer connections
- **Easy Session Codes**: Share simple 6-character codes to let players join

## How to Use

### As a Game Master (GM)

1. Open your character sheet
2. Click the "CAMPAIGN" button on the right side of the screen
3. Click "Create Session (GM)"
4. Share the 6-character session code with your players
5. Players will appear in the player list as they join
6. All roll results from connected players will appear in the activity log

### As a Player

1. Open your character sheet
2. Click the "CAMPAIGN" button on the right side of the screen
3. Enter the session code provided by your GM
4. Click "Join Session"
5. Your rolls will now be shared with all connected players

## Features in Detail

### Player List
Shows all connected players with their character names and avatars. The GM is marked with "Game Master" role.

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
