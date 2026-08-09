# Motion clips for Lionk

Drop VRM Animation (`.vrma`) files in this folder and list them in
`motions.json` to have the character driven by real motion capture instead of
the hand-authored poses in `src/scripts/lionk.ts`.

Nothing here is required. `motions.json` ships empty, and while every entry is
`null` the animation runtime is never even downloaded — the procedural rig runs
exactly as it does today.

## motions.json

Fill in the file names of the clips you have added:

```json
{
  "scenes": ["hero.vrma", "about.vrma", null, "projects.vrma", null],
  "greet": "greet.vrma"
}
```

- `scenes` — one entry per deck slide, in order (hero, about, skills, projects,
  contact). Use `null`, or leave the array short, for any slide that should keep
  its authored pose. Mixing the two is fine.
- `greet` — optional one-shot played when the character is clicked. It returns
  to the slide's clip when it finishes.

Clips cross-fade over 0.35s on every slide change and loop by default.

## What a clip takes over

A clip owns the entire humanoid while it plays, so the authored pose, the
weight shift and the breathing all stand down for that slide — they would only
fight it. Everything else keeps running: the camera rig, the stage placement,
the eye tracking, the click reaction and the blinking.

Face expressions are left to the clip while one is playing, since many clips
animate them. Blinking is kept on regardless, because clips rarely carry it.

## Licensing — read before adding files

**Do not commit `.vrma` files to this repository.** `.gitignore` is set up to
keep them out, and that is deliberate.

The freely available packs — including the seven official VRoid Project motions
— prohibit redistributing the data "in a way that can be rigged or extracted".
A public static site serves these files at a plain URL, and a public GitHub
repository makes them downloadable outright, so committing them would be
redistribution in exactly the prohibited form. The prohibition covers modified
versions too.

Clips that are safe to commit are ones you authored yourself, or ones whose
licence explicitly permits redistribution. If you have written permission from
the rights holder, keep it on file and remove the `.gitignore` entry.

Whatever you use, check whether it requires credit. The official VRoid pack
does: "Character animation credits to pixiv Inc.'s VRoid Project".
