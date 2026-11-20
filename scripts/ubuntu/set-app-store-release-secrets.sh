#!/bin/bash
# Interactive setup for the four GitHub Actions secrets that
# .github/workflows/release-app-store.yml needs. Run this yourself (from the
# desktop launcher or a terminal) -- values are typed here, never pasted into
# chat with an AI assistant.
set -euo pipefail

REPO="bud-diaz/required-listening"
MODEBI_KEY_PATH="/home/bud/.yeyo/apple/AuthKey_GAUWTB7BMV.p8"

echo "Setting App Store release secrets for $REPO"
echo

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

echo "1/4: EXPO_TOKEN"
echo "   Create one at https://expo.dev/accounts/bud-diaz/settings/access-tokens if you don't have it yet."
read -r -s -p "   Paste EXPO_TOKEN (hidden): " EXPO_TOKEN
echo
if [ -z "$EXPO_TOKEN" ]; then
  echo "   Empty value, aborting." >&2
  exit 1
fi
printf '%s' "$EXPO_TOKEN" | gh secret set EXPO_TOKEN --repo "$REPO"
echo "   Set."
echo

echo "2-4/4: App Store Connect API key"
echo "   required-listening and modebi share Apple team 6PA43G2WVX, so modebi's key"
echo "   is very likely reusable here."
read -r -p "   Reuse modebi's key ($MODEBI_KEY_PATH, ID GAUWTB7BMV)? [Y/n] " REUSE
REUSE="${REUSE:-Y}"

if [[ "$REUSE" =~ ^[Yy] ]]; then
  if [ ! -f "$MODEBI_KEY_PATH" ]; then
    echo "   $MODEBI_KEY_PATH not found. Re-run and choose 'n' to enter a different key." >&2
    exit 1
  fi
  KEY_ID="GAUWTB7BMV"
  KEY_PATH="$MODEBI_KEY_PATH"
else
  read -r -p "   ASC API Key ID: " KEY_ID
  read -r -p "   Path to the .p8 private key file: " KEY_PATH
  if [ -z "$KEY_ID" ] || [ ! -f "$KEY_PATH" ]; then
    echo "   Missing key ID or file not found at '$KEY_PATH'." >&2
    exit 1
  fi
fi

read -r -p "   ASC API Issuer ID (same one used for modebi, if reusing): " ISSUER_ID
if [ -z "$ISSUER_ID" ]; then
  echo "   Empty value, aborting." >&2
  exit 1
fi

gh secret set ASC_API_KEY_ID --repo "$REPO" --body "$KEY_ID"
gh secret set ASC_API_ISSUER_ID --repo "$REPO" --body "$ISSUER_ID"
base64 -i "$KEY_PATH" | tr -d '\n' | gh secret set ASC_API_KEY_P8_BASE64 --repo "$REPO"
echo "   Set."
echo

echo "Current secrets on $REPO:"
gh secret list --repo "$REPO"
echo

read -r -p "Trigger the Release to App Store workflow now? [y/N] " RUN_NOW
if [[ "$RUN_NOW" =~ ^[Yy] ]]; then
  gh workflow run release-app-store.yml --repo "$REPO"
  echo "Triggered. Watch it with: gh run watch --repo $REPO"
fi

echo
echo "Done. Press Enter to close."
read -r
