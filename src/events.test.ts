import {describe,it,expect} from 'vitest';
import raw from './data/samples.json';
import {eventSchema,filterEvents,miles,ics,deduplicate,dayKey} from './events';
const events=raw.map(e=>eventSchema.parse(e));
const filters={from:'',to:'',type:'',venue:'',radius:40,query:''};
describe('catalog integrity',()=>{
it('validates all marked fictional samples',()=>expect(events.every(e=>e.sample&&e.status!=='confirmed')).toBe(true));
it('rejects reversed dates and unsafe links',()=>{expect(eventSchema.safeParse({...events[0],end:events[0].start}).success).toBe(false);expect(eventSchema.safeParse({...events[0],sourceUrl:'not a url'}).success).toBe(false)});
it('keeps newest cancellation for a stable identity',()=>{expect(deduplicate([events[0],{...events[0],status:'cancelled',updatedAt:'2026-11-09T12:00:00Z'}])[0].status).toBe('cancelled')});
it('filters dates, types, venue, radius and elapsed events',()=>{const now=new Date('2026-11-01T00:00:00Z');expect(filterEvents(events,{...filters,type:'Tournament'},now)).toHaveLength(2);expect(filterEvents(events,{...filters,from:'2026-11-14',to:'2026-11-14'},now)).toHaveLength(1);expect(filterEvents(events,{...filters,venue:'Gridline Games'},now)).toHaveLength(2);expect(filterEvents(events,{...filters,radius:0},now)).toHaveLength(0);expect(filterEvents(events,filters,new Date('2027-01-01'))).toHaveLength(0);expect(filterEvents(events,{...filters,query:'first run'},now)).toHaveLength(1)});
it('calculates downtown distance',()=>expect(miles(39.7684,-86.1581)).toBe(0));
it('uses Indianapolis dates across UTC midnight and DST',()=>{expect(dayKey('2026-11-14T02:00:00Z')).toBe('2026-11-13');expect(dayKey('2026-07-14T03:00:00Z')).toBe('2026-07-13')});
it('exports UTC times, escaped text and cancellation status',()=>{const output=ics({...events[0],name:'Run, play; learn',status:'cancelled'});expect(output).toContain('DTSTART:20261113T230000Z');expect(output).toContain('Run\\, play\\; learn');expect(output).toContain('STATUS:CANCELLED');expect(output).toContain('[FICTIONAL SAMPLE]');expect(output.split('\r\n').every(line=>new TextEncoder().encode(line).length<=75)).toBe(true)});
});
