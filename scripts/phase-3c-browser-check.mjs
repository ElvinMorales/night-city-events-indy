// Optional local QA harness. Supply external Playwright and axe-core paths; no app dependencies.
// Start loopback dev (5177) and production preview (4177) before running.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const output=process.env.QA_OUTPUT || '/tmp/night-city-phase-3c';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({timezoneId:'Asia/Tokyo',viewport:{width:1280,height:900},acceptDownloads:true});
const candidate=JSON.parse(fs.readFileSync('docs/release-candidate/events.json','utf8'));
let data=candidate;
const results={checkedAt:new Date().toISOString(),browser:browser.version(),checks:[],axe:[]};
const check=(name)=>results.checks.push(name);
await page.route('**/src/data/events.json*',r=>r.fulfill({contentType:'application/javascript',body:'export default '+JSON.stringify(data)}));
await page.clock.install({time:new Date('2026-11-07T16:00:00Z')});
async function open(){await page.goto('http://127.0.0.1:5177');await page.getByRole('heading',{name:'Upcoming events'}).waitFor();}
async function scan(view){await page.addScriptTag({path:process.env.AXE_PATH});const a=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}));results.axe.push({view,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:a.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
async function tabTo(locator){for(let n=0;n<100;n++){await page.keyboard.press('Tab');if(await locator.evaluate(el=>el===document.activeElement))return;}throw Error('Keyboard target unreachable: '+locator);}
async function focusVisible(){assert(await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2;}),'focus outline');}
async function dialogCycle(trigger){
 await tabTo(trigger);await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog');await dialog.waitFor();
 assert(await dialog.evaluate(el=>el.contains(document.activeElement)));await focusVisible();
 const seen=new Set();
 for(let i=0;i<80;i++){
  await page.keyboard.press('Tab');
  assert(await page.evaluate(()=>document.activeElement===document.body||!!document.activeElement.closest('dialog')),'focus reached background content');
  if(await page.locator(':focus').count())seen.add(await page.locator(':focus').evaluate(el=>el.outerHTML));
 }
 for(const el of await dialog.locator('a,button,input,select,textarea').all()){
  if(await el.isVisible()&&await el.isEnabled())assert(seen.has(await el.evaluate(el=>el.outerHTML)),'unreachable dialog control');
 }
 await page.keyboard.press('Shift+Tab');
 // Native Chromium dialogs can traverse browser chrome (body active), never background controls.
 if(await page.evaluate(()=>document.activeElement===document.body))await page.keyboard.press('Shift+Tab');
 assert(await dialog.evaluate(el=>el.contains(document.activeElement)));
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 assert(await trigger.evaluate(el=>el===document.activeElement),'focus did not return');
}
try{
await open();await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').innerText(),'Skip to events');await focusVisible();await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'events');await focusVisible();check('Skip link moves focus to events with visible outline');
assert.equal(await page.locator('.event-card').count(),1);assert.equal(await page.locator('.results-top').innerText(),'1 event on the grid\nIndianapolis time (ET)');assert((await page.locator('.event-card').innerText()).includes('6:00 PM · End time unknown'));await scan('one-event-list');
// Walk all currently visible enabled controls, including segmented native date inputs.
const focusables=page.locator('a,button,input,select,textarea,[tabindex="0"]');
const seen=new Set();for(let i=0;i<110;i++){await page.keyboard.press('Tab');if(await page.locator(':focus').count()){const el=await page.locator(':focus').evaluate(el=>el.outerHTML);seen.add(el);await focusVisible();}}
for(const el of await focusables.all()){if(await el.isVisible()&&await el.isEnabled())assert(seen.has(await el.evaluate(el=>el.outerHTML)),'Unreachable control '+await el.evaluate(el=>el.outerHTML));}check('All visible enabled list controls reachable by Tab; focus outlines present');
await dialogCycle(page.getByRole('button',{name:candidate[0].name,exact:true}));check('Details keyboard open, focus containment, reverse Tab, Escape and focus restoration');
await tabTo(page.getByRole('button',{name:candidate[0].name,exact:true}));await page.keyboard.press('Space');assert(await page.getByRole('button',{name:'Add to calendar (.ics)',exact:true}).isDisabled());await page.getByText('Calendar download unavailable: end time unknown.',{exact:true}).waitFor();await scan('details');await page.keyboard.press('Escape');
await tabTo(page.getByRole('button',{name:'Calendar',exact:true}));await page.keyboard.press('Space');assert.equal(await page.getByRole('button',{name:'Calendar',exact:true}).getAttribute('aria-pressed'),'true');await scan('month');await dialogCycle(page.locator('.calendar-day button'));check('Month switch via Space; occurrence opens and restores focus by keyboard');
await tabTo(page.getByRole('button',{name:'Next month'}));await page.keyboard.press('Enter');await page.getByText('December 2026',{exact:true}).waitFor();await page.keyboard.press('Enter');await page.getByText('January 2027',{exact:true}).waitFor();await page.getByText('No matching events in this month. Try another month or the list view.',{exact:true}).waitFor();await tabTo(page.getByRole('button',{name:'Previous month'}));await page.keyboard.press('Enter');await page.getByText('December 2026',{exact:true}).waitFor();await page.keyboard.press('Enter');await page.getByText('November 2026',{exact:true}).waitFor();check('Keyboard month navigation crosses December/January in both directions; empty-month message');
await tabTo(page.getByRole('button',{name:'List',exact:true}));await page.keyboard.press('Enter');await tabTo(page.getByRole('textbox',{name:'Search events'}));await page.keyboard.type('no-match');await page.getByText('No events match these filters',{exact:true}).waitFor();await scan('filtered-empty');await tabTo(page.getByRole('button',{name:'Reset filters',exact:true}));await page.keyboard.press('Space');assert.equal(await page.locator('.event-card').count(),1);check('Search and filter recovery by keyboard');
await tabTo(page.getByRole('slider'));const before=await page.getByRole('slider').inputValue();await page.keyboard.press('ArrowRight');assert.equal(Number(await page.getByRole('slider').inputValue()),Number(before)+5);await tabTo(page.getByRole('button',{name:'Reset',exact:true}));await page.keyboard.press('Enter');
await page.getByLabel('Events from date').fill('2026-11-12');await page.getByLabel('Events through date').fill('2026-11-10');await page.getByRole('alert').getByText('The through date must be on or after the from date.').waitFor();await page.getByRole('button',{name:'Reset',exact:true}).click();check('Invalid filter range has an alert');
await dialogCycle(page.getByRole('button',{name:'Submit an event',exact:true}).first());await dialogCycle(page.getByRole('button',{name:'Project info'}));check('Submission and About dialogs: keyboard focus, Escape and restoration');
await tabTo(page.getByRole('button',{name:'Submit an event',exact:true}).first());await page.keyboard.press('Enter');await scan('submission');const form=page.locator('form');await page.getByText(/there is currently no submission inbox/).waitFor();await page.getByRole('button',{name:'Prepare submission JSON'}).click();assert(await form.evaluate(el=>!el.checkValidity()));
for(const [name,value] of Object.entries({name:'QA fictional event',venue:'QA venue',address:'123 Test Street',start:'2026-11-10T18:00',format:'Constructed',registrationUrl:'https://example.com/register',sourceUrl:'https://example.com/source',description:'Fictional local QA; do not attend.'})){await form.locator(`[name="${name}"]`).fill(value);}
await form.locator('[name="end"]').fill('2026-11-10T17:00');await page.getByRole('button',{name:'Prepare submission JSON'}).click();await page.getByText('End time must be after the start time.',{exact:true}).waitFor();await form.locator('[name="end"]').fill('');await form.locator('[name="sourceUrl"]').fill('ftp://example.com');await page.getByRole('button',{name:'Prepare submission JSON'}).click();await page.getByText('Use HTTP or HTTPS links for registration and the original source.',{exact:true}).waitFor();await form.locator('[name="sourceUrl"]').fill('https://example.com/source');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Prepare submission JSON'}).click();const submission=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert(!Object.hasOwn(submission,'end'));assert.equal(submission.reviewStatus,'pending');await page.getByText(/It has not been published/).waitFor();check('Submission: required fields, invalid end/URL errors, optional end omitted in downloaded pending JSON');await page.keyboard.press('Escape');
await tabTo(page.getByRole('button',{name:'Project info'}));await page.keyboard.press('Enter');await scan('about');await page.keyboard.press('Escape');
for(const width of [320,375,390,768]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+width);await page.getByRole('button',{name:'Calendar',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'month overflow '+width);await tabTo(page.getByRole('region',{name:'Month calendar; scroll horizontally on small screens'}));await focusVisible();if(width<680){await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);assert(await page.locator('.calendar-scroll').evaluate(el=>el.scrollLeft>0));}await page.getByRole('button',{name:'List',exact:true}).click();if(width===390){await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:path.join(output,'one-event-mobile.png'),fullPage:true});await scan('mobile-list');await page.getByRole('button',{name:candidate[0].name,exact:true}).click();await scan('mobile-details');await page.keyboard.press('Escape');}}
check('No page overflow at 320/375/390/768; month region scrolls by keyboard; Tokyo device shows Indy time');
await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:path.join(output,'one-event-desktop.png'),fullPage:true});
data=[{...candidate[0],status:'cancelled'}];await open();await page.getByText('Cancelled. Do not attend.',{exact:true}).waitFor();await scan('cancelled');
data=[];await open();await page.getByText('Your next table is still taking shape',{exact:true}).waitFor();await scan('empty-catalog');check('Cancelled warning and honest empty catalog');
data=[{...candidate[0],start:'bad-date'}];await open();await page.getByRole('alert').getByText('Event information is temporarily unavailable').waitFor();assert.equal(await page.locator('.event-card').count(),0);assert.equal(await page.locator('.empty-state').count(),0);await tabTo(page.locator('summary'));await focusVisible();await page.keyboard.press('Enter');assert(await page.locator('.catalog-error details').evaluate(el=>el.open));await scan('invalid-catalog');check('Invalid catalog withheld with error alert and keyboard diagnostics; no misleading empty state');
await page.goto('http://127.0.0.1:4177/?demo=1');await page.getByText('Your next table is still taking shape',{exact:true}).waitFor();assert.equal(await page.locator('.event-card').count(),0);assert(!(await page.locator('body').innerText()).includes('Development demo'));await scan('production-empty');check('Production preview ignores demo query and excludes review record');
assert(results.axe.every(r=>r.violations.length===0),'axe violations; see report');
console.log(JSON.stringify({checks:results.checks,axe:results.axe.map(r=>({view:r.view,violations:r.violations.length,incomplete:r.incomplete.length}))},null,2));
}finally{fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close();}
