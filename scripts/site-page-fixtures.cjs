// Shared deterministic API data for local WAR browser checks.
const fs=require('node:fs');
const fixture=name=>JSON.parse(fs.readFileSync('src/test/fixtures/api-2026/'+name+'.json','utf8'));
const characters=fixture('characters'),weapons=fixture('weapons'),armor=fixture('armor'),character=characters.data[0];
const route={id:42,title:'검증 루트',characterCode:character.code,userNickname:'테스트',weaponCodes:String(weapons.data[0].code)};
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const stats={buckets:{rows:[{day,season:37,mode:3,tier:7,character:character.code,games:10,wins:2,top3:4,rank:4,damage:1000}],items:[],builds:[]}};
const payload={
 '/er/character':characters,'/er/weapon':weapons,'/er/armor':armor,'/er/main':{result:[{recommendWeaponRoute:route}]},
 '/er/statistics/data':stats,'/er/statistics/collection':{status:'waiting'},
 '/er/leaderboard/data':{topRanks:[{nickname:'검증',userId:42,rank:1,mmr:9000}]},
 '/er/userRank':{userStats:[{nickname:'검증',seasonId:37,totalGames:10,totalWins:2,mmr:9000,rank:1,characterStats:[{characterCode:character.code,usages:10,wins:2}]}]},
 '/er/user/detail':{userGames:[]},'/er/search/nickname':{user:{nickname:'검증',userId:42}},'/er/seasons':{data:[]},
 '/er/route-data/Area':{data:[{code:40,name:'Alley',areaType:'Lumia',startingArea:true,modeType:'3'}]}
};

module.exports={payload,character,weapons};
