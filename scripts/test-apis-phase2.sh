#!/usr/bin/env bash
# test-apis-phase2.sh — Tests endpoints that were blocked in Phase 1 due to missing data.
# Creates all prerequisite data (requests, approvals, etc.) before each test group.
# Run AFTER test-apis.sh passes. Re-runnable (first-login test auto-skips if already done).

BASE="http://localhost:8080/api/v1"
PASS=0; FAIL=0; ERRORS=""

# ── Helpers ───────────────────────────────────────────────────────────────────
_login() {
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.data&&r.data.accessToken?r.data.accessToken:'')}catch(e){}})"
}

_get_id() {
  node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.success&&r.data&&r.data.id?String(r.data.id):'')}catch(e){}})"
}

_get_msg() {
  node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.message||'')}catch(e){}})"
}

_check_ok() {
  node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>{d+=c});process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.success?'OK':'ERR:'+r.message)}catch(e){process.stdout.write('PARSE_ERR:'+d.substring(0,80))}})"
}

t() {
  local label="$1" method="$2" url="$3" token="$4" body="$5"
  local resp ok
  if [ -n "$body" ]; then
    resp=$(curl -s -X "$method" "$url" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$body")
  else
    resp=$(curl -s -X "$method" "$url" -H "Authorization: Bearer $token")
  fi
  ok=$(echo "$resp" | _check_ok)
  if [[ "$ok" == OK* ]]; then
    echo "✅ $label"
    PASS=$((PASS+1))
  else
    echo "❌ $label → $ok"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n❌ $label → $ok"
  fi
}

# ── Login ─────────────────────────────────────────────────────────────────────
echo "=== Phase 2: Fetching tokens ==="
EMP=$(_login "emp.it1@ifms.vn" "Ifms@2027")
TL=$(_login "tl.it@ifms.vn" "Ifms@2027")
MGR=$(_login "manager.it@ifms.vn" "Ifms@2027")
ACC=$(_login "accountant@ifms.vn" "Ifms@2027")
CFO=$(_login "cfo@ifms.vn" "Ifms@2027")
[ -z "$EMP" ] && echo "EMP login failed - aborting" && exit 1
[ -z "$TL" ]  && echo "TL login failed - aborting" && exit 1
[ -z "$MGR" ] && echo "MGR login failed - aborting" && exit 1
[ -z "$ACC" ] && echo "ACC login failed - aborting" && exit 1
[ -z "$CFO" ] && echo "CFO login failed - aborting" && exit 1
echo "✅ All tokens fetched"
echo ""

# ── §1 POST /auth/first-login/complete ───────────────────────────────────────
# emp.it2 has is_first_login=true (seeded). Login returns setupToken (no accessToken).
# After success: emp.it2 password = Ifms@2027B, pin = 24682, is_first_login = false.
# Subsequent runs: emp.it2 already completed → skip with note.
echo "=== §1 POST /auth/first-login/complete ==="
EMP2_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"emp.it2@ifms.vn","password":"Ifms@2027"}')
EMP2_SETUP=$(echo "$EMP2_RESP" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.data&&r.data.setupToken?r.data.setupToken:'')}catch(e){}})")
if [ -n "$EMP2_SETUP" ]; then
  FL_RESP=$(curl -s -X POST "$BASE/auth/first-login/complete" \
    -H "Content-Type: application/json" \
    -d "{\"setupToken\":\"$EMP2_SETUP\",\"newPassword\":\"Ifms@2027B\",\"confirmPassword\":\"Ifms@2027B\",\"pin\":\"24682\"}")
  ok=$(echo "$FL_RESP" | _check_ok)
  if [[ "$ok" == OK* ]]; then
    echo "✅ POST /auth/first-login/complete (emp.it2 → password: Ifms@2027B, pin: 24682)"
    PASS=$((PASS+1))
  else
    echo "❌ POST /auth/first-login/complete → $ok"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n❌ POST /auth/first-login/complete → $ok"
  fi
