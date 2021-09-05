import{S as e,i as t,s as a,e as s,c as r,a as n,d as l,b as c,D as i,f as o,E as d,F as f,G as h,H as u,I as m,J as p,K as g,L as v,M as $,N as b,O as x,P as y,l as k,r as w,u as E,Q as I,w as D,x as T,R as V,A as j,T as N,t as z,k as O,g as S,n as L,U as A,V as B,h as H,W as U,X as M,Y as P,j as W,m as q,o as _,Z as C,v as F,_ as G,$ as R,a0 as J,a1 as K,a2 as Q}from"../chunks/vendor-51b7d296.js";import{n as X,p as Y,l as Z,d as ee}from"../chunks/dark_mode-502a2968.js";import{s as te}from"../chunks/index-16bd9a46.js";import{N as ae}from"../chunks/getAPi-d548b28c.js";import"../chunks/singletons-bb9012b7.js";function se(e,t,a){const s=e.slice();return s[11]=t[a].name,s[12]=t[a].action,s[13]=t[a].options,s[14]=void 0!==t[a].disabled&&t[a].disabled,s[3]=void 0!==t[a].hidden&&t[a].hidden,s}function re(e,t){let a,f,h,u,m,p,g,v=t[11]+"";return{key:e,first:null,c(){a=s("div"),f=s("button"),h=z(v),m=O(),this.h()},l(e){a=r(e,"DIV",{class:!0});var t=n(a);f=r(t,"BUTTON",{disabled:!0,class:!0});var s=n(f);h=S(s,v),s.forEach(l),m=L(t),t.forEach(l),this.h()},h(){f.disabled=u=t[14],c(f,"class","block text-left w-full text-xl text-gray-900 dark:text-blue-300 capitalize svelte-5c17ev"),c(a,"class","hover:bg-gray-200 dark:hover:bg-gray-500 px-1 rounded svelte-5c17ev"),i(a,"disabled",t[14]),i(a,"hidden",t[3]),this.first=a},m(e,s){o(e,a,s),d(a,f),d(f,h),d(a,m),p||(g=A(f,"click",(function(){B(t[12]())&&t[12]().apply(this,arguments)})),p=!0)},p(e,s){t=e,2&s&&v!==(v=t[11]+"")&&H(h,v),2&s&&u!==(u=t[14])&&(f.disabled=u),2&s&&i(a,"disabled",t[14]),2&s&&i(a,"hidden",t[3])},d(e){e&&l(a),p=!1,g()}}}function ne(e){let t,a,k,w,E,I,D,T,V,j=[],N=new Map,z=e[1];const O=e=>e[11];for(let s=0;s<z.length;s+=1){let t=se(e,z,s),a=O(t);N.set(a,j[s]=re(a,t))}return{c(){t=s("div"),a=s("div");for(let e=0;e<j.length;e+=1)j[e].c();this.h()},l(e){t=r(e,"DIV",{id:!0,class:!0});var s=n(t);a=r(s,"DIV",{class:!0});var c=n(a);for(let t=0;t<j.length;t+=1)j[t].l(c);c.forEach(l),s.forEach(l),this.h()},h(){c(a,"class","flex p-2 bg-white dark:bg-gray-700 bg-opacity-95 dark:bg-opacity-95  flex-col min-w-[200px] min-h-[200px] rounded-md shadow-2xl gap-3 md:gap-4 text-gray-800 dark:text-blue-200"),c(t,"id","context-menu__view"),c(t,"class",E=" fixed z-20 "+e[0]+" svelte-5c17ev"),i(t,"hidden",e[3])},m(s,r){o(s,t,r),d(t,a);for(let e=0;e<j.length;e+=1)j[e].m(a,null);D=!0,T||(V=f(e[6].call(null,t)),T=!0)},p(s,r){e=s,2&r&&(z=e[1],j=h(j,r,O,1,e,z,N,a,u,re,null,se)),(!D||1&r&&E!==(E=" fixed z-20 "+e[0]+" svelte-5c17ev"))&&c(t,"class",E),9&r&&i(t,"hidden",e[3])},i(e){D||(m((()=>{w&&w.end(1),k||(k=p(a,v,{delay:100,start:.8,easing:g,duration:250})),k.start()})),m((()=>{I||(I=$(t,b,{delay:100,duration:200},!0)),I.run(1)})),D=!0)},o(e){k&&k.invalidate(),w=x(a,v,{start:.9,easing:y,duration:200}),I||(I=$(t,b,{delay:100,duration:200},!1)),I.run(0),D=!1},d(e){e&&l(t);for(let t=0;t<j.length;t+=1)j[t].d();e&&w&&w.end(),e&&I&&I.end(),T=!1,V()}}}function le(e){let t,s,r=e[2],n=ne(e);return{c(){n.c(),t=k()},l(e){n.l(e),t=k()},m(e,a){n.m(e,a),o(e,t,a),s=!0},p(e,[s]){4&s&&a(r,r=e[2])?(w(),E(n,1,1,I),D(),n=ne(e),n.c(),T(n),n.m(t.parentNode,t)):n.p(e,s)},i(e){s||(T(n),s=!0)},o(e){E(n),s=!1},d(e){e&&l(t),n.d(e)}}}function ce(e,t,a){let s,r,n,l;const c=te.g("context_menu");V(e,c,(e=>a(1,l=e)));const i=te.g("pos");V(e,i,(e=>a(7,n=e)));let{class:o=""}=t;const d=e=>{27!==e.keyCode&&"keyup"===e.type||N(c,l=[],l)};let f;f=document.querySelector("div#main");return j((()=>()=>{window.removeEventListener("keyup",d),window.removeEventListener("resize",d),f.removeEventListener("click",d)})),e.$$set=e=>{"class"in e&&a(0,o=e.class)},e.$$.update=()=>{128&e.$$.dirty&&a(2,s=n||{x:0,y:0}),2&e.$$.dirty&&a(3,r=0===((null==l?void 0:l.length)||0))},X&&N(c,l=[],l),[o,l,s,r,c,i,e=>{f||(f=document.querySelector("div#main"));const t=document.getElementById("file-manager");let a={x:0,y:0},r={x:0,y:0};a.x=e.offsetWidth,a.y=e.offsetHeight;const n=t.offsetWidth,l=window.innerHeight,c=(i=n,{l1:(innerWidth-i)/2,l2:(innerWidth+i)/2});var i;s.x+3+200<c.l2?r.x=s.x+3:c.l1<s.x-3-200&&(r.x=s.x-3-200),s.y-5-a.y>50?r.y=s.y-5-a.y:l>s.y+5+a.y&&(r.y=Math.max(s.y+5,50)),e.style.left=r.x+"px",e.style.top=r.y+"px",f.addEventListener("click",d),window.addEventListener("keyup",d),window.addEventListener("resize",d)},n]}class ie extends e{constructor(e){super(),t(this,e,ce,le,a,{class:0})}}function oe(e,t,a){const s=e.slice();return s[6]=t[a],s}function de(e){let t,a,f,h,u;return{c(){t=s("div"),a=s("a"),f=z(e[6]),u=O(),this.h()},l(s){t=r(s,"DIV",{class:!0});var c=n(t);a=r(c,"A",{"sveltekit:prefetch":!0,class:!0,href:!0});var i=n(a);f=S(i,e[6]),i.forEach(l),u=L(c),c.forEach(l),this.h()},h(){c(a,"sveltekit:prefetch",""),c(a,"class","anchor p-3 capitalize"),c(a,"href",h=`/${e[6]}`),i(a,"active",e[1].path==="/"+e[6]),c(t,"class","nav-link lead3")},m(e,s){o(e,t,s),d(t,a),d(a,f),d(t,u)},p(e,t){2&t&&i(a,"active",e[1].path==="/"+e[6])},d(e){e&&l(t)}}}function fe(e){let t,a,i,f,h,u,m,p;return{c(){t=s("button"),a=s("img"),f=O(),h=s("span"),u=z("light mode"),this.h()},l(e){t=r(e,"BUTTON",{class:!0});var s=n(t);a=r(s,"IMG",{src:!0,alt:!0}),f=L(s),h=r(s,"SPAN",{class:!0});var c=n(h);u=S(c,"light mode"),c.forEach(l),s.forEach(l),this.h()},h(){a.src!==(i=Z)&&c(a,"src",i),c(a,"alt","light"),c(h,"class","inline-block ml-1"),c(t,"class","p-2 text-blue-50 border rounded-full dark:bg-gray-800 border-gray-400 dark:hover:bg-gray-600 flex justify-between ml-6 md:ml-0")},m(s,r){o(s,t,r),d(t,a),d(t,f),d(t,h),d(h,u),m||(p=A(t,"click",e[5]),m=!0)},p:I,d(e){e&&l(t),m=!1,p()}}}function he(e){let t,a,i,f,h,u,m,p;return{c(){t=s("button"),a=s("img"),f=O(),h=s("span"),u=z("dark mode"),this.h()},l(e){t=r(e,"BUTTON",{class:!0});var s=n(t);a=r(s,"IMG",{src:!0,alt:!0}),f=L(s),h=r(s,"SPAN",{class:!0});var c=n(h);u=S(c,"dark mode"),c.forEach(l),s.forEach(l),this.h()},h(){a.src!==(i=ee)&&c(a,"src",i),c(a,"alt","dark"),c(h,"class","inline-block ml-1"),c(t,"class"," p-2 text-blue-500 border rounded-full border-gray-300 hover:bg-gray-400 flex justify-between ml-6 md:ml-0")},m(s,r){o(s,t,r),d(t,a),d(t,f),d(t,h),d(h,u),m||(p=A(t,"click",e[4]),m=!0)},p:I,d(e){e&&l(t),m=!1,p()}}}function ue(e){let t,a,f,h,u,m,p,g,v,$=["file-manager","chat"],b=[];for(let s=0;s<2;s+=1)b[s]=de(oe(e,$,s));function x(e,t){return"light"===e[2]?he:fe}let y=x(e),k=y(e);return{c(){t=s("div"),a=s("div"),f=s("a"),h=z("Hyp"),u=O(),m=s("div");for(let e=0;e<2;e+=1)b[e].c();p=O(),g=s("div"),k.c(),this.h()},l(e){t=r(e,"DIV",{class:!0});var s=n(t);a=r(s,"DIV",{class:!0});var c=n(a);f=r(c,"A",{href:!0,"sveltekit:prefetch":!0,class:!0});var i=n(f);h=S(i,"Hyp"),i.forEach(l),c.forEach(l),u=L(s),m=r(s,"DIV",{class:!0});var o=n(m);for(let t=0;t<2;t+=1)b[t].l(o);o.forEach(l),p=L(s),g=r(s,"DIV",{});var d=n(g);k.l(d),d.forEach(l),s.forEach(l),this.h()},h(){c(f,"href","/"),c(f,"sveltekit:prefetch",""),c(f,"class","anchor text-3xl"),i(f,"active","/"===e[1].path),c(a,"class","hidden md:block"),c(m,"class","flex justify-between flex-md-row flex-col svelte-bcyqtg"),c(t,"class",v="md:flex md:justify-between "+e[0]+" svelte-bcyqtg")},m(e,s){o(e,t,s),d(t,a),d(a,f),d(f,h),d(t,u),d(t,m);for(let t=0;t<2;t+=1)b[t].m(m,null);d(t,p),d(t,g),k.m(g,null)},p(e,[a]){if(2&a&&i(f,"active","/"===e[1].path),2&a){let t;for($=["file-manager","chat"],t=0;t<2;t+=1){const s=oe(e,$,t);b[t]?b[t].p(s,a):(b[t]=de(s),b[t].c(),b[t].m(m,null))}for(;t<2;t+=1)b[t].d(1)}y===(y=x(e))&&k?k.p(e,a):(k.d(1),k=y(e),k&&(k.c(),k.m(g,null))),1&a&&v!==(v="md:flex md:justify-between "+e[0]+" svelte-bcyqtg")&&c(t,"class",v)},i:I,o:I,d(e){e&&l(t),U(b,e),k.d()}}}function me(e,t,a){let s,r;V(e,Y,(e=>a(1,s=e)));const n=te.state.colorScheme;V(e,n,(e=>a(2,r=e)));let{cls:l=""}=t;return e.$$set=e=>{"cls"in e&&a(0,l=e.cls)},[l,s,r,n,()=>te.commit("setColorScheme","dark"),()=>te.commit("setColorScheme","light")]}class pe extends e{constructor(e){super(),t(this,e,me,ue,a,{cls:0})}}function ge(e){let t,a;return t=new pe({}),{c(){W(t.$$.fragment)},l(e){q(t.$$.fragment,e)},m(e,s){_(t,e,s),a=!0},i(e){a||(T(t.$$.fragment,e),a=!0)},o(e){E(t.$$.fragment,e),a=!1},d(e){F(t,e)}}}function ve(e){let t,a,f,h,u,m,p,g,v,$,b,x,y,k,w,I;return g=new M({props:{size:"2x",class:"dark:text-blue-100"}}),$=new P({props:{width:"80",backdropOpacity:"0.2",maxScreenWidth:"768",transitionDuration:"300",transitionTimingFunc:"cubic-bezier(0.9, 0.28, 0.08, 1.13)",class:"rounded",$$slots:{default:[ge]},$$scope:{ctx:e}}}),y=new pe({}),{c(){t=s("div"),a=s("div"),f=s("div"),h=s("a"),u=z("Hyp"),m=O(),p=s("button"),W(g.$$.fragment),v=O(),W($.$$.fragment),b=O(),x=s("div"),W(y.$$.fragment),this.h()},l(e){t=r(e,"DIV",{id:!0,class:!0});var s=n(t);a=r(s,"DIV",{class:!0});var c=n(a);f=r(c,"DIV",{});var i=n(f);h=r(i,"A",{href:!0,"sveltekit:prefetch":!0,class:!0});var o=n(h);u=S(o,"Hyp"),o.forEach(l),i.forEach(l),m=L(c),p=r(c,"BUTTON",{class:!0});var d=n(p);q(g.$$.fragment,d),d.forEach(l),c.forEach(l),s.forEach(l),v=L(e),q($.$$.fragment,e),b=L(e),x=r(e,"DIV",{id:!0,class:!0});var k=n(x);q(y.$$.fragment,k),k.forEach(l),this.h()},h(){c(h,"href","/"),c(h,"sveltekit:prefetch",""),c(h,"class","btn lead3 anchor"),i(h,"active","/"===e[0].path),c(p,"class",""),c(a,"class","flex justify-between"),c(t,"id","nav-sm"),c(t,"class","mobile mb-1 p-2 sticky-top"),c(x,"id","nav-md"),c(x,"class","desktop bg-transparent select-none md:px-10 py-2 sticky-top")},m(e,s){o(e,t,s),d(t,a),d(a,f),d(f,h),d(h,u),d(a,m),d(a,p),_(g,p,null),o(e,v,s),_($,e,s),o(e,b,s),o(e,x,s),_(y,x,null),k=!0,w||(I=A(p,"click",C),w=!0)},p(e,[t]){1&t&&i(h,"active","/"===e[0].path);const a={};2&t&&(a.$$scope={dirty:t,ctx:e}),$.$set(a)},i(e){k||(T(g.$$.fragment,e),T($.$$.fragment,e),T(y.$$.fragment,e),k=!0)},o(e){E(g.$$.fragment,e),E($.$$.fragment,e),E(y.$$.fragment,e),k=!1},d(e){e&&l(t),F(g),e&&l(v),F($,e),e&&l(b),e&&l(x),F(y),w=!1,I()}}}function $e(e,t,a){let s;return V(e,Y,(e=>a(0,s=e))),[s]}class be extends e{constructor(e){super(),t(this,e,$e,ve,a,{})}}function xe(e){let t,s,r=e[0],n=ye(e);return{c(){n.c(),t=k()},l(e){n.l(e),t=k()},m(e,a){n.m(e,a),o(e,t,a),s=!0},p(e,s){1&s&&a(r,r=e[0])?(w(),E(n,1,1,I),D(),n=ye(e),n.c(),T(n),n.m(t.parentNode,t)):n.p(e,s)},i(e){s||(T(n),s=!0)},o(e){E(n),s=!1},d(e){e&&l(t),n.d(e)}}}function ye(e){let t,a,i,f,h,u,k,w,E,I,D,T,V,j,N,B,U,M=e[1].message+"",P=e[1].dismissText+"",W=e[1].acceptText+"";return{c(){t=s("div"),a=s("div"),i=s("div"),f=z(M),h=O(),u=s("div"),k=s("button"),w=z(P),E=O(),I=s("button"),D=z(W),this.h()},l(e){t=r(e,"DIV",{style:!0,class:!0});var s=n(t);a=r(s,"DIV",{class:!0});var c=n(a);i=r(c,"DIV",{class:!0});var o=n(i);f=S(o,M),o.forEach(l),h=L(c),u=r(c,"DIV",{class:!0});var d=n(u);k=r(d,"BUTTON",{class:!0});var m=n(k);w=S(m,P),m.forEach(l),E=L(d),I=r(d,"BUTTON",{class:!0});var p=n(I);D=S(p,W),p.forEach(l),d.forEach(l),c.forEach(l),s.forEach(l),this.h()},h(){c(i,"class","p-4 font-semibold text-blue-700"),c(k,"class","hover:ring active:ring-4 capitalize active:bg-red-300 hover:text-red-600  focus:outline-transparent hover:ring-red-300 border-2 p-2 font-bold rounded-md border-red-500"),c(I,"class","hover:ring active:ring-4 capitalize active:bg-blue-300 hover:text-blue-600  focus:outline-transparent hover:ring-blue-300 border-2 p-2 font-bold rounded-md border-blue-500 hover:opacity-80"),c(u,"class","border-gray-300 p-4 flex justify-between border-t-1"),c(a,"class","w-96 max-w-full rounded-lg h-auto bg-gray-100 px-4"),G(t,"background-color","rgba(0,0,0,0.5)"),c(t,"class"," px-1 flex fixed m-auto top-0 items-center select-none justify-center w-screen h-screen")},m(s,r){o(s,t,r),d(t,a),d(a,i),d(i,f),d(a,h),d(a,u),d(u,k),d(k,w),d(u,E),d(u,I),d(I,D),N=!0,B||(U=[A(k,"click",e[3]),A(I,"click",e[4]),A(t,"click",e[5])],B=!0)},p(t,a){e=t,(!N||2&a)&&M!==(M=e[1].message+"")&&H(f,M),(!N||2&a)&&P!==(P=e[1].dismissText+"")&&H(w,P),(!N||2&a)&&W!==(W=e[1].acceptText+"")&&H(D,W)},i(e){N||(m((()=>{V&&V.end(1),T||(T=p(a,v,{delay:100,start:.8,easing:g,duration:250})),T.start()})),m((()=>{j||(j=$(t,b,{delay:100,duration:200},!0)),j.run(1)})),N=!0)},o(e){T&&T.invalidate(),V=x(a,v,{start:.9,easing:y,duration:200}),j||(j=$(t,b,{delay:100,duration:200},!1)),j.run(0),N=!1},d(e){e&&l(t),e&&V&&V.end(),e&&j&&j.end(),B=!1,R(U)}}}function ke(e){let t,a,s=e[1].visible&&xe(e);return{c(){s&&s.c(),t=k()},l(e){s&&s.l(e),t=k()},m(e,r){s&&s.m(e,r),o(e,t,r),a=!0},p(e,[a]){e[1].visible?s?(s.p(e,a),2&a&&T(s,1)):(s=xe(e),s.c(),T(s,1),s.m(t.parentNode,t)):s&&(w(),E(s,1,1,(()=>{s=null})),D())},i(e){a||(T(s),a=!0)},o(e){E(s),a=!1},d(e){s&&s.d(e),e&&l(t)}}}function we(e,t,a){let s,r;const n=te.state.prompt;return V(e,n,(e=>a(1,s=e))),[r,s,n,function(){s.ondismiss().then((()=>te.dispatch("hidePrompt")))},function(){s.onaccept().then((()=>te.dispatch("hidePrompt")))},function(e){e.target===e.currentTarget&&a(0,r=Math.random())}]}class Ee extends e{constructor(e){super(),t(this,e,we,ke,a,{})}}function Ie(e){let t,a;return t=new ie({}),{c(){W(t.$$.fragment)},l(e){q(t.$$.fragment,e)},m(e,s){_(t,e,s),a=!0},i(e){a||(T(t.$$.fragment,e),a=!0)},o(e){E(t.$$.fragment,e),a=!1},d(e){F(t,e)}}}function De(e){let t,a,i,h,u,m,p,g,v,$,b,x,y,I,V,j,N;t=new Ee({}),u=new be({});const z=e[4].default,S=J(z,e,e[3],null);x=new K({});let A="/file-manager"===e[0].path&&Ie();return{c(){W(t.$$.fragment),a=O(),i=s("div"),h=s("div"),W(u.$$.fragment),m=O(),p=s("div"),g=O(),S&&S.c(),v=O(),$=s("footer"),b=O(),W(x.$$.fragment),y=O(),A&&A.c(),I=k(),this.h()},l(e){q(t.$$.fragment,e),a=L(e),i=r(e,"DIV",{id:!0,class:!0});var s=n(i);h=r(s,"DIV",{class:!0});var c=n(h);q(u.$$.fragment,c),m=L(c),p=r(c,"DIV",{class:!0}),n(p).forEach(l),g=L(c),S&&S.l(c),c.forEach(l),s.forEach(l),v=L(e),$=r(e,"FOOTER",{class:!0}),n($).forEach(l),b=L(e),q(x.$$.fragment,e),y=L(e),A&&A.l(e),I=k(),this.h()},h(){c(p,"class","w-screen h-1"),c(h,"class","h-full flex flex-col flex-grow"),c(i,"id","main"),c(i,"class","w-full min-h-screen mx-auto flex flex-col justify-between bg-white dark:bg-gray-800 shadow-md select-none"),c($,"class","bg-gradient-to-r from-green-400 to-blue-500 flex flex-col justify-center items-center p-4  svelte-2i8okz")},m(e,s){_(t,e,s),o(e,a,s),o(e,i,s),d(i,h),_(u,h,null),d(h,m),d(h,p),d(h,g),S&&S.m(h,null),o(e,v,s),o(e,$,s),o(e,b,s),_(x,e,s),o(e,y,s),A&&A.m(e,s),o(e,I,s),V=!0,j||(N=f(ae.call(null,p)),j=!0)},p(e,[t]){S&&S.p&&(!V||8&t)&&Q(S,z,e,e[3],t,null,null),"/file-manager"===e[0].path?A?1&t&&T(A,1):(A=Ie(),A.c(),T(A,1),A.m(I.parentNode,I)):A&&(w(),E(A,1,1,(()=>{A=null})),D())},i(e){V||(T(t.$$.fragment,e),T(u.$$.fragment,e),T(S,e),T(x.$$.fragment,e),T(A),V=!0)},o(e){E(t.$$.fragment,e),E(u.$$.fragment,e),E(S,e),E(x.$$.fragment,e),E(A),V=!1},d(e){F(t,e),e&&l(a),e&&l(i),F(u),S&&S.d(e),e&&l(v),e&&l($),e&&l(b),F(x,e),e&&l(y),A&&A.d(e),e&&l(I),j=!1,N()}}}async function Te({page:e,fetch:t,session:a,context:s}){return te.dispatch("startConnection"),{}}function Ve(e,t,a){let s,r;V(e,Y,(e=>a(0,r=e)));let{$$slots:n={},$$scope:l}=t;const c=te.g("colorScheme");return V(e,c,(e=>a(2,s=e))),te.g("hideFilemenu"),e.$$set=e=>{"$$scope"in e&&a(3,l=e.$$scope)},e.$$.update=()=>{4&e.$$.dirty&&("dark"===s?document.body.classList.add("dark"):document.body.classList.remove("dark"))},[r,c,s,l,n]}class je extends e{constructor(e){super(),t(this,e,Ve,De,a,{})}}export{je as default,Te as load};
