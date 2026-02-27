// ============================================================================
// VocabFlow - Browser Console Helpers
// Pega este archivo en la consola del navegador (DevTools > Console)
// mientras la app está abierta y logueada.
//
// Uso rápido:
//   1. Abre la app en el navegador
//   2. Abre DevTools (F12 o Cmd+Option+I)
//   3. Ve a la pestaña Console
//   4. Copia y pega todo este archivo
//   5. Usa las funciones: vf.session(), vf.review(), etc.
// ============================================================================

window.vf = (() => {
  const api = async (method, path, body) => {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json();
    console.log(`${method} ${path}`, res.status, data);
    return data;
  };

  return {
    // ─── Sesión ─────────────────────────────────────────────────────

    /** Obtener o crear la sesión de hoy */
    session: () => api("GET", "/api/session"),

    /** Generar palabras para una sesión */
    generate: (sessionId) =>
      api("POST", "/api/generate", { session_id: sessionId }),

    /** Flujo automático: obtener sesión + generar si es necesario */
    autoSession: async () => {
      const data = await api("GET", "/api/session");
      if (data.needs_generation && data.session?.id) {
        console.log("Generando palabras...");
        return api("POST", "/api/generate", {
          session_id: data.session.id,
        });
      }
      return data;
    },

    // ─── Palabras ───────────────────────────────────────────────────

    /** Marcar una palabra como aprendida */
    markLearned: (wordId) =>
      api("PATCH", `/api/words/${wordId}`, { is_learned: true }),

    /** Marcar una palabra como NO aprendida (revertir) */
    unmarkLearned: (wordId) =>
      api("PATCH", `/api/words/${wordId}`, { is_learned: false }),

    /** Marcar TODAS las palabras de la sesión actual como aprendidas */
    markAllLearned: async () => {
      const data = await api("GET", "/api/session");
      const words = (data.words || []).filter((w) => !w.is_learned);
      console.log(`Marcando ${words.length} palabras como aprendidas...`);
      for (const w of words) {
        await api("PATCH", `/api/words/${w.id}`, { is_learned: true });
      }
      console.log("Todas las palabras marcadas.");
      return { marked: words.length };
    },

    /** Ver todas las palabras del usuario */
    allWords: () => api("GET", "/api/words/all"),

    // ─── Repaso ─────────────────────────────────────────────────────

    /** Obtener palabras pendientes de repaso */
    review: () => api("GET", "/api/review"),

    /** Enviar resultado de repaso
     *  quality: 0=Again, 1=Hard, 3=Good, 5=Easy */
    submitReview: (wordId, quality = 3) =>
      api("POST", "/api/review/submit", { word_id: wordId, quality }),

    /** Repasar todas las palabras con calidad "Good" (3) */
    reviewAllGood: async () => {
      const data = await api("GET", "/api/review");
      const reviews = data.reviews || [];
      console.log(`Repasando ${reviews.length} palabras con Good(3)...`);
      for (const r of reviews) {
        const wordId = r.learned_words?.id || r.word_id;
        await api("POST", "/api/review/submit", {
          word_id: wordId,
          quality: 3,
        });
      }
      console.log("Todos los repasos completados.");
      return { reviewed: reviews.length };
    },

    // ─── Estadísticas ───────────────────────────────────────────────

    /** Ver estadísticas completas */
    stats: () => api("GET", "/api/stats"),

    // ─── Zustand Store (acceso directo al estado) ───────────────────

    /** Obtener el estado del session store */
    sessionStore: () => {
      // Zustand stores expose getState() on the hook
      try {
        // Access through React DevTools or global store
        const stores = document.querySelectorAll("[data-zustand]");
        console.log(
          "Tip: Instala React DevTools para inspeccionar stores.",
          "\nO usa: vf.session() para ver el estado del servidor."
        );
      } catch {
        console.log("Usa vf.session() para ver el estado.");
      }
    },

    // ─── Dev API (solo desarrollo) ─────────────────────────────────

    /** Ver estado completo del usuario (perfil, sesión, repasos) */
    inspect: () => api("POST", "/api/dev", { action: "inspect" }),

    /** Forzar que N palabras estén listas para repaso hoy */
    forceReviews: (limit = 999) =>
      api("POST", "/api/dev", { action: "force-reviews", limit }),

    /** Borrar sesión de hoy (se regenera al recargar) */
    resetSession: () =>
      api("POST", "/api/dev", { action: "reset-session" }),

    /** Cambiar streak: vf.setStreak(7) o vf.setStreak(5, 10) */
    setStreak: (current = 0, longest) =>
      api("POST", "/api/dev", {
        action: "set-streak",
        current,
        longest: longest ?? current,
      }),

    /** Borrar TODO el progreso (mantiene cuenta e intereses) */
    resetProgress: () =>
      api("POST", "/api/dev", { action: "reset-progress" }),

    /** Insertar palabras de prueba en la sesión de hoy */
    seedWords: () => api("POST", "/api/dev", { action: "seed-words" }),

    /** Marcar todas las palabras de hoy como aprendidas (server-side) */
    completeSession: () =>
      api("POST", "/api/dev", { action: "complete-session" }),

    /**
     * Preparar el escenario de repaso completo:
     * 1. Completa la sesión de hoy
     * 2. Fuerza todos los repasos para hoy
     * 3. Recarga la página en /review
     */
    setupReview: async () => {
      console.log("1. Completando sesión...");
      await api("POST", "/api/dev", { action: "complete-session" });
      console.log("2. Forzando repasos para hoy...");
      await api("POST", "/api/dev", { action: "force-reviews" });
      console.log("3. Listo! Navega a /review o recarga la página.");
      if (window.location.pathname !== "/review") {
        console.log("   Redirigiendo a /review...");
        window.location.href = "/review";
      } else {
        window.location.reload();
      }
    },

    /**
     * Preparar el escenario de nueva sesión:
     * 1. Borra la sesión de hoy
     * 2. Recarga la página
     */
    setupNewSession: async () => {
      console.log("1. Borrando sesión de hoy...");
      await api("POST", "/api/dev", { action: "reset-session" });
      console.log("2. Recargando...");
      if (window.location.pathname !== "/session") {
        window.location.href = "/session";
      } else {
        window.location.reload();
      }
    },

    // ─── Utilidades de debugging ────────────────────────────────────

    /** Health check del API */
    health: () => api("GET", "/api/health"),

    /** Simular un flujo completo: sesión → generar → marcar todo → repasar */
    fullFlow: async () => {
      console.log("=== FLUJO COMPLETO ===\n");

      console.log("1. Obteniendo sesión...");
      const sessionData = await api("GET", "/api/session");

      if (sessionData.needs_generation && sessionData.session?.id) {
        console.log("\n2. Generando palabras...");
        const genData = await api("POST", "/api/generate", {
          session_id: sessionData.session.id,
        });

        if (genData.words?.length) {
          console.log("\n3. Marcando primera palabra como aprendida...");
          await api("PATCH", `/api/words/${genData.words[0].id}`, {
            is_learned: true,
          });
        }
      }

      console.log("\n4. Verificando repasos...");
      await api("GET", "/api/review");

      console.log("\n5. Estadísticas...");
      await api("GET", "/api/stats");

      console.log("\n=== FIN DEL FLUJO ===");
    },

    // ─── Ayuda ──────────────────────────────────────────────────────

    help: () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║              VocabFlow - Browser Helpers (vf.*)             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  SESIÓN                                                      ║
║    vf.session()          - Obtener sesión de hoy             ║
║    vf.generate(id)       - Generar palabras                  ║
║    vf.autoSession()      - Sesión + generar automático       ║
║                                                              ║
║  PALABRAS                                                    ║
║    vf.markLearned(id)    - Marcar como aprendida             ║
║    vf.unmarkLearned(id)  - Revertir aprendida                ║
║    vf.markAllLearned()   - Marcar todas como aprendidas      ║
║    vf.allWords()         - Ver todas las palabras            ║
║                                                              ║
║  REPASO                                                      ║
║    vf.review()           - Palabras pendientes de repaso     ║
║    vf.submitReview(id,q) - Enviar repaso (q: 0/1/3/5)       ║
║    vf.reviewAllGood()    - Repasar todo con "Good"           ║
║                                                              ║
║  DEV (solo desarrollo)                                       ║
║    vf.inspect()          - Ver estado completo               ║
║    vf.forceReviews(n)    - Forzar n repasos para hoy        ║
║    vf.resetSession()     - Borrar sesión de hoy              ║
║    vf.setStreak(n)       - Cambiar streak                    ║
║    vf.resetProgress()    - Reset total (mantiene cuenta)     ║
║    vf.seedWords()        - Insertar palabras de prueba       ║
║    vf.completeSession()  - Completar sesión al instante      ║
║                                                              ║
║  ATAJOS DE ESCENARIO                                         ║
║    vf.setupReview()      - Preparar todo para probar repaso  ║
║    vf.setupNewSession()  - Preparar nueva sesión limpia      ║
║                                                              ║
║  UTILIDADES                                                  ║
║    vf.stats()            - Estadísticas completas            ║
║    vf.health()           - Health check                      ║
║    vf.fullFlow()         - Flujo completo automático         ║
║    vf.help()             - Mostrar esta ayuda                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    },
  };
})();

// Mostrar ayuda automáticamente al cargar
vf.help();