else
  EMP2_ACCESS=$(echo "$EMP2_RESP" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.data&&r.data.accessToken?'YES':'')}catch(e){}})")
  if [ -n "$EMP2_ACCESS" ]; then
    echo "⚠️  SKIP POST /auth/first-login/complete — emp.it2 already completed first-login"
    echo "   (Login returned accessToken — is_first_login is already false)"
  else
    EMP2_ERR=$(echo "$EMP2_RESP" | _get_msg)
    echo "⚠️  SKIP POST /auth/first-login/complete — emp.it2 login failed: $EMP2_ERR"
    echo "   Hint: try login with password Ifms@2027B (already completed)"
  fi
fi
echo ""

# ── §2 Create ADVANCE requests for test data ──────────────────────────────────
echo "=== §2 Creating ADVANCE requests (setup data) ==="
# Request A: for GET /requests/{id} test
REQ_A_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $EMP" -H "Content-Type: application/json" \
  -d '{"type":"ADVANCE","projectId":1,"phaseId":1,"categoryId":1,"amount":50000,"description":"P2 test A - for detail view"}')
REQ_A_ID=$(echo "$REQ_A_RESP" | _get_id)
[ -n "$REQ_A_ID" ] && echo "  ✓ Request A created (id=$REQ_A_ID)" \
  || echo "  ⚠ Request A failed: $(echo "$REQ_A_RESP" | _get_msg)"

# Request B: for TL reject test (→ notification)
REQ_B_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $EMP" -H "Content-Type: application/json" \
  -d '{"type":"ADVANCE","projectId":1,"phaseId":1,"categoryId":2,"amount":60000,"description":"P2 test B - for TL reject"}')
REQ_B_ID=$(echo "$REQ_B_RESP" | _get_id)
[ -n "$REQ_B_ID" ] && echo "  ✓ Request B created (id=$REQ_B_ID)" \
  || echo "  ⚠ Request B failed: $(echo "$REQ_B_RESP" | _get_msg)"

# Request C: for TL approve → accountant reject
REQ_C_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $EMP" -H "Content-Type: application/json" \
  -d '{"type":"ADVANCE","projectId":1,"phaseId":1,"categoryId":3,"amount":70000,"description":"P2 test C - for accountant reject"}')
REQ_C_ID=$(echo "$REQ_C_RESP" | _get_id)
[ -n "$REQ_C_ID" ] && echo "  ✓ Request C created (id=$REQ_C_ID)" \
  || echo "  ⚠ Request C failed: $(echo "$REQ_C_RESP" | _get_msg)"
echo ""

# ── §3 GET /requests/{id} ─────────────────────────────────────────────────────
echo "=== §3 GET /requests/{id} ==="
[ -n "$REQ_A_ID" ] && t "GET /requests/{id}" GET "$BASE/requests/$REQ_A_ID" "$EMP" \
  || echo "⚠️  SKIP GET /requests/{id} — REQ_A_ID not set"
echo ""

# ── §4 POST /team-leader/approvals/{id}/approve (TL approves request C) ───────
# This sets request C to APPROVED_BY_TEAM_LEADER, enabling accountant reject (§11).
echo "=== §4 POST /team-leader/approvals/{id}/approve ==="
if [ -n "$REQ_C_ID" ]; then
  t "POST /team-leader/approvals/{id}/approve" POST \
    "$BASE/team-leader/approvals/$REQ_C_ID/approve" "$TL" '{"comment":"Approved - P2 setup for accountant reject"}'
else
  echo "⚠️  SKIP — REQ_C_ID not set"
fi
echo ""

# ── §5 POST /team-leader/approvals/{id}/reject (TL rejects request B) ─────────
# Generates a notification for emp.it1 (used in §6).
echo "=== §5 POST /team-leader/approvals/{id}/reject ==="
if [ -n "$REQ_B_ID" ]; then
  t "POST /team-leader/approvals/{id}/reject" POST \
    "$BASE/team-leader/approvals/$REQ_B_ID/reject" "$TL" '{"reason":"P2 test reject - insufficient documentation"}'
else
  echo "⚠️  SKIP — REQ_B_ID not set"
