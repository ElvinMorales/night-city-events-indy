import { z } from 'zod';
export const TZ = 'America/Indiana/Indianapolis';
export const types = ['Tournament','Casual play','Learn to play','Community meetup'] as const;
const publicUrl = z.string().url().refine(value=>/^https?:\/\//i.test(value),'Use a public HTTP(S) URL');
export const eventSchema = z.object({
 id:z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, digits, underscores or hyphens'), name:z.string().min(3), type:z.enum(types),
 venue:z.string().min(1), address:z.string().min(5), lat:z.number().min(-90).max(90), lng:z.number().min(-180).max(180),
 start:z.string().datetime({offset:true}), end:z.string().datetime({offset:true}).optional(), timezone:z.literal(TZ), format:z.string().min(1),
 fee:z.string().optional(), registrationUrl:publicUrl, sourceUrl:publicUrl, lastVerified:z.string().datetime({offset:true}).nullable(),
 verificationMethod:z.literal('moderator-organizer-check').optional(), status:z.enum(['confirmed','unverified','cancelled']), sample:z.boolean(), description:z.string(), updatedAt:z.string().datetime({offset:true})
}).refine(e=>e.end===undefined||Date.parse(e.end)>Date.parse(e.start),{message:'End must be after start',path:['end']}).refine(e=>!e.sample||e.status!=='confirmed',{message:'Fictional samples cannot be confirmed',path:['status']}).refine(e=>e.status!=='confirmed'||e.lastVerified!==null,{message:'Confirmed events require an organizer verification timestamp',path:['lastVerified']});
export type Event = z.infer<typeof eventSchema>;
export const dayKey=(date:string|Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
export const time=(date:string)=>new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'}).format(new Date(date));
export function miles(lat:number,lng:number){const r=Math.PI/180;const a=Math.sin((lat-39.7684)*r/2)**2+Math.cos(39.7684*r)*Math.cos(lat*r)*Math.sin((lng+86.1581)*r/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
export function deduplicate(events:Event[]){const map=new Map<string,Event>();for(const e of events){const key=e.id;const old=map.get(key);if(!old||Date.parse(e.updatedAt)>Date.parse(old.updatedAt)||(Date.parse(e.updatedAt)===Date.parse(old.updatedAt)&&e.status==='cancelled'))map.set(key,e);}return [...map.values()];}
// Unknown ends have a visibility cutoff, never an inferred event duration.
export function isVisible(e:Event,now=new Date()) {
  return e.end!==undefined ? Date.parse(e.end)>now.getTime() : dayKey(e.start)>=dayKey(now);
}
export function scheduleLabel(e:Event) {
  return e.end===undefined ? `${time(e.start)} · End time unknown` : `${time(e.start)} – ${time(e.end)}`;
}
export function timingNotice(e:Event,now=new Date()) {
  if(e.status==='cancelled') return 'Cancelled. Do not attend.';
  if(e.end!==undefined) return Date.parse(e.end)<=now.getTime() ? 'This event has ended.' : '';
  if(dayKey(e.start)<dayKey(now)) return 'Start date has passed. End time unknown; this listing is no longer in Upcoming.';
  return Date.parse(e.start)<=now.getTime() ? 'Scheduled start has passed. End time unknown; check with the organizer before travel.' : '';
}
export const calendarExportIssue=(e:Event)=>e.end===undefined ? 'Calendar download unavailable: end time unknown.' : '';
export function filterEvents(events:Event[],f:{from:string;to:string;type:string;venue:string;radius:number;query:string},now=new Date()) {return deduplicate(events).filter(e=>isVisible(e,now)&&(!f.from||dayKey(e.start)>=f.from)&&(!f.to||dayKey(e.start)<=f.to)&&(!f.type||e.type===f.type)&&(!f.venue||e.venue===f.venue)&&miles(e.lat,e.lng)<=f.radius&&`${e.name} ${e.venue}`.toLowerCase().includes(f.query.toLowerCase())).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));}
const escapeICS=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function ics(e:Event){if(e.end===undefined)throw new Error(calendarExportIssue(e));const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Night City Events Indy//EN','BEGIN:VEVENT',`UID:${e.id}@nightcityevents.example`,`DTSTAMP:${stamp(e.updatedAt)}`,`DTSTART:${stamp(e.start)}`,`DTEND:${stamp(e.end)}`,`SUMMARY:${escapeICS((e.sample?'[FICTIONAL SAMPLE] ':'')+e.name)}`,`LOCATION:${escapeICS(e.venue+', '+e.address)}`,`DESCRIPTION:${escapeICS(e.description+' | '+e.timezone+' | Source: '+e.sourceUrl)}`,`STATUS:${e.status==='cancelled'?'CANCELLED':e.status==='confirmed'&&!e.sample?'CONFIRMED':'TENTATIVE'}`,'END:VEVENT','END:VCALENDAR'];return lines.map(line=>{let out='',chunk='';for(const char of line){if(new TextEncoder().encode(chunk+char).length>73){out+=chunk+'\r\n ';chunk='';}chunk+=char;}return out+chunk;}).join('\r\n')+'\r\n';}
export function download(text:string,name:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
