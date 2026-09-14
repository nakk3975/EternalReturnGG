'use strict';
// Official WeaponTypeInfo (verified 2026-09-14) has type but no numeric mastery ID.
// Keep this one compatibility bridge for historic numeric bestWeapon/masteryLevel codes.
const erWeaponFallback = {1:['Glove','글러브'],2:['Tonfa','톤파'],3:['Bat','방망이'],4:['Whip','채찍'],5:['HighAngleFire','투척'],6:['DirectFire','암기'],7:['Bow','활'],8:['CrossBow','석궁'],9:['Pistol','권총'],10:['AssaultRifle','돌격 소총'],11:['SniperRifle','저격 소총'],13:['Hammer','망치'],14:['Axe','도끼'],15:['OneHandSword','단검'],16:['TwoHandSword','양손검'],17:['Polearm','폴암'],18:['DualSword','쌍검'],19:['Spear','창'],20:['Nunchaku','쌍절곤'],21:['Rapier','레이피어'],22:['Guitar','기타'],23:['Camera','카메라'],24:['Arcana','아르카나'],25:['VFArm','VF 의수']};
const erWeaponMetadata = new Map();
let erWeaponRequest;
function erWeaponInfo(code) { return erWeaponMetadata.get(String(code)) || erWeaponFallback[code]; }
function erInstallWeaponMetadata(rows, names=new Map()) {
    if(!Array.isArray(rows))throw new Error('WeaponTypeInfo.data must be an array');
    const next=new Map();
    for(const row of rows){
        const type=row.type ?? row.weaponType;
        if(typeof type!=='string'||!/^[_A-Za-z][_A-Za-z0-9]*$/.test(type))continue;
        const legacy=Object.entries(erWeaponFallback).find(([,value])=>value[0]===type);
        const code=Number.isInteger(row.code)&&row.code>0?row.code:legacy?.[0];
        if(next.has(type)||(code!=null&&next.has(String(code))))throw new Error('Duplicate weapon code/type');
        const label=names.get('WeaponType/'+type)||names.get('MasteryType/'+type)||legacy?.[1]?.[1]||type;
        const value=[type,label];
        next.set(type,value);
        if(code!=null)next.set(String(code),value);
    }
    if(!next.size)throw new Error('No valid WeaponTypeInfo rows');
    erWeaponMetadata.clear();for(const [key,value] of next)erWeaponMetadata.set(key,value);
    return new Set(next.values()).size;
}
function erLoadWeaponMetadata(){
    if(!erWeaponRequest)erWeaponRequest=Promise.all([
        fetch('/er/weapon-types',{signal:AbortSignal.timeout(4000)}).then(r=>{if(!r.ok)throw new Error('Weapon metadata unavailable');return r.json();}),
        typeof erDictionary==='function'?erDictionary():Promise.resolve(new Map())
    ]).then(([body,names])=>{
        if(body.code!=null && ![0,200].includes(Number(body.code)))throw new Error('Weapon metadata API error');
        return erInstallWeaponMetadata(body.data,names);
    }).catch(()=>{erWeaponRequest=null;return 0;});
    return erWeaponRequest;
}
