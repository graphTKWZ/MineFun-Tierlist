const SUPABASE_URL = "https://vpctqhooxwcmczjkxljq.supabase.co";
const SUPABASE_KEY = "sb_publishable_HHx1ZeCZBS2aOAsJqm0hXw_gGzK2zj-";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let data = [];
let dev = "PC";
let edit = null;
const icons = {S:"⭐",A:"🔥",B:"💎",C:"⚔️"};

const rules = [
"1.1) В тирлист могут подавать заявки исключительно игроки основного проекта Minefun.",
"1.2) В тирлисте могут находиться исключительно легитные игроки, а также игроки, чья анлегитность не подтверждается прямыми доказательствами.",
"1.3) Категории устройств полностью фиксированны: каждый участник находится только в одной категории в зависимости от коэффициента скилла на данном устройстве.",
"1.4) Скилл игрока оценивается по определённой формуле (Minefun + Practice) и сравнивается со средним коэффициентом других игроков в тирлисте.",
"1.5) Свапы происходят при полном доминировании над стандартной формой игрока либо при ощутимом перевесе в навыках на Minefun или по формуле среднего коэффициента. Запрещено завышать реальные навыки путём клеветы и дезинформации.",
"1.6) Для попадания в тирлист игрок оформляет заявку овнерам по указанным контактам и проходит проверку на чистый/ситуативный скилл напрямую или предоставляет актуальные видеодоказательства.",
"1.7) Срок актуальных видеодоказательств — 7 дней. После этого они становятся неактуальными.",
"1.8) Ограничения: S — 3 игрока (top 1–3), A — 10 игроков (top 4–13), B — 15 игроков (top 13–28), C — 12 игроков (top 28–40)."
];

