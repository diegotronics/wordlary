#!/usr/bin/env bash
# ============================================================================
# VocabFlow - API Testing Helper
# Uso: ./scripts/test-api.sh <comando> [opciones]
#
# Requisitos:
#   - La app corriendo en localhost:3000 (npm run dev)
#   - Cookie de sesión de Supabase (se extrae del navegador)
#
# Para obtener tu cookie de sesión:
#   1. Abre la app en el navegador y logueate
#   2. Abre DevTools > Application > Cookies
#   3. Copia el valor de la cookie que empieza con "sb-"
#   4. Exporta: export VOCABFLOW_COOKIE="sb-xxx-auth-token=..."
#
# Alternativa más fácil: usa las funciones de browser-helpers.js
# directamente desde la consola del navegador.
# ============================================================================

set -euo pipefail

BASE_URL="${VOCABFLOW_URL:-http://localhost:3000}"
COOKIE="${VOCABFLOW_COOKIE:-}"

if [ -z "$COOKIE" ]; then
  echo "⚠  VOCABFLOW_COOKIE no está configurada."
  echo "   Exporta tu cookie de sesión:"
  echo "   export VOCABFLOW_COOKIE=\"sb-xxx-auth-token=...\""
  echo ""
  echo "   O usa browser-helpers.js desde la consola del navegador."
  echo ""
fi

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"
}

print_response() {
  local status=$1
  local body=$2
  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    echo -e "${GREEN}Status: $status${NC}"
  else
    echo -e "${RED}Status: $status${NC}"
  fi
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
}

api_call() {
  local method=$1
  local endpoint=$2
  local data=${3:-}

  local args=(-s -w "\n%{http_code}" -X "$method")
  args+=(-H "Content-Type: application/json")

  if [ -n "$COOKIE" ]; then
    args+=(-b "$COOKIE")
  fi

  if [ -n "$data" ]; then
    args+=(-d "$data")
  fi

  local response
  response=$(curl "${args[@]}" "${BASE_URL}${endpoint}")

  local status
  status=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | sed '$d')

  print_response "$status" "$body"
}

# ─── Comandos ──────────────────────────────────────────────────────────────

cmd_session() {
  print_header "GET /api/session - Obtener/crear sesión de hoy"
  api_call GET "/api/session"
}

cmd_generate() {
  local session_id=${1:-}
  if [ -z "$session_id" ]; then
    echo -e "${YELLOW}Uso: $0 generate <session_id>${NC}"
    echo "  Obtén el session_id con: $0 session"
    return 1
  fi
  print_header "POST /api/generate - Generar palabras"
  api_call POST "/api/generate" "{\"session_id\": \"$session_id\"}"
}

cmd_mark_learned() {
  local word_id=${1:-}
  if [ -z "$word_id" ]; then
    echo -e "${YELLOW}Uso: $0 mark <word_id>${NC}"
    return 1
  fi
  print_header "PATCH /api/words/$word_id - Marcar como aprendida"
  api_call PATCH "/api/words/$word_id" '{"is_learned": true}'
}

cmd_review() {
  print_header "GET /api/review - Obtener palabras para repasar"
  api_call GET "/api/review"
}

cmd_submit_review() {
  local word_id=${1:-}
  local quality=${2:-3}
  if [ -z "$word_id" ]; then
    echo -e "${YELLOW}Uso: $0 submit <word_id> [quality]${NC}"
    echo "  quality: 0=Again, 1=Hard, 3=Good (default), 5=Easy"
    return 1
  fi
  print_header "POST /api/review/submit - Enviar resultado de repaso"
  api_call POST "/api/review/submit" "{\"word_id\": \"$word_id\", \"quality\": $quality}"
}

cmd_stats() {
  print_header "GET /api/stats - Estadísticas del usuario"
  api_call GET "/api/stats"
}

cmd_health() {
  print_header "GET /api/health - Health check"
  api_call GET "/api/health"
}

cmd_all_words() {
  print_header "GET /api/words/all - Todas las palabras"
  api_call GET "/api/words/all"
}

cmd_full_flow() {
  print_header "FLUJO COMPLETO: Sesión → Generar → Marcar → Repasar"

  echo -e "\n${BLUE}Paso 1: Obtener sesión${NC}"
  local session_response
  session_response=$(curl -s -b "$COOKIE" -H "Content-Type: application/json" "${BASE_URL}/api/session")
  echo "$session_response" | python3 -m json.tool 2>/dev/null

  local session_id
  session_id=$(echo "$session_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session',{}).get('id',''))" 2>/dev/null)
  local needs_gen
  needs_gen=$(echo "$session_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('needs_generation', False))" 2>/dev/null)

  if [ "$needs_gen" = "True" ] && [ -n "$session_id" ]; then
    echo -e "\n${BLUE}Paso 2: Generar palabras${NC}"
    local gen_response
    gen_response=$(curl -s -b "$COOKIE" -H "Content-Type: application/json" -X POST -d "{\"session_id\": \"$session_id\"}" "${BASE_URL}/api/generate")
    echo "$gen_response" | python3 -m json.tool 2>/dev/null

    local first_word_id
    first_word_id=$(echo "$gen_response" | python3 -c "import sys,json; words=json.load(sys.stdin).get('words',[]); print(words[0]['id'] if words else '')" 2>/dev/null)

    if [ -n "$first_word_id" ]; then
      echo -e "\n${BLUE}Paso 3: Marcar primera palabra como aprendida${NC}"
      api_call PATCH "/api/words/$first_word_id" '{"is_learned": true}'
    fi
  else
    echo -e "\n${YELLOW}La sesión ya tiene palabras generadas${NC}"
  fi

  echo -e "\n${BLUE}Paso 4: Verificar repasos pendientes${NC}"
  api_call GET "/api/review"

  echo -e "\n${BLUE}Paso 5: Estadísticas${NC}"
  api_call GET "/api/stats"
}

# ─── Ayuda ─────────────────────────────────────────────────────────────────

cmd_help() {
  cat << 'EOF'

VocabFlow API Testing Helper

Comandos:
  session                    Obtener/crear la sesión de hoy
  generate <session_id>      Generar palabras para una sesión
  mark <word_id>             Marcar una palabra como aprendida
  review                     Ver palabras pendientes de repaso
  submit <word_id> [quality] Enviar resultado de repaso (0/1/3/5)
  stats                      Ver estadísticas del usuario
  words                      Ver todas las palabras aprendidas
  health                     Health check
  flow                       Ejecutar flujo completo automático

Ejemplos:
  ./scripts/test-api.sh session
  ./scripts/test-api.sh generate abc-123-def
  ./scripts/test-api.sh mark word-id-here
  ./scripts/test-api.sh submit word-id-here 5
  ./scripts/test-api.sh flow

EOF
}

# ─── Main ──────────────────────────────────────────────────────────────────

case "${1:-help}" in
  session)       cmd_session ;;
  generate|gen)  cmd_generate "${2:-}" ;;
  mark|learned)  cmd_mark_learned "${2:-}" ;;
  review)        cmd_review ;;
  submit)        cmd_submit_review "${2:-}" "${3:-3}" ;;
  stats)         cmd_stats ;;
  words)         cmd_all_words ;;
  health)        cmd_health ;;
  flow)          cmd_full_flow ;;
  help|--help|-h) cmd_help ;;
  *) echo -e "${RED}Comando desconocido: $1${NC}"; cmd_help ;;
esac
