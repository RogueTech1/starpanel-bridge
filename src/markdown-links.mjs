export function headingAnchors(markdown){
 const anchors=new Set();let fence=null;
 for(const line of markdown.split(/\r?\n/)){
  const block=/^\s*(`{3,}|~{3,})/.exec(line);
  if(block){if(!fence)fence=block[1][0];else if(fence===block[1][0])fence=null;continue;}
  if(fence)continue;
  const heading=/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);if(!heading)continue;
  const base=heading[1].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/<[^>]*>/g,'').toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu,'').trim().replace(/\s/g,'-');
  let slug=base,n=0;while(anchors.has(slug))slug=base+'-'+(++n);anchors.add(slug);
 }
 for(const m of markdown.matchAll(/<(?:a|h[1-6])\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi))anchors.add(m[1]);
 return anchors;
}