document.getElementById("rulesText").innerHTML = rules.map(x=>`<p>${esc(x)}</p>`).join("");

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function page(id){
  document.querySelectorAll(".pg").forEach(x=>x.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if(id==="admin") refreshAuthUI();
}
function setDev(d,b){
  dev=d;
  document.querySelectorAll(".dev").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
  render();
}
async function loadPlayers(){
  setStatus("Загрузка…", false);
const {data:rows,error}=await sb
  .from("players")
  .select("*")
  .order("device")
  .order("sort_order");
  if(error){ setStatus("Ошибка базы", true); console.error(error); return; }
  data=rows||[];
  setStatus("Онлайн • синхронизировано", false);
  render();
  adminRender();
}
function setStatus(text,error){
  const el=document.getElementById("status");
  el.textContent=text;
  el.style.color=error?"#ff9b9b":"#9ee69e";
}
function render(){
  const q=document.getElementById("search").value.trim().toLowerCase();
  let out="";
  for(const t of ["S","A","B","C"]){
    const a=data.filter(p=>p.device===dev&&p.tier===t&&p.name.toLowerCase().includes(q));
    out+=`<section class="tier"><div class="th">${icons[t]} ${t} TIER <small>${a.length}</small></div><div class="players">`;
    out+=a.length?a.map(p=>`<div class="player" onclick="profile('${p.id}')"><i class="avatar">${esc(p.name.slice(0,2).toUpperCase())}</i><span>${esc(p.name)}</span></div>`).join(""):"<p>Игроки не найдены</p>";
    out+="</div></section>";
  }
  out+=`<section class="tier"><div class="th">🛡️ D TIER</div><div class="players"><p>Все остальные игроки</p></div></section>`;
  document.getElementById("tiers").innerHTML=out;
}
function profile(id){
  const p=data.find(x=>x.id===id);
  if(!p)return;
  page("profile");
  document.getElementById("profileBox").innerHTML=`<div class="profile">
    <h1>${esc(p.name)}</h1>
    <p>${icons[p.tier]} ${p.tier} TIER • ${p.device}</p>
    <p>💎 Донат: <b>${esc(p.donate)||"Не указан"}</b></p>
    <p>🎥 Видео: ${p.video?`<a href="${esc(p.video)}" target="_blank" rel="noopener">открыть</a>`:"не добавлено"}</p>
    <p>${esc(p.about)||"Информация о игроке пока не добавлена."}</p>
    ${p.social?`<a href="${esc(p.social)}" target="_blank" rel="noopener">Социальная сеть →</a>`:""}
  </div>`;
}
async function login(){
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  document.getElementById("loginError").textContent="";
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){document.getElementById("loginError").textContent=error.message;return;}
  await refreshAuthUI();
}
async function logout(){await sb.auth.signOut();refreshAuthUI();}
async function refreshAuthUI(){
  const {data:{user}}=await sb.auth.getUser();
  const loginBox=document.getElementById("login");
  const panel=document.getElementById("panel");
  if(user){
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    document.getElementById("adminUser").textContent=`Выполнен вход: ${user.email}`;
    adminRender();
  }else{
    loginBox.classList.remove("hidden");
    panel.classList.add("hidden");
  }
}
async function isAdmin(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return false;
  const {data:row,error}=await sb.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
  return !error && !!row;
}
async function adminRender(){
  const ok=await isAdmin();
  if(!ok)return;

  const q=document.getElementById("aq").value.trim().toLowerCase();
  const d=document.getElementById("ad").value;

  const a=data
    .filter(p =>
      (!q || p.name.toLowerCase().includes(q)) &&
      (d==="ALL" || p.device===d)
    )
    .sort((x,y) => {
      if(x.device !== y.device) return x.device.localeCompare(y.device);
      if(x.tier !== y.tier) return ["S","A","B","C"].indexOf(x.tier) - ["S","A","B","C"].indexOf(y.tier);
      return (x.sort_order ?? 9999) - (y.sort_order ?? 9999);
    });

  document.getElementById("table").innerHTML =
    `<div class="adminrow">
      <b>Игрок</b>
      <b>Устр.</b>
      <b>Тир</b>
      <b>Донат</b>
      <b>Порядок</b>
      <b>Действия</b>
    </div>` +

   a.map(p => `
  <div
    class="adminrow"
    draggable="true"
    data-id="${p.id}"
    data-device="${p.device}"
    data-tier="${p.tier}"
    ondragstart="dragStart(event)"
    ondragover="dragOver(event)"
    ondragleave="dragLeave(event)"
    ondrop="dropPlayer(event)"
    ondragend="dragEnd(event)"
  >
        <div>${esc(p.name)}</div>
        <div>${p.device}</div>
        <div>${p.tier}</div>
        <div>${esc(p.donate)||"—"}</div>

        <div>
          <button onclick="movePlayer('${p.id}', -1)" title="Поднять">↑</button>
          <button onclick="movePlayer('${p.id}', 1)" title="Опустить">↓</button>
        </div>

        <div>
          <button onclick="openForm('${p.id}')">Изм.</button>
          <button onclick="del('${p.id}')">Удал.</button>
        </div>
      </div>
    `).join("");
}
let draggedPlayerId = null;
let draggedDevice = null;
let draggedTier = null;

function dragStart(event){
  const row = event.currentTarget;

  const playerId = row.dataset.id;

  draggedPlayerId = playerId;
  draggedDevice = row.dataset.device;
  draggedTier = row.dataset.tier;

  row.classList.add("dragging");

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", playerId);
}
function dragOver(event){
  event.preventDefault();

  const row = event.currentTarget;

  if(
    row.dataset.device !== draggedDevice ||
    row.dataset.tier !== draggedTier ||
    row.dataset.id === draggedPlayerId
  ){
    event.dataTransfer.dropEffect = "none";
    return;
  }

  event.dataTransfer.dropEffect = "move";
  row.classList.add("drag-over");
}

function dragLeave(event){
  event.currentTarget.classList.remove("drag-over");
}

