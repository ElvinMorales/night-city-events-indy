import {describe,it,expect} from 'vitest';
import raw from './data/samples.json';
import {eventSchema,filterEvents,miles,ics,deduplicate,dayKey,scheduleLabel,timingNotice,calendarExportIssue} from './events';
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

describe('unknown end times',()=>{
  const unknown={...events[0],end:undefined};
  it('preserves a valid start without inventing an end and still validates supplied ends',()=>{
    const parsed=eventSchema.parse(unknown);
    expect(parsed.start).toBe(events[0].start);
    expect(parsed.end).toBeUndefined();
    expect(JSON.parse(JSON.stringify(parsed))).not.toHaveProperty('end');
    for(const end of ['',null,'2026-11-13',unknown.start,'2026-11-13T17:00:00-05:00'])
      expect(eventSchema.safeParse({...unknown,end}).success).toBe(false);
    expect(eventSchema.safeParse({...unknown,start:'2026-11-13T18:00:00'}).success).toBe(false);
  });
  it('keeps an unknown-end occurrence through its Indianapolis date, including after UTC midnight',()=>{
    for(const at of ['2026-11-13T22:59:59Z','2026-11-13T23:00:00Z','2026-11-14T04:59:59Z'])
      expect(filterEvents([unknown],filters,new Date(at))).toHaveLength(1);
    expect(filterEvents([unknown],filters,new Date('2026-11-14T05:00:00Z'))).toEqual([]);
    expect(filterEvents([unknown],filters,new Date('2027-01-01T00:00:00Z'))).toEqual([]);
    expect(filterEvents([unknown],{...filters,to:'2026-11-12'},new Date('2026-11-01T00:00:00Z'))).toEqual([]);
  });
  it('uses local dates across summer, DST transitions and year rollover',()=>{
    for(const [start,before,cutoff] of [
      ['2026-07-13T23:00:00-04:00','2026-07-14T03:59:59Z','2026-07-14T04:00:00Z'],
      ['2026-11-01T01:30:00-04:00','2026-11-02T04:59:59Z','2026-11-02T05:00:00Z'],
      ['2026-03-08T01:30:00-05:00','2026-03-09T03:59:59Z','2026-03-09T04:00:00Z'],
      ['2026-12-31T23:30:00-05:00','2027-01-01T04:59:59Z','2027-01-01T05:00:00Z']
    ]){
      expect(filterEvents([{...unknown,start}],filters,new Date(before))).toHaveLength(1);
      expect(filterEvents([{...unknown,start}],filters,new Date(cutoff))).toEqual([]);
    }
  });
  it('expires known ends exactly at the end, retaining overnight events until then',()=>{
    const overnight={...unknown,end:'2026-11-14T02:00:00-05:00'};
    expect(filterEvents([overnight],filters,new Date('2026-11-14T06:59:59Z'))).toHaveLength(1);
    expect(filterEvents([overnight],filters,new Date('2026-11-14T07:00:00Z'))).toEqual([]);
  });
  it('rejects ICS for every unknown-end status, including cancellations',()=>{
    for(const status of ['confirmed','unverified','cancelled'] as const)
      expect(()=>ics({...unknown,status,sample:false})).toThrow('end time unknown');
    const output=ics({...unknown,end:'2026-11-13T21:00:00-05:00'});
    expect(output).toContain('DTSTART:20261113T230000Z');
    expect(output).toContain('DTEND:20261114T020000Z');
    expect(output).not.toContain('DURATION');
  });
});

describe('schedule communication',()=>{
  const unknown={...events[0],end:undefined};
  it('labels unknown ends and elapsed starts without claiming an ongoing event',()=>{
    expect(scheduleLabel(unknown)).toBe('6:00 PM · End time unknown');
    expect(calendarExportIssue(unknown)).toContain('unavailable');
    expect(timingNotice(unknown,new Date('2026-11-13T22:59:59Z'))).toBe('');
    expect(timingNotice(unknown,new Date('2026-11-13T23:00:00Z'))).toContain('Scheduled start has passed');
    expect(timingNotice(unknown,new Date('2026-11-14T05:00:00Z'))).toContain('no longer in Upcoming');
    expect(timingNotice({...unknown,status:'cancelled'},new Date('2026-11-13T23:00:00Z'))).toBe('Cancelled. Do not attend.');
    expect(scheduleLabel(events[0])).toBe('6:00 PM – 9:00 PM');
    expect(calendarExportIssue(events[0])).toBe('');
    expect(timingNotice(events[0],new Date('2026-11-14T02:00:00Z'))).toBe('This event has ended.');
  });
});
