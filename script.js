// ORCHID LAB — student access, page navigation, profile, and date display.
const authScreen = document.getElementById('authScreen');
const dashboardApp = document.getElementById('dashboardApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = [...document.querySelectorAll('[data-auth-tab]')];
const USERS_KEY = 'orchidLabUsers';
const SESSION_KEY = 'orchidLabSession';
const ADMINS_KEY = 'orchidLabAdmins';
// DEMO ONLY: change this code before testing. A code stored in front-end JavaScript is visible to anyone inspecting the source.
const ADMIN_ACCESS_CODE = 'ORCHID-ADMIN-2026';
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');

function getUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
function getAdmins(){ try { return JSON.parse(localStorage.getItem(ADMINS_KEY) || '[]'); } catch { return []; } }
function setAuthTab(tab){
  authTabs.forEach(button => button.classList.toggle('active', button.dataset.authTab === tab));
  loginForm.hidden = tab !== 'login';
  registerForm.hidden = tab !== 'register';
  adminPanel.hidden = tab !== 'admin';
  document.getElementById('loginMessage').textContent = '';
  document.getElementById('registerMessage').textContent = '';
  document.getElementById('adminLoginMessage').textContent = '';
  document.getElementById('adminRegisterMessage').textContent = '';
  adminLoginForm.hidden = false;
  adminRegisterForm.hidden = true;
}
authTabs.forEach(button => button.addEventListener('click', () => setAuthTab(button.dataset.authTab)));
document.getElementById('showAdminRegister').addEventListener('click', () => { adminLoginForm.hidden = true; adminRegisterForm.hidden = false; });
document.getElementById('backToAdminLogin').addEventListener('click', () => { adminRegisterForm.hidden = true; adminLoginForm.hidden = false; });

async function hashPassword(password){
  if (!window.crypto || !crypto.subtle) throw new Error('Secure password hashing is unavailable. Open this project using localhost (for example, XAMPP) or a secure browser context.');
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function openDashboard(user){
  const role = user.role || 'student';
  localStorage.setItem(SESSION_KEY, JSON.stringify({email:user.email, name:user.name, role}));
  authScreen.hidden = true;
  dashboardApp.hidden = false;
  const initials = user.name.trim().split(/\\s+/).map(part => part[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('avatar').textContent = initials || (role === 'admin' ? 'AD' : 'ST');
  document.getElementById('roleLabel').textContent = role === 'admin' ? 'ADMIN ACCESS' : 'STUDENT ACCESS';
  const fullName = document.getElementById('fullName');
  if (fullName) fullName.value = user.name;
}
function closeDashboard(){
  localStorage.removeItem(SESSION_KEY);
  dashboardApp.hidden = true;
  authScreen.hidden = false;
  setAuthTab('login');
  loginForm.reset();
  document.getElementById('loginMessage').textContent = 'You have logged out.';
}
function restoreSession(){
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const accountList = session?.role === 'admin' ? getAdmins() : getUsers();
    const user = session && accountList.find(item => item.email === session.email);
    if (user) { openDashboard(user); return; }
  } catch {}
  dashboardApp.hidden = true;
  authScreen.hidden = false;
}
registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const message = document.getElementById('registerMessage');
  message.textContent = '';
  if (name.length < 2) { message.textContent = 'Please enter your full name.'; return; }
  if (password.length < 8) { message.textContent = 'Password must be at least 8 characters.'; return; }
  if (password !== confirm) { message.textContent = 'Passwords do not match.'; return; }
  const users = getUsers();
  if (users.some(user => user.email === email)) { message.textContent = 'An account with this email already exists. Please log in.'; return; }
  try {
    const passwordHash = await hashPassword(password);
    const user = {name, email, passwordHash, role:'student'};
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    openDashboard(user);
  } catch (error) { message.textContent = error.message || 'Could not create your account.'; }
});
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const message = document.getElementById('loginMessage');
  message.textContent = '';
  try {
    const passwordHash = await hashPassword(password);
    const user = getUsers().find(item => item.email === email && item.passwordHash === passwordHash);
    if (!user) { message.textContent = 'Email or password is incorrect. Register first if you do not have an account.'; return; }
    openDashboard(user);
  } catch (error) { message.textContent = error.message || 'Could not log in.'; }
});
adminRegisterForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('adminRegisterName').value.trim();
  const email = document.getElementById('adminRegisterEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminRegisterPassword').value;
  const confirm = document.getElementById('adminConfirmPassword').value;
  const accessCode = document.getElementById('adminAccessCode').value;
  const message = document.getElementById('adminRegisterMessage');
  message.textContent = '';
  if (accessCode !== ADMIN_ACCESS_CODE) { message.textContent = 'Invalid admin access code. Ask the portal owner for the correct code.'; return; }
  if (name.length < 2) { message.textContent = 'Please enter the administrator name.'; return; }
  if (password.length < 8) { message.textContent = 'Password must be at least 8 characters.'; return; }
  if (password !== confirm) { message.textContent = 'Passwords do not match.'; return; }
  if (getAdmins().some(admin => admin.email === email) || getUsers().some(user => user.email === email)) { message.textContent = 'This email is already registered.'; return; }
  try {
    const passwordHash = await hashPassword(password);
    const admin = {name, email, passwordHash, role:'admin'};
    const admins = getAdmins(); admins.push(admin);
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    openDashboard(admin);
  } catch (error) { message.textContent = error.message || 'Could not create the admin account.'; }
});
adminLoginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('adminLoginEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminLoginPassword').value;
  const message = document.getElementById('adminLoginMessage');
  message.textContent = '';
  try {
    const passwordHash = await hashPassword(password);
    const admin = getAdmins().find(item => item.email === email && item.passwordHash === passwordHash);
    if (!admin) { message.textContent = 'Admin email or password is incorrect. Register with the access code first.'; return; }
    openDashboard(admin);
  } catch (error) { message.textContent = error.message || 'Could not log in.'; }
});

document.getElementById('logoutBtn').addEventListener('click', closeDashboard);

// Dashboard navigation is available only after authentication.
const pages=[...document.querySelectorAll('.page')];
const nav=[...document.querySelectorAll('.nav button[data-page]')];
function showPage(id){
  pages.forEach(page=>page.classList.toggle('active',page.id===id));
  nav.forEach(button=>button.classList.toggle('active',button.dataset.page===id));
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
nav.forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.go)));
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));

const saved=JSON.parse(localStorage.getItem('orchidStudent')||'{}');
if(saved.name){
  document.getElementById('fullName').value=saved.name;
  document.getElementById('studentNo').value=saved.number||'';
}
document.getElementById('profileForm').addEventListener('submit',event=>{
  event.preventDefault();
  const data={name:document.getElementById('fullName').value.trim(),number:document.getElementById('studentNo').value.trim()};
  localStorage.setItem('orchidStudent',JSON.stringify(data));
  document.getElementById('avatar').textContent=data.name.split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('profileMsg').textContent='Profile saved on this device.';
});
document.getElementById('today').textContent=new Date().toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}).toUpperCase();
restoreSession();
