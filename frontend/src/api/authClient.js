export function getStoredUserId(){ return localStorage.getItem("sb_userId"); }
export function setStoredUserId(id){ localStorage.setItem("sb_userId", id); }
export function getStoredToken(){ return localStorage.getItem("sb_token"); }
export function setStoredToken(t){ if(t) localStorage.setItem("sb_token", t); }
export function clearAuth(){ localStorage.removeItem("sb_userId"); localStorage.removeItem("sb_token"); }
