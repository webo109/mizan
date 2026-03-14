// ╔══════════════════════════════════════════════════════════════════╗
// ║  MIZAN — مِيزان  |  v4.1  |  Supabase Cloud Sync + New Nav       ║
// ╚══════════════════════════════════════════════════════════════════╝

import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// ─── SUPABASE ─────────────────────────────────────────────────────
const SUPA = 'https://fiecdxgsawlxgpysqzbf.supabase.co';
const AKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZWNkeGdzYXdseGdweXNxemJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODA0MDAsImV4cCI6MjA4OTA1NjQwMH0.nFFS1Tnt1d_MhzsBGbPSpjhtraFGqa9NrHJuhB-3KQU';
const H  = t => ({'Content-Type':'application/json','apikey':AKEY,'Authorization':`Bearer ${t||AKEY}`});
const db = {
  auth: async(p,b)=>{ const r=await fetch(`${SUPA}/auth/v1/${p}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':AKEY},body:JSON.stringify(b)}); return r.json(); },
  signUp:(e,p)=>db.auth('signup',{email:e,password:p}),
  signIn:(e,p)=>db.auth('token?grant_type=password',{email:e,password:p}),
  signOut:async t=>fetch(`${SUPA}/auth/v1/logout`,{method:'POST',headers:H(t)}),
  me: async t=>{ const r=await fetch(`${SUPA}/auth/v1/user`,{headers:H(t)}); return r.ok?r.json():null; },
  list:async(tbl,t,uid)=>{ const r=await fetch(`${SUPA}/rest/v1/${tbl}?user_id=eq.${uid}&select=*&order=created_at.desc`,{headers:H(t)}); const d=await r.json(); return Array.isArray(d)?d:[]; },
  one: async(tbl,t,uid)=>{ const r=await fetch(`${SUPA}/rest/v1/${tbl}?user_id=eq.${uid}&select=*`,{headers:H(t)}); const d=await r.json(); return Array.isArray(d)&&d.length?d[0]:null; },
  add: async(tbl,t,data)=>{ const r=await fetch(`${SUPA}/rest/v1/${tbl}`,{method:'POST',headers:{...H(t),'Prefer':'return=representation'},body:JSON.stringify(data)}); return r.json(); },
  del: async(tbl,t,id)=>fetch(`${SUPA}/rest/v1/${tbl}?id=eq.${id}`,{method:'DELETE',headers:H(t)}),
  ups: async(tbl,t,data)=>{ const r=await fetch(`${SUPA}/rest/v1/${tbl}`,{method:'POST',headers:{...H(t),'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(data)}); return r.json(); },
  upd: async(tbl,t,id,data)=>fetch(`${SUPA}/rest/v1/${tbl}?id=eq.${id}`,{method:'PATCH',headers:H(t),body:JSON.stringify(data)}),
};

// ─── MAPPERS ─────────────────────────────────────────────────────
const xE=(e,u)=>({id:e.id,user_id:u,amount:e.amount,merchant:e.merchant,category:e.category,date:e.date,note:e.note||''});
const mE=e=>({id:e.id,amount:+e.amount,merchant:e.merchant,category:e.category,date:e.date,note:e.note||''});
const xI=(i,u)=>({id:i.id,user_id:u,amount:i.amount,source:i.source,label:i.label,date:i.date,note:i.note||'',recurring:i.recurring||false,recurring_day:i.recurringDay||null});
const mI=i=>({id:i.id,amount:+i.amount,source:i.source,label:i.label,date:i.date,note:i.note||'',recurring:i.recurring||false,recurringDay:i.recurring_day});
const xG=(g,u)=>({id:g.id,user_id:u,name:g.name,icon:g.icon,color:g.color,target:g.target,saved:g.saved,deadline:g.deadline||'',is_main:g.isMain||false,locked:g.locked||false,lock_monthly:g.lockMonthly||0,lock_start_month:g.lockStartMonth||'',commit_history:g.commitHistory||[]});
const mG=g=>({id:g.id,name:g.name,icon:g.icon,color:g.color,target:+g.target,saved:+g.saved,deadline:g.deadline||'',isMain:g.is_main||false,locked:g.locked||false,lockMonthly:+g.lock_monthly||0,lockStartMonth:g.lock_start_month||'',commitHistory:g.commit_history||[]});
const xR=(r,u)=>({id:r.id,user_id:u,name:r.name,amount:r.amount,category:r.category||null,income_source:r.incomeSource||null,type:r.type,mode:r.mode,reminder:r.reminder??true,reminder_days:r.reminderDays||1,day_of_month:r.dayOfMonth||1});
const mR=r=>({id:r.id,name:r.name,amount:+r.amount,category:r.category,incomeSource:r.income_source,type:r.type,mode:r.mode,reminder:r.reminder??true,reminderDays:r.reminder_days||1,dayOfMonth:r.day_of_month||1});

// ─── CONSTANTS ───────────────────────────────────────────────────
const DEFAULT_CATS={
  food:     {en:'Food & Dining', ar:'طعام ومطاعم', icon:'🍽️',color:'#FF6B6B',custom:false},
  rent:     {en:'Rent & Bills',  ar:'إيجار وفواتير',icon:'🏠', color:'#4ECDC4',custom:false},
  transport:{en:'Transport',     ar:'مواصلات',      icon:'🚗', color:'#45B7D1',custom:false},
  shopping: {en:'Shopping',      ar:'تسوق',         icon:'🛍️',color:'#96CEB4',custom:false},
  business: {en:'Business',      ar:'أعمال',        icon:'💼', color:'#FFEAA7',custom:false},
  health:   {en:'Health',        ar:'صحة',          icon:'❤️',color:'#DDA0DD',custom:false},
  savings:  {en:'Savings',       ar:'مدخرات',       icon:'💰', color:'#F5A623',custom:false},
};
const DEFAULT_ITYPES={
  utas:     {en:'UTAS Stipend',  ar:'منحة UTAS', icon:'📚',color:'#4ECDC4',custom:false},
  freelance:{en:'Freelance',     ar:'عمل حر',    icon:'🛠️',color:'#F5A623',custom:false},
  family:   {en:'Family Support',ar:'دعم عائلي', icon:'👨‍👩‍👦',color:'#DDA0DD',custom:false},
  selling:  {en:'Selling Online',ar:'بيع أونلاين',icon:'🛒',color:'#96CEB4',custom:false},
  other:    {en:'Other',         ar:'أخرى',      icon:'💸',color:'#FF6B6B',custom:false},
};
const GOAL_ICONS =['🚀','🏪','💻','🛡️','✈️','🎓','🏠','🚗','💍','🌟','💎','🎯','🌍','📱','🏋️','🎪'];
const GOAL_COLORS=['#F5A623','#4ECDC4','#FF6B6B','#DDA0DD','#96CEB4','#45B7D1','#FFEAA7','#FF8C69','#7EC8E3','#B5EAD7','#C3B1E1','#FFD700'];
const CAT_COLORS =['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F5A623','#FF8C69','#7EC8E3','#B5EAD7','#C3B1E1','#A8D8A8'];
const CAT_ICONS  =['🎨','🏋️','📚','🎮','🐾','🌱','🍕','✂️','🎵','🎭','🧴','🛫','🏊','🧳','🎁','🔧','🎯','💄','🌿','🧒'];

const D=new Date(),TODAY=D.toISOString().split('T')[0],THIS_MONTH=TODAY.slice(0,7),THIS_YEAR=TODAY.slice(0,4);
const FMT=n=>`${Number(n).toFixed(3)} OMR`;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const getDaysUntil=day=>{const t=new Date(),n=new Date(t.getFullYear(),t.getMonth(),day);if(n<t)n.setMonth(n.getMonth()+1);return Math.ceil((n-t)/(1000*60*60*24));};

const INIT_BUDGETS={food:{mode:'target',amount:30},rent:{mode:'target',amount:90},transport:{mode:'target',amount:20},shopping:{mode:'target',amount:20},business:{mode:'open',amount:0},health:{mode:'target',amount:10},savings:{mode:'open',amount:0}};
const INIT_SETTINGS={theme:'dark',lang:'en',rolloverGoalId:'',notificationsEnabled:false,onboardingDone:false,apiKey:''};
const MORE_TABS=['reports','recurring','advisor','settings'];

// ─── TRANSLATIONS ────────────────────────────────────────────────
const TR={
  en:{
    dir:'ltr',appName:'Mizan',tagline:'Your Smart Financial Balance',
    nav:{dashboard:'Home',goals:'Goals',expense:'Expense',income:'Income'},
    more:{title:'More',reports:'Reports',reportsub:'Spending breakdown',recurring:'Recurring',reccursub:'Bills & subscriptions',advisor:'AI Advisor',advisorsub:'Personal insights',settings:'Settings',settingssub:'Preferences & data',back:'← More'},
    auth:{login:'Sign In',signup:'Sign Up',email:'Email',password:'Password',submit:'Continue',switching:'Don\'t have an account?',switchingTo:'Sign Up',switchingBack:'Already have an account?',switchingToLogin:'Sign In',error:'Invalid email or password.',errorSignup:'Could not create account.',loading:'Please wait…'},
    empty:{dashboard:{icon:'💸',title:'Your journey starts here',sub:'Add your first expense to see your financial picture come alive.',cta:'Add first expense'},goals:{icon:'🎯',title:'What are you saving for?',sub:'A business? A laptop? A trip? Start with one goal.',cta:'Create my first goal'},income:{icon:'💚',title:'No income recorded yet',sub:'Add your stipend or any money you receive.',cta:'Add income'},reports:{icon:'📊',title:'Your story is just beginning',sub:'It gets more interesting every day you track.'},recurring:{icon:'🔁',title:'No recurring items yet',sub:'Add monthly bills so Mizan can remind you.',cta:'Add recurring'}},
    welcome:{greeting:'Welcome to Mizan! 👋',sub:'Start by logging your first expense.',tip:'Tap the red button anytime to add an expense instantly.'},
    dash:{freeToSpend:'Free to Spend',totalIncome:'Income',totalSpent:'Spent',totalSaved:'Saved',alerts:'Budget Alerts',recentTx:'Recent',noAlerts:'All budgets on track 👍',mainGoal:'Main Goal',progress:'progress',toGo:'to go',seeAll:'See all →'},
    exp:{title:'Add Expense',amount:'Amount (OMR)',merchant:'Merchant / Paid to',category:'Category',date:'Date',note:'Note (optional)',save:'Save',saved:'Saved!',tabManual:'Manual',tabSms:'SMS',smsHint:'Paste your Arabic or English bank SMS — AI extracts everything',parse:'Parse SMS',parsing:'Parsing…',parsedResult:'Review before saving',confirm:'Confirm & Save',parseError:'Could not parse. Try manual entry.',noApiKey:'Add your Anthropic API key in Settings'},
    inc:{title:'Income',addIncome:'Add Income',totalMonth:'This Month',totalYear:'This Year',noIncome:'No income recorded yet',deleteConfirm:'Delete this income entry?',tabManual:'Manual',source:'Source',label:'Label',amount:'Amount (OMR)',date:'Date',note:'Note',recurring:'Recurring',recurringDay:'Day of month',save:'Save',saved:'Saved!'},
    goals:{title:'Goals',mainGoal:'Main Goal',pinAsMain:'Set as Main',addGoal:'New Goal',editGoal:'Edit',deleteConfirm:'Delete this goal?',name:'Goal Name',targetAmt:'Target (OMR)',savedAmt:'Already Saved (OMR)',deadline:'Deadline',icon:'Icon',color:'Color',save:'Save Goal',addToGoal:'Add Savings',add:'Add',toGo:'to go',progress:'progress',noGoals:'No goals yet',lockTitle:'Commitment Lock',lockDesc:'Freeze goal + commit monthly savings. Cannot undo until deadline.',lockEnable:'Enable Commitment Lock',lockMonthly:'Monthly commitment (OMR)',lockWarning:'⚠️ Once locked, cannot edit or delete until deadline.',locked:'LOCKED',unlocksOn:'Unlocks on',perMonth:'/ month'},
    rep:{title:'Reports',daily:'Daily',monthly:'Monthly',yearly:'Yearly',netFlow:'Net Flow',catBreak:'By Category',searchPlaceholder:'Search…',all:'All',expense:'Expense',income:'Income',totalSpent:'Total Spent',totalIncome:'Total Income',netSavings:'Net Savings',savingsRate:'Savings Rate',noResults:'No transactions found'},
    rec:{title:'Recurring',addItem:'Add',name:'Name',amount:'Amount',type:'Type',expense:'Expense',income:'Income',mode:'Mode',modeAuto:'Auto-log',modeRemind:'Remind',modeManual:'Manual',reminder:'Reminder',reminderDays:'Days before',dayOfMonth:'Day of month',category:'Category',incomeSource:'Income Source',save:'Save',due:'due',overdue:'overdue',daysLeft:'days'},
    adv:{title:'AI Advisor',subtitle:'Powered by Claude AI',generate:'Generate My Report',generating:'Analyzing…',noData:'Add expenses to get insights',refresh:'Refresh',apiKeyNeeded:'Add your Anthropic API key in Settings'},
    set:{title:'Settings',theme:'Theme',dark:'Dark',light:'Light',language:'Language',budgets:'Monthly Budgets',target:'Target',open:'Open',rollover:'Month-end Rollover',rolloverGoal:'Send leftover to',notifications:'Notifications',enableNotifs:'Enable Notifications',apiKey:'Anthropic API Key',apiKeyHint:'For SMS parsing & AI Advisor',customCats:'Custom Categories',customCatAdd:'Add Category',customISrc:'Custom Income Sources',customISrcAdd:'Add Source',catName:'Name (EN)',catIcon:'Icon',catColor:'Color',exportCSV:'Export CSV',clearData:'Clear All Data',clearConfirm:'Delete ALL data permanently?',logout:'Sign Out',logoutConfirm:'Sign out of Mizan?',save:'Save',saved:'Saved!',info:'Mizan v4.1 · Built for Oman 🇴🇲'},
    onboard:{w:'Welcome to مِيزان',wsub:'Your smart financial companion for Oman',income:'Your Income',incomeSub:'Set up your main income source',goal:'Your First Goal',goalSub:'What are you saving toward?',budget:'Budget Targets',budgetSub:'Set flexible monthly limits',remaining:'Remaining from income',next:'Next',back:'Back',finish:"Let's Go!",skip:'Skip setup'},
  },
  ar:{
    dir:'rtl',appName:'مِيزان',tagline:'توازنك المالي الذكي',
    nav:{dashboard:'الرئيسية',goals:'الأهداف',expense:'مصروف',income:'دخل'},
    more:{title:'المزيد',reports:'التقارير',reportsub:'تفصيل مصاريفك',recurring:'المتكررة',reccursub:'الفواتير',advisor:'المستشار',advisorsub:'رؤى مالية',settings:'الإعدادات',settingssub:'التفضيلات',back:'المزيد ←'},
    auth:{login:'تسجيل الدخول',signup:'إنشاء حساب',email:'البريد الإلكتروني',password:'كلمة المرور',submit:'متابعة',switching:'ليس لديك حساب؟',switchingTo:'إنشاء حساب',switchingBack:'لديك حساب؟',switchingToLogin:'تسجيل الدخول',error:'البريد أو كلمة المرور غير صحيحة.',errorSignup:'تعذّر إنشاء الحساب.',loading:'انتظر…'},
    empty:{dashboard:{icon:'💸',title:'رحلتك تبدأ هنا',sub:'أضف أول مصروف لترى صورتك المالية.',cta:'إضافة أول مصروف'},goals:{icon:'🎯',title:'ما الذي تدخر لأجله؟',sub:'مشروع؟ لابتوب؟ رحلة؟',cta:'إنشاء أول هدف'},income:{icon:'💚',title:'لا توجد مداخيل بعد',sub:'أضف منحتك أو أي دخل.',cta:'إضافة دخل'},reports:{icon:'📊',title:'قصتك بدأت للتو',sub:'تزداد إثارة كل يوم تتبع.'},recurring:{icon:'🔁',title:'لا عناصر متكررة',sub:'أضف الفواتير الشهرية.',cta:'إضافة متكرر'}},
    welcome:{greeting:'مرحباً في ميزان! 👋',sub:'ابدأ بتسجيل أول مصروف.',tip:'اضغط الزر الأحمر في أي وقت لإضافة مصروف.'},
    dash:{freeToSpend:'للإنفاق الحر',totalIncome:'الدخل',totalSpent:'الإنفاق',totalSaved:'المدخر',alerts:'تنبيهات',recentTx:'الأخيرة',noAlerts:'كل الميزانيات بخير 👍',mainGoal:'هدفي الرئيسي',progress:'تقدم',toGo:'للوصول',seeAll:'عرض الكل →'},
    exp:{title:'إضافة مصروف',amount:'المبلغ (ريال)',merchant:'الجهة',category:'الفئة',date:'التاريخ',note:'ملاحظة',save:'حفظ',saved:'تم!',tabManual:'يدوي',tabSms:'SMS',smsHint:'الصق رسالة البنك هنا',parse:'تحليل',parsing:'جاري…',parsedResult:'راجع قبل الحفظ',confirm:'تأكيد وحفظ',parseError:'تعذّر التحليل.',noApiKey:'أضف مفتاح API في الإعدادات'},
    inc:{title:'الدخل',addIncome:'إضافة دخل',totalMonth:'هذا الشهر',totalYear:'هذا العام',noIncome:'لا توجد مداخيل',deleteConfirm:'حذف هذا الدخل؟',tabManual:'يدوي',source:'المصدر',label:'التسمية',amount:'المبلغ',date:'التاريخ',note:'ملاحظة',recurring:'متكرر',recurringDay:'يوم الشهر',save:'حفظ',saved:'تم!'},
    goals:{title:'الأهداف',mainGoal:'هدفي الرئيسي',pinAsMain:'تعيين رئيسياً',addGoal:'هدف جديد',editGoal:'تعديل',deleteConfirm:'حذف هذا الهدف؟',name:'اسم الهدف',targetAmt:'المبلغ المستهدف',savedAmt:'المدخر',deadline:'الموعد النهائي',icon:'الأيقونة',color:'اللون',save:'حفظ',addToGoal:'إضافة مدخرات',add:'إضافة',toGo:'للوصول',progress:'تقدم',noGoals:'لا توجد أهداف',lockTitle:'قفل الالتزام',lockDesc:'تجميد الهدف مع ادخار شهري.',lockEnable:'تفعيل القفل',lockMonthly:'الالتزام الشهري',lockWarning:'⚠️ لا يمكن التعديل أو الحذف حتى الموعد.',locked:'مقفل',unlocksOn:'يُفتح في',perMonth:'/ شهر'},
    rep:{title:'التقارير',daily:'يومي',monthly:'شهري',yearly:'سنوي',netFlow:'صافي التدفق',catBreak:'توزيع الفئات',searchPlaceholder:'ابحث…',all:'الكل',expense:'مصروف',income:'دخل',totalSpent:'إجمالي الإنفاق',totalIncome:'إجمالي الدخل',netSavings:'صافي المدخرات',savingsRate:'معدل الادخار',noResults:'لا توجد معاملات'},
    rec:{title:'المتكررة',addItem:'إضافة',name:'الاسم',amount:'المبلغ',type:'النوع',expense:'مصروف',income:'دخل',mode:'الوضع',modeAuto:'تلقائي',modeRemind:'تذكير',modeManual:'يدوي',reminder:'تذكير',reminderDays:'أيام قبل',dayOfMonth:'يوم الشهر',category:'الفئة',incomeSource:'المصدر',save:'حفظ',due:'مستحق',overdue:'متأخر',daysLeft:'أيام'},
    adv:{title:'المستشار المالي',subtitle:'مدعوم بـ Claude AI',generate:'أنشئ تقريري',generating:'جاري…',noData:'أضف مصاريف للبدء',refresh:'تحديث',apiKeyNeeded:'أضف مفتاح API في الإعدادات'},
    set:{title:'الإعدادات',theme:'المظهر',dark:'داكن',light:'فاتح',language:'اللغة',budgets:'حدود الميزانية',target:'هدف',open:'مفتوح',rollover:'ترحيل الفائض',rolloverGoal:'أرسل الفائض إلى',notifications:'الإشعارات',enableNotifs:'تفعيل الإشعارات',apiKey:'مفتاح Anthropic API',apiKeyHint:'لتحليل SMS والمستشار',customCats:'فئات مخصصة',customCatAdd:'إضافة فئة',customISrc:'مصادر مخصصة',customISrcAdd:'إضافة مصدر',catName:'الاسم',catIcon:'الأيقونة',catColor:'اللون',exportCSV:'تصدير CSV',clearData:'مسح البيانات',clearConfirm:'حذف جميع البيانات؟',logout:'تسجيل الخروج',logoutConfirm:'تسجيل الخروج؟',save:'حفظ',saved:'تم!',info:'Mizan v4.1 · مصنوع لعُمان 🇴🇲'},
    onboard:{w:'مرحباً في مِيزان',wsub:'رفيقك المالي الذكي',income:'دخلك',incomeSub:'أضف مصدر دخلك',goal:'هدفك الأول',goalSub:'لماذا تدخر؟',budget:'ميزانيتك',budgetSub:'حدود شهرية مرنة',remaining:'المتبقي من دخلك',next:'التالي',back:'رجوع',finish:'لنبدأ!',skip:'تخطي'},
  },
};

// ─── CSS ──────────────────────────────────────────────────────────
const getCSS=theme=>`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  ${theme==='dark'?`--bg:#0A0E1A;--surf:#131929;--card:#1A2235;--card2:#1F2A40;--text:#E8EBF0;--muted:#6B7A99;--border:rgba(255,255,255,0.07);--input-bg:#1F2A40;`:`--bg:#F0EDE6;--surf:#FFFFFF;--card:#FFFFFF;--card2:#F8F5F0;--text:#1A1A2E;--muted:#7A8299;--border:rgba(0,0,0,0.09);--input-bg:#F8F5F0;`}
  --gold:#F5A623;--gold-bg:rgba(245,166,35,0.12);--gold-br:rgba(245,166,35,0.3);
  --teal:#4ECDC4;--coral:#FF6B6B;--r:14px;
}
html,body,#root{height:100%;}
body{background:var(--bg);color:var(--text);font-size:15px;-webkit-tap-highlight-color:transparent;}
.card{background:var(--card);border-radius:var(--r);border:1px solid var(--border);}
.btn{background:linear-gradient(135deg,#F5A623,#E8930E);color:#0A0E1A;border:none;border-radius:12px;padding:13px 20px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;width:100%;font-family:inherit;}
.btn:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(245,166,35,.35);}
.btn:active{transform:scale(.98);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-s{background:var(--card2);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:9px 16px;font-size:13px;cursor:pointer;transition:all .2s;font-family:inherit;}
.btn-s:hover{border-color:var(--gold);color:var(--gold);}
.btn-danger{background:var(--card2);color:var(--coral);border:1px solid rgba(255,107,107,.28);border-radius:10px;padding:9px 16px;font-size:13px;cursor:pointer;font-family:inherit;}
input,select,textarea{background:var(--input-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:11px 14px;font-size:14px;width:100%;outline:none;transition:border-color .2s;font-family:inherit;}
input:focus,select:focus,textarea:focus{border-color:var(--gold);}
select option{background:var(--card2);}
textarea{resize:vertical;min-height:80px;}
.tab{background:none;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--muted);transition:all .2s;font-family:inherit;}
.tab.on{background:var(--gold-bg);color:var(--gold);}
.pbar{background:rgba(128,128,128,.15);border-radius:999px;overflow:hidden;}
.pfill{height:100%;border-radius:999px;transition:width .7s cubic-bezier(.4,0,.2,1);}
.tx-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);}
.tx-row:last-child{border-bottom:none;}
@keyframes fi{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.fi{animation:fi .28s ease;}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
.label{font-size:12px;color:var(--muted);display:block;margin-bottom:6px;}
.field{display:flex;flex-direction:column;gap:0;margin-bottom:12px;}
.section-title{font-size:13px;font-weight:600;color:var(--gold);margin-bottom:12px;}
.badge{background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold-br);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;}
.lock-badge{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;}
.nav-btn{background:none;border:none;color:var(--muted);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:9px;padding:6px 2px;border-radius:10px;transition:all .2s;flex:1;font-family:inherit;}
.nav-btn.on{color:var(--gold);}
.nav-btn.on-red{color:var(--coral);}
.toggle-wrap{display:inline-flex;background:var(--card2);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
.toggle-btn{border:none;background:none;color:var(--muted);padding:4px 13px;font-size:12px;cursor:pointer;transition:all .2s;border-radius:18px;font-family:inherit;}
.toggle-btn.on{background:var(--gold);color:#0A0E1A;font-weight:700;}
.stat-card{background:var(--card);border-radius:12px;border:1px solid var(--border);padding:13px 10px;text-align:center;}
.sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;backdrop-filter:blur(3px);}
.sheet{position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-radius:24px 24px 0 0;z-index:201;padding-bottom:92px;animation:slideUp .3s cubic-bezier(.32,0,.67,0);max-width:520px;margin:0 auto;border:1px solid var(--border);border-bottom:none;}
.fab-exp{background:linear-gradient(135deg,#FF6B6B,#E85555);border:4px solid var(--bg);border-radius:50%;width:58px;height:58px;box-shadow:0 -2px 16px rgba(255,107,107,.4),0 4px 24px rgba(255,107,107,.55);cursor:pointer;font-size:26px;color:white;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .2s;transform:translateY(-14px);font-family:inherit;}
.fab-exp:hover{transform:translateY(-17px) scale(1.05);box-shadow:0 -2px 20px rgba(255,107,107,.5),0 8px 32px rgba(255,107,107,.65);}
.fab-exp:active{transform:translateY(-12px) scale(.97);}
.fab-exp.on{box-shadow:0 -2px 20px rgba(255,107,107,.7),0 8px 32px rgba(255,107,107,.8);}
`;

// ─── HOOKS ────────────────────────────────────────────────────────
function useLS(key,init){
  const [val,setVal]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(val));}catch{}},[key,val]);
  return [val,setVal];
}
function useCats(cc=[]){return useMemo(()=>{const m={...DEFAULT_CATS};cc.forEach(c=>{m[c.id]={en:c.en,ar:c.ar||c.en,icon:c.icon,color:c.color,custom:true};});return m;},[cc]);}
function useITypes(ci=[]){return useMemo(()=>{const m={...DEFAULT_ITYPES};ci.forEach(s=>{m[s.id]={en:s.en,ar:s.ar||s.en,icon:s.icon,color:s.color,custom:true};});return m;},[ci]);}
function isLockExpired(goal){if(!goal.locked||!goal.deadline)return false;return TODAY>=goal.deadline;}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────
const CTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:12}}>{label&&<div style={{color:'var(--muted)',marginBottom:4}}>{label}</div>}{payload.map((p,i)=><div key={i} style={{color:p.color||'var(--gold)'}}>{p.name}: {Number(p.value).toFixed(3)} OMR</div>)}</div>);
};
function Flash({msg,type='success'}){
  if(!msg)return null;
  const c={success:'var(--teal)',error:'var(--coral)',info:'var(--gold)'};
  return(<div className="fi" style={{background:`${c[type]}18`,border:`1px solid ${c[type]}44`,borderRadius:10,padding:'10px 14px',color:c[type],fontSize:13,textAlign:'center',marginBottom:10}}>{msg}</div>);
}
function Field({label,children}){return <div className="field"><label className="label">{label}</label>{children}</div>;}
function GoalRing({pct,icon,color,size=80,locked=false}){
  const r=size/2-7,circ=2*Math.PI*r,dash=Math.min(pct/100,1)*circ;
  return(<div style={{position:'relative',width:size,height:size,flexShrink:0}}><svg width={size} height={size} style={{transform:'rotate(-90deg)'}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(128,128,128,.2)" strokeWidth={6}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={locked?'#FF6B6B':color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray .7s ease'}}/></svg><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size>70?20:14}}>{locked?'🔒':icon}</div></div>);
}
function EmptyState({icon,title,sub,cta,onCta}){
  return(<div style={{textAlign:'center',padding:'52px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}><div style={{fontSize:58,lineHeight:1}}>{icon}</div><div style={{fontSize:17,fontWeight:700}}>{title}</div><div style={{fontSize:13,color:'var(--muted)',lineHeight:1.65,maxWidth:260}}>{sub}</div>{cta&&onCta&&<button className="btn" style={{width:'auto',padding:'12px 28px',marginTop:6}} onClick={onCta}>{cta}</button>}</div>);
}
function WelcomeCard({t,income,mainGoal,onAdd}){
  const w=t.welcome,pct=mainGoal?((mainGoal.saved/mainGoal.target)*100).toFixed(0):null;
  return(<div className="fi" style={{background:'linear-gradient(135deg,rgba(245,166,35,.13),rgba(78,205,196,.08))',border:'1px solid var(--gold-br)',borderRadius:20,padding:24,textAlign:'center'}}><div style={{fontSize:46,marginBottom:8}}>👋</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:21,color:'var(--gold)',marginBottom:8}}>{w.greeting}</div>{income>0&&<div style={{fontSize:13,marginBottom:4,lineHeight:1.6}}>You have <strong style={{color:'var(--teal)'}}>{income.toFixed(3)} OMR</strong> this month.{mainGoal&&pct&&<span> Your goal <strong>"{mainGoal.name}"</strong> is {pct}% there.</span>}</div>}<div style={{fontSize:12,color:'var(--muted)',marginBottom:16,lineHeight:1.65}}>{w.sub}</div><div style={{fontSize:12,color:'var(--teal)',background:'rgba(78,205,196,.1)',borderRadius:10,padding:'9px 14px',border:'1px solid rgba(78,205,196,.2)',marginBottom:16}}>💡 {w.tip}</div><button className="btn" style={{background:'linear-gradient(135deg,#FF6B6B,#E85555)'}} onClick={onAdd}>+ {t.exp.title}</button></div>);
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────
function AuthScreen({onSession,lang}){
  const t=TR[lang||'en'].auth;
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    if(!email||!pass)return;
    setLoading(true);setErr('');
    try{
      const d=mode==='login'?await db.signIn(email,pass):await db.signUp(email,pass);
      if(d.access_token){
        localStorage.setItem('mzn_auth',JSON.stringify({token:d.access_token,refresh:d.refresh_token,userId:d.user.id,email:d.user.email}));
        onSession({token:d.access_token,userId:d.user.id,email:d.user.email});
      } else {
        setErr(mode==='login'?t.error:t.errorSignup);
      }
    }catch{setErr(t.error);}
    setLoading(false);
  };

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:64,color:'var(--gold)',marginBottom:4}}>مِيزان</div>
      <div style={{fontSize:13,color:'var(--muted)',marginBottom:40}}>Your Smart Financial Balance</div>
      <div style={{width:'100%',maxWidth:360,background:'var(--card)',borderRadius:20,padding:28,border:'1px solid var(--border)'}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:20,color:'var(--text)'}}>{mode==='login'?t.login:t.signup}</div>
        {err&&<Flash msg={err} type="error"/>}
        <Field label={t.email}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==='Enter'&&submit()}/></Field>
        <Field label={t.password}><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()}/></Field>
        <button className="btn" style={{marginTop:8}} onClick={submit} disabled={loading||!email||!pass}>
          {loading?t.loading:t.submit}
        </button>
        <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--muted)'}}>
          {mode==='login'?t.switching:t.switchingBack}{' '}
          <button style={{background:'none',border:'none',color:'var(--gold)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}
            onClick={()=>{setMode(m=>m==='login'?'signup':'login');setErr('');}}>
            {mode==='login'?t.switchingTo:t.switchingToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────
export default function App(){
  const [session,setSession]=useState(null);
  const [appLoading,setAppLoading]=useState(true);
  const [expenses,setExpenses]=useState([]);
  const [incomes,setIncomes]=useState([]);
  const [goals,setGoals]=useState([]);
  const [recurring,setRecurring]=useState([]);
  const [budgets,setBudgets]=useState(INIT_BUDGETS);
  const [settings,setSettings]=useState(INIT_SETTINGS);
  const [customCats,setCustomCats]=useLS('mzn_ccats',[]);
  const [customISrc,setCustomISrc]=useLS('mzn_cisrc',[]);
  const [tab,setTab]=useState('dashboard');
  const [showMore,setShowMore]=useState(false);

  const t=TR[settings.lang];
  const CATS=useCats(customCats);
  const ITYPES=useITypes(customISrc);
  const fam=settings.lang==='ar'?"'Cairo', sans-serif":"'DM Sans', sans-serif";
  const upSett=p=>setSettings(s=>({...s,...p}));
  const mainGoal=goals.find(g=>g.isMain)||goals[0];
  const pinGoal=id=>setGoals(g=>g.map(gl=>({...gl,isMain:gl.id===id})));

  // Load session on mount
  useEffect(()=>{
    const stored=localStorage.getItem('mzn_auth');
    if(stored){
      const s=JSON.parse(stored);
      db.me(s.token).then(user=>{
        if(user&&user.id){setSession(s);loadData(s);}
        else{localStorage.removeItem('mzn_auth');setAppLoading(false);}
      }).catch(()=>{localStorage.removeItem('mzn_auth');setAppLoading(false);});
    } else {setAppLoading(false);}
  },[]);

  const loadData=async s=>{
    setAppLoading(true);
    try{
      const [exp,inc,gls,rec,bud,sett]=await Promise.all([
        db.list('expenses',s.token,s.userId),
        db.list('incomes',s.token,s.userId),
        db.list('goals',s.token,s.userId),
        db.list('recurring',s.token,s.userId),
        db.one('budgets',s.token,s.userId),
        db.one('user_settings',s.token,s.userId),
      ]);
      setExpenses(exp.map(mE));
      setIncomes(inc.map(mI));
      setGoals(gls.map(mG));
      setRecurring(rec.map(mR));
      if(bud?.data)setBudgets(bud.data);
      if(sett?.data)setSettings(sett.data);
    }catch(e){console.error('Load error',e);}
    setAppLoading(false);
  };

  const onSession=s=>{setSession(s);loadData(s);};
  const onLogout=async()=>{
    if(!window.confirm(t.set.logoutConfirm))return;
    await db.signOut(session.token);
    localStorage.removeItem('mzn_auth');
    setSession(null);setExpenses([]);setIncomes([]);setGoals([]);setRecurring([]);
    setBudgets(INIT_BUDGETS);setSettings(INIT_SETTINGS);
  };

  // Sync helpers
  const saveSettings=async ns=>{
    setSettings(ns);
    if(session)await db.ups('user_settings',session.token,{user_id:session.userId,data:ns,updated_at:new Date().toISOString()});
  };
  const saveBudgets=async nb=>{
    setBudgets(nb);
    if(session)await db.ups('budgets',session.token,{user_id:session.userId,data:nb,updated_at:new Date().toISOString()});
  };
  const addExpense=async e=>{setExpenses(p=>[e,...p]);if(session)await db.add('expenses',session.token,xE(e,session.userId));};
  const delExpense=async id=>{setExpenses(p=>p.filter(e=>e.id!==id));if(session)await db.del('expenses',session.token,id);};
  const addIncome=async i=>{setIncomes(p=>[i,...p]);if(session)await db.add('incomes',session.token,xI(i,session.userId));};
  const delIncome=async id=>{setIncomes(p=>p.filter(i=>i.id!==id));if(session)await db.del('incomes',session.token,id);};
  const setGoalsSync=async newGs=>{
    setGoals(newGs);
    if(session){for(const g of newGs)await db.ups('goals',session.token,xG(g,session.userId));}
  };
  const addGoal=async g=>{setGoals(p=>[...p,g]);if(session)await db.add('goals',session.token,xG(g,session.userId));};
  const delGoal=async id=>{setGoals(p=>p.filter(g=>g.id!==id));if(session)await db.del('goals',session.token,id);};
  const updateGoal=async g=>{setGoals(p=>p.map(x=>x.id===g.id?g:x));if(session)await db.ups('goals',session.token,xG(g,session.userId));};
  const addRecurring=async r=>{setRecurring(p=>[...p,r]);if(session)await db.add('recurring',session.token,xR(r,session.userId));};
  const delRecurring=async id=>{setRecurring(p=>p.filter(r=>r.id!==id));if(session)await db.del('recurring',session.token,id);};
  const updateRecurring=async r=>{setRecurring(p=>p.map(x=>x.id===r.id?r:x));if(session)await db.ups('recurring',session.token,xR(r,session.userId));};

  const monthIncome =useMemo(()=>incomes.filter(i=>i.date.startsWith(THIS_MONTH)).reduce((s,i)=>s+i.amount,0),[incomes]);
  const monthExpense=useMemo(()=>expenses.filter(e=>e.date.startsWith(THIS_MONTH)).reduce((s,e)=>s+e.amount,0),[expenses]);
  const monthSaved  =useMemo(()=>expenses.filter(e=>e.date.startsWith(THIS_MONTH)&&e.category==='savings').reduce((s,e)=>s+e.amount,0),[expenses]);
  const freeToSpend =Math.max(monthIncome-monthExpense,0);
  const dueCount    =useMemo(()=>recurring.filter(r=>r.type==='expense'&&getDaysUntil(r.dayOfMonth)<=(r.reminderDays||1)).length,[recurring]);

  const shared={t,CATS,ITYPES,settings,upSett:p=>saveSettings({...settings,...p})};
  const go=nextTab=>{setTab(nextTab);setShowMore(false);};

  if(appLoading) return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:16,background:'#0A0E1A'}}>
      <style>{getCSS('dark')}</style>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:'#F5A623'}}>مِيزان</div>
      <div style={{color:'#6B7A99',fontSize:14}}>Loading your finances…</div>
    </div>
  );

  if(!session) return(<><style>{getCSS(settings.theme)}</style><AuthScreen onSession={onSession} lang={settings.lang}/></>);

  return(
    <div style={{fontFamily:fam,direction:t.dir,minHeight:'100vh',background:'var(--bg)',color:'var(--text)'}}>
      <style>{getCSS(settings.theme)}</style>
      {!settings.onboardingDone&&(
        <Onboarding {...shared} setBudgets={saveBudgets} setGoals={setGoals} addGoal={addGoal}
          addIncome={addIncome} saveSettings={saveSettings} session={session}/>
      )}
      {settings.onboardingDone&&(<>
        <Header {...shared} tab={tab} showMore={showMore} setShowMore={setShowMore}/>
        <div style={{maxWidth:520,margin:'0 auto',padding:'14px 14px 104px'}}>
          {tab==='dashboard' &&<Dashboard {...shared} expenses={expenses} incomes={incomes} goals={goals} budgets={budgets} monthIncome={monthIncome} monthExpense={monthExpense} monthSaved={monthSaved} freeToSpend={freeToSpend} mainGoal={mainGoal} setTab={go}/>}
          {tab==='expense'   &&<AddExpense {...shared} onSave={addExpense}/>}
          {tab==='income'    &&<IncomePage {...shared} incomes={incomes} onAdd={addIncome} onDel={delIncome}/>}
          {tab==='goals'     &&<Goals {...shared} goals={goals} addGoal={addGoal} delGoal={delGoal} updateGoal={updateGoal} pinGoal={id=>setGoalsSync(goals.map(g=>({...g,isMain:g.id===id})))} addExpense={addExpense}/>}
          {tab==='reports'   &&<Reports {...shared} expenses={expenses} incomes={incomes} budgets={budgets}/>}
          {tab==='recurring' &&<Recurring {...shared} recurring={recurring} addRecurring={addRecurring} delRecurring={delRecurring} updateRecurring={updateRecurring}/>}
          {tab==='advisor'   &&<AIAdvisor {...shared} expenses={expenses} incomes={incomes} goals={goals} budgets={budgets} monthIncome={monthIncome} monthExpense={monthExpense} freeToSpend={freeToSpend}/>}
          {tab==='settings'  &&<Settings {...shared} budgets={budgets} saveBudgets={saveBudgets} goals={goals} customCats={customCats} setCustomCats={setCustomCats} customISrc={customISrc} setCustomISrc={setCustomISrc} setExpenses={setExpenses} setIncomes={setIncomes} setGoals={setGoals} setRecurring={setRecurring} onLogout={onLogout} session={session}/>}
        </div>
        <BottomNav t={t} tab={tab} setTab={go} showMore={showMore} setShowMore={setShowMore} dueCount={dueCount}/>
        {showMore&&<MoreSheet t={t} tab={tab} setTab={go} onClose={()=>setShowMore(false)} dueCount={dueCount}/>}
      </>)}
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────
function Header({t,settings,upSett,tab,showMore,setShowMore}){
  const isMore=MORE_TABS.includes(tab);
  return(
    <div style={{background:'var(--surf)',borderBottom:'1px solid var(--border)',padding:'11px 16px',position:'sticky',top:0,zIndex:99}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:520,margin:'0 auto'}}>
        {isMore
          ?<button onClick={()=>setShowMore(true)} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontSize:13,color:'var(--gold)',fontWeight:600,fontFamily:'inherit'}}>{t.more.back}</button>
          :<div><div style={{fontFamily:"'Playfair Display',serif",fontSize:21,color:'var(--gold)',lineHeight:1.1}}>{t.appName}</div><div style={{fontSize:10,color:'var(--muted)'}}>{t.tagline}</div></div>
        }
        <div style={{display:'flex',gap:8}}>
          <div className="toggle-wrap">
            <button className={`toggle-btn ${settings.theme==='dark'?'on':''}`} onClick={()=>upSett({theme:'dark'})}>🌙</button>
            <button className={`toggle-btn ${settings.theme==='light'?'on':''}`} onClick={()=>upSett({theme:'light'})}>☀️</button>
          </div>
          <div className="toggle-wrap">
            <button className={`toggle-btn ${settings.lang==='en'?'on':''}`} onClick={()=>upSett({lang:'en'})}>EN</button>
            <button className={`toggle-btn ${settings.lang==='ar'?'on':''}`} onClick={()=>upSett({lang:'ar'})}>ع</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────
function BottomNav({t,tab,setTab,showMore,setShowMore,dueCount}){
  const isMoreActive=showMore||MORE_TABS.includes(tab);
  return(
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100}}>
      <div style={{background:'var(--surf)',borderTop:'1px solid var(--border)',maxWidth:520,margin:'0 auto',display:'flex',alignItems:'flex-end',padding:'0 8px 10px',overflow:'visible'}}>
        {/* Home */}
        <button className={`nav-btn ${tab==='dashboard'&&!showMore?'on':''}`} onClick={()=>setTab('dashboard')}>
          <span style={{fontSize:18}}>📊</span><span>{t.nav.dashboard}</span>
        </button>
        {/* Goals */}
        <button className={`nav-btn ${tab==='goals'&&!showMore?'on':''}`} onClick={()=>setTab('goals')}>
          <span style={{fontSize:18}}>🎯</span><span>{t.nav.goals}</span>
        </button>
        {/* Expense FAB — red, center */}
        <div style={{flex:1,display:'flex',justifyContent:'center',overflow:'visible'}}>
          <button className={`fab-exp ${tab==='expense'&&!showMore?'on':''}`} onClick={()=>setTab('expense')} aria-label="Add expense">
            +
          </button>
        </div>
        {/* Income */}
        <button className={`nav-btn ${tab==='income'&&!showMore?'on-red':''}`} style={{color:tab==='income'&&!showMore?'var(--teal)':'var(--muted)'}} onClick={()=>setTab('income')}>
          <span style={{fontSize:18}}>💚</span><span>{t.nav.income}</span>
        </button>
        {/* More */}
        <button className={`nav-btn ${isMoreActive?'on':''}`} style={{position:'relative'}} onClick={()=>setShowMore(s=>!s)}>
          {dueCount>0&&<span style={{position:'absolute',top:4,right:'calc(50% - 12px)',background:'var(--coral)',color:'white',borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{dueCount>9?'9+':dueCount}</span>}
          <span style={{fontSize:18}}>☰</span><span>{t.more.title}</span>
        </button>
      </div>
    </div>
  );
}

// ─── MORE SHEET ───────────────────────────────────────────────────
function MoreSheet({t,tab,setTab,onClose,dueCount}){
  const m=t.more;
  const items=[
    {key:'reports',  icon:'📊',label:m.reports,  sub:m.reportsub,  badge:false},
    {key:'recurring',icon:'🔁',label:m.recurring,sub:m.reccursub,  badge:dueCount>0},
    {key:'advisor',  icon:'🤖',label:m.advisor,  sub:m.advisorsub, badge:false},
    {key:'settings', icon:'⚙️',label:m.settings, sub:m.settingssub,badge:false},
  ];
  return(<>
    <div className="sheet-backdrop" onClick={onClose}/>
    <div className="sheet">
      <div style={{width:36,height:4,background:'var(--border)',borderRadius:999,margin:'14px auto 16px'}}/>
      <div style={{padding:'0 20px 8px',fontFamily:"'Playfair Display',serif",fontSize:20,color:'var(--gold)'}}>{m.title}</div>
      {items.map(item=>(
        <button key={item.key} onClick={()=>setTab(item.key)} style={{width:'100%',background:tab===item.key?'var(--gold-bg)':'none',border:'none',borderBottom:'1px solid var(--border)',padding:'15px 20px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',textAlign:'left',color:'var(--text)',fontFamily:'inherit',transition:'background .15s'}}>
          <span style={{fontSize:26,minWidth:34,textAlign:'center'}}>{item.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
              {item.label}
              {item.badge&&<span style={{background:'var(--coral)',color:'white',borderRadius:999,padding:'1px 7px',fontSize:10,fontWeight:700}}>{dueCount} due</span>}
            </div>
            <div style={{fontSize:12,color:'var(--muted)'}}>{item.sub}</div>
          </div>
          <span style={{color:'var(--muted)',fontSize:18}}>›</span>
        </button>
      ))}
    </div>
  </>);
}

// ─── ONBOARDING ──────────────────────────────────────────────────
function Onboarding({t,settings,upSett,saveBudgets,addGoal,addIncome,saveSettings,session,CATS,ITYPES}){
  const o=t.onboard;
  const [step,setStep]=useState(0);
  const [inc,setInc]=useState({amount:'90',day:'1',source:'utas'});
  const [goal,setGoal]=useState({name:'',target:'1000',icon:'🚀',color:GOAL_COLORS[0]});
  const [buds,setBuds]=useState({food:30,rent:80,transport:20,shopping:15,health:10,savings:20,business:0});

  const totalBudgeted=Object.values(buds).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const remaining=parseFloat(inc.amount||0)-totalBudgeted;
  const isOver=remaining<0;

  const finish=async()=>{
    if(inc.amount){
      const ni={id:uid(),amount:parseFloat(inc.amount)||90,source:inc.source,label:ITYPES[inc.source]?.en||inc.source,date:TODAY,note:'Initial',recurring:true,recurringDay:parseInt(inc.day)||1};
      await addIncome(ni);
    }
    if(goal.name&&goal.target){
      const ng={id:uid(),name:goal.name,icon:goal.icon,color:goal.color,target:parseFloat(goal.target)||1000,saved:0,deadline:'',isMain:true,locked:false,lockMonthly:0,lockStartMonth:'',commitHistory:[]};
      await addGoal(ng);
    }
    const nb={};
    Object.entries(DEFAULT_CATS).forEach(([k])=>{nb[k]={mode:buds[k]>0?'target':'open',amount:buds[k]||0};});
    await saveBudgets(nb);
    await saveSettings({...settings,onboardingDone:true});
  };

  const steps=[
    <div key={0} style={{textAlign:'center',padding:'20px 0'}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:'var(--gold)',marginBottom:8}}>مِيزان</div>
      <div style={{fontSize:22,fontWeight:600,marginBottom:6}}>{o.w}</div>
      <div style={{color:'var(--muted)',fontSize:14,marginBottom:24}}>{o.wsub}</div>
      {['Smart income & expense tracking','AI-powered Arabic SMS parsing','Multiple savings goals with commitment lock','Cloud sync across all your devices ☁️'].map((f,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:'var(--card2)',borderRadius:10,padding:'10px 14px',fontSize:13,marginBottom:8}}>
          <span style={{color:'var(--teal)'}}>✓</span>{f}
        </div>
      ))}
    </div>,
    <div key={1}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{o.income}</div>
      <div style={{color:'var(--muted)',fontSize:13,marginBottom:14}}>{o.incomeSub}</div>
      <Field label="Income Source"><select value={inc.source} onChange={e=>setInc(p=>({...p,source:e.target.value}))}>
        {Object.entries(ITYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.en}</option>)}
      </select></Field>
      <Field label="Monthly Amount (OMR)"><input type="number" value={inc.amount} step="0.001" onChange={e=>setInc(p=>({...p,amount:e.target.value}))}/></Field>
      <Field label="Usually arrives on day"><input type="number" min="1" max="31" value={inc.day} onChange={e=>setInc(p=>({...p,day:e.target.value}))}/></Field>
    </div>,
    <div key={2}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{o.goal}</div>
      <div style={{color:'var(--muted)',fontSize:13,marginBottom:14}}>{o.goalSub}</div>
      <Field label="Goal Name"><input type="text" value={goal.name} placeholder="My Business" onChange={e=>setGoal(p=>({...p,name:e.target.value}))}/></Field>
      <Field label="Target (OMR)"><input type="number" value={goal.target} onChange={e=>setGoal(p=>({...p,target:e.target.value}))}/></Field>
      <div className="label" style={{marginBottom:8}}>Pick an icon</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
        {GOAL_ICONS.map(ic=><button key={ic} onClick={()=>setGoal(p=>({...p,icon:ic}))} style={{fontSize:20,padding:5,borderRadius:8,border:`2px solid ${goal.icon===ic?'var(--gold)':'var(--border)'}`,background:'var(--card2)',cursor:'pointer'}}>{ic}</button>)}
      </div>
    </div>,
    <div key={3}>
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{o.budget}</div>
      <div style={{color:'var(--muted)',fontSize:13,marginBottom:14}}>{o.budgetSub}</div>
      {/* Remaining Display */}
      <div style={{textAlign:'center',padding:'16px 12px',marginBottom:16,background:isOver?'rgba(255,107,107,.1)':'var(--gold-bg)',borderRadius:16,border:`1px solid ${isOver?'rgba(255,107,107,.3)':'var(--gold-br)'}`}}>
        <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>{o.remaining}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:700,color:isOver?'var(--coral)':'var(--gold)',lineHeight:1,transition:'color .3s'}}>
          {remaining.toFixed(3)}
        </div>
        <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>OMR {isOver&&<span style={{color:'var(--coral)',fontWeight:600}}>— over budget!</span>}</div>
      </div>
      {Object.entries(CATS).map(([k,v])=>(
        <div key={k} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <span style={{fontSize:16,minWidth:24}}>{v.icon}</span>
          <span style={{flex:1,fontSize:13}}>{v.en}</span>
          <input type="number" value={buds[k]||0} style={{width:80}} onChange={e=>setBuds(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/>
        </div>
      ))}
    </div>,
  ];

  return(
    <div style={{position:'fixed',inset:0,background:'var(--bg)',zIndex:999,overflow:'auto'}}>
      <div style={{maxWidth:420,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{display:'flex',gap:6,marginBottom:24,justifyContent:'center'}}>
          {steps.map((_,i)=><div key={i} style={{height:4,flex:1,borderRadius:999,background:i<=step?'var(--gold)':'var(--border)',transition:'background .3s'}}/>)}
        </div>
        <div className="fi">{steps[step]}</div>
        <div style={{display:'flex',gap:10,marginTop:22}}>
          {step>0&&<button className="btn-s" onClick={()=>setStep(s=>s-1)}>{o.back}</button>}
          {step<steps.length-1?<button className="btn" onClick={()=>setStep(s=>s+1)}>{o.next}</button>:<button className="btn" onClick={finish}>{o.finish}</button>}
          {step===0&&<button className="btn-s" onClick={finish}>{o.skip}</button>}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({t,CATS,ITYPES,settings,expenses,incomes,goals,budgets,monthIncome,monthExpense,monthSaved,freeToSpend,mainGoal,setTab}){
  const d=t.dash;
  const hasExp=expenses.some(e=>e.date.startsWith(THIS_MONTH));
  const catTotals=useMemo(()=>{const m={};expenses.filter(e=>e.date.startsWith(THIS_MONTH)).forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});return m;},[expenses]);
  const topBudgets=useMemo(()=>Object.entries(budgets).filter(([,b])=>b.mode==='target'&&b.amount>0).map(([cat,b])=>({cat,spent:catTotals[cat]||0,budget:b.amount,pct:((catTotals[cat]||0)/b.amount)*100})).sort((a,b)=>b.pct-a.pct).slice(0,3),[budgets,catTotals]);
  const alerts=topBudgets.filter(a=>a.pct>=80);
  const recent=useMemo(()=>[...expenses.map(e=>({...e,kind:'expense'})),...incomes.map(i=>({...i,kind:'income',merchant:i.label,category:null}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5),[expenses,incomes]);
  const goalPct=mainGoal?Math.min((mainGoal.saved/mainGoal.target)*100,100):0;
  const locked=mainGoal?.locked&&!isLockExpired(mainGoal);

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Hero */}
      <div style={{background:settings.theme==='dark'?'linear-gradient(135deg,#1A2235 0%,#1F2A40 100%)':'linear-gradient(135deg,#FFFAF0 0%,#FFF3DC 100%)',borderRadius:20,padding:22,border:'1px solid var(--gold-br)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-30,right:-30,width:130,height:130,borderRadius:'50%',background:'rgba(245,166,35,.06)'}}/>
        <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>{d.freeToSpend}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:46,color:'var(--gold)',fontWeight:700,letterSpacing:'-1.5px',lineHeight:1}}>{freeToSpend.toFixed(3)}</div>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>OMR</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[{l:d.totalIncome,v:monthIncome.toFixed(3),icon:'💚',c:'var(--teal)'},{l:d.totalSpent,v:monthExpense.toFixed(3),icon:'🔴',c:'var(--coral)'},{l:d.totalSaved,v:monthSaved.toFixed(3),icon:'💛',c:'var(--gold)'}].map((s,i)=>(
            <div key={i} style={{background:'rgba(128,128,128,.08)',borderRadius:10,padding:'9px 8px',textAlign:'center'}}>
              <div style={{fontSize:14}}>{s.icon}</div>
              <div style={{fontSize:10,color:'var(--muted)',margin:'3px 0 2px'}}>{s.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      {!hasExp&&<WelcomeCard t={t} income={monthIncome} mainGoal={mainGoal} onAdd={()=>setTab('expense')}/>}
      {mainGoal&&hasExp&&(
        <div className="card" style={{padding:18,cursor:'pointer'}} onClick={()=>setTab('goals')}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div className="section-title" style={{margin:0}}>🎯 {d.mainGoal}</div>
            {locked&&<span className="lock-badge">🔒 {t.goals.locked}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <GoalRing pct={goalPct} icon={mainGoal.icon} color={mainGoal.color} size={80} locked={locked}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,marginBottom:5}}>{mainGoal.name}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>{FMT(mainGoal.saved)} / {FMT(mainGoal.target)}</div>
              <div className="pbar" style={{height:7}}><div className="pfill" style={{width:`${goalPct}%`,background:locked?'var(--coral)':`linear-gradient(90deg,${mainGoal.color},${mainGoal.color}88)`}}/></div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{goalPct.toFixed(1)}% {d.progress} · {FMT(Math.max(mainGoal.target-mainGoal.saved,0))} {d.toGo}</div>
            </div>
          </div>
        </div>
      )}
      {alerts.length>0&&(
        <div className="card" style={{padding:14}}>
          <div className="section-title" style={{color:'var(--coral)'}}>⚠️ {d.alerts}</div>
          {alerts.map((a,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:9,marginBottom:6,background:a.pct>=100?'rgba(255,107,107,.1)':'rgba(245,166,35,.1)',borderLeft:`3px solid ${a.pct>=100?'var(--coral)':'var(--gold)'}`,fontSize:13}}>
              <span>{CATS[a.cat]?.icon} {CATS[a.cat]?.en}</span>
              <span style={{color:a.pct>=100?'var(--coral)':'var(--gold)',fontWeight:600}}>{a.spent.toFixed(3)} / {a.budget} OMR</span>
            </div>
          ))}
        </div>
      )}
      {hasExp&&topBudgets.length>0&&(
        <div className="card" style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div className="section-title" style={{margin:0}}>📊 Budget</div>
            <button className="btn-s" style={{padding:'4px 10px',fontSize:11}} onClick={()=>setTab('reports')}>{d.seeAll}</button>
          </div>
          {topBudgets.map(({cat,spent,budget,pct})=>{const cv=CATS[cat];const over=spent>budget;return(
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span>{cv?.icon} {settings.lang==='ar'?cv?.ar:cv?.en}</span>
                <span style={{color:over?'var(--coral)':'var(--muted)'}}>{spent.toFixed(3)} / {budget} OMR</span>
              </div>
              <div className="pbar" style={{height:6}}><div className="pfill" style={{width:`${Math.min(pct,100)}%`,background:over?'var(--coral)':cv?.color||'var(--gold)'}}/></div>
            </div>
          );})}
        </div>
      )}
      {hasExp&&recent.length>0&&(
        <div className="card" style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div className="section-title" style={{margin:0}}>🕐 {d.recentTx}</div>
            <button className="btn-s" style={{padding:'4px 10px',fontSize:11}} onClick={()=>setTab('reports')}>{d.seeAll}</button>
          </div>
          {recent.map((tx,i)=>(
            <div key={i} className="tx-row">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{tx.kind==='income'?(ITYPES[tx.source]?.icon||'💚'):(CATS[tx.category]?.icon||'💳')}</span>
                <div><div style={{fontSize:13,fontWeight:500}}>{tx.merchant}</div><div style={{fontSize:11,color:'var(--muted)'}}>{tx.date}</div></div>
              </div>
              <span style={{fontWeight:700,fontSize:13,color:tx.kind==='income'?'var(--teal)':'var(--coral)'}}>{tx.kind==='income'?'+':'−'}{FMT(tx.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADD EXPENSE ──────────────────────────────────────────────────
function AddExpense({t,CATS,settings,onSave}){
  const a=t.exp;
  const [mode,setMode]=useState('manual');
  const [form,setForm]=useState({amount:'',merchant:'',category:'food',date:TODAY,note:''});
  const [sms,setSms]=useState('');
  const [parsing,setParsing]=useState(false);
  const [parsed,setParsed]=useState(null);
  const [flash,setFlash]=useState({msg:'',type:'success'});
  const [smsErr,setSmsErr]=useState('');
  const sf=(msg,type='success')=>{setFlash({msg,type});setTimeout(()=>setFlash({msg:'',type:'success'}),2400);};

  const save=()=>{
    if(!form.amount||!form.merchant)return;
    onSave({id:uid(),amount:parseFloat(form.amount),merchant:form.merchant,category:form.category,date:form.date,note:form.note});
    setForm({amount:'',merchant:'',category:'food',date:TODAY,note:''});sf(a.saved);
  };
  const parseSMS=async()=>{
    if(!sms.trim())return;
    if(!settings.apiKey){setSmsErr(a.noApiKey);return;}
    setParsing(true);setSmsErr('');setParsed(null);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':settings.apiKey,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:700,messages:[{role:'user',content:`Parse this Omani bank SMS and return ONLY valid JSON.\nSMS: ${sms}\nJSON: {"type":"expense","amount":<number>,"merchant":"<English>","balance":<number|null>,"date":"${TODAY}","category":"food|rent|transport|shopping|business|health|savings"}\nReturn ONLY JSON.`}]})});
      const data=await res.json();
      setParsed(JSON.parse((data.content?.[0]?.text||'').replace(/```json|```/g,'').trim()));
    }catch{setSmsErr(a.parseError);}
    setParsing(false);
  };
  const saveParsed=()=>{
    if(!parsed)return;
    onSave({id:uid(),amount:parseFloat(parsed.amount),merchant:parsed.merchant,category:parsed.category||'shopping',date:parsed.date||TODAY,note:''});
    setParsed(null);setSms('');sf(a.saved);
  };

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--coral)'}}>{a.title}</h2>
      <Flash msg={flash.msg} type={flash.type}/>
      <div style={{display:'flex',background:'var(--card)',borderRadius:12,padding:4,gap:4}}>
        {[[' manual',`📝 ${a.tabManual}`],['sms',`📱 ${a.tabSms}`]].map(([m,lbl])=>(
          <button key={m} className={`tab ${mode===m.trim()?'on':''}`} style={{flex:1}} onClick={()=>setMode(m.trim())}>{lbl}</button>
        ))}
      </div>
      {mode==='manual'&&(
        <div className="card" style={{padding:16}}>
          <Field label={a.amount}><input type="number" step="0.001" placeholder="0.000" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></Field>
          <Field label={a.merchant}><input type="text" placeholder="Lulu Hypermarket" value={form.merchant} onChange={e=>setForm(p=>({...p,merchant:e.target.value}))}/></Field>
          <Field label={a.category}><select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
            {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {settings.lang==='ar'?v.ar:v.en}</option>)}
          </select></Field>
          <Field label={a.date}><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Field>
          <Field label={a.note}><input type="text" placeholder="optional…" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}/></Field>
          <button className="btn" style={{background:'linear-gradient(135deg,#FF6B6B,#E85555)'}} onClick={save} disabled={!form.amount||!form.merchant}>{a.save}</button>
        </div>
      )}
      {mode==='sms'&&(<>
        <div className="card" style={{padding:16}}>
          <label className="label">{a.smsHint}</label>
          <textarea value={sms} onChange={e=>setSms(e.target.value)} dir="auto" placeholder="تم خصم 0.800 OMR من حسابك…"/>
          {smsErr&&<Flash msg={smsErr} type="error"/>}
          <button className="btn" style={{marginTop:10,background:'linear-gradient(135deg,#FF6B6B,#E85555)'}} onClick={parseSMS} disabled={parsing||!sms.trim()}>
            {parsing?`⏳ ${a.parsing}`:`🔍 ${a.parse}`}
          </button>
        </div>
        {parsed&&(
          <div className="card fi" style={{padding:16,borderColor:'rgba(255,107,107,.3)'}}>
            <div className="section-title">✅ {a.parsedResult}</div>
            <Field label={a.amount}><input type="number" step="0.001" value={parsed.amount} onChange={e=>setParsed(p=>({...p,amount:e.target.value}))}/></Field>
            <Field label={a.merchant}><input type="text" value={parsed.merchant} onChange={e=>setParsed(p=>({...p,merchant:e.target.value}))}/></Field>
            <Field label={a.category}><select value={parsed.category||'shopping'} onChange={e=>setParsed(p=>({...p,category:e.target.value}))}>
              {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.en}</option>)}
            </select></Field>
            <Field label={a.date}><input type="date" value={parsed.date||TODAY} onChange={e=>setParsed(p=>({...p,date:e.target.value}))}/></Field>
            {parsed.balance!=null&&<div style={{background:'var(--gold-bg)',borderRadius:9,padding:'9px 13px',fontSize:13,color:'var(--gold)',border:'1px solid var(--gold-br)',marginBottom:12}}>💳 New Balance: {FMT(parsed.balance)}</div>}
            <button className="btn" style={{background:'linear-gradient(135deg,#FF6B6B,#E85555)'}} onClick={saveParsed}>{a.confirm}</button>
          </div>
        )}
      </>)}
    </div>
  );
}

// ─── INCOME PAGE ──────────────────────────────────────────────────
function IncomePage({t,ITYPES,settings,incomes,onAdd,onDel}){
  const i=t.inc;
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({amount:'',source:'utas',label:'',date:TODAY,note:'',recurring:false,recurringDay:'1'});
  const [flash,setFlash]=useState('');
  const sf=msg=>{setFlash(msg);setTimeout(()=>setFlash(''),2000);};

  const save=async()=>{
    if(!form.amount||!form.label)return;
    await onAdd({id:uid(),amount:parseFloat(form.amount),source:form.source,label:form.label,date:form.date,note:form.note,recurring:form.recurring,recurringDay:parseInt(form.recurringDay)||1});
    setForm({amount:'',source:'utas',label:'',date:TODAY,note:'',recurring:false,recurringDay:'1'});
    setShowForm(false);sf(i.saved);
  };
  const del=async id=>{if(window.confirm(i.deleteConfirm))await onDel(id);};

  const monthTotal=useMemo(()=>incomes.filter(x=>x.date.startsWith(THIS_MONTH)).reduce((s,x)=>s+x.amount,0),[incomes]);
  const yearTotal =useMemo(()=>incomes.filter(x=>x.date.startsWith(THIS_YEAR)).reduce((s,x)=>s+x.amount,0),[incomes]);
  const grouped   =useMemo(()=>{const g={};incomes.forEach(x=>{if(!g[x.source])g[x.source]=[];g[x.source].push(x);});return g;},[incomes]);

  if(incomes.length===0&&!showForm)return(
    <div className="fi">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--teal)'}}>{i.title}</h2>
        <button className="btn-s" onClick={()=>setShowForm(true)}>+ {i.addIncome}</button>
      </div>
      <EmptyState {...t.empty.income} onCta={()=>setShowForm(true)}/>
    </div>
  );

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--teal)'}}>{i.title}</h2>
        <button className="btn-s" onClick={()=>setShowForm(s=>!s)}>+ {i.addIncome}</button>
      </div>
      <Flash msg={flash} type="success"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {[{l:i.totalMonth,v:monthTotal,c:'var(--teal)'},{l:i.totalYear,v:yearTotal,c:'var(--gold)'}].map((s,idx)=>(
          <div key={idx} className="stat-card"><div className="label">{s.l}</div><div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v.toFixed(3)}</div><div style={{fontSize:11,color:'var(--muted)'}}>OMR</div></div>
        ))}
      </div>
      {showForm&&(
        <div className="card fi" style={{padding:16,borderColor:'rgba(78,205,196,.25)'}}>
          <Field label={i.source}><select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}>
            {Object.entries(ITYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {settings.lang==='ar'?v.ar:v.en}</option>)}
          </select></Field>
          <Field label={i.label}><input type="text" placeholder="UTAS March Stipend" value={form.label} onChange={e=>setForm(p=>({...p,label:e.target.value}))}/></Field>
          <Field label={i.amount}><input type="number" step="0.001" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></Field>
          <Field label={i.date}><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Field>
          <Field label={i.note}><input type="text" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}/></Field>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <input type="checkbox" checked={form.recurring} style={{width:'auto'}} onChange={e=>setForm(p=>({...p,recurring:e.target.checked}))}/>
            <span style={{fontSize:13}}>{i.recurring}</span>
          </div>
          {form.recurring&&<Field label={i.recurringDay}><input type="number" min="1" max="31" value={form.recurringDay} onChange={e=>setForm(p=>({...p,recurringDay:e.target.value}))}/></Field>}
          <button className="btn" style={{background:'linear-gradient(135deg,#4ECDC4,#3AB8AF)'}} onClick={save} disabled={!form.amount||!form.label}>{i.save}</button>
        </div>
      )}
      {Object.entries(grouped).map(([src,list])=>(
        <div key={src} className="card" style={{padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:18}}>{ITYPES[src]?.icon||'💸'}</span>
            <span style={{fontWeight:600,fontSize:14}}>{settings.lang==='ar'?ITYPES[src]?.ar:ITYPES[src]?.en}</span>
            <span className="badge">{list.reduce((s,x)=>s+x.amount,0).toFixed(3)} OMR</span>
          </div>
          {list.sort((a,b)=>b.date.localeCompare(a.date)).map(inc=>(
            <div key={inc.id} className="tx-row">
              <div><div style={{fontSize:13,fontWeight:500}}>{inc.label}</div><div style={{fontSize:11,color:'var(--muted)'}}>{inc.date}{inc.recurring?' 🔁':''}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'var(--teal)',fontWeight:700,fontSize:13}}>+{FMT(inc.amount)}</span>
                <button className="btn-danger" style={{padding:'3px 8px',fontSize:11}} onClick={()=>del(inc.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── GOALS ────────────────────────────────────────────────────────
function Goals({t,settings,goals,addGoal,delGoal,updateGoal,pinGoal,addExpense}){
  const g=t.goals;
  const [editing,setEditing]=useState(null);
  const [addGoalId,setAddGoalId]=useState(null);
  const [addAmt,setAddAmt]=useState('');
  const [form,setForm]=useState({name:'',icon:'🚀',color:GOAL_COLORS[0],target:'',saved:'',deadline:'',lockEnable:false,lockMonthly:''});
  const [flash,setFlash]=useState({msg:'',type:'success'});
  const sf=(msg,type='success')=>{setFlash({msg,type});setTimeout(()=>setFlash({msg:'',type:'success'}),2400);};

  const openNew=()=>{setForm({name:'',icon:'🚀',color:GOAL_COLORS[0],target:'',saved:'',deadline:'',lockEnable:false,lockMonthly:''});setEditing('new');};
  const openEdit=goal=>{if(goal.locked&&!isLockExpired(goal))return;setForm({name:goal.name,icon:goal.icon,color:goal.color,target:String(goal.target),saved:String(goal.saved),deadline:goal.deadline||'',lockEnable:false,lockMonthly:''});setEditing(goal.id);};
  const saveGoal=async()=>{
    if(!form.name||!form.target)return;
    if(form.lockEnable&&!form.deadline){sf('Set a deadline to enable lock','error');return;}
    if(form.lockEnable&&!form.lockMonthly){sf('Set a monthly commitment','error');return;}
    const base={name:form.name,icon:form.icon,color:form.color,target:parseFloat(form.target)||100,saved:parseFloat(form.saved)||0,deadline:form.deadline,isMain:goals.length===0};
    const lk=form.lockEnable?{locked:true,lockMonthly:parseFloat(form.lockMonthly)||0,lockStartMonth:THIS_MONTH,commitHistory:[]}:{locked:false,lockMonthly:0,lockStartMonth:'',commitHistory:[]};
    if(editing==='new'){await addGoal({id:uid(),...base,...lk});}
    else{await updateGoal({...goals.find(x=>x.id===editing),...base,...lk});}
    setEditing(null);sf(t.exp.saved);
  };
  const handleDel=async id=>{
    const goal=goals.find(g=>g.id===id);
    if(goal?.locked&&!isLockExpired(goal)){sf('🔒 Cannot delete a locked goal','error');return;}
    if(window.confirm(g.deleteConfirm))await delGoal(id);
  };
  const addToGoal=async id=>{
    if(!addAmt)return;
    const goal=goals.find(x=>x.id===id);
    await updateGoal({...goal,saved:goal.saved+parseFloat(addAmt)});
    setAddAmt('');setAddGoalId(null);sf('Savings added!');
  };
  const tryPin=id=>{
    const curr=goals.find(g=>g.isMain);
    if(curr?.locked&&!isLockExpired(curr)){sf('🔒 Locked goal is pinned until deadline','error');return;}
    pinGoal(id);
  };

  const mainGoal=goals.find(gl=>gl.isMain)||goals[0];
  const others=goals.filter(gl=>!gl.isMain);

  if(goals.length===0&&!editing)return(<div className="fi"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{g.title}</h2><button className="btn-s" onClick={openNew}>+ {g.addGoal}</button></div><EmptyState {...t.empty.goals} onCta={openNew}/></div>);

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{g.title}</h2>
        <button className="btn-s" onClick={openNew}>+ {g.addGoal}</button>
      </div>
      <Flash msg={flash.msg} type={flash.type}/>
      {editing&&(
        <div className="card fi" style={{padding:16}}>
          <div className="section-title">{editing==='new'?g.addGoal:g.editGoal}</div>
          <Field label={g.name}><input type="text" value={form.name} placeholder="My Business" onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
          <Field label={g.targetAmt}><input type="number" step="0.001" value={form.target} onChange={e=>setForm(p=>({...p,target:e.target.value}))}/></Field>
          <Field label={g.savedAmt}><input type="number" step="0.001" value={form.saved} onChange={e=>setForm(p=>({...p,saved:e.target.value}))}/></Field>
          <Field label={g.deadline}><input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/></Field>
          <div className="label" style={{marginBottom:8}}>{g.icon}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>{GOAL_ICONS.map(ic=><button key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))} style={{fontSize:20,padding:5,borderRadius:8,border:`2px solid ${form.icon===ic?'var(--gold)':'var(--border)'}`,background:'var(--card2)',cursor:'pointer'}}>{ic}</button>)}</div>
          <div className="label" style={{marginBottom:8}}>{g.color}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>{GOAL_COLORS.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${form.color===c?'var(--text)':'transparent'}`}}/>)}</div>
          <div style={{background:'rgba(255,107,107,.07)',borderRadius:12,padding:14,border:'1px solid rgba(255,107,107,.2)',marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:4,color:'var(--coral)'}}>🔒 {g.lockTitle}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:10,lineHeight:1.5}}>{g.lockDesc}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:form.lockEnable?10:0}}>
              <input type="checkbox" checked={form.lockEnable} style={{width:'auto'}} onChange={e=>setForm(p=>({...p,lockEnable:e.target.checked}))}/>
              <label style={{fontSize:13,cursor:'pointer',fontWeight:500}}>{g.lockEnable}</label>
            </div>
            {form.lockEnable&&(<><Field label={g.lockMonthly}><input type="number" step="0.001" value={form.lockMonthly} placeholder="15.000" onChange={e=>setForm(p=>({...p,lockMonthly:e.target.value}))}/></Field><div style={{background:'rgba(255,107,107,.12)',borderRadius:8,padding:'9px 12px',fontSize:12,color:'var(--coral)'}}>{g.lockWarning}</div></>)}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn" onClick={saveGoal} disabled={!form.name||!form.target}>{g.save}</button>
            <button className="btn-s" onClick={()=>setEditing(null)}>✕</button>
          </div>
        </div>
      )}
      {mainGoal&&(()=>{
        const pct=Math.min((mainGoal.saved/mainGoal.target)*100,100);
        const locked=mainGoal.locked&&!isLockExpired(mainGoal);
        return(
          <div style={{background:`linear-gradient(135deg,${mainGoal.color}22,${mainGoal.color}0d)`,borderRadius:20,padding:22,border:`1px solid ${locked?'rgba(255,107,107,.35)':mainGoal.color+'44'}`,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:`${mainGoal.color}10`}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px'}}>{g.mainGoal}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,marginTop:2}}>{mainGoal.name}</div>
                {mainGoal.deadline&&<div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{locked?`🔒 ${g.unlocksOn}: ${mainGoal.deadline}`:`📅 ${mainGoal.deadline}`}</div>}
              </div>
              <div style={{display:'flex',gap:6}}>
                {locked&&<span className="lock-badge">🔒 {g.locked}</span>}
                {!locked&&<button className="btn-s" style={{padding:'5px 10px',fontSize:11}} onClick={()=>openEdit(mainGoal)}>✏️</button>}
                {!locked&&<button className="btn-danger" style={{padding:'5px 10px',fontSize:11}} onClick={()=>handleDel(mainGoal.id)}>🗑️</button>}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              <GoalRing pct={pct} icon={mainGoal.icon} color={mainGoal.color} size={100} locked={locked}/>
              <div style={{flex:1}}>
                <div style={{fontSize:26,fontWeight:700,color:locked?'var(--coral)':mainGoal.color,fontFamily:"'Playfair Display',serif"}}>{pct.toFixed(1)}%</div>
                <div style={{fontSize:13,color:'var(--muted)',margin:'4px 0'}}>{FMT(mainGoal.saved)} / {FMT(mainGoal.target)}</div>
                <div className="pbar" style={{height:8}}><div className="pfill" style={{width:`${pct}%`,background:locked?'var(--coral)':`linear-gradient(90deg,${mainGoal.color},${mainGoal.color}88)`}}/></div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:5}}>{FMT(Math.max(mainGoal.target-mainGoal.saved,0))} {g.toGo}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:6,marginTop:16}}>
              {[25,50,75,100].map(m=>{const done=(mainGoal.saved/mainGoal.target)*100>=m;return(<div key={m} style={{flex:1,textAlign:'center',padding:'6px 4px',borderRadius:8,background:done?`${mainGoal.color}22`:'rgba(128,128,128,.08)',opacity:done?1:0.5}}><div style={{fontSize:12}}>{done?'✅':'⭕'}</div><div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{m}%</div></div>);})}
            </div>
            {!locked&&(addGoalId===mainGoal.id?(<div style={{display:'flex',gap:8,marginTop:12}}><input type="number" step="0.001" value={addAmt} placeholder="0.000 OMR" onChange={e=>setAddAmt(e.target.value)} style={{flex:1}}/><button className="btn" style={{width:'auto',padding:'10px 16px'}} onClick={()=>addToGoal(mainGoal.id)}>{g.add}</button><button className="btn-s" onClick={()=>setAddGoalId(null)}>✕</button></div>):(<button className="btn-s" style={{width:'100%',marginTop:12}} onClick={()=>setAddGoalId(mainGoal.id)}>💰 {g.addToGoal}</button>))}
            {locked&&<div style={{marginTop:12,textAlign:'center',fontSize:12,color:'var(--coral)',padding:'8px',background:'rgba(255,107,107,.08)',borderRadius:8}}>🔒 Auto-saving {FMT(mainGoal.lockMonthly)} {g.perMonth} until {mainGoal.deadline}</div>}
          </div>
        );
      })()}
      {others.map(gl=>{
        const pct=Math.min((gl.saved/gl.target)*100,100);const locked=gl.locked&&!isLockExpired(gl);
        return(<div key={gl.id} className="card" style={{padding:14,borderLeft:locked?'3px solid var(--coral)':undefined}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <GoalRing pct={pct} icon={gl.icon} color={gl.color} size={52} locked={locked}/>
              <div><div style={{fontWeight:600,fontSize:14,display:'flex',alignItems:'center',gap:6}}>{gl.name}{locked&&<span className="lock-badge" style={{fontSize:9}}>🔒</span>}</div><div style={{fontSize:11,color:'var(--muted)'}}>{FMT(gl.saved)} / {FMT(gl.target)}</div><div className="pbar" style={{height:5,width:120,marginTop:4}}><div className="pfill" style={{width:`${pct}%`,background:locked?'var(--coral)':gl.color}}/></div></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {!locked&&<button className="btn-s" style={{padding:'4px 8px',fontSize:11}} onClick={()=>tryPin(gl.id)}>⭐ {g.pinAsMain}</button>}
              <div style={{display:'flex',gap:5}}>{!locked&&<button className="btn-s" style={{padding:'4px 8px',fontSize:11}} onClick={()=>openEdit(gl)}>✏️</button>}<button className="btn-danger" style={{padding:'4px 8px',fontSize:11}} onClick={()=>handleDel(gl.id)}>🗑️</button></div>
            </div>
          </div>
          {!locked&&(addGoalId===gl.id?(<div style={{display:'flex',gap:8}}><input type="number" step="0.001" value={addAmt} placeholder="0.000 OMR" onChange={e=>setAddAmt(e.target.value)} style={{flex:1}}/><button className="btn" style={{width:'auto',padding:'8px 14px'}} onClick={()=>addToGoal(gl.id)}>{g.add}</button><button className="btn-s" onClick={()=>setAddGoalId(null)}>✕</button></div>):(<button className="btn-s" style={{width:'100%',fontSize:12}} onClick={()=>setAddGoalId(gl.id)}>+ {g.addToGoal}</button>))}
        </div>);
      })}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────
function Reports({t,CATS,ITYPES,settings,expenses,incomes,budgets}){
  const r=t.rep;
  const [period,setPeriod]=useState('monthly');
  const [search,setSearch]=useState('');
  const [filterT,setFilterT]=useState('all');
  const prefix=period==='daily'?TODAY:period==='monthly'?THIS_MONTH:THIS_YEAR;
  const allTx=useMemo(()=>[...expenses.map(e=>({...e,kind:'expense'})),...incomes.map(i=>({...i,kind:'income',merchant:i.label,category:null}))].filter(tx=>tx.date.startsWith(prefix)).filter(tx=>!search||tx.merchant?.toLowerCase().includes(search.toLowerCase())).filter(tx=>filterT==='all'||(filterT==='expense'&&tx.kind==='expense')||(filterT==='income'&&tx.kind==='income')).sort((a,b)=>b.date.localeCompare(a.date)),[expenses,incomes,prefix,search,filterT]);
  const totalSpent=allTx.filter(x=>x.kind==='expense').reduce((s,e)=>s+e.amount,0);
  const totalIncome=allTx.filter(x=>x.kind==='income').reduce((s,i)=>s+i.amount,0);
  const netSavings=totalIncome-totalSpent;
  const savingsRate=totalIncome>0?(netSavings/totalIncome)*100:0;
  const catData=useMemo(()=>{const m={};expenses.filter(e=>e.date.startsWith(prefix)).forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;});return Object.entries(m).map(([k,v])=>({name:settings.lang==='ar'?(CATS[k]?.ar||k):(CATS[k]?.en||k),value:parseFloat(v.toFixed(3)),color:CATS[k]?.color||'#888'})).filter(d=>d.value>0);},[expenses,prefix,CATS,settings.lang]);
  const flowData=useMemo(()=>{const all=[...expenses,...incomes];const keys=[...new Set(all.filter(x=>x.date.startsWith(prefix)).map(x=>period==='yearly'?x.date.slice(0,7):x.date))].sort();return keys.map(k=>({d:period==='yearly'?k:k.slice(5),income:parseFloat(incomes.filter(i=>i.date.startsWith(k)).reduce((s,i)=>s+i.amount,0).toFixed(3)),expense:parseFloat(expenses.filter(e=>e.date.startsWith(k)).reduce((s,e)=>s+e.amount,0).toFixed(3))}));},[expenses,incomes,period,prefix]);

  if(expenses.length===0&&incomes.length===0)return(<div className="fi"><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)',marginBottom:14}}>{r.title}</h2><EmptyState {...t.empty.reports}/></div>);

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{r.title}</h2>
      <div style={{display:'flex',background:'var(--card)',borderRadius:12,padding:4,gap:4}}>
        {[['daily',r.daily],['monthly',r.monthly],['yearly',r.yearly]].map(([k,v])=><button key={k} className={`tab ${period===k?'on':''}`} style={{flex:1}} onClick={()=>setPeriod(k)}>{v}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {[{l:r.totalSpent,v:totalSpent.toFixed(3),c:'var(--coral)'},{l:r.totalIncome,v:totalIncome.toFixed(3),c:'var(--teal)'},{l:r.netSavings,v:netSavings.toFixed(3),c:netSavings>=0?'var(--gold)':'var(--coral)'},{l:r.savingsRate,v:`${savingsRate.toFixed(0)}%`,c:'#DDA0DD'}].map((s,i)=><div key={i} className="stat-card"><div className="label">{s.l}</div><div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div></div>)}
      </div>
      <div className="card" style={{padding:12,display:'flex',gap:8}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`🔍 ${r.searchPlaceholder}`} style={{flex:2}}/>
        <select value={filterT} onChange={e=>setFilterT(e.target.value)} style={{flex:1}}><option value="all">{r.all}</option><option value="expense">{r.expense}</option><option value="income">{r.income}</option></select>
      </div>
      {flowData.length>1&&<div className="card" style={{padding:16}}><div className="section-title">💹 {r.netFlow}</div><ResponsiveContainer width="100%" height={180}><AreaChart data={flowData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="d" tick={{fill:'var(--muted)',fontSize:9}}/><YAxis tick={{fill:'var(--muted)',fontSize:9}}/><Tooltip content={<CTooltip/>}/><Area type="monotone" dataKey="income" stroke="var(--teal)" fill="rgba(78,205,196,.15)" strokeWidth={2} name="Income"/><Area type="monotone" dataKey="expense" stroke="var(--coral)" fill="rgba(255,107,107,.15)" strokeWidth={2} name="Expense"/><Legend wrapperStyle={{fontSize:11}}/></AreaChart></ResponsiveContainer></div>}
      {catData.length>0&&<div className="card" style={{padding:16}}><div className="section-title">🥧 {r.catBreak}</div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value">{catData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<CTooltip/>}/><Legend formatter={v=><span style={{fontSize:10,color:'var(--text)'}}>{v}</span>}/></PieChart></ResponsiveContainer></div>}
      <div className="card" style={{padding:16}}>
        <div className="section-title">📋 {allTx.length} transactions</div>
        {allTx.length===0?<div style={{textAlign:'center',color:'var(--muted)',padding:20,fontSize:13}}>{r.noResults}</div>:allTx.map((tx,i)=>(
          <div key={i} className="tx-row">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>{tx.kind==='income'?(ITYPES[tx.source]?.icon||'💚'):(CATS[tx.category]?.icon||'💳')}</span>
              <div><div style={{fontSize:13,fontWeight:500}}>{tx.merchant}</div><div style={{fontSize:10,color:'var(--muted)'}}>{tx.date}</div></div>
            </div>
            <span style={{color:tx.kind==='income'?'var(--teal)':'var(--coral)',fontWeight:700,fontSize:13}}>{tx.kind==='income'?'+':'−'}{FMT(tx.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RECURRING ────────────────────────────────────────────────────
function Recurring({t,CATS,ITYPES,settings,recurring,addRecurring,delRecurring,updateRecurring}){
  const r=t.rec;
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:'',amount:'',type:'expense',category:'rent',incomeSource:'utas',mode:'remind',reminder:true,reminderDays:'1',dayOfMonth:'1'});
  const [flash,setFlash]=useState('');
  const sf=msg=>{setFlash(msg);setTimeout(()=>setFlash(''),2000);};
  const openNew=()=>{setForm({name:'',amount:'',type:'expense',category:'rent',incomeSource:'utas',mode:'remind',reminder:true,reminderDays:'1',dayOfMonth:'1'});setEditing('new');};
  const openEdit=item=>{setForm({...item,amount:String(item.amount),reminderDays:String(item.reminderDays),dayOfMonth:String(item.dayOfMonth)});setEditing(item.id);};
  const save=async()=>{
    if(!form.name||!form.amount)return;
    const obj={...form,amount:parseFloat(form.amount)||0,reminderDays:parseInt(form.reminderDays)||0,dayOfMonth:parseInt(form.dayOfMonth)||1};
    if(editing==='new')await addRecurring({id:uid(),...obj});
    else await updateRecurring({...recurring.find(x=>x.id===editing),...obj});
    setEditing(null);sf(t.inc.saved);
  };
  const del=async id=>{if(window.confirm('Delete?'))await delRecurring(id);};
  const sendWA=item=>window.open(`https://wa.me/?text=${encodeURIComponent(`Mizan Reminder 🔔\n"${item.name}" — ${item.amount} OMR due on day ${item.dayOfMonth}.`)}`, '_blank');

  const ItemCard=({item})=>{
    const dl=getDaysUntil(item.dayOfMonth);
    const status=dl<=0?'overdue':dl<=(item.reminderDays||1)?'due':'ok';
    const sc=status==='overdue'?'var(--coral)':status==='due'?'var(--gold)':'var(--teal)';
    return(<div className="card" style={{padding:13,borderLeft:`3px solid ${sc}`,marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:16}}>{item.type==='income'?(ITYPES[item.incomeSource]?.icon||'💚'):(CATS[item.category]?.icon||'💸')}</span>
            <span style={{fontWeight:600,fontSize:14}}>{item.name}</span>
            {status!=='ok'&&<span style={{fontSize:11,color:sc,fontWeight:600}}>{status==='overdue'?`⚠️ ${r.overdue}`:`⏰ ${r.due}`}</span>}
          </div>
          <div style={{fontSize:12,color:'var(--muted)',display:'flex',gap:14}}>
            <span>{FMT(item.amount)}</span><span>Day {item.dayOfMonth} · {dl>0?`${dl} ${r.daysLeft}`:r.overdue}</span><span>{item.mode==='auto'?r.modeAuto:item.mode==='remind'?r.modeRemind:r.modeManual}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:5}}>
          {item.reminder&&<button className="btn-s" style={{padding:'4px 8px',fontSize:11}} onClick={()=>sendWA(item)}>📱</button>}
          <button className="btn-s" style={{padding:'4px 8px',fontSize:11}} onClick={()=>openEdit(item)}>✏️</button>
          <button className="btn-danger" style={{padding:'4px 8px',fontSize:11}} onClick={()=>del(item.id)}>✕</button>
        </div>
      </div>
    </div>);
  };

  if(recurring.length===0&&!editing)return(<div className="fi"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{r.title}</h2><button className="btn-s" onClick={openNew}>+ {r.addItem}</button></div><EmptyState {...t.empty.recurring} onCta={openNew}/></div>);

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{r.title}</h2>
        <button className="btn-s" onClick={openNew}>+ {r.addItem}</button>
      </div>
      <Flash msg={flash}/>
      {editing&&(
        <div className="card fi" style={{padding:16}}>
          <div style={{display:'flex',gap:4,marginBottom:14}}>{[['expense',`💸 ${r.expense}`],['income',`💚 ${r.income}`]].map(([v,lbl])=><button key={v} className={`tab ${form.type===v?'on':''}`} style={{flex:1}} onClick={()=>setForm(p=>({...p,type:v}))}>{lbl}</button>)}</div>
          <Field label={r.name}><input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
          <Field label={r.amount}><input type="number" step="0.001" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></Field>
          {form.type==='expense'?<Field label={r.category}><select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>{Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {settings.lang==='ar'?v.ar:v.en}</option>)}</select></Field>:<Field label={r.incomeSource}><select value={form.incomeSource} onChange={e=>setForm(p=>({...p,incomeSource:e.target.value}))}>{Object.entries(ITYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {settings.lang==='ar'?v.ar:v.en}</option>)}</select></Field>}
          <Field label={r.dayOfMonth}><input type="number" min="1" max="31" value={form.dayOfMonth} onChange={e=>setForm(p=>({...p,dayOfMonth:e.target.value}))}/></Field>
          <Field label={r.mode}><select value={form.mode} onChange={e=>setForm(p=>({...p,mode:e.target.value}))}><option value="auto">{r.modeAuto}</option><option value="remind">{r.modeRemind}</option><option value="manual">{r.modeManual}</option></select></Field>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><input type="checkbox" checked={form.reminder} style={{width:'auto'}} onChange={e=>setForm(p=>({...p,reminder:e.target.checked}))}/><span style={{fontSize:13}}>{r.reminder}</span></div>
          {form.reminder&&<Field label={r.reminderDays}><input type="number" min="0" max="30" value={form.reminderDays} onChange={e=>setForm(p=>({...p,reminderDays:e.target.value}))}/></Field>}
          <div style={{display:'flex',gap:10}}><button className="btn" onClick={save} disabled={!form.name||!form.amount}>{r.save}</button><button className="btn-s" onClick={()=>setEditing(null)}>✕</button></div>
        </div>
      )}
      {recurring.filter(x=>x.type==='expense').length>0&&<div><div className="section-title">💸 {r.expense}</div>{recurring.filter(x=>x.type==='expense').map(item=><ItemCard key={item.id} item={item}/>)}</div>}
      {recurring.filter(x=>x.type==='income').length>0&&<div><div className="section-title">💚 {r.income}</div>{recurring.filter(x=>x.type==='income').map(item=><ItemCard key={item.id} item={item}/>)}</div>}
    </div>
  );
}

// ─── AI ADVISOR ──────────────────────────────────────────────────
function AIAdvisor({t,settings,expenses,incomes,goals,budgets,monthIncome,monthExpense,freeToSpend}){
  const a=t.adv;
  const [report,setReport]=useState('');
  const [loading,setLoading]=useState(false);
  const generate=async()=>{
    if(!settings.apiKey){setReport(a.apiKeyNeeded);return;}
    if(!expenses.length){setReport(a.noData);return;}
    setLoading(true);setReport('');
    const catM={};expenses.filter(e=>e.date.startsWith(THIS_MONTH)).forEach(e=>{catM[e.category]=(catM[e.category]||0)+e.amount;});
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':settings.apiKey,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1200,messages:[{role:'user',content:`You are a warm expert finance advisor for an Omani university student. Respond in ${settings.lang==='ar'?'Arabic':'English'}.\n\nSNAPSHOT (${THIS_MONTH}):\nIncome: ${monthIncome.toFixed(3)} OMR | Spent: ${monthExpense.toFixed(3)} OMR | Free: ${freeToSpend.toFixed(3)} OMR\nCategories: ${Object.entries(catM).map(([k,v])=>`${k}: ${v.toFixed(3)} OMR (budget: ${budgets[k]?.amount||0})`).join(', ')}\nGoals: ${goals.map(g=>`${g.name}: ${((g.saved/g.target)*100).toFixed(1)}%`).join(', ')}\n\nWrite a personal report: 📊 Financial Health | ⚠️ Watch Out | 💡 Top 3 Tips | 🚀 Goal Strategy | ✨ What You're Doing Well\nBe specific, encouraging, Oman-relevant.`}]})});
      const data=await res.json();setReport(data.content?.[0]?.text||'No response.');
    }catch{setReport('Connection error.');}
    setLoading(false);
  };
  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{a.title}</h2>
      <p style={{fontSize:13,color:'var(--muted)',marginTop:-6}}>{a.subtitle}</p>
      <div style={{background:'var(--card2)',borderRadius:20,padding:24,border:'1px solid rgba(78,205,196,.2)',textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:8}}>🤖</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:'var(--teal)'}}>Claude AI</div>
        <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{expenses.length} transactions · {goals.length} goals</div>
      </div>
      {!settings.apiKey&&<div style={{background:'rgba(245,166,35,.1)',border:'1px solid var(--gold-br)',borderRadius:10,padding:'12px 14px',fontSize:13,color:'var(--gold)'}}>⚙️ {a.apiKeyNeeded}</div>}
      <button className="btn" onClick={generate} disabled={loading}>{loading?`⏳ ${a.generating}`:report?`🔄 ${a.refresh}`:`✨ ${a.generate}`}</button>
      {report&&!loading&&<div style={{background:'var(--card2)',borderRadius:12,padding:18,whiteSpace:'pre-wrap',fontSize:13.5,lineHeight:1.9,border:'1px solid var(--gold-br)',direction:settings.lang==='ar'?'rtl':'ltr'}}>{report}</div>}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────
function Settings({t,settings,upSett,budgets,saveBudgets,goals,customCats,setCustomCats,customISrc,setCustomISrc,setExpenses,setIncomes,setGoals,setRecurring,onLogout,session}){
  const s=t.set;
  const [localBuds,setLocalBuds]=useState({...budgets});
  const [localKey,setLocalKey]=useState(settings.apiKey||'');
  const [flash,setFlash]=useState('');
  const [catForm,setCatForm]=useState({en:'',ar:'',icon:'🎨',color:CAT_COLORS[0]});
  const sf=msg=>{setFlash(msg);setTimeout(()=>setFlash(''),2000);};
  const saveKey=()=>{upSett({apiKey:localKey});sf(s.saved);};
  const addCat=()=>{if(!catForm.en)return;const id='c_'+uid();setCustomCats(p=>[...p,{id,...catForm,custom:true}]);saveBudgets({...budgets,[id]:{mode:'open',amount:0}});setCatForm({en:'',ar:'',icon:'🎨',color:CAT_COLORS[0]});sf(s.saved);};
  const addSrc=()=>{if(!catForm.en)return;const id='s_'+uid();setCustomISrc(p=>[...p,{id,...catForm,custom:true}]);setCatForm({en:'',ar:'',icon:'💸',color:CAT_COLORS[1]});sf(s.saved);};
  const exportCSV=()=>{const rows=[['Date','Type','Merchant','Category','Amount'],...expenses.map(e=>[e.date,'expense',e.merchant,e.category,e.amount])];const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='mizan.csv';a.click();};
  let expenses=[],incomes=[];

  return(
    <div className="fi" style={{display:'flex',flexDirection:'column',gap:14}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--gold)'}}>{s.title}</h2>
      <Flash msg={flash}/>

      {/* Account */}
      <div className="card" style={{padding:16}}>
        <div className="section-title">👤 Account</div>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:12}}>Signed in as <strong style={{color:'var(--text)'}}>{session?.email}</strong></div>
        <button className="btn-danger" style={{width:'100%'}} onClick={onLogout}>🚪 {s.logout}</button>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">🎨 {s.theme} & {s.language}</div>
        <div style={{display:'flex',gap:10,marginBottom:12}}>{[['dark',`🌙 ${s.dark}`],['light',`☀️ ${s.light}`]].map(([v,l])=><button key={v} className="btn-s" style={{flex:1,...(settings.theme===v?{borderColor:'var(--gold)',color:'var(--gold)'}:{})}} onClick={()=>upSett({theme:v})}>{l}</button>)}</div>
        <div style={{display:'flex',gap:10}}>{[['en','English 🇬🇧'],['ar','العربية 🇴🇲']].map(([v,l])=><button key={v} className="btn-s" style={{flex:1,...(settings.lang===v?{borderColor:'var(--gold)',color:'var(--gold)'}:{})}} onClick={()=>upSett({lang:v})}>{l}</button>)}</div>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">🔑 {s.apiKey}</div>
        <div className="label" style={{marginBottom:8}}>{s.apiKeyHint}</div>
        <input type="password" value={localKey} onChange={e=>setLocalKey(e.target.value)} placeholder="sk-ant-…"/>
        <button className="btn-s" style={{marginTop:10,width:'100%'}} onClick={saveKey}>{s.save}</button>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">💰 {s.budgets}</div>
        {Object.entries({...DEFAULT_CATS,...Object.fromEntries(customCats.map(c=>[c.id,c]))}).map(([k,v])=>{
          const b=localBuds[k]||{mode:'open',amount:0};
          return(<div key={k} style={{marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:16}}>{v.icon}</span>
              <span style={{flex:1,fontSize:13}}>{settings.lang==='ar'?v.ar:v.en}</span>
              <div style={{display:'flex',gap:4}}>{[['target',s.target],['open',s.open]].map(([m,lbl])=><button key={m} style={{padding:'3px 9px',fontSize:11,borderRadius:6,cursor:'pointer',border:`1px solid ${b.mode===m?'var(--gold)':'var(--border)'}`,background:b.mode===m?'var(--gold-bg)':'var(--card2)',color:b.mode===m?'var(--gold)':'var(--muted)'}} onClick={()=>setLocalBuds(p=>({...p,[k]:{...b,mode:m}}))}>{lbl}</button>)}</div>
            </div>
            {b.mode==='target'&&<input type="number" value={b.amount} style={{height:36,fontSize:13}} onChange={e=>setLocalBuds(p=>({...p,[k]:{...b,amount:parseFloat(e.target.value)||0}}))}/>}
          </div>);
        })}
        <button className="btn" onClick={()=>{saveBudgets(localBuds);sf(s.saved);}}>{s.save}</button>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">🏷️ {s.customCats}</div>
        {customCats.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:18}}>{c.icon}</span><span style={{flex:1,fontSize:13}}>{c.en}</span><button className="btn-danger" style={{padding:'3px 8px',fontSize:11}} onClick={()=>setCustomCats(p=>p.filter(x=>x.id!==c.id))}>✕</button></div>)}
        <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
          <input type="text" value={catForm.en} placeholder={s.catName} onChange={e=>setCatForm(p=>({...p,en:e.target.value}))}/>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{CAT_ICONS.map(ic=><button key={ic} onClick={()=>setCatForm(p=>({...p,icon:ic}))} style={{fontSize:15,padding:4,borderRadius:6,border:`2px solid ${catForm.icon===ic?'var(--gold)':'var(--border)'}`,background:'var(--card2)',cursor:'pointer'}}>{ic}</button>)}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{CAT_COLORS.map(c=><button key={c} onClick={()=>setCatForm(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${catForm.color===c?'var(--text)':'transparent'}`}}/>)}</div>
          <button className="btn-s" onClick={addCat} disabled={!catForm.en}>+ {s.customCatAdd}</button>
        </div>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">🔄 {s.rollover}</div>
        <div className="label">{s.rolloverGoal}</div>
        <select value={settings.rolloverGoalId||''} onChange={e=>upSett({rolloverGoalId:e.target.value})}>
          <option value="">Keep as balance</option>
          {goals.map(g=><option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
        </select>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="section-title">⚙️ Data</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="btn-s" onClick={exportCSV}>📊 {s.exportCSV}</button>
          <button className="btn-danger" onClick={()=>{if(window.confirm(s.clearConfirm)){setExpenses([]);setIncomes([]);setGoals([]);setRecurring([]);}}}>🗑️ {s.clearData}</button>
        </div>
      </div>
      <div style={{textAlign:'center',color:'var(--muted)',fontSize:11,padding:4}}>{s.info}</div>
    </div>
  );
}
