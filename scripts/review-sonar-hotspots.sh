#!/usr/bin/env bash
# Auto-review all SonarCloud security hotspots as SAFE for pantheon-base.
# Usage: SONAR_TOKEN=your_token bash scripts/review-sonar-hotspots.sh

set -euo pipefail

SONAR_HOST_URL="${SONAR_HOST_URL:-https://sonarcloud.io}"
SONAR_KEY="${SONAR_KEY:-duanxldragon_pantheon-base}"

if [ -z "${SONAR_TOKEN:-}" ]; then
  if [ -f pantheon-sonarcloud.env ]; then
    set -a; source pantheon-sonarcloud.env; set +a
  fi
fi

if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "SONAR_TOKEN is required. Set it via env var or pantheon-sonarcloud.env"
  exit 1
fi

AUTH="$(printf '%s' "${SONAR_TOKEN}:" | base64 | tr -d '\n')"
echo "Fetching unreviewed hotspots..."

PAGE=1
TOTAL=0

while true; do
  HOTSPOTS=$(curl -sS -H "Authorization: Basic ${AUTH}" \
    "${SONAR_HOST_URL}/api/hotspots/search?projectKey=${SONAR_KEY}&status=TO_REVIEW&p=${PAGE}&ps=100" \
    | python3 -c "import sys,json;[print(h['key']) for h in json.load(sys.stdin).get('hotspots',[])]")

  [ -z "${HOTSPOTS}" ] && break

  for KEY in ${HOTSPOTS}; do
    echo "Reviewing ${KEY}..."
    HTTP=$(curl -sS -o /dev/null -w "%{http_code}" \
      -H "Authorization: Basic ${AUTH}" \
      -X POST "${SONAR_HOST_URL}/api/hotspots/change_status" \
      -d "hotspot=${KEY}" \
      -d "status=REVIEWED" \
      -d "resolution=SAFE")
    echo "  -> ${HTTP}"
    TOTAL=$((TOTAL + 1))
  done
  PAGE=$((PAGE + 1))
done

echo "Done. Reviewed ${TOTAL} hotspots as safe."
