'use strict';
// Timer observations are evidence of a respawn deadline, not an exact kill time.
// Input must be a user-selected animal timer, never arbitrary HUD digits.
function erAnimalTimerSeconds(text){
 const value=String(text).trim();
 const clock=value.match(/^(\d{1,2}):([0-5]\d)$/);
 if(clock)return Number(clock[1])*60+Number(clock[2]);
 const seconds=value.match(/^(\d{1,3})\s*(?:s|초)$/i);
 return seconds?Number(seconds[1]):null;
}
function erAnimalTimerObserver({minConfidence=75,maxRemaining=300}={}){
 let previous=null,emittedDeadline=null;
 return {
  reset(){previous=null;emittedDeadline=null;},
  observe({text,confidence,at,campId,session}){
   const remaining=erAnimalTimerSeconds(text);
   if(!campId||session==null||!Number.isFinite(at)||!Number.isFinite(confidence)||confidence<minConfidence||remaining===null||remaining<=0||remaining>maxRemaining){previous=null;return null;}
   const next={remaining,at,campId,session,deadline:at+remaining,hits:1,start:at,startRemaining:remaining};
   if(previous){
    const elapsed=at-previous.at;
    const continuous=campId===previous.campId&&session===previous.session&&elapsed>0&&elapsed<=5&&remaining<=previous.remaining&&Math.abs(previous.remaining-remaining-elapsed)<=1.5;
    if(continuous){next.hits=previous.hits+1;next.start=previous.start;next.startRemaining=previous.startRemaining;}
    else emittedDeadline=null;
   }
   previous=next;
   // Frozen frames and repeated OCR output cannot independently prove a countdown.
   if(next.hits<3||at-next.start<2||next.startRemaining-remaining<2)return null;
   if(emittedDeadline!==null&&Math.abs(next.deadline-emittedDeadline)<=3)return null;
   emittedDeadline=next.deadline;
   return {campId,session,observedAt:at,respawnAt:next.deadline,remaining,source:'visible-respawn-timer'};
  }
 };
}
