const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const root=path.resolve('../docs/qa-visual-round-three-20261105')
const files=[
 ['最终视口与居中','suite-centered/final/results.json'],['动态星空','living-sky/results.json'],
 ['款式及混搭','suite/catalog/browser-results.json'],['逐层与历史','suite/layers/results.json'],
 ['爱心运动','suite-centered/heart/results.json'],['保存音乐导出','suite-centered/stage-three/stage-three-results.json'],
 ['基础与性能','suite/core/results.json'],['装饰正反面','suite/decoration-faces/face-results.json'],
 ['轨道与奶油几何','suite/geometry/results.json'],['目录与布局数据','suite/catalog-data/data-results.json'],
]
const report={testedAt:new Date().toISOString(),baselineCommit:'141d579',productionBuildPassed:true,finalMain:'index-Bg3UMb_I.js',sceneRegressionMain:'index-DyR08VQH.js',
 buildCoverage:'Complete scene regressions on DyR08VQH; only the opening anchor and crossfade changed afterward. Final viewport/centering, full heart motion, music/draft/export repeated on Bg3UMb_I.',
 areas:[],passed:0,failed:0,limitations:['Chrome simulated mobile; no physical iPhone/Android connected','Real-time material approximation; photographic parity not claimed','Existing ANGLE shader and Vite chunk warnings retained']}
for(const [name,file] of files){const r=JSON.parse(fs.readFileSync(path.join(root,file),'utf8')),checks=Object.values(r.checks),passed=checks.filter(v=>v===true).length;assert.equal(r.errors?.length||0,0,file);assert.equal(r.failure,undefined,file);assert(checks.every(v=>v===true),file);report.passed+=passed;report.areas.push({name,file,passed,failed:0,warnings:r.warnings?.length||0})}
const core=JSON.parse(fs.readFileSync(path.join(root,'suite/core/results.json'),'utf8')),sky=JSON.parse(fs.readFileSync(path.join(root,'living-sky/results.json'),'utf8')),catalog=JSON.parse(fs.readFileSync(path.join(root,'suite/catalog/browser-results.json'),'utf8'))
report.performance=core.performance;report.mobileSeamError=sky.layouts;report.catalogResources=catalog.resources
fs.writeFileSync(path.join(root,'acceptance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
