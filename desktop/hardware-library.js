(() => {
 const $=id=>document.getElementById(id);let library=[];
 const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 function draw(){
  const q=$('librarySearch').value.toLowerCase(),role=$('libraryRole').value,vendor=$('libraryVendor').value;
  const items=library.filter(p=>(!role||p.role===role)&&(!vendor||p.vendor===vendor)&&`${p.name} ${p.role} ${p.description} ${p.notes}`.toLowerCase().includes(q));
  $('libraryCount').textContent=`${items.length} items · DCSBIOSKit catalog reviewed 26 Nov 2026. Listing a product does not mean all of its hardware features have a bundled driver.`;
  $('libraryCards').replaceChildren();
  for(const p of items){const card=node('article','');card.dataset.product=p.id;const role=node('span',`${p.vendor} / ${p.role}`);role.className='eyebrow';card.append(role,node('h3',p.name),node('p',p.description),node('p',p.notes));
   if(p.controllers){const list=node('ul','');for(const part of p.controllers)list.append(node('li',part));card.append(list);}
   if(p.includes)card.append(node('p','Contains: '+p.includes.map(id=>library.find(p=>p.id===id)?.name??id).join(', ')));
   const row=node('div','');row.className='row';
   if(p.profile){const select=node('button','Use in new panel');select.onclick=()=>{ $('libraryResult').textContent='';document.dispatchEvent(new CustomEvent('hardware-use',{detail:p.profile}));};row.append(select);}
   if(p.workflow==='master'){const button=node('button','Open master connection');button.onclick=()=>{document.querySelector('[data-tab="panels"]').click();$('protocol').value='dcsbios-master';$('result').textContent='Select and connect the master USB port. Factory routing firmware normally suffices.';};row.append(button);}
   if(p.url){const link=node('button','Vendor product page');link.onclick=async()=>{try{await window.bridge.hardwareProduct(p.id);}catch(err){$('libraryResult').textContent=err.message;}};row.append(link);}
   card.append(row);$('libraryCards').append(card);
  }
 }
 for(const id of ['librarySearch','libraryRole','libraryVendor'])$(id).addEventListener(id==='librarySearch'?'input':'change',draw);
 void window.bridge.hardware().then(data=>{library=data.library;for(const role of [...new Set(library.map(p=>p.role))].sort())$('libraryRole').append(new Option(role,role));for(const vendor of [...new Set(library.map(p=>p.vendor))].sort())$('libraryVendor').append(new Option(vendor,vendor));draw();}).catch(err=>$('libraryResult').textContent=err.message);
})();
