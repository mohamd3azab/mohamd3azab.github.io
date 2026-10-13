(function(){
 var button=document.querySelector(".menu-button"),nav=document.querySelector(".navlinks");
 function close(){nav.classList.remove("open");button.setAttribute("aria-expanded","false");button.textContent="Menu +";document.body.classList.remove("menu-open")}
 button.addEventListener("click",function(){var active=nav.classList.toggle("open");button.setAttribute("aria-expanded",String(active));button.textContent=active?"Close −":"Menu +";document.body.classList.toggle("menu-open",active)});
 nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",close)});
 window.addEventListener("resize",function(){if(window.innerWidth>800)close()});
 document.querySelectorAll(".work-card").forEach(function(card){card.addEventListener("toggle",function(){if(card.open){history.replaceState(null,"","#"+card.id)}})});
 if(location.hash){var el=document.getElementById(location.hash.slice(1));if(el&&el.classList.contains("work-card")){el.open=true}}
})();