fi
echo ""

# ── §6 PATCH /notifications/{id}/read ────────────────────────────────────────
# Request status changes do NOT auto-generate notifications (not yet wired up).
# Use POST /notifications/test (debug endpoint) to create a test notification for emp.it1 (id=8).
echo "=== §6 PATCH /notifications/{id}/read ==="
curl -s -X POST "$BASE/notifications/test" \
  -H "Authorization: Bearer $EMP" -H "Content-Type: application/json" \
  -d "{\"userId\":8,\"userEmail\":\"emp.it1@ifms.vn\",\"type\":\"REQUEST_REJECTED\",\"title\":\"Request rejected\",\"message\":\"Request B was rejected by Team Leader\",\"refId\":${REQ_B_ID:-11},\"refType\":\"REQUEST\"}" \
  > /dev/null
sleep 1  # wait for RabbitMQ consumer to process
NOTIF_ID=$(curl -s "$BASE/notifications?page=1&limit=5" \
  -H "Authorization: Bearer $EMP" \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);const i=r.data&&r.data.items||[];const u=i.find(x=>!x.isRead)||i[0];process.stdout.write(u?String(u.id):'')}catch(e){}})")
[ -n "$NOTIF_ID" ] && t "PATCH /notifications/{id}/read" PATCH "$BASE/notifications/$NOTIF_ID/read" "$EMP" \
  || echo "⚠️  SKIP PATCH /notifications/{id}/read — no notifications found after test publish"
echo ""

# ── §7 TL phases, categories, members (Project 1) ────────────────────────────
# Project 1 (id=1): availableBudget=500M, Phase 1 budget=300M → 200M free.
# manager.it (id=5): in dept 2, not a Project 1 member → use for member tests.
echo "=== §7 TL phases/categories/members (Project 1, hardcoded id=1) ==="
TL_PROJ_ID=1

# Create Phase 2 with 1M budget (well within 200M remaining)
NEW_PHASE_RESP=$(curl -s -X POST "$BASE/team-leader/projects/$TL_PROJ_ID/phases" \
  -H "Authorization: Bearer $TL" -H "Content-Type: application/json" \
  -d '{"name":"Phase P2 Test","budgetLimit":1000000}')
NEW_PHASE_ID=$(echo "$NEW_PHASE_RESP" | _get_id)
if [ -n "$NEW_PHASE_ID" ]; then
  echo "✅ POST /team-leader/projects/{id}/phases → id=$NEW_PHASE_ID"
  PASS=$((PASS+1))

  t "GET /team-leader/projects/{id}/categories" GET \
    "$BASE/team-leader/projects/$TL_PROJ_ID/categories?phaseId=$NEW_PHASE_ID" "$TL"

  # PUT categories updates an EXISTING phase-category budget record.
  # New phase has no categories. Use Phase 1 (id=1) which already has categories 1-4.
  t "PUT /team-leader/projects/{id}/categories" PUT \
    "$BASE/team-leader/projects/$TL_PROJ_ID/categories" "$TL" \
    '{"phaseId":1,"categoryId":1,"budgetLimit":30000000}'

  t "PUT /team-leader/projects/{id}/phases/{phaseId}" PUT \
    "$BASE/team-leader/projects/$TL_PROJ_ID/phases/$NEW_PHASE_ID" "$TL" \
    '{"name":"Phase P2 Test Updated","budgetLimit":1000000}'
else
  REASON=$(echo "$NEW_PHASE_RESP" | _get_msg)
  echo "❌ POST /team-leader/projects/{id}/phases → $REASON"
  FAIL=$((FAIL+1))
  ERRORS="$ERRORS\n❌ POST /team-leader/projects/{id}/phases → $REASON"
  echo "   SKIP GET/PUT categories and PUT phases/{id} — phase create failed"
fi

# Members: use manager.it (id=5, dept 2, not yet a Project 1 member)
ADD_MBR_RESP=$(curl -s -X POST "$BASE/team-leader/projects/$TL_PROJ_ID/members" \
  -H "Authorization: Bearer $TL" -H "Content-Type: application/json" \
  -d '{"userId":5,"position":"Engineering Manager"}')
