/* Walle shared JS — nav, i18n, reveal, quiz engine */
(function(){
  "use strict";

  /* ---------- nav ---------- */
  var PAGES = [
    {file:"index.html", en:"Home",            bg:"Начало"},
    {file:"prompting.html",          en:"Prompting",       bg:"Промптинг"},
    {file:"spot-the-fakes.html",     en:"Spot the fakes",  bg:"Разпознай фалшивото"},
    {file:"make-things.html",        en:"Make things",     bg:"Създавай"},
    {file:"ai-for-school.html",      en:"For school",      bg:"За училище"},
    {file:"fine-print.html",         en:"The fine print",  bg:"Дребният шрифт"}
  ];

  function currentFile(){
    var p = decodeURIComponent(location.pathname);
    return p.substring(p.lastIndexOf("/")+1) || PAGES[0].file;
  }

  function buildNav(){
    var slot = document.getElementById("nav-links");
    if(!slot) return;
    var cur = currentFile();
    PAGES.forEach(function(pg){
      var a = document.createElement("a");
      a.href = pg.file;
      a.setAttribute("data-en", pg.en);
      a.setAttribute("data-bg", pg.bg);
      a.textContent = pg.en;
      if(pg.file === cur) a.className = "active";
      slot.appendChild(a);
    });
  }

  /* ---------- i18n ---------- */
  var lang = "en";
  try { var saved = localStorage.getItem("walle-lang"); if(saved==="en"||saved==="bg") lang = saved; } catch(e){}

  function applyLang(){
    document.body.setAttribute("data-lang", lang);
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-en]").forEach(function(el){
      var v = el.getAttribute("data-"+lang);
      if(v!=null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-en-ph]").forEach(function(el){
      var v = el.getAttribute("data-"+lang+"-ph");
      if(v!=null) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-setlang]").forEach(function(b){
      b.classList.toggle("active", b.getAttribute("data-setlang")===lang);
    });
    try { localStorage.setItem("walle-lang", lang); } catch(e){}
    document.dispatchEvent(new CustomEvent("walle:lang", {detail:{lang:lang}}));
  }

  function wireLang(){
    document.querySelectorAll("[data-setlang]").forEach(function(b){
      b.addEventListener("click", function(){ lang = b.getAttribute("data-setlang"); applyLang(); });
    });
  }

  /* ---------- reveal (with fail-safe) ---------- */
  function wireReveal(){
    var reveals = document.querySelectorAll(".reveal");
    function revealAll(){ reveals.forEach(function(el){ el.classList.add("in"); }); }
    if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
      }, {threshold:0.08, rootMargin:"0px 0px -8% 0px"});
      reveals.forEach(function(el){ io.observe(el); });
      setTimeout(revealAll, 1600);
    } else { revealAll(); }
  }

  /* ---------- quiz engine ----------
     Mount with: WalleQuiz(containerEl, {
       kicker:{en,bg}, title:{en,bg},
       questions:[{q:{en,bg}, opts:[{en,bg}...], correct:i, right:{en,bg}, wrong:{en,bg}}]
     })
  ----------------------------------- */
  function esc(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML; }

  window.WalleQuiz = function(el, cfg){
    var idx = 0, score = 0;
    var UI = {
      progress:{en:"Question", bg:"Въпрос"},
      of:{en:"of", bg:"от"},
      next:{en:"Next →", bg:"Напред →"},
      done:{en:"See my result", bg:"Виж резултата"},
      again:{en:"Play again", bg:"Играй пак"},
      score:{en:"You got", bg:"Позна"},
      outof:{en:"out of", bg:"от"}
    };
    function t(o){ return o[lang] || o.en; }

    function finalLine(){
      var n = cfg.questions.length;
      var msgs = score===n
        ? {en:"Perfect score. Honestly? Suspiciously good. 🏆", bg:"Пълно попадение. Чак подозрително добре. 🏆"}
        : score >= Math.ceil(n/2)
        ? {en:"Solid. You're harder to fool than most adults. 💪", bg:"Стабилно. Лъжеш се по-трудно от повечето възрастни. 💪"}
        : {en:"Hey, that's why lessons exist. Run it back. 🔁", bg:"Е, затова има уроци. Пробвай пак. 🔁"};
      return t(msgs);
    }

    function render(){
      var html = '<div class="quiz-head">';
      html += '<div class="quiz-kicker">'+esc(t(cfg.kicker))+'</div>';
      html += '<h2>'+esc(t(cfg.title))+'</h2></div>';
      html += '<div class="quiz-body">';
      if(idx < cfg.questions.length){
        var q = cfg.questions[idx];
        html += '<div class="quiz-progress">'+esc(t(UI.progress))+' '+(idx+1)+' '+esc(t(UI.of))+' '+cfg.questions.length+'</div>';
        html += '<div class="quiz-q">'+esc(t(q.q))+'</div>';
        html += '<div class="quiz-opts">';
        q.opts.forEach(function(o,i){
          html += '<button type="button" class="quiz-opt" data-i="'+i+'">'+esc(t(o))+'</button>';
        });
        html += '</div><div class="quiz-feedback"></div>';
      } else {
        html += '<div class="quiz-q" style="font-family:var(--display);font-weight:800;font-size:24px;">'
              + esc(t(UI.score))+' '+score+' '+esc(t(UI.outof))+' '+cfg.questions.length+'. '+esc(finalLine())
              + '</div>';
        html += '<button type="button" class="quiz-opt" data-again="1" style="max-width:220px;">'+esc(t(UI.again))+'</button>';
      }
      html += '</div>';
      el.innerHTML = html;
      wire();
    }

    function wire(){
      var q = cfg.questions[idx];
      el.querySelectorAll(".quiz-opt").forEach(function(btn){
        btn.addEventListener("click", function(){
          if(btn.hasAttribute("data-again")){ idx=0; score=0; render(); return; }
          var i = +btn.getAttribute("data-i");
          var fb = el.querySelector(".quiz-feedback");
          el.querySelectorAll(".quiz-opt").forEach(function(b){ b.disabled = true; });
          if(i === q.correct){ score++; btn.classList.add("correct"); fb.textContent = "✓ " + t(q.right); }
          else {
            btn.classList.add("wrong");
            var c = el.querySelector('.quiz-opt[data-i="'+q.correct+'"]');
            if(c) c.classList.add("correct");
            fb.textContent = "✗ " + t(q.wrong);
          }
          fb.classList.add("show");
          var nx = document.createElement("button");
          nx.type = "button"; nx.className = "quiz-opt"; nx.style.maxWidth = "180px"; nx.style.marginTop = "14px";
          nx.textContent = (idx+1 < cfg.questions.length) ? t(UI.next) : t(UI.done);
          nx.addEventListener("click", function(){ idx++; render(); });
          el.querySelector(".quiz-body").appendChild(nx);
        });
      });
    }

    document.addEventListener("walle:lang", render);
    render();
  };

  /* ---------- init ---------- */
  buildNav();
  wireLang();
  applyLang();
  wireReveal();
})();