async function dropPlayer(event){
  event.preventDefault();

  const row = event.currentTarget;
  row.classList.remove("drag-over");

  const targetId = row.dataset.id;
  const sourceId = event.dataTransfer.getData("text/plain");

  if(!sourceId || !targetId){
    alert("Не удалось определить игрока");
    return;
  }

  if(sourceId === targetId){
    return;
  }

  if(
    row.dataset.device !== draggedDevice ||
    row.dataset.tier !== draggedTier
  ){
    alert("Перетаскивать можно только внутри одного тира и устройства");
    return;
  }

  if(!(await isAdmin())){
    alert("Нет доступа администратора");
    return;
  }

  const {error} = await sb.rpc("move_player_before", {
    p_id: sourceId,
    p_target_id: targetId
  });

  if(error){
    console.error(error);
    alert(error.message);
    return;
  }

  await loadPlayers();
}

function dragEnd(event){
  event.currentTarget.classList.remove("dragging");

  document
    .querySelectorAll(".adminrow")
    .forEach(row => row.classList.remove("drag-over"));

  draggedPlayerId = null;
  draggedDevice = null;
  draggedTier = null;
}

async function movePlayer(id, direction){
  if(!(await isAdmin())){
    alert("Нет доступа администратора");
    return;
  }

  const p = data.find(x => x.id === id);
  if(!p) return;

  const sameTier = data
    .filter(x => x.device === p.device && x.tier === p.tier)
    .sort((a,b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));

  const index = sameTier.findIndex(x => x.id === id);
  if(index === -1) return;

  const targetIndex = index + direction;

  if(targetIndex < 0 || targetIndex >= sameTier.length) return;

  const other = sameTier[targetIndex];

  const oldOrder = p.sort_order;
  const newOrder = other.sort_order;

  const r1 = await sb
    .from("players")
    .update({sort_order:newOrder})
    .eq("id", p.id);

  if(r1.error){
    alert(r1.error.message);
    return;
  }

  const r2 = await sb
    .from("players")
    .update({sort_order:oldOrder})
    .eq("id", other.id);

  if(r2.error){
    alert(r2.error.message);
    return;
  }

  await loadPlayers();
}
function openForm(id=null){
  edit=id;
  const p=id?data.find(x=>x.id===id):{name:"",device:"PC",tier:"S",donate:"",video:"",social:"",about:""};
  document.getElementById("modalTitle").textContent=id?"Редактирование игрока":"Добавление игрока";
  fn.value=p.name;fd.value=p.device;ft.value=p.tier;fdon.value=p.donate||"";fvid.value=p.video||"";fsoc.value=p.social||"";fab.value=p.about||"";
  document.getElementById("modal").classList.remove("hidden");
}
function closeForm(){document.getElementById("modal").classList.add("hidden");}
async function savePlayer(){
  if(!(await isAdmin())){
    return alert("Нет доступа администратора");
  }

  const p = {
    name: fn.value.trim(),
    device: fd.value,
    tier: ft.value,
    donate: fdon.value.trim(),
    video: fvid.value.trim(),
    social: fsoc.value.trim(),
    about: fab.value.trim()
  };

  if(!p.name){
    return alert("Введите ник");
  }

  const { data, error } = await sb.rpc("save_player_with_order", {
    p_id: edit || null,
    p_name: p.name,
    p_device: p.device,
    p_tier: p.tier,
    p_donate: p.donate,
    p_video: p.video,
    p_social: p.social,
    p_about: p.about
  });

  if(error){
    console.error(error);
    return alert(error.message);
  }

  closeForm();
  await loadPlayers();
}async function del(id){
  if(!(await isAdmin()))return;
  const p=data.find(x=>x.id===id);
  if(!p||!confirm("Удалить "+p.name+"?"))return;
  const {error}=await sb.from("players").delete().eq("id",id);
  if(error)return alert(error.message);
  await loadPlayers();
}
sb.auth.onAuthStateChange(()=>refreshAuthUI());
sb.channel("players-live").on("postgres_changes",{event:"*",schema:"public",table:"players"},()=>loadPlayers()).subscribe();

loadPlayers();
refreshAuthUI();