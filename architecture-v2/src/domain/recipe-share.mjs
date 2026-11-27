export function recipeShareMessage(recipe,url){
 const name=String(recipe?.title||'A recipe').trim()||'A recipe';
 return {title:name+' · Metro Eats',text:'From my Metro Eats recipe collection: '+name,url};
}
