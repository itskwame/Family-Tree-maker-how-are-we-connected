import"./style-CW0EZ8dP.js";document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(t){t.preventDefault();const o=document.querySelector(this.getAttribute("href"));if(o){const s=document.querySelector(".navbar").offsetHeight,n=o.offsetTop-s;window.scrollTo({top:n,behavior:"smooth"})}})});const l=document.querySelector(".navbar");window.addEventListener("scroll",()=>{window.pageYOffset>50?l.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)":l.style.boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"});const c=document.querySelectorAll(".faq-item");c.forEach(e=>{e.querySelector(".faq-question").addEventListener("click",()=>{c.forEach(o=>{o!==e&&o.classList.contains("active")&&o.classList.remove("active")}),e.classList.toggle("active")})});const d=document.querySelector(".mobile-menu-toggle"),f=document.querySelector(".nav-links"),p=document.querySelector(".nav-buttons");d.addEventListener("click",()=>{f.classList.toggle("active"),p.classList.toggle("active");const e=d.querySelector("i");e.classList.contains("fa-bars")?(e.classList.remove("fa-bars"),e.classList.add("fa-times")):(e.classList.remove("fa-times"),e.classList.add("fa-bars"))});const u={threshold:.1,rootMargin:"0px 0px -100px 0px"},a=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&(t.target.style.opacity="1",t.target.style.transform="translateY(0)")})},u);document.querySelectorAll(".feature-card").forEach(e=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition="opacity 0.6s ease, transform 0.6s ease",a.observe(e)});document.querySelectorAll(".step").forEach((e,t)=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition=`opacity 0.6s ease ${t*.1}s, transform 0.6s ease ${t*.1}s`,a.observe(e)});document.querySelectorAll(".pricing-card").forEach((e,t)=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition=`opacity 0.6s ease ${t*.1}s, transform 0.6s ease ${t*.1}s`,a.observe(e)});document.querySelectorAll(".testimonial-card").forEach((e,t)=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition=`opacity 0.6s ease ${t*.1}s, transform 0.6s ease ${t*.1}s`,a.observe(e)});const r=(e,t,o=2e3)=>{let s=0;const n=t/(o/16),i=()=>{s+=n,s<t?(e.textContent=Math.floor(s).toLocaleString()+"+",requestAnimationFrame(i)):e.textContent=t.toLocaleString()+"+"};i()},y=new IntersectionObserver(e=>{e.forEach(t=>{if(t.isIntersecting){const o=document.querySelectorAll(".stat strong");t.target.dataset.animated||(r(o[0],1e4),r(o[1],500),r(o[2],1),setTimeout(()=>{o[2].textContent="1M+"},2e3),t.target.dataset.animated="true")}})},{threshold:.5}),m=document.querySelector(".hero-stats");m&&y.observe(m);const g=document.querySelectorAll(".tree-node");g.forEach((e,t)=>{e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.transition="transform 0.3s ease"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)"}),setTimeout(()=>{e.style.opacity="1",e.style.transform="translateY(0)"},t*200),e.style.opacity="0",e.style.transform="translateY(20px)",e.style.transition="opacity 0.5s ease, transform 0.5s ease"});const v=()=>{const e=document.createElement("button");e.innerHTML='<i class="fas fa-arrow-up"></i>',e.className="scroll-to-top",e.style.cssText=`
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    `,document.body.appendChild(e),window.addEventListener("scroll",()=>{window.pageYOffset>300?(e.style.opacity="1",e.style.pointerEvents="auto"):(e.style.opacity="0",e.style.pointerEvents="none")}),e.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})}),e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)"})};v();console.log("%c👨‍👩‍👧‍👦 Welcome to FamilyConnect! ","font-size: 20px; font-weight: bold; color: #667eea;");console.log("%cBringing families together, one connection at a time.","font-size: 14px; color: #4a5568;");window.performance&&window.addEventListener("load",()=>{setTimeout(()=>{const e=window.performance.timing,t=e.loadEventEnd-e.navigationStart;console.log(`Page load time: ${t}ms`)},0)});const b=()=>{const e=document.createElement("style");e.textContent=`
        @media (max-width: 768px) {
            .nav-links.active,
            .nav-buttons.active {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                gap: 16px;
            }
            
            .nav-links.active {
                animation: slideDown 0.3s ease;
            }
            
            .nav-buttons.active {
                position: relative;
                top: auto;
                box-shadow: none;
                padding: 0;
                margin-top: 16px;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }
    `,document.head.appendChild(e)};b();document.addEventListener("DOMContentLoaded",()=>{console.log("FamilyConnect Landing Page Loaded Successfully! 🎉")});
