(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 6);
  }

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (toggle.contains(event.target) || nav.contains(event.target)) return;
      setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });
  }

  // A short ease, faster than the browser's default smooth scroll.
  // The root scroll-behavior is forced to auto for the animation so each
  // frame moves instantly; otherwise every scrollTo restarts a smooth scroll.
  var quickScrollId = 0;
  var quickScrollRestore = null;
  function scrollQuickly(top) {
    var destination = Math.max(0, Math.round(top));
    var root = document.documentElement;
    quickScrollId += 1;
    var id = quickScrollId;
    if (quickScrollRestore === null) quickScrollRestore = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    function restore() {
      if (id !== quickScrollId) return;
      root.style.scrollBehavior = quickScrollRestore;
      quickScrollRestore = null;
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var start = window.pageYOffset;
    var change = destination - start;
    if (reduce || Math.abs(change) < 2) {
      window.scrollTo(0, destination);
      restore();
      return;
    }
    var duration = Math.min(560, Math.max(280, Math.abs(change) * 0.22));
    var startTime = 0;
    function step(now) {
      if (id !== quickScrollId) return;
      if (!startTime) startTime = now;
      var t = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, start + change * eased);
      if (t < 1) window.requestAnimationFrame(step);
      else restore();
    }
    window.requestAnimationFrame(step);
  }

  // "Get your Price Here" and the headline "NOW" link should land on the
  // pricing boxes, not only the heading. Nav and footer Pricing links stay
  // on the section itself.
  document.querySelectorAll("a.header-cta[href='#pricing'], .hero-actions a[href='#pricing'], h1 a[href='#pricing']").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var section = document.querySelector("#pricing");
      if (!section) return;
      event.preventDefault();
      var bar = document.querySelector(".site-header");
      var headerHeight = bar ? bar.offsetHeight : 0;
      var gap = 8;
      var head = section.querySelector(".section-head") || section;
      var tail = section.querySelector(".price-disclaimer") || section;
      var headTop = head.getBoundingClientRect().top + window.pageYOffset;
      var tailBottom = tail.getBoundingClientRect().bottom + window.pageYOffset;
      var available = window.innerHeight - headerHeight - gap * 2;
      var top = headTop - headerHeight - gap;
      if (tailBottom - headTop > available) {
        var grid = section.querySelector(".load-grid");
        if (grid) {
          var gridTop = grid.getBoundingClientRect().top + window.pageYOffset;
          var gridBottom = grid.getBoundingClientRect().bottom + window.pageYOffset;
          var gridHeight = gridBottom - gridTop;
          if (gridHeight <= available) {
            var room = available - gridHeight;
            var above = gridTop - headTop;
            top = gridTop - Math.min(above, room) - headerHeight - gap;
          }
        }
      }
      scrollQuickly(top);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "#pricing");
      }
    });
  });

  document.querySelectorAll("[data-photo]").forEach(function (slot) {
    var img = slot.querySelector("img");
    if (!img) return;

    function show() {
      if (img.naturalWidth > 0) slot.classList.remove("is-empty");
    }

    if (img.complete) show();
    img.addEventListener("load", show);
  });

  document.querySelectorAll("[data-compare]").forEach(function (card) {
    var beforeSrc = card.getAttribute("data-before");
    var afterSrc = card.getAttribute("data-after");
    var frame = card.querySelector(".compare");
    var before = card.querySelector(".compare-before");
    var after = card.querySelector(".compare-after");
    var range = card.querySelector('input[type="range"]');
    if (!frame || !before || !after || !range) return;

    function preload(src) {
      return new Promise(function (resolve) {
        var probe = new Image();
        probe.onload = function () {
          resolve(probe.naturalWidth > 0);
        };
        probe.onerror = function () {
          resolve(false);
        };
        probe.src = src;
      });
    }

    Promise.all([preload(beforeSrc), preload(afterSrc)]).then(function (results) {
      if (!results[0] || !results[1]) return;
      var pending = 2;
      function markReady() {
        pending -= 1;
        if (pending === 0) card.classList.add("is-ready");
      }
      before.alt = card.getAttribute("data-before-label") || "Before";
      after.alt = card.getAttribute("data-after-label") || "After";
      before.onload = markReady;
      after.onload = markReady;
      before.src = beforeSrc;
      after.src = afterSrc;
    });

    function setPosition(value) {
      frame.style.setProperty("--pos", value + "%");
      range.setAttribute("aria-valuetext", value + " percent before");
    }

    range.addEventListener("input", function () {
      setPosition(range.value);
    });
    setPosition(range.value);
  });

  var pricing = document.querySelector("#pricing");
  var priceGrid = pricing ? pricing.querySelector(".load-grid") : null;
  var prompt = document.querySelector("#discount-prompt");
  var promptGo = document.querySelector(".discount-prompt-go");
  var promptClose = document.querySelector(".discount-prompt-close");
  var wheelModal = document.querySelector("#wheel-modal");
  var wheelRotor = document.querySelector("#wheel-rotor");
  var wheelSpin = document.querySelector("#wheel-spin");
  var wheelResult = document.querySelector("#wheel-result");
  var wheelClose = document.querySelector(".wheel-close");
  var prizes = ["5% off", "$10 off", "$15 off", "$20 off", "$25 off", "10% off"];

  if (pricing && priceGrid && prompt && wheelModal && wheelRotor && wheelSpin) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var promptOpen = false;
    var wheelOpen = false;
    var finished = false;
    var rotation = 0;
    var idleId = 0;
    var lastTick = 0;
    var spinning = false;

    var mascotFaces = ["jacob", "evan", "tanner"];

    function pickMascotFace() {
      var name = mascotFaces[Math.floor(Math.random() * mascotFaces.length)];
      var mascot = prompt.querySelector(".mascot");
      var head = prompt.querySelector(".mascot-head");
      if (!mascot || !head) return;
      mascot.classList.remove("is-jacob", "is-evan", "is-tanner");
      mascot.classList.add("is-" + name);
      head.src = "images/mascot-" + name + "-head.png";
    }

    function openDiscountPrompt() {
      if (promptOpen || wheelOpen || finished) return;
      pickMascotFace();
      prompt.hidden = false;
      promptOpen = true;
      showCelebrate();
      showMoney();
    }

    var pageBlur = document.querySelector("#page-blur");

    function showBlur() {
      if (pageBlur) pageBlur.hidden = false;
    }

    function hideBlur() {
      if (pageBlur) pageBlur.hidden = true;
    }

    function hidePrompt(keepBlur) {
      prompt.hidden = true;
      promptOpen = false;
      stopCelebrate();
      if (!keepBlur) {
        hideBlur();
        stopMoney();
      } else {
        liftMoney();
      }
    }

    var celebrateLayer = document.querySelector("#celebrate");
    var celebrateCanvas = document.querySelector("#celebrate-canvas");
    var celebrateId = 0;
    var arrowMarkup = '<svg viewBox="0 0 320 140" aria-hidden="true"><path fill="#112f5b" d="M34 44h152l-16-30c18 12 62 34 138 56-76 22-120 44-138 56l16-30H34c-22 0-28-12-28-26s6-26 28-26z"/><path fill="#f59d38" d="M42 52h140l-10-22c16 10 54 28 120 40-66 12-104 30-120 40l10-22H42c-18 0-24-8-24-18s6-18 24-18z"/><path fill="#ffe7c4" d="M50 57h112c6 0 14 1 22 2-8 2-16 2-24 2H50c-6 0-8-1-8-2s2-2 8-2z"/><path fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7" d="M58 63h96"/></svg>';

    function stopCelebrate() {
      if (celebrateId) cancelAnimationFrame(celebrateId);
      celebrateId = 0;
      if (!celebrateLayer) return;
      celebrateLayer.hidden = true;
      var arrows = celebrateLayer.querySelector(".celebrate-arrows");
      if (arrows) arrows.innerHTML = "";
    }

    function placeArrows() {
      var arrows = celebrateLayer.querySelector(".celebrate-arrows");
      arrows.innerHTML = "";
      var rect = prompt.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var wide = window.innerWidth >= 640;
      var side = wide ? 88 : 54;
      var vert = wide ? 80 : 50;
      var spots = [
        { x: rect.left - side, y: cy, rot: 0 },
        { x: rect.right + side, y: cy, rot: 180 },
        { x: cx, y: rect.top - vert, rot: 90 },
        { x: cx, y: rect.bottom + vert, rot: -90 }
      ];
      var pad = wide ? 72 : 44;
      var minX = pad;
      var maxX = window.innerWidth - pad;
      var minY = pad;
      var maxY = window.innerHeight - pad;
      spots.forEach(function (spot) {
        spot.x = Math.max(minX, Math.min(maxX, spot.x));
        spot.y = Math.max(minY, Math.min(maxY, spot.y));
        var horizontal = Math.abs(spot.rot) !== 90;
        var boxW = horizontal ? (wide ? 120 : 78) : (wide ? 52 : 34);
        var boxH = horizontal ? (wide ? 52 : 34) : (wide ? 120 : 78);
        var overlapX = Math.min(spot.x + boxW / 2, rect.right) - Math.max(spot.x - boxW / 2, rect.left);
        var overlapY = Math.min(spot.y + boxH / 2, rect.bottom) - Math.max(spot.y - boxH / 2, rect.top);
        var depth = overlapX > 0 && overlapY > 0 ? (horizontal ? overlapX : overlapY) : 0;
        if (depth > 16) return;
        var arrow = document.createElement("div");
        arrow.className = "celebrate-arrow";
        arrow.style.left = spot.x + "px";
        arrow.style.top = spot.y + "px";
        arrow.style.setProperty("--rot", spot.rot + "deg");
        arrow.innerHTML = arrowMarkup;
        arrows.appendChild(arrow);
      });
    }

    function showCelebrate() {
      showBlur();
      if (!celebrateLayer || !celebrateCanvas) return;
      stopCelebrate();
      celebrateLayer.hidden = false;
      placeArrows();
      if (reduceMotion) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth;
      var h = window.innerHeight;
      celebrateCanvas.width = Math.round(w * dpr);
      celebrateCanvas.height = Math.round(h * dpr);
      var ctx = celebrateCanvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var rect = prompt.getBoundingClientRect();
      var ox = rect.left + rect.width / 2;
      var oy = rect.top + rect.height / 2;
      var colors = ["#f59d38", "#004c7c", "#1e9d4a", "#ffe08a", "#ffffff", "#ff5a7a", "#112f5b"];
      var showMs = 12000;
      var fadeAt = 9600;

      function makePiece(fromTop) {
        var ang = Math.random() * Math.PI * 2;
        var speed = 1.5 + Math.random() * 3.2;
        return {
          x: fromTop ? Math.random() * w : ox + (Math.random() - 0.5) * 80,
          y: fromTop ? -16 - Math.random() * 90 : oy + (Math.random() - 0.5) * 18,
          vx: fromTop ? (Math.random() - 0.5) * 1.8 : Math.cos(ang) * speed,
          vy: fromTop ? 1.1 + Math.random() * 2.2 : Math.sin(ang) * speed - 2.6,
          w: 6 + Math.random() * 8,
          ht: 3 + Math.random() * 5,
          color: colors[(Math.random() * colors.length) | 0],
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.28
        };
      }

      var pieces = [];
      var i;
      for (i = 0; i < 130; i++) pieces.push(makePiece(false));

      var fwColors = [
        ["#ffe08a", "#f59d38", "#ffffff"],
        ["#9be7ff", "#ffffff", "#004c7c"],
        ["#b6f5c8", "#1e9d4a", "#ffffff"],
        ["#ffd0dc", "#ff5a7a", "#ffe08a"],
        ["#f59d38", "#ffffff", "#112f5b"]
      ];
      var shots = [
        { dx: -190, dy: -150, delay: 0 },
        { dx: 200, dy: -130, delay: 240 },
        { dx: 8, dy: -230, delay: 520 },
        { dx: -170, dy: 150, delay: 820 },
        { dx: 180, dy: 140, delay: 1120 },
        { dx: -230, dy: -36, delay: 1900 },
        { dx: 220, dy: -48, delay: 2700 },
        { dx: -20, dy: -250, delay: 3500 },
        { dx: 150, dy: -190, delay: 4400 },
        { dx: -186, dy: -168, delay: 5300 },
        { dx: 206, dy: 16, delay: 6200 },
        { dx: 4, dy: -176, delay: 7100 },
        { dx: -130, dy: 124, delay: 8000 },
        { dx: 164, dy: -210, delay: 8900 }
      ];
      var plans = shots.map(function (shot, index) {
        return {
          x: Math.max(40, Math.min(w - 40, ox + shot.dx)),
          y: Math.max(64, Math.min(h - 80, oy + shot.dy)),
          delay: shot.delay,
          colors: fwColors[index % fwColors.length],
          sparks: null,
          born: 0
        };
      });

      function ignite(plan, ts) {
        plan.born = ts;
        plan.sparks = [];
        var n = 78;
        for (var s = 0; s < n; s++) {
          var a = (Math.PI * 2 * s) / n + Math.random() * 0.08;
          var sp = 1.35 + Math.random() * 2.5;
          plan.sparks.push({
            x: plan.x,
            y: plan.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.9 + Math.random() * 0.35,
            decay: 0.0045 + Math.random() * 0.0025,
            size: 2.5 + Math.random() * 2.6,
            color: plan.colors[s % plan.colors.length]
          });
        }
      }

      function fade(elapsedMs) {
        if (elapsedMs < fadeAt) return 1;
        return Math.max(0, 1 - (elapsedMs - fadeAt) / (showMs - fadeAt));
      }

      var started = performance.now();
      var nextPop = 640;
      function frame(ts) {
        var elapsed = ts - started;
        var alpha = fade(elapsed);
        ctx.clearRect(0, 0, w, h);
        if (elapsed > nextPop && elapsed < fadeAt && pieces.length < 220) {
          nextPop += 640;
          for (var n = 0; n < 26; n++) pieces.push(makePiece(n % 2 === 0));
        }
        pieces.forEach(function (piece) {
          piece.vy += 0.028;
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.vx *= 0.992;
          piece.rot += piece.vr;
          if (piece.y > h + 30 && elapsed < fadeAt) {
            var again = makePiece(true);
            piece.x = again.x;
            piece.y = again.y;
            piece.vx = again.vx;
            piece.vy = again.vy;
            piece.w = again.w;
            piece.ht = again.ht;
            piece.color = again.color;
            piece.rot = again.rot;
            piece.vr = again.vr;
          }
          if (alpha <= 0) return;
          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rot);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = piece.color;
          ctx.fillRect(-piece.w / 2, -piece.ht / 2, piece.w, piece.ht);
          ctx.restore();
        });
        plans.forEach(function (plan) {
          if (!plan.sparks && elapsed >= plan.delay) ignite(plan, ts);
          if (!plan.sparks) return;
          var age = (ts - plan.born) / 520;
          if (age < 1.15 && alpha > 0) {
            ctx.globalAlpha = Math.max(0, (1 - age) * alpha);
            ctx.strokeStyle = "#fff7d6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(plan.x, plan.y, 10 + age * 86, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = Math.max(0, (0.9 - age) * alpha);
            ctx.fillStyle = "#fffef6";
            ctx.beginPath();
            ctx.arc(plan.x, plan.y, 14 * (1 - Math.min(age, 1)), 0, Math.PI * 2);
            ctx.fill();
          }
          plan.sparks.forEach(function (spark) {
            if (spark.life <= 0) return;
            spark.life -= spark.decay;
            spark.vy += 0.008;
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vx *= 0.99;
            spark.vy *= 0.99;
            if (spark.life <= 0 || alpha <= 0) return;
            var glow = alpha * Math.max(spark.life, 0);
            ctx.globalAlpha = glow;
            ctx.fillStyle = spark.color;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * (0.5 + 0.5 * spark.life), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = glow * 0.4;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * 0.42, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        ctx.globalAlpha = 1;
        if (elapsed < showMs) celebrateId = requestAnimationFrame(frame);
        else {
          celebrateId = 0;
          ctx.clearRect(0, 0, w, h);
        }
      }
      celebrateId = requestAnimationFrame(frame);
    }

    var wheelScrim = document.querySelector("#wheel-scrim");
    var moneyLayer = document.querySelector("#money-rain");
    var moneyCanvas = document.querySelector("#money-canvas");
    var moneyId = 0;
    var moneyOn = false;

    function showScrim() {
      if (wheelScrim) wheelScrim.hidden = false;
    }

    function hideScrim() {
      if (wheelScrim) wheelScrim.hidden = true;
    }

    function stopMoney() {
      if (moneyId) cancelAnimationFrame(moneyId);
      moneyId = 0;
      moneyOn = false;
      if (!moneyLayer) return;
      moneyLayer.hidden = true;
      moneyLayer.classList.remove("is-over-wheel");
      if (!moneyCanvas) return;
      var ctx = moneyCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, moneyCanvas.width, moneyCanvas.height);
    }

    function liftMoney() {
      if (moneyLayer) moneyLayer.classList.add("is-over-wheel");
    }

    function roundBill(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function showMoney() {
      if (moneyOn || reduceMotion || !moneyLayer || !moneyCanvas) return;
      moneyOn = true;
      moneyLayer.hidden = false;
      var greens = ["#1b7a43", "#146b38", "#22884c", "#0e6336"];
      var bills = [];
      var count = window.innerWidth < 640 ? 14 : 24;

      function makeBill(scatter) {
        var bw = 40 + Math.random() * 26;
        return {
          x: Math.random() * window.innerWidth,
          y: scatter ? Math.random() * window.innerHeight * 0.85 : -30 - Math.random() * 160,
          vy: 1.15 + Math.random() * 1.45,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.018 + Math.random() * 0.028,
          rot: (Math.random() - 0.5) * 0.9,
          vr: (Math.random() - 0.5) * 0.02,
          w: bw,
          h: bw * 0.46,
          color: greens[(Math.random() * greens.length) | 0]
        };
      }

      var i;
      for (i = 0; i < count; i++) bills.push(makeBill(true));

      function drawBill(ctx, bill) {
        var w = bill.w;
        var h = bill.h;
        ctx.save();
        ctx.translate(bill.x, bill.y);
        ctx.rotate(bill.rot);
        ctx.fillStyle = "rgba(17, 47, 91, 0.16)";
        roundBill(ctx, -w / 2 + 2, -h / 2 + 3, w, h, 3);
        ctx.fill();
        ctx.fillStyle = bill.color;
        roundBill(ctx, -w / 2, -h / 2, w, h, 3);
        ctx.fill();
        ctx.strokeStyle = "#e7f8df";
        ctx.lineWidth = 1.25;
        roundBill(ctx, -w / 2 + 2.2, -h / 2 + 2.2, w - 4.4, h - 4.4, 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.18, h * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#f3fff0";
        ctx.font = "700 " + Math.max(10, Math.round(h * 0.62)) + "px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0.5);
        ctx.font = "700 " + Math.max(7, Math.round(h * 0.28)) + "px Outfit, sans-serif";
        ctx.fillText("$", -w / 2 + 7, -h / 2 + h * 0.28);
        ctx.restore();
      }

      function frame() {
        if (!moneyOn) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = window.innerWidth;
        var h = window.innerHeight;
        var pw = Math.round(w * dpr);
        var ph = Math.round(h * dpr);
        if (moneyCanvas.width !== pw || moneyCanvas.height !== ph) {
          moneyCanvas.width = pw;
          moneyCanvas.height = ph;
        }
        var ctx = moneyCanvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        bills.forEach(function (bill) {
          bill.sway += bill.swaySpeed;
          bill.x += Math.sin(bill.sway) * 0.7;
          bill.y += bill.vy;
          bill.rot += bill.vr;
          if (bill.y > h + 36) {
            bill.y = -28 - Math.random() * 120;
            bill.x = Math.random() * w;
          }
          if (bill.x < -40) bill.x = w + 20;
          if (bill.x > w + 40) bill.x = -20;
          drawBill(ctx, bill);
        });
        moneyId = requestAnimationFrame(frame);
      }

      moneyId = requestAnimationFrame(frame);
    }

    function stopIdle() {
      if (idleId) {
        cancelAnimationFrame(idleId);
        idleId = 0;
      }
      lastTick = 0;
    }

    function idleFrame(ts) {
      if (!lastTick) lastTick = ts;
      var dt = Math.min(64, ts - lastTick);
      lastTick = ts;
      rotation = (rotation + dt * 0.09) % 360;
      wheelRotor.style.transform = "rotate(" + rotation + "deg)";
      idleId = requestAnimationFrame(idleFrame);
    }

    function startIdle() {
      stopIdle();
      wheelRotor.style.transition = "none";
      if (reduceMotion || finished) {
        wheelRotor.style.transform = "rotate(" + rotation + "deg)";
        return;
      }
      idleId = requestAnimationFrame(idleFrame);
    }

    function openWheel() {
      hidePrompt(true);
      showScrim();
      wheelModal.hidden = false;
      wheelOpen = true;
      document.body.style.overflow = "hidden";
      wheelResult.hidden = true;
      wheelResult.textContent = "";
      wheelSpin.disabled = finished;
      startIdle();
      wheelSpin.focus();
    }

    function closeWheel() {
      wheelModal.hidden = true;
      wheelOpen = false;
      document.body.style.overflow = "";
      hideScrim();
      hideBlur();
      stopMoney();
      stopIdle();
    }

    function formatPrice(amount) {
      var cents = Math.round(amount * 100);
      var whole = Math.floor(Math.abs(cents) / 100);
      var frac = Math.abs(cents) % 100;
      if (frac === 0) return "$" + whole;
      return "$" + whole + "." + (frac < 10 ? "0" : "") + frac;
    }

    function discounted(base, label) {
      var percent = /^(\d+)% off$/.exec(label);
      if (percent) return base * (1 - Number(percent[1]) / 100);
      var dollars = /^\$(\d+) off$/.exec(label);
      if (dollars) return Math.max(0, base - Number(dollars[1]));
      return base;
    }

    function showWonPrices(label) {
      document.querySelectorAll("#pricing [data-price]").forEach(function (el) {
        if (el.querySelector("s")) return;
        var base = Number(el.getAttribute("data-price"));
        var next = discounted(base, label);
        var oldPrice = document.createElement("s");
        oldPrice.textContent = formatPrice(base);
        var now = document.createElement("span");
        now.className = "price-new";
        now.textContent = formatPrice(next);
        el.textContent = "";
        el.classList.add("price-pair");
        el.setAttribute("aria-label", "was " + formatPrice(base) + ", now " + formatPrice(next));
        el.appendChild(oldPrice);
        el.appendChild(now);
      });
      document.dispatchEvent(new Event("hm-prices"));
    }

    function landedIndex(angle) {
      var mod = ((angle % 360) + 360) % 360;
      var local = (360 - mod) % 360;
      return Math.floor(local / 60) % prizes.length;
    }

    function spinWheel() {
      if (spinning || finished) return;
      spinning = true;
      wheelSpin.disabled = true;
      stopMoney();
      stopIdle();
      var index = Math.floor(Math.random() * prizes.length);
      var center = index * 60 + 30;
      var targetMod = (360 - center) % 360;
      var currentMod = ((rotation % 360) + 360) % 360;
      var delta = targetMod - currentMod;
      if (delta <= 0) delta += 360;
      rotation = currentMod + delta + 5 * 360;
      wheelRotor.style.transition = reduceMotion
        ? "transform 1.1s ease-out"
        : "transform 5.4s cubic-bezier(0.12, 0.62, 0.08, 1)";
      wheelRotor.getBoundingClientRect();
      wheelRotor.style.transform = "rotate(" + rotation + "deg)";

      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        wheelRotor.removeEventListener("transitionend", done);
        spinning = false;
        finished = true;
        var landed = landedIndex(rotation);
        var label = prizes[landed];
        wheelResult.hidden = false;
        wheelResult.textContent = "You landed on " + label + ".";
        showWonPrices(label);
        window.setTimeout(function () {
          if (wheelOpen) closeWheel();
          priceGrid.scrollIntoView({ block: "center" });
        }, 1600);
      }

      wheelRotor.addEventListener("transitionend", done);
      window.setTimeout(done, reduceMotion ? 80 : 5600);
    }

    document.addEventListener("hm-load-selected", function (event) {
      var priced = event.detail && event.detail.priced;
      if (!priced) {
        if (promptOpen && !wheelOpen) hidePrompt();
        return;
      }
      openDiscountPrompt();
    });

    document.addEventListener("hm-photo-ready", function () {
      openDiscountPrompt();
    });

    promptGo.addEventListener("click", openWheel);
    promptClose.addEventListener("click", function () {
      hidePrompt();
    });
    wheelSpin.addEventListener("click", spinWheel);
    wheelClose.addEventListener("click", closeWheel);
    wheelModal.addEventListener("click", function (event) {
      if (event.target === wheelModal) closeWheel();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && wheelOpen) closeWheel();
    });
  }

  (function () {
    var uploadBtn = document.querySelector("#truck-upload");
    var sources = document.querySelector("#truck-sources");
    var takeBtn = document.querySelector("#truck-take");
    var libraryBtn = document.querySelector("#truck-library");
    var cameraInput = document.querySelector("#truck-camera");
    var libraryInput = document.querySelector("#truck-photo");
    var cam = document.querySelector("#truck-cam");
    var camVideo = document.querySelector("#truck-cam-video");
    var camCancel = document.querySelector("#truck-cam-cancel");
    var camSnap = document.querySelector("#truck-cam-snap");
    var fill = document.querySelector("#truck-fill");
    var interior = document.querySelector("#truck-interior");
    var svg = document.querySelector(".truck-svg");
    var pctText = document.querySelector("#truck-pct");
    var result = document.querySelector("#truck-result");
    var percentEl = document.querySelector("#truck-percent");
    var tierEl = document.querySelector("#truck-tier");
    var costEl = document.querySelector("#truck-cost");
    var waiting = document.querySelector("#truck-waiting");
    var preview = document.querySelector("#truck-preview");
    var status = document.querySelector("#truck-status");
    var compareEl = document.querySelector("#truck-compare");
    var loadStatus = document.querySelector("#load-photo-status");
    if (!uploadBtn || !sources || !takeBtn || !libraryBtn || !cameraInput || !libraryInput || !cam || !fill || !interior || !svg || !result) return;

    document.querySelectorAll('a[href="#truck-upload"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var header = document.querySelector(".site-header");
        var truck = document.querySelector(".truck-stage");
        var headerHeight = header ? header.offsetHeight : 0;
        var anchor = truck || uploadBtn;
        var top = anchor.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8;
        scrollQuickly(top);
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", "#truck-upload");
        }
      });
    });

    var cameraStream = null;
    var phoneCamera = window.matchMedia("(pointer: coarse)").matches;
    var selectedCard = null;
    var pendingFromGrid = false;

    var tiers = [
      { max: 6, name: "Minimum pickup" },
      { max: 12.5, name: "1/8 truck" },
      { max: 25, name: "1/4 truck" },
      { max: 50, name: "1/2 truck" },
      { max: 75, name: "3/4 truck" },
      { max: 100, name: "Full truck" }
    ];
    var lastTier = "";

    function tierFor(percent) {
      for (var i = 0; i < tiers.length; i++) {
        if (percent <= tiers[i].max) return tiers[i];
      }
      return tiers[tiers.length - 1];
    }

    function livePrice(name) {
      var cards = document.querySelectorAll("#pricing .load");
      for (var i = 0; i < cards.length; i++) {
        var label = cards[i].querySelector("span");
        if (!label || label.textContent.trim() !== name) continue;
        var newer = cards[i].querySelector(".price-new");
        var struck = cards[i].querySelector("s");
        if (newer) {
          return {
            now: newer.textContent.trim(),
            was: struck ? struck.textContent.trim() : ""
          };
        }
        var strong = cards[i].querySelector("strong");
        return {
          now: strong ? strong.textContent.replace(/\s+/g, " ").trim() : "",
          was: ""
        };
      }
      return { now: "", was: "" };
    }

    function money(text) {
      var n = Number(String(text).replace(/[^0-9.]/g, ""));
      return isNaN(n) ? 0 : n;
    }

    function formatMoney(amount) {
      var cents = Math.round(amount * 100);
      var whole = Math.floor(cents / 100);
      var frac = cents % 100;
      if (frac === 0) return "$" + whole;
      return "$" + whole + "." + (frac < 10 ? "0" : "") + frac;
    }

    function paintPrice(name) {
      var offer = livePrice(name);
      var deal = Boolean(offer.was && offer.was !== offer.now);
      costEl.textContent = "";
      costEl.classList.toggle("is-deal", deal);
      if (deal) {
        var oldPrice = document.createElement("s");
        oldPrice.textContent = offer.was;
        costEl.appendChild(oldPrice);
      }
      var now = document.createElement("span");
      now.className = "truck-now";
      now.textContent = offer.now;
      costEl.appendChild(now);
      if (deal) {
        var save = document.createElement("span");
        save.className = "truck-save";
        var diff = money(offer.was) - money(offer.now);
        save.textContent = diff > 0 ? "You save " + formatMoney(diff) : "Discount applied";
        costEl.appendChild(save);
        costEl.setAttribute("aria-label", "was " + offer.was + ", now " + offer.now);
      } else {
        costEl.removeAttribute("aria-label");
      }
    }

    function priceLabel() {
      var now = costEl.querySelector(".truck-now");
      var was = costEl.querySelector("s");
      if (!now) return costEl.textContent.trim();
      if (was) return now.textContent + " (was " + was.textContent + ")";
      return now.textContent;
    }

    function setLoadStatus(message) {
      if (!loadStatus) return;
      if (!message) {
        loadStatus.hidden = true;
        loadStatus.textContent = "";
        return;
      }
      loadStatus.hidden = false;
      loadStatus.textContent = message;
    }

    function clearCompare() {
      if (!compareEl) return;
      compareEl.hidden = true;
      compareEl.textContent = "";
      compareEl.classList.remove("is-less", "is-more", "is-same");
    }

    function fillCompare(kind, title, body) {
      compareEl.hidden = false;
      compareEl.classList.remove("is-less", "is-more", "is-same");
      compareEl.classList.add(kind);
      compareEl.textContent = "";
      var heading = document.createElement("strong");
      heading.textContent = title;
      compareEl.appendChild(heading);
      compareEl.appendChild(document.createTextNode(body));
    }

    function paintCompare() {
      if (!compareEl) return;
      if (!selectedCard || !lastTier || result.hidden) {
        clearCompare();
        return;
      }
      var nameEl = selectedCard.querySelector(".load-pick span");
      var name = nameEl ? nameEl.textContent.trim() : "";
      var strong = selectedCard.querySelector("strong[data-price]");
      if (!strong) {
        clearCompare();
        return;
      }
      var newer = strong.querySelector(".price-new");
      var pickedText = newer ? newer.textContent.trim() : strong.textContent.replace(/\s+/g, " ").trim();
      var photo = livePrice(lastTier);
      var diff = Math.round((money(pickedText) - money(photo.now)) * 100);
      if (diff > 0) {
        fillCompare(
          "is-less",
          "Good news. You save " + formatMoney(diff / 100) + ".",
          "You picked the " + name + " at " + pickedText + ". Your photo fills less of the truck, so the price is " + photo.now + ". That is " + formatMoney(diff / 100) + " less than what you thought it would cost."
        );
      } else if (diff < 0) {
        fillCompare(
          "is-more",
          "This picture comes in higher.",
          "You picked the " + name + " at " + pickedText + ". The photo fills more of the 12 ft by 10 ft cargo box, so the price is the " + lastTier + " at " + photo.now + ". That is " + formatMoney(-diff / 100) + " more because the load takes up more space than the box you chose. One of our partners will look at the photo and confirm the price, so you are not charged more than it should be."
        );
      } else {
        fillCompare(
          "is-same",
          "This matches the box you picked.",
          "You picked the " + name + " at " + pickedText + ", and the photo comes in at the same price."
        );
      }
    }

    function estimateFill(img) {
      var maxSide = 100;
      var scale = maxSide / Math.max(img.naturalWidth, img.naturalHeight);
      var w = Math.max(1, Math.round(img.naturalWidth * scale));
      var h = Math.max(1, Math.round(img.naturalHeight * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var data = ctx.getImageData(0, 0, w, h).data;
      var n = w * h;
      var hues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      var colorful = 0;
      var hist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      var p, i, r, g, b, rf, gf, bf, mx, mn, diff, sat, hh, hi;
      for (p = 0; p < n; p++) {
        i = p * 4;
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        hist[((r / 86) | 0) * 9 + ((g / 86) | 0) * 3 + ((b / 86) | 0)] += 1;
        rf = r / 255;
        gf = g / 255;
        bf = b / 255;
        mx = Math.max(rf, gf, bf);
        mn = Math.min(rf, gf, bf);
        diff = mx - mn;
        sat = mx === 0 ? 0 : diff / mx;
        if (sat > 0.18 && mx > 0.12 && diff > 0) {
          colorful += 1;
          if (mx === rf) hh = (gf - bf) / diff;
          else if (mx === gf) hh = (bf - rf) / diff + 2;
          else hh = (rf - gf) / diff + 4;
          hh = ((hh % 6) + 6) % 6;
          hues[((hh * 2) | 0) % 12] += 1;
        }
      }
      var hueBins = 0;
      for (hi = 0; hi < 12; hi++) if (hues[hi] > n * 0.02) hueBins += 1;
      var big = 0;
      var occ = 0;
      for (hi = 0; hi < 27; hi++) {
        if (hist[hi] > big) big = hist[hi];
        if (hist[hi] > n * 0.025) occ += 1;
      }
      big = big / n;
      var jumpSum = 0;
      var y, x, prev, v, jumpsOnRow;
      for (y = 0; y < h; y++) {
        prev = 0.2126 * data[y * w * 4] + 0.7152 * data[y * w * 4 + 1] + 0.0722 * data[y * w * 4 + 2];
        jumpsOnRow = 0;
        for (x = 1; x < w; x++) {
          i = (y * w + x) * 4;
          v = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          if (Math.abs(v - prev) > 24) {
            jumpsOnRow += 1;
            prev = v;
          }
        }
        jumpSum += jumpsOnRow;
      }
      var jumps = (jumpSum / h) / (w / 40);
      var colorShare = colorful / n;
      var mix = (Math.min(occ, 8) / 8) * 0.4 + (Math.min(hueBins, 6) / 6) * 0.4 + (Math.min(jumps, 9) / 9) * 0.2;
      mix *= 0.42 + Math.min(colorShare, 0.7);
      mix *= 0.4 + (1 - big);
      var pct = 4 + Math.pow(Math.max(0, mix), 1.2) * 115;
      if (big > 0.82 && jumps < 1.6 && hueBins <= 1) pct = 4 + (1 - big) * 30;
      else if (hueBins <= 1 && occ <= 3 && jumps < 2.5) pct = 4 + (1 - big) * 42;
      if (colorShare < 0.1 && jumps > 7) pct = Math.min(pct, 18);
      // A photo makes each item look larger than the space it takes in the 12 ft by 10 ft box.
      // Price the load as smaller than it appears: 60% of that compressed reading.
      var smaller = Math.pow(Math.max(0, pct) / 140, 2) * 48;
      return Math.max(3, Math.min(96, Math.round(smaller)));
    }

    function showEstimate(pct) {
      var tier = tierFor(pct);
      lastTier = tier.name;
      fill.style.setProperty("--fill", String(pct / 100));
      var cargoTop = 72;
      var cargoH = 500;
      var band = cargoH * (pct / 100);
      var fontSize = 64;
      var labelY = 176;
      if (pct >= 74) {
        labelY = cargoTop + (cargoH - band) + band / 2 + fontSize * 0.3;
      }
      pctText.setAttribute("y", String(Math.round(labelY)));
      pctText.setAttribute("font-size", String(fontSize));
      pctText.setAttribute("fill", "#112f5b");
      pctText.textContent = pct + "%";
      percentEl.textContent = pct + "%";
      tierEl.textContent = tier.name;
      paintPrice(tier.name);
      waiting.hidden = true;
      result.hidden = false;
      status.textContent = "";
      paintCompare();
      if (selectedCard && !selectedCard.querySelector("strong[data-price]")) {
        document.dispatchEvent(new CustomEvent("hm-photo-ready"));
      }
      if (pendingFromGrid) {
        pendingFromGrid = false;
        setLoadStatus("");
        window.requestAnimationFrame(function () {
          result.scrollIntoView({ block: "start" });
        });
      }
    }

    document.addEventListener("hm-prices", function () {
      if (!lastTier || !costEl) return;
      paintPrice(lastTier);
      paintCompare();
    });

    function closeSources() {
      sources.hidden = true;
      uploadBtn.setAttribute("aria-expanded", "false");
    }

    function openSources() {
      sources.hidden = false;
      uploadBtn.setAttribute("aria-expanded", "true");
      takeBtn.focus();
    }

    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(function (track) { track.stop(); });
        cameraStream = null;
      }
      if (camVideo) camVideo.srcObject = null;
      cam.hidden = true;
    }

    function notePhotoError(message) {
      status.textContent = message;
      if (pendingFromGrid) setLoadStatus(message);
      pendingFromGrid = false;
    }

    function readFile(file) {
      if (!file) return;
      if (file.type && file.type.indexOf("image/") !== 0) {
        notePhotoError("Choose a photo to estimate.");
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () {
        notePhotoError("That photo could not be read. Try another one.");
      };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          preview.hidden = false;
          preview.src = reader.result;
          preview.alt = "Uploaded photo of the load";
          showEstimate(estimateFill(img));
        };
        img.onerror = function () {
          notePhotoError("That photo could not be read. Try another one.");
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function onPicked(event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      closeSources();
      readFile(file);
    }

    function openTake() {
      closeSources();
      closeLoadMenus();
      if (phoneCamera) {
        cameraInput.click();
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notePhotoError("This browser cannot open the camera. Choose a photo from your library instead.");
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        .then(function (stream) {
          cameraStream = stream;
          camVideo.srcObject = stream;
          cam.hidden = false;
          camSnap.focus();
        })
        .catch(function () {
          stopCamera();
          notePhotoError("The camera could not be opened. Choose a photo from your library instead.");
        });
    }

    function openLibrary() {
      closeSources();
      closeLoadMenus();
      libraryInput.click();
    }

    uploadBtn.addEventListener("click", function () {
      pendingFromGrid = false;
      closeLoadMenus();
      if (sources.hidden) openSources();
      else closeSources();
    });

    takeBtn.addEventListener("click", openTake);

    libraryBtn.addEventListener("click", openLibrary);

    cameraInput.addEventListener("change", onPicked);
    libraryInput.addEventListener("change", onPicked);

    camCancel.addEventListener("click", stopCamera);
    cam.addEventListener("click", function (event) {
      if (event.target === cam) stopCamera();
    });
    camSnap.addEventListener("click", function () {
      if (!camVideo.videoWidth) return;
      var shot = document.createElement("canvas");
      shot.width = camVideo.videoWidth;
      shot.height = camVideo.videoHeight;
      shot.getContext("2d").drawImage(camVideo, 0, 0);
      shot.toBlob(function (blob) {
        stopCamera();
        if (!blob) {
          notePhotoError("That photo could not be read. Try another one.");
          return;
        }
        readFile(blob);
      }, "image/jpeg", 0.92);
    });

    function bringIntoView(el) {
      if (!el) return;
      window.requestAnimationFrame(function () {
        el.scrollIntoView({ block: "nearest" });
      });
    }

    function closeLoadMenus() {
      document.querySelectorAll("#pricing .load-sources").forEach(function (menu) {
        menu.hidden = true;
      });
      document.querySelectorAll("#pricing .load-confirm").forEach(function (button) {
        button.setAttribute("aria-expanded", "false");
      });
    }

    function selectCard(card) {
      document.querySelectorAll("#pricing .load-grid .load").forEach(function (other) {
        var on = other === card;
        other.classList.toggle("is-selected", on);
        var pick = other.querySelector(".load-pick");
        var actions = other.querySelector(".load-actions");
        if (pick) pick.setAttribute("aria-pressed", on ? "true" : "false");
        if (actions) actions.hidden = !on;
      });
      closeLoadMenus();
      selectedCard = card;
      if (loadStatus && card.querySelector(".load-actions")) {
        card.querySelector(".load-actions").appendChild(loadStatus);
      }
      if (lastTier) paintCompare();
      bringIntoView(card.querySelector(".load-confirm"));
      document.dispatchEvent(new CustomEvent("hm-load-selected", {
        detail: { priced: !!card.querySelector("strong[data-price]") }
      }));
    }

    document.querySelectorAll("#pricing .load-grid .load").forEach(function (card) {
      var pick = card.querySelector(".load-pick");
      var confirmBtn = card.querySelector(".load-confirm");
      var menu = card.querySelector(".load-sources");
      var take = card.querySelector(".load-take");
      var library = card.querySelector(".load-library");
      if (!pick || !confirmBtn || !menu || !take || !library) return;
      pick.addEventListener("click", function () {
        selectCard(card);
      });
      confirmBtn.addEventListener("click", function () {
        var willOpen = menu.hidden;
        closeLoadMenus();
        if (!willOpen) return;
        menu.hidden = false;
        confirmBtn.setAttribute("aria-expanded", "true");
        take.focus();
        bringIntoView(menu);
      });
      take.addEventListener("click", function () {
        pendingFromGrid = true;
        selectedCard = card;
        openTake();
      });
      library.addEventListener("click", function () {
        pendingFromGrid = true;
        selectedCard = card;
        openLibrary();
      });
    });

    document.addEventListener("click", function (event) {
      if (!sources.hidden && !uploadBtn.contains(event.target) && !sources.contains(event.target)) {
        closeSources();
      }
      if (!event.target.closest(".load-actions")) closeLoadMenus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!cam.hidden) stopCamera();
      closeSources();
      closeLoadMenus();
    });

    var bookBtn = document.querySelector("#truck-book");
    var bookPanel = document.querySelector("#truck-book-panel");
    var bookDate = document.querySelector("#truck-book-date");
    var bookTime = document.querySelector("#truck-book-time");
    var bookFirst = document.querySelector("#truck-book-first");
    var bookLast = document.querySelector("#truck-book-last");
    var bookPhone = document.querySelector("#truck-book-phone");
    if (bookBtn && bookPanel && bookDate && bookTime && bookFirst && bookLast && bookPhone) {
      var slots = {
        "08:00": true,
        "09:00": true,
        "10:00": true,
        "11:00": true,
        "12:00": true,
        "13:00": true,
        "14:00": true,
        "15:00": true,
        "16:00": true,
        "17:00": true,
        "18:00": true
      };

      function isoFromDate(date) {
        var month = String(date.getMonth() + 1);
        var day = String(date.getDate());
        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;
        return date.getFullYear() + "-" + month + "-" + day;
      }

      function dateFromISO(iso) {
        var parts = iso.split("-");
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }

      function isSunday(iso) {
        if (!iso) return false;
        return dateFromISO(iso).getDay() === 0;
      }

      function fillDays() {
        var selected = bookDate.value;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var placeholder = bookDate.querySelector("option[value='']");
        bookDate.innerHTML = "";
        if (!placeholder) {
          placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = "Choose a day";
        }
        bookDate.appendChild(placeholder);
        for (var i = 0; i < 6; i++) {
          var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
          if (date.getDay() === 0) continue;
          var option = document.createElement("option");
          option.value = isoFromDate(date);
          option.textContent = date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
          });
          bookDate.appendChild(option);
        }
        if (selected && !isSunday(selected) && bookDate.querySelector("option[value='" + selected + "']")) {
          bookDate.value = selected;
        }
      }

      function inWindow(iso) {
        if (!iso || isSunday(iso)) return false;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var picked = dateFromISO(iso);
        var last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
        return picked >= today && picked <= last;
      }

      function requireText(input, message) {
        if (input.value.trim()) {
          input.setCustomValidity("");
          return true;
        }
        input.setCustomValidity(message);
        return false;
      }

      function formatWhen(day, time) {
        var date = dateFromISO(day);
        var pretty = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        var bits = time.split(":");
        var hour = Number(bits[0]);
        var suffix = hour >= 12 ? "PM" : "AM";
        var hour12 = hour % 12 || 12;
        return pretty + " at " + hour12 + ":" + bits[1] + " " + suffix;
      }

      function placeAboveChat(el) {
        var chat = document.querySelector("#tawk-bubble-container");
        var header = document.querySelector(".site-header");
        var bottomLimit = window.innerHeight - 16;
        var topLimit = 12;
        if (header) {
          var head = header.getBoundingClientRect();
          if (head.height) topLimit = head.bottom + 8;
        }
        var rect = el.getBoundingClientRect();
        var box = chat && chat.getBoundingClientRect().height
          ? chat.getBoundingClientRect()
          : (function () {
              var mobile = window.matchMedia("(max-width: 640px)").matches;
              var size = 64;
              var x = mobile ? 12 : 20;
              var y = mobile ? 16 : 20;
              return {
                left: window.innerWidth - x - size,
                right: window.innerWidth - x,
                top: window.innerHeight - y - size,
                height: size
              };
            })();
        var overlapsX = rect.right > box.left && rect.left < box.right;
        if (box.height && overlapsX) bottomLimit = Math.min(bottomLimit, box.top - 12);
        var shift = 0;
        if (rect.bottom > bottomLimit) shift = rect.bottom - bottomLimit;
        if (rect.height <= bottomLimit - topLimit && rect.top - shift < topLimit) {
          shift = rect.top - topLimit;
        }
        if (!shift) return;
        var root = document.documentElement;
        var previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollBy(0, shift);
        root.style.scrollBehavior = previous;
      }

      fillDays();
      bookDate.addEventListener("change", function () {
        bookDate.setCustomValidity("");
      });
      bookTime.addEventListener("change", function () {
        bookTime.setCustomValidity("");
      });
      [bookFirst, bookLast, bookPhone].forEach(function (input) {
        input.addEventListener("input", function () {
          if (input.value.trim()) input.setCustomValidity("");
        });
      });
      bookBtn.addEventListener("click", function () {
        var open = bookPanel.hidden;
        bookPanel.hidden = !open;
        bookBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          fillDays();
          void bookPanel.offsetHeight;
          placeAboveChat(bookPanel.parentElement || bookPanel);
          bookDate.focus({ preventScroll: true });
        }
      });

      bookPanel.addEventListener("submit", function (event) {
        event.preventDefault();
        requireText(bookFirst, "Enter your first name.");
        requireText(bookLast, "Enter your last name.");
        requireText(bookPhone, "Enter your phone number.");
        if (isSunday(bookDate.value)) {
          status.textContent = "Sundays are closed. Pick another day, or call or text (385) 275-6435.";
          bookDate.setCustomValidity("Sundays are closed.");
          bookDate.reportValidity();
          return;
        }
        if (bookDate.value && !inWindow(bookDate.value)) {
          status.textContent = "Booking is open for the next 6 days, starting today. Pick one of those days, or call or text (385) 275-6435.";
          bookDate.setCustomValidity("Choose a day in the next 6 days.");
          bookDate.reportValidity();
          return;
        }
        bookDate.setCustomValidity("");
        if (bookTime.value && !slots[bookTime.value]) {
          bookTime.setCustomValidity("Choose a time between 8:00 AM and 6:00 PM.");
          bookTime.reportValidity();
          return;
        }
        bookTime.setCustomValidity("");
        if (!bookPanel.reportValidity()) return;
        var when = formatWhen(bookDate.value, bookTime.value);
        var lines = [
          "Time request from the H&M Junk Removal website",
          "",
          "Name: " + bookFirst.value.trim() + " " + bookLast.value.trim(),
          "Phone: " + bookPhone.value.trim(),
          "Photo estimate: " + percentEl.textContent + " of the truck",
          "Load: " + tierEl.textContent,
          "Estimated price: " + priceLabel(),
          "Requested time: " + when
        ];
        var href =
          "mailto:garagegonecleanut@gmail.com?subject=" +
          encodeURIComponent("Time request — H&M Junk Removal") +
          "&body=" +
          encodeURIComponent(lines.join("\n"));
        status.textContent =
          "Your email app should open with a request for " +
          when +
          " at " +
          priceLabel() +
          ". We confirm the time before it is locked. If it does not open, call or text (385) 275-6435.";
        void status.offsetHeight;
        placeAboveChat(status);
        window.location.href = href;
      });
    }
  })();

  var form = document.querySelector("#quote-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var lines = [
      "Quote request from the H&M Junk Removal website",
      "",
      "Name: " + data.get("firstName") + " " + data.get("lastName"),
      "Phone: " + data.get("phone"),
      "Email: " + (data.get("email") || "—"),
      "What needs to go: " + data.get("haul"),
      "City: " + (data.get("city") || "—"),
      "",
      String(data.get("message") || "").trim()
    ];

    var href =
      "mailto:garagegonecleanut@gmail.com?subject=" +
      encodeURIComponent("Quote request — H&M Junk Removal") +
      "&body=" +
      encodeURIComponent(lines.join("\n"));

    var status = document.querySelector("#form-status");
    if (status) {
      status.hidden = false;
      status.textContent =
        "Your email app should open with this request filled in. If it does not, call or text (385) 275-6435.";
    }

    window.location.href = href;
  });
})();
