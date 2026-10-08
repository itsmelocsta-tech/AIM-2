# AIM Google Play launch offer

Free install with Basic access. Premium is $9.99 USD per month or $79.99 per year in the U.S. Eligible new subscribers may receive a seven-day trial. `play-launch-offer.json` is the source of truth. Purchases remain disabled until release checks pass.

Create `aim_premium` with the `monthly` and `annual` base plans and eligible `seven_day_trial` offers in Play Console. Before purchase, show the actual localized price, trial duration, recurring period, automatic renewal, and Google Play cancellation link. Android reads these details from Google Play; the intended U.S. price is not a substitute for the actual eligible offer.

Basic includes one active goal and three analyzed plan updates each calendar month (UTC). Premium adds unlimited plan updates and the listed Premium tools. Failed analysis returns the free update allowance. User-written billing records cannot grant Premium.

Complete the owner setup and device checks in [android-release.md](android-release.md) before enabling purchases. Verify trial eligibility, monthly and annual purchases, renewal, cancellation, grace period, hold, expiration, account restoration, and rejected purchases on the wrong AIM account with Play license testers. Do not charge real purchases during QA.
