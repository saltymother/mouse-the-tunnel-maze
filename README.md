# 🐭 Mouse: The Tunnel Maze

A polished, charming **2D browser game** built with pure vanilla HTML5, CSS3, JavaScript (Canvas API), and Web Audio API. Zero external dependencies, 100% self-contained, responsive across desktop, laptop, tablet, and mobile browsers.

---

## 🎮 Concept & Rules

The player guides a cute cartoon mouse through an underground labyrinth consisting of **10 sequential checkpoints** (`TUNNEL 1 / 10` to `TUNNEL 10 / 10`).

At every stage, the mouse reaches a cavern fork with **two tunnel choices stacked vertically**:
- 🔴 **Red Tunnel**
- 🔵 **Blue Tunnel**

### The Tunnel Decision
- Only **one tunnel is correct** per stage.
- The correct color is **independently randomized** (50% Red, 50% Blue).
- The vertical arrangement is **randomized per checkpoint** (Layout A: Blue top / Red bottom; Layout B: Red top / Blue bottom).
- You can never predict the answer from color alone!

### Progress & Mistakes
- **Correct Choice**: The mouse scurries through with golden sparkles and a harmonious chime, advancing to the next tunnel (`TUNNEL 2`, `TUNNEL 3`, ...).
- **Wrong Choice**: Harmless warning effect and soft bonk sound. The mouse retreats backward out of the tunnel and returns to the **previous checkpoint** (e.g. Stage 3 $\rightarrow$ Stage 2; Stage 1 remains at Stage 1).
- No permanent damage, no instant death, no restarting the entire game on a mistake!
- Passing all 10 stages triggers the celebratory **YOU ESCAPED!** win screen.

---

## 🕹️ Controls

The game features **exactly four visible control buttons** at the bottom of the screen (optimized for touch on mobile and mouse on desktop), plus full keyboard support:

| Visible Button | Keyboard Keys | Action |
|---|---|---|
| **[ ↑ FORWARD ]** | `W` / `↑` (or `D` / `→`) | Moves mouse forward toward tunnels / enters aligned tunnel |
| **[ ↓ BACKWARD ]** | `S` / `↓` (or `A` / `←`) | Moves mouse backward (retreats left) |
| **[ JUMP ]** | `Space` | Mouse jumps / hops onto the upper walkway |
| **[ SIT ]** | `C` | Mouse sits up cutely on hind legs; drops through upper deck |

### Navigating Between Upper & Lower Tunnels
1. **Lower Tunnel**: Walk forward along the cavern floor directly into the lower entrance.
2. **Upper Tunnel**: Press **JUMP** (or step on the glowing cyan **⚡ BOUNCE** mushroom) to hop up onto the upper wooden walkway, then press **FORWARD**.
3. **Dropping Back Down**: While on the upper walkway, press **SIT** or walk off the left ledge to drop down.

---

## 🎨 Visual Features

- **Procedural Animated Mouse**:
  - Tear-drop cartoon mouse body with natural fur gradient.
  - Large rounded ears that bob with running and jumping.
  - Glossy bead eye with periodic natural blinking.
  - Twitching pink nose and vibrating whiskers.
  - Articulated 8-segment dynamic tail following Verlet/kinematic wave physics.
  - Squash-and-stretch on jumps and landings.
  - Cute sit pose with front paws folded to chest.
- **Atmospheric Underground Cavern**:
  - Multi-layered deep subterranean rock walls and ceiling stalactites.
  - Swinging lantern chains with warm flickering light cones.
  - Bioluminescent cyan, green, and pink cave mushrooms.
  - Floating dust motes illuminated by ambient light.
  - Glowing archways with engraved color badges (`🔴 RED TUNNEL` & `🔵 BLUE TUNNEL`).
  - Active alignment prompt and glowing portal effects.

---

## 🔊 Audio Synthesis (Web Audio API)

No external audio assets or MP3 files required! All sounds are generated in real-time:
- **Soft Footsteps**: Gentle randomized scurry pitter-patter.
- **Jump & Bounce**: Light rising chirps and bouncy spring sweeps.
- **Cute Squeak**: High-pitched cartoon mouse squeak when sitting.
- **Tunnel Entry**: Low subterranean wind rushing whoosh.
- **Correct Choice**: Harmonious 4-note major chime arpeggio (C5 - E5 - G5 - C6).
- **Wrong Choice**: Harmless soft hollow descending bonk.
- **Victory Fanfare**: Triumphant celebration arpeggio.
- **Sound Toggle**: Instant mute/unmute button in the top header.

---

## 🚀 How to Run

### Method 1: Direct File Opening
Double-click `index.html` or open it in any web browser:
```
file:///Users/vaibhav/Antigravity/mouse_the_tunnel_maze/index.html
```

### Method 2: Local Python Server
Run the included launch script or python server:
```bash
./launch.sh
# or
python3 server.py
```
This automatically opens the game at `http://localhost:8095/index.html`!
