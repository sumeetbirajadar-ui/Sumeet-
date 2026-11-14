# Project memory

## Video editing (always)
Whenever the user says "video edit", "edit video", "edit this video", or shares a video to edit, load and follow the `pro-video-pipeline` skill (`.claude/skills/pro-video-pipeline/SKILL.md`) from start to finish:
storyline → rough cut → visual effects → explainer graphics → B-roll → captions → sound effects + music → colour grade → mix → professional render → QA → packaging.

- Installed toolkit: 494+ skills in `.claude/skills/` (full list in `VIDEO_EDITING_SKILLS.md`), 15 MCP servers in `.mcp.json`, plus the user's claude.ai connectors (Higgsfield, ElevenLabs, Descript, OpusClip, Adobe, HyperFrames, vidIQ, Picsart, Tella).
- Effect names from viral reels → skill: see the `video-effects-library` skill.
- Lighting and colour by mood: `mood-lighting-grade`. Product image presets: `product-shot-prompts`.
- Apps that need the user's own computer (local voice cloning, Lumen relighting, Google Flow, Agent Storyboard): `tools/install-local-ai-tools.sh`.
- The user's channels: Instagram Reels and YouTube (incl. Shorts); content may be in Kannada, Hindi or English.
- Voice cloning only for the user's own voice or with written consent.
