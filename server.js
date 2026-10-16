import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
app.use(cors({origin: true, methods:['GET','POST','OPTIONS'], allowedHeaders:['Content-Type','x-admin-key']}));
app.use(express.json({limit:'1mb'}));
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';
const DATA_FILE = path.join(DATA_DIR, 'points.json');
const ADMIN_KEY = process.env.ADMIN_KEY || '';
async function load(){try{return JSON.parse(await fs.readFile(DATA_FILE,'utf8'))}catch{return {students:{},notifications:[]}}}
async function save(db){await fs.mkdir(DATA_DIR,{recursive:true});const tmp=DATA_FILE+'.tmp';await fs.writeFile(tmp,JSON.stringify(db,null,2));await fs.rename(tmp,DATA_FILE)}
function requireAdmin(req,res,next){if(!ADMIN_KEY)return res.status(503).json({error:'ADMIN_KEY غير مضبوط في Environment على Render'});if(req.get('x-admin-key')!==ADMIN_KEY)return res.status(401).json({error:'مفتاح الإدارة غير صحيح'});next()}
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'iraq-points-backend'}));
app.get('/api/students/:studentId/points',async(req,res)=>{const id=String(req.params.studentId||'').trim();if(!id)return res.status(400).json({error:'معرّف الطالب مطلوب'});const db=await load();const s=db.students[id]||{points:0};res.json({studentId:id,points:Number(s.points||0),lastAward:Number(s.lastAward||0),updatedAt:s.updatedAt||null})});
app.post('/api/admin/students/points',requireAdmin,async(req,res)=>{const id=String(req.body?.studentId||'').trim();const amount=Number(req.body?.points);if(!id||!Number.isSafeInteger(amount)||amount<1)return res.status(400).json({error:'ايدي الطالب والنقاط الصحيحة الموجبة مطلوبة'});const db=await load();const old=db.students[id]||{points:0,notifications:[]};old.points=Number(old.points||0)+amount;old.lastAward=amount;old.updatedAt=new Date().toISOString();old.notifications=Array.isArray(old.notifications)?old.notifications:[];const notice={id:Date.now().toString(),title:'تم استلام نقاط',text:`تم استلام ${amount} نقطة. رصيدك الآن ${old.points} نقطة.`,points:amount,date:old.updatedAt,read:false};old.notifications.unshift(notice);db.students[id]=old;await save(db);res.json({success:true,studentId:id,awarded:amount,points:old.points,message:`تم إرسال ${amount} نقطة إلى ${id}`,notification:notice})});
app.get('/api/notifications',async(req,res)=>{const id=String(req.query.studentId||'').trim();if(!id)return res.status(400).json({error:'studentId مطلوب'});const db=await load();res.json({notifications:(db.students[id]?.notifications||[])});});
app.post('/api/ai/study-tip',async(req,res)=>{const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return res.status(503).json({error:'OPENAI_API_KEY غير مضبوط في Render'});const subject=String(req.body?.subject||'الدراسة').slice(0,100);const problem=String(req.body?.problem||'أحتاج نصيحة').slice(0,200);try{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:`أنت مساعد دراسي داعم لطلاب السادس الإعدادي في العراق. اكتب نصيحة دراسية عملية ومشجعة بالعربية العراقية، 80 إلى 130 كلمة، بلا صور أو فيديو أو وعود بنتائج مضمونة. المادة: ${subject}. الصعوبة: ${problem}.`})});const data=await r.json();if(!r.ok)return res.status(502).json({error:data.error?.message||'فشل اتصال خدمة الذكاء الاصطناعي'});const tip=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();if(!tip)throw new Error('لم يرجع النموذج نصاً');res.json({tip})}catch(e){res.status(502).json({error:'تعذر توليد النصيحة حالياً',detail:e.message})}});
app.listen(PORT,'0.0.0.0',()=>console.log(`points backend listening on ${PORT}`));
