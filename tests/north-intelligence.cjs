/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test runner. */
const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
const output=ts.transpileModule(fs.readFileSync('src/lib/north-intelligence.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleExports={};vm.runInNewContext(output,{exports:moduleExports,Date,Map,Math,Number,Set});const {analyzeNorth,recommendedSessionMinutes}=moduleExports;
const area={id:'math',name:'Matematik',kind:'math',icon:'∑',goal:'Sınav',priority:3,weeklyMinutes:600,minimumMinutes:10,archived:false,metric:'Problem',target:0,notes:'',resources:''};
const tasks=[];const activities=[];
for(let i=0;i<16;i++){const morning=i<12,id=`t${i}`,planned=i%2?50:90,done=morning||i===12;tasks.push({id,areaId:'math',title:'Problem çöz',goal:'10 problem',minutes:planned,intensity:'high',mandatory:true,status:done?'done':'partial',date:'',deadline:'',resource:'',why:'',week:'2026-08-31'});activities.push({id:`a${i}`,taskId:id,areaId:'math',date:`2026-08-${String(15+i).padStart(2,'0')}`,minutes:planned===50?48:70,outcome:done?'done':'partial',difficulty:'Zor',reflection:'',amount:10,metric:'Problem',actualStart:`2026-08-${String(15+i).padStart(2,'0')}T${morning?'09':'21'}:00:00Z`,plannedMinutes:planned,completionPercent:done?100:60,endedAt:`2026-08-${String(15+i).padStart(2,'0')}T${morning?'10':'22'}:00:00Z`});}
const state={version:1,areas:[area],tasks,activities,events:[],energy:{date:'',level:'normal'},weeklyHours:14,mode:'normal',customMode:'',protection:[]};
const report=analyzeNorth(state,new Date('2026-09-05T12:00:00Z'));
const morning=report.patterns.find(p=>p.patternType==='best_time');assert.ok(morning);assert.equal(morning.status,'reliable');assert.equal(morning.metricValue,100);
assert.equal(report.twelveWeek.sessions,16);assert.ok(report.metrics.some(m=>m.label==='Planlama doğruluğu'&&m.value.startsWith('%')));assert.ok(recommendedSessionMinutes(state)>=40);
const sparse=analyzeNorth({...state,activities:activities.slice(0,2),tasks:tasks.slice(0,2)},new Date('2026-09-05T12:00:00Z'));assert.equal(sparse.patterns[0].status,'insufficient');assert.equal(sparse.metrics[0].value,'Veri birikiyor');
console.log('North Intelligence checks passed: evidence thresholds, time windows, rolling summaries, duration recommendation, no sparse-data overclaim.');