ADD_MBR_OK=$(echo "$ADD_MBR_RESP" | _check_ok)
if [[ "$ADD_MBR_OK" == OK* ]]; then
  echo "✅ POST /team-leader/projects/{id}/members (manager.it, id=5)"
  PASS=$((PASS+1))

  t "PUT /team-leader/projects/{id}/members/{userId}" PUT \
    "$BASE/team-leader/projects/$TL_PROJ_ID/members/5" "$TL" \
    '{"position":"Senior Engineering Manager"}'

  t "DELETE /team-leader/projects/{id}/members/{userId}" DELETE \
    "$BASE/team-leader/projects/$TL_PROJ_ID/members/5" "$TL"
else
  echo "❌ POST /team-leader/projects/{id}/members → $ADD_MBR_OK"
  FAIL=$((FAIL+1))
  ERRORS="$ERRORS\n❌ POST /team-leader/projects/{id}/members → $ADD_MBR_OK"
  echo "   SKIP PUT/DELETE members — add failed"
fi
echo ""

# ── §8 PROJECT_TOPUP → Manager approvals ────────────────────────────────────
# TL creates two PROJECT_TOPUP for Project 1: D (MGR approves), E (MGR rejects).
# Department wallet (dept 2) has 20B — sufficient for both.
echo "=== §8 PROJECT_TOPUP + Manager approvals ==="
TOPUP_D_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $TL" -H "Content-Type: application/json" \
  -d '{"type":"PROJECT_TOPUP","projectId":1,"amount":500000,"description":"P2 topup D - MGR approve test"}')
TOPUP_D_ID=$(echo "$TOPUP_D_RESP" | _get_id)
[ -n "$TOPUP_D_ID" ] && echo "  ✓ PROJECT_TOPUP D created (id=$TOPUP_D_ID)" \
  || echo "  ⚠ PROJECT_TOPUP D failed: $(echo "$TOPUP_D_RESP" | _get_msg)"

TOPUP_E_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $TL" -H "Content-Type: application/json" \
  -d '{"type":"PROJECT_TOPUP","projectId":1,"amount":600000,"description":"P2 topup E - MGR reject test"}')
TOPUP_E_ID=$(echo "$TOPUP_E_RESP" | _get_id)
[ -n "$TOPUP_E_ID" ] && echo "  ✓ PROJECT_TOPUP E created (id=$TOPUP_E_ID)" \
  || echo "  ⚠ PROJECT_TOPUP E failed: $(echo "$TOPUP_E_RESP" | _get_msg)"

[ -n "$TOPUP_D_ID" ] && t "GET /manager/approvals/{id}" GET \
  "$BASE/manager/approvals/$TOPUP_D_ID" "$MGR" \
  || echo "⚠️  SKIP GET /manager/approvals/{id} — TOPUP_D_ID not set"

[ -n "$TOPUP_D_ID" ] && t "POST /manager/approvals/{id}/approve" POST \
  "$BASE/manager/approvals/$TOPUP_D_ID/approve" "$MGR" '{"comment":"P2 approve - dept has funds"}' \
  || echo "⚠️  SKIP POST /manager/approvals/{id}/approve — TOPUP_D_ID not set"

[ -n "$TOPUP_E_ID" ] && t "POST /manager/approvals/{id}/reject" POST \
  "$BASE/manager/approvals/$TOPUP_E_ID/reject" "$MGR" '{"reason":"P2 reject - insufficient justification"}' \
  || echo "⚠️  SKIP POST /manager/approvals/{id}/reject — TOPUP_E_ID not set"
echo ""

# ── §9 DEPARTMENT_TOPUP → CFO approvals ──────────────────────────────────────
# MGR creates two DEPARTMENT_TOPUP: F (CFO approves), G (CFO rejects).
# COMPANY_FUND has 50B+ — sufficient for approve.
echo "=== §9 DEPARTMENT_TOPUP + CFO approvals ==="
DTOPUP_F_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $MGR" -H "Content-Type: application/json" \
  -d '{"type":"DEPARTMENT_TOPUP","amount":1000000,"description":"P2 dept topup F - CFO approve test"}')
