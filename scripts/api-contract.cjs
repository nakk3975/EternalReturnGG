'use strict';
// Contract checks distinguish absent optional fields from malformed present values.
function validate(value, schema, path='$', result={errors:[],missingOptional:[]}) {
  if(value==null){if(schema.required)result.errors.push(path+': required');else result.missingOptional.push(path);return result;}
  const type=Array.isArray(value)?'array':typeof value;
  if(!schema.types.includes(type) || type==='number'&&!Number.isFinite(value)) {result.errors.push(path+': expected '+schema.types.join('|')+', got '+type);return result;}
  if(type==='array'&&schema.items)value.forEach((v,i)=>validate(v,schema.items,path+'['+i+']',result));
  if(type==='object'&&schema.fields)for(const [key,rule] of Object.entries(schema.fields))validate(value[key],rule,path+'.'+key,result);
  return result;
}
module.exports={validate};
