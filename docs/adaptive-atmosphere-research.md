# Adaptive Atmosphere: evidence and implementation

AIM offers adjustable audiovisual settings and remembers preferences. The names Settle, Focus, Restore and Energize describe user-selected intentions. Presets are design hypotheses, not experimentally established treatments or measured brain states. A local keyword match proposes a starting point; no diagnosis or physiological inference occurs.

## Primary studies

| Topic | Study and measured outcome | Limit for AIM |
| --- | --- | --- |
| Color | [Wilms & Oberfeld (2018)](https://doi.org/10.1007/s00426-017-0880-8): laboratory color viewing; emotion ratings, skin conductance and heart rate. Hue, saturation and brightness interacted. | This does not validate particular RGB presets. Our intensity control adjusts artwork opacity, not hardware brightness or calibrated luminance. |
| Shape | [Makin et al. (2012)](https://doi.org/10.1016/j.neuropsychologia.2012.10.003): symmetry and task-dependent EEG/facial-muscle responses. | No universal shape-to-emotion mapping. Rings and petals are optional design choices. |
| Patterns | [Hägerhäll et al. (2008)](https://doi.org/10.1068/p5918): EEG responses varied with fractal dimension in silhouette patterns. | Our branching geometry has not been matched to their stimuli or assigned an experimentally validated fractal dimension. EEG changes alone do not prove a health benefit. |
| Numbers | [Harvey et al. (2013)](https://doi.org/10.1126/science.1239052): high-field fMRI mapped populations responding to small quantities. | Numerosity processing does not establish biological benefits from symbolic numbers, Fibonacci sequences or numerology. |
| Light | [Chang et al. (2015)](https://doi.org/10.1073/pnas.1418490112): evening eReader versus printed-book exposure affected melatonin, circadian timing, sleep and subsequent alertness. | Screen spectrum, duration, brightness, viewing distance and ambient light affect exposure. A theme is not a measured retinal light dose or circadian intervention. |

These are selected primary experiments, not a systematic review. Their findings are limited to their methods and participants. The in-app study cards distinguish findings, limits and proposed design applications. No experiment has yet established a biological or mood benefit from AIM. Optical energy conservation is a separate numerical check and supplies no evidence about neuroscience.

## Product behavior and privacy

- Descriptions remain in component memory; they are never transmitted, logged or persisted by this feature.
- Versioned, sanitized settings and explicit positive-feedback preferences remain in local storage under the current Firebase UID. The public preview uses its own key. Raw text and audio playback state are excluded. These are device-local preferences, not cloud sync or encrypted private storage.
- Controls apply immediately. “This works for me” saves a starting point for that intention; “Too much” reduces visual intensity, density, motion and volume. Users can forget preferences.
- Reduced-motion settings override animation. There are no flashing effects. The default sound state is off. Web Audio starts on a click and stops on view hiding, page hiding, account change or unmount. The generated drone tones have no therapeutic meaning.

## Next evidence step

Within-person usability testing can compare two labeled settings for the same task. Change one visual property at a time, counterbalance A/B order, keep device and room lighting similar, and collect brief comfort/focus ratings before and after alongside task completion. Record duration and motion preference. Use neutral prompts and allow stopping at any time. Preference data can improve defaults; it cannot establish a biological mechanism or clinical efficacy. Such claims would require an appropriately designed research study and relevant measurement expertise.

## Design review

[Figma interaction review](https://www.figma.com/design/bkpDV0yonvzZeuaK4Q4v5G/AIM?node-id=46-2): calm dark navy, original orbital-arrow brand, scene beside controls on desktop, one column on phones, reversible adjustments, optional sound, preference isolation, and clearly bounded research claims. Deployment comparison and commit-bound QA belong in the pull request evidence.
