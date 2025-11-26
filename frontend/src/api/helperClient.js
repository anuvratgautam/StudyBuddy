const BASE = import.meta.env.VITE_STUDENT_HELPER_BASE || "http://localhost:8000";
function uid(){ return localStorage.getItem("sb_userId"); }
function token(){ return localStorage.getItem("sb_token"); }

async function api(endpoint, method="GET", body=null, isFile=false){
  const headers = { "X-User-ID": uid() || "" };
  if (token()) headers["Authorization"] = `Bearer ${token()}`;
  if (!isFile) headers["Content-Type"] = "application/json";
  const config = { method, headers };
  if (body) config.body = isFile ? body : JSON.stringify(body);

  const res = await fetch(`${BASE}${endpoint}`, config);
  const text = await res.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null }catch(e){}
  if (!res.ok) {
    const err = new Error(text || res.statusText);
    err.status = res.status;
    err.body = data || text;
    throw err;
  }
  return data;
}

export function askQuestion(question){ return api("/ask", "POST", { question }); }
export function uploadPdf(file){
  const f = new FormData(); f.append("file", file);
  return api("/upload", "POST", f, true);
}
export function getDocuments(){ return api("/documents"); }
export function deleteDocument(name){ return api(`/documents/${encodeURIComponent(name)}`, "DELETE"); }
export function clearDocuments(){ return api("/documents", "DELETE"); }