DTOPUP_F_ID=$(echo "$DTOPUP_F_RESP" | _get_id)
[ -n "$DTOPUP_F_ID" ] && echo "  ✓ DEPARTMENT_TOPUP F created (id=$DTOPUP_F_ID)" \
  || echo "  ⚠ DEPARTMENT_TOPUP F failed: $(echo "$DTOPUP_F_RESP" | _get_msg)"

DTOPUP_G_RESP=$(curl -s -X POST "$BASE/requests" \
  -H "Authorization: Bearer $MGR" -H "Content-Type: application/json" \
  -d '{"type":"DEPARTMENT_TOPUP","amount":2000000,"description":"P2 dept topup G - CFO reject test"}')
DTOPUP_G_ID=$(echo "$DTOPUP_G_RESP" | _get_id)
[ -n "$DTOPUP_G_ID" ] && echo "  ✓ DEPARTMENT_TOPUP G created (id=$DTOPUP_G_ID)" \
  || echo "  ⚠ DEPARTMENT_TOPUP G failed: $(echo "$DTOPUP_G_RESP" | _get_msg)"

[ -n "$DTOPUP_F_ID" ] && t "GET /cfo/approvals/{id}" GET \
  "$BASE/cfo/approvals/$DTOPUP_F_ID" "$CFO" \
  || echo "⚠️  SKIP GET /cfo/approvals/{id} — DTOPUP_F_ID not set"

[ -n "$DTOPUP_F_ID" ] && t "POST /cfo/approvals/{id}/approve" POST \
  "$BASE/cfo/approvals/$DTOPUP_F_ID/approve" "$CFO" '{"comment":"P2 approve - budget approved"}' \
  || echo "⚠️  SKIP POST /cfo/approvals/{id}/approve — DTOPUP_F_ID not set"

[ -n "$DTOPUP_G_ID" ] && t "POST /cfo/approvals/{id}/reject" POST \
  "$BASE/cfo/approvals/$DTOPUP_G_ID/reject" "$CFO" '{"reason":"P2 reject - budget exceeded"}' \
  || echo "⚠️  SKIP POST /cfo/approvals/{id}/reject — DTOPUP_G_ID not set"
echo ""

# ── §10 POST /accountant/disbursements/{id}/reject ────────────────────────────
# Request C was TL-approved in §4 (status = APPROVED_BY_TEAM_LEADER).
# Accountant disbursements list always shows APPROVED_BY_TEAM_LEADER requests.
# Use REQ_C_ID directly (disbursement list id = request id).
echo "=== §10 POST /accountant/disbursements/{id}/reject ==="
if [ -n "$REQ_C_ID" ]; then
  # Verify request C is in APPROVED_BY_TEAM_LEADER status before reject
  DISB_STATUS=$(curl -s "$BASE/accountant/disbursements/$REQ_C_ID" \
    -H "Authorization: Bearer $ACC" \
    | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.data&&r.data.status||'')}catch(e){}})")
  if [ "$DISB_STATUS" = "APPROVED_BY_TEAM_LEADER" ]; then
    t "POST /accountant/disbursements/{id}/reject" POST \
      "$BASE/accountant/disbursements/$REQ_C_ID/reject" "$ACC" \
      '{"reason":"P2 test reject - missing supporting documents"}'
  else
    echo "⚠️  SKIP POST /accountant/disbursements/{id}/reject — request C status=$DISB_STATUS (expected APPROVED_BY_TEAM_LEADER)"
    echo "   Check if TL approve (§4) succeeded"
  fi
else
  echo "⚠️  SKIP — REQ_C_ID not set"
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "=============================="
echo "Phase 2 RESULTS: $PASS passed, $FAIL failed"
[ -n "$ERRORS" ] && printf "\nFailed endpoints:%b\n" "$ERRORS"
echo "=============================="
