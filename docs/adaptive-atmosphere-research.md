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

## Research refinement: source-to-control mapping

The following studies refine the design hypotheses; no numeric setting is described as a scientifically optimized dose. The new defaults apply when no saved choice exists. Previous version-1 settings and learned preferences retain their chosen values; missing saturation and audio-tone fields receive bounded defaults.

| Primary source | Finding relevant to this revision | Implementation and boundary |
| --- | --- | --- |
| [Robles et al. (2021)](https://doi.org/10.3389/fpsyg.2021.699962) | Engagement and relaxation ratings can diverge as fractal complexity increases; subgroups differ. | Moderate rather than maximum detail, distinct intentions and retained personal feedback. No claimed universal optimum or assigned fractal dimension. |
| [O’Hare & Hibbard (2011)](https://doi.org/10.1016/j.visres.2011.06.002) | Concentrating contrast in a narrow spatial-frequency band increased discomfort ratings compared with broad-spectrum visual noise. | Soft multiscale organic contours, adjustable artwork intensity and independent saturation. SVG contours do not reproduce the study’s noise images or measured 1/f image spectrum; display size/viewing distance are uncalibrated. |
| [Alvarsson et al. (2010)](https://doi.org/10.3390/ijerph7031036) | Following induced stress, skin-conductance recovery differed between pleasant nature recordings and environmental noises. | Optional synthesized water-like audio, explicitly identified as synthesis. It is not a recording from the experiment. No inference about the listener’s sympathetic or parasympathetic state. |
| [Mallik & Russo (2022)](https://doi.org/10.1371/journal.pone.0259312) | Effects in an open-label online trial differed by treatment and trait-anxiety subgroup. | Pink noise and an original ambient chord are listening alternatives, not reproductions of the intervention. No binaural-beat/entrainment feature. Pink noise served as a control in the trial, not evidence for an attention benefit. |

### Visual engineering choices

Organic contours use a bounded deterministic sum of angular scales. Detail controls the number of scales and paths, not measured fractal dimension. Palette, saturation and artwork opacity are separate controls. Slow translation and slight scaling replace continuous rotation; there is no opacity pulse. These motion parameters are conservative product choices, not an experimentally established biological rate. User pause and `prefers-reduced-motion` stop drift, including changes between render and effect subscription. Only the artwork is filtered; text contrast is preserved.

### Audio engineering choices

All sounds are original synthesis. Pink noise is constructed using conjugate random-phase Fourier bins with amplitude proportional to 1/√f over a tapered audible band, giving approximately 1/f power there. The buffer is periodic by construction, mean-free and normalized to nominal RMS 0.16 with a 0.8 digital peak ceiling. Stereo channels use fixed independent seeds. The water texture adds slow amplitude variation; the pad uses a conventional C-major harmony and quiet second harmonics. The noise and pad have comparable nominal input energy before filtering; this is not perceptual loudness normalization.

The first sound request constructs/caches only two bounded procedural arrays; no network request or third-party sample is involved. A low-pass tone control, nonlinear volume taper, output dynamics compressor, 450 ms entrance and 120 ms manual exit reduce abrupt transitions. Changes to level and tone are smoothed. View/page hiding and unmount close immediately, including pending fade-outs. Switching sound type stops playback and requires another explicit start. Device sound pressure is uncalibrated; digital levels cannot establish a hearing-safe exposure. These fade/tone choices improve controllability and signal behavior, not a demonstrated medical outcome.

Audio power spectra and visual amplitude spectra are different measurements. Their shared 1/f notation does not establish a shared biological mechanism or validate a cross-modal therapeutic effect.
