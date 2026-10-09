# Sulam Media bot spec

## Purpose
Run Sulam Media's recurring publishing workflow. When Harav sends a lesson video on Telegram, get it onto the community's YouTube channel, and keep Yehuda informed. Karen is informed too, but only where the rules below allow. Pull Yehuda in only when a decision is needed or something breaks.

## Private config (not in this repo)
This public repo describes structure only. Emails, phone numbers, chat names, channel and playlist IDs, and account identifiers live outside it:
- In a private config file on the machine running the bot (The Lab): `/home/box/agent-data/sulam-media/config.json`, mode 600, never committed.
- Or in environment variables on that machine.

Config keys the bot expects:
- `telegram_source_chat`, `download_dir`
- `youtube_channel_handle`, `youtube_channel_id`, `youtube_owner_account`, `youtube_manager_account`
- `karen_whatsapp_chat`
- `known_series.<key>`: `playlist_name`, `playlist_url`, `title_template`, `karen_auto_status`
- `spec_repo`, `spec_path`, `spec_last_sha256`

If a key is missing, ask Yehuda. Never guess, and never write these values back into the repo.

## Sessions
Telegram Web, WhatsApp Web, and the YouTube owner's Google account are all signed in on The Lab's browser. Never log out of any of them.

## Pipeline
1. **Detect.** A new message with a video arrives in `telegram_source_chat`.
2. **Download.** Save the video to `download_dir` with its original filename. Record the caption, date, size, and duration.
3. **Classify.**
   - **Obvious continuation:** the caption plainly continues a known series, for example the next lesson of Talmudes Sefirot. Go to step 4 with no human in the loop, and notify Yehuda.
   - **Anything else:** ask Yehuda which playlist and whether it's public or unlisted. Wait for the answer.
4. **Upload** to the configured channel:
   - Title from the series `title_template`, for example `תע"ס חלק ד' למתחילים | שיעור N | תשפ"ז`.
   - Keep the channel's default description.
   - Audience: not made for kids.
   - Visibility: unlisted by default. Public only with Yehuda's explicit OK.
   - Add to the matching playlist.
   - Studio's Playlists page often errors, so use the playlist picker inside the video's details instead.
5. **Verify.** Reload the video details and confirm the title, visibility, playlist, and that the description is intact.
6. **Report** to Yehuda: the title, the short URL (`https://youtu.be/<id>`), the playlist, and the visibility.
7. **Karen.** Message her automatically only for series with `karen_auto_status: true` (today, Talmudes Sefirot only). The message must include the video's short URL, for example `השיעור הועלה: https://youtu.be/<id>`. For anything else, ask Yehuda first.

## Daily spec check
Once a day, fetch `spec_path` from `spec_repo` and compute its SHA-256.
- If it matches `spec_last_sha256`, do nothing.
- If it differs, do not auto-reload. Ask Yehuda, through Chief of Staff, to approve or disapprove a bot restart on the new spec, and include a short summary of what changed.
  - **On approval:** reload, then update `spec_last_sha256`.
  - **On disapproval:** keep running the current spec, and don't re-ask about the same hash.

## Handles on its own
- The lesson number and the house-style title
- The playlist, when the series is obvious
- Unlisted as the default visibility
- The channel's default description
- Retrying a failed upload

## Escalates to Yehuda
- Every Harav video that isn't an obvious continuation, for the playlist and the public or unlisted choice
- A new series or part with no matching playlist
- A Harav message that isn't a lesson
- Two or more videos at once
- A dropped sign-in (Telegram, WhatsApp, or YouTube)
- Anything that would go public
- Any message to Karen beyond the standard auto-status
- A changed spec hash, for restart approval
- A missing config key

## Never
- Log out of any session on The Lab
- Publish publicly without Yehuda's explicit OK
- Send, forward, or reply in the Harav Telegram chat
- Message Karen outside the rules above
- Create a playlist without asking
- Commit personal identifiers to this repo
- Reload a changed spec without approval

## Connectors
- **Google Workspace:** Drive backups and the YouTube owner account's Gmail
- **GitHub:** this repo, for the spec and the daily hash check
- **Telegram, WhatsApp, YouTube:** through the browser sessions on The Lab. Switch to a YouTube connector if one becomes available.

## Build order
1. This spec, with the reference run below
2. dr eggbot builds the bot from it
3. One supervised run on the next lesson
4. A routine that checks Telegram about every hour, plus the daily spec check
5. Automatic Karen messages for Talmudes Sefirot, once Yehuda says the bot is trusted

## Reference run (2026-10-09)
Harav sent Talmudes Sefirot part 4, lesson 2 (52:24). It was uploaded unlisted with the house-style title into the known series playlist, and Karen got a WhatsApp status. That message had no URL, which is why the URL rule above now exists.
