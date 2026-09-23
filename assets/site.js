// Smile 4 Less — sitewide behaviors (vanilla, no dependencies)

// ---------------------------------------------------------------------------
// LEAD FORMS
// Submissions go to the Smile 4 Less lead board (repo ty734/lead-board, client
// "smile4less"), not GoHighLevel. The board only accepts this site's origins, so
// if the site moves domains, add the new origin to clients/smile4less.ts there.
// When leads.smile4lessbraces.com is connected, point this at it instead.
// ---------------------------------------------------------------------------
var WEBHOOK = "https://s4l-leads.vercel.app/api/lead";
var CONFIRM_URL = "/appointment-request-confirmation";

(function () {
  "use strict";

  // ---- scroll reveal ("float in"), staggered, reduced-motion aware ----
  if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    var blocks = document.querySelectorAll("main .center, main .split .txt, main .split > img, .band h2, .band p, .trust .lbl");
    Array.prototype.forEach.call(blocks, function (el) { el.classList.add("reveal"); });
    var groups = document.querySelectorAll(".grid2, .grid3, .grid4, .steps, .revs, .locs, .logos, .docs, .team, .faq, .gal, .ba");
    Array.prototype.forEach.call(groups, function (g) {
      Array.prototype.forEach.call(g.children, function (ch, i) {
        ch.classList.add("reveal");
        ch.style.setProperty("--d", Math.min(i, 8) * 70 + "ms");
      });
    });
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }
  }

  // ---- attribution: persist UTM / click IDs across the session ----
  var ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "msclkid"];
  function qp(n) { try { return new URLSearchParams(location.search).get(n) || ""; } catch (e) { return ""; } }
  function store() {
    try {
      ATTR.forEach(function (k) { var v = qp(k); if (v) localStorage.setItem("s4l_" + k, v); });
      if (!localStorage.getItem("s4l_landing")) localStorage.setItem("s4l_landing", location.pathname);
      if (!localStorage.getItem("s4l_referrer")) localStorage.setItem("s4l_referrer", document.referrer || "direct");
    } catch (e) {}
  }
  function recall(k) { try { return localStorage.getItem("s4l_" + k) || ""; } catch (e) { return ""; } }
  store();

  // ---- validation ----
  function digits(s) { return (s || "").replace(/\D/g, ""); }
  function validPhone(s) {
    var d = digits(s);
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    if (d.length !== 10) return false;
    if (d.charAt(0) === "0" || d.charAt(0) === "1") return false;      // invalid area code
    if (/^(\d)\1{9}$/.test(d)) return false;                            // 0000000000
    if (d === "1234567890") return false;
    return true;
  }
  function validEmail(el) {
    if (!el.value) return true;                                         // email is optional
    if (!el.checkValidity()) return false;
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(el.value);            // type=email alone accepts a@b
  }

  Array.prototype.forEach.call(document.querySelectorAll("form[data-lead]"), function (f) {
    var loaded = Date.now();
    var msg = document.createElement("p");
    msg.className = "formmsg";
    msg.setAttribute("role", "alert");
    msg.hidden = true;
    var btn = f.querySelector("button[type=submit]");
    if (btn) btn.parentNode.insertBefore(msg, btn);

    function fail(t) {
      msg.textContent = t + " Or just call us at (915) 304-3090.";
      msg.hidden = false;
      msg.className = "formmsg err";
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Send"; }
    }

    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg.hidden = true;

      var hp = f.querySelector(".hp input");
      if (hp && hp.value) { location.href = CONFIRM_URL; return; }              // honeypot
      if (Date.now() - loaded < 2500) { location.href = CONFIRM_URL; return; }  // speed trap

      var name = f.querySelector("[name=name]");
      var phone = f.querySelector("[name=phone]");
      var email = f.querySelector("[name=email]");
      if (name && !name.value.trim()) return fail("Please enter your name.");
      if (phone && !validPhone(phone.value)) return fail("Please enter a valid 10-digit phone number.");
      if (email && !validEmail(email)) return fail("That email address doesn't look right.");

      if (btn) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.textContent = "Sending…"; }

      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      ATTR.forEach(function (k) { data[k] = qp(k) || recall(k); });
      data.page = location.pathname;
      data.page_url = location.href;
      data.landing_page = recall("landing");
      data.referrer = recall("referrer");
      data.form_name = f.getAttribute("data-lead") || "request_exam";
      // send both key styles so either GHL mapping works
      data.full_name = data.name; data.first_name = (data.name || "").split(" ")[0];
      data.last_name = (data.name || "").split(" ").slice(1).join(" ");
      data.phone_number = data.phone;
      data.elapsed = Math.round((Date.now() - loaded) / 100) / 10;   // seconds; the board's bot check uses it

      function done() {
        try {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "generate_lead", form_name: data.form_name });
        } catch (e) {}
        location.href = CONFIRM_URL;
      }
      if (!WEBHOOK) { setTimeout(done, 300); return; }

      // Only thank them (and fire the conversion) once the board has the lead.
      // The board is the only record, so a failure must say so and point to the
      // phone, never redirect to "thanks" as if it worked. One retry covers a
      // blip; a 4xx is a validation answer and is not retried.
      function send(attempt) {
        fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (r.ok) return done();
          if (r.status >= 500 && attempt < 2) return setTimeout(function () { send(attempt + 1); }, 1200);
          fail("Sorry, that didn't go through.");
        }).catch(function () {
          if (attempt < 2) return setTimeout(function () { send(attempt + 1); }, 1200);
          fail("We couldn't reach our server. Check your connection and try again.");
        });
      }
      send(1);
    });
  });

  // ---- phone field formatting ----
  Array.prototype.forEach.call(document.querySelectorAll("input[type=tel]"), function (i) {
    i.addEventListener("input", function () {
      // Drop a leading US country code first: pasting "+1 915 304 3090" used to
      // keep "1915304309" and fail validation as a bad area code.
      var d = digits(i.value);
      if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
      d = d.slice(0, 10);
      var o = d;
      if (d.length > 6) o = "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
      else if (d.length > 3) o = "(" + d.slice(0, 3) + ") " + d.slice(3);
      i.value = o;
    });
  });

  // ---- click-to-call tracking ----
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) {
    a.addEventListener("click", function () {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "click_to_call", phone: a.getAttribute("href").replace("tel:", "") });
      } catch (e) {}
    });
  });
})();
