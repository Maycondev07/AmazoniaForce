document.addEventListener("click",(e)=>{

const btn=e.target.closest("[data-logout]");

if(!btn) return;

auth.logout();

});