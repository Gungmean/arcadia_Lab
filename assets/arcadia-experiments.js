// Presentation and accessible names only. Experiment state remains page-owned.
(()=>{
 const root=document.body;
 function labelInputs(){
  for(const input of root.querySelectorAll('input,select')){
   if(input.labels?.length||input.hasAttribute('aria-label')||input.hasAttribute('aria-labelledby'))continue;
   const group=input.closest('.control-group,.control-row,.control-card');
   let label=group?.querySelector('label');
   if(!label){let sibling=input.previousElementSibling;while(sibling&&!label){if(sibling.tagName==='LABEL')label=sibling;sibling=sibling.previousElementSibling;}}
   if(label){if(!input.id)input.id='ar-input-'+Math.random().toString(36).slice(2,9);label.htmlFor=input.id;}
  }
 }
 labelInputs();
 for(const label of root.querySelectorAll('label.file-upload-zone')){
  const input=label.querySelector('input[type=file]');if(!input)continue;
  label.tabIndex=0;label.setAttribute('role','button');label.setAttribute('aria-label','시뮬레이션에 쓸 이미지 불러오기');
  label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}});
 }
 const tools=[...root.querySelectorAll('.tool-item')];
 tools.forEach((tool,i)=>{tool.setAttribute('role','button');tool.tabIndex=0;tool.setAttribute('aria-label',['막대자석 추가','말발굽자석 추가','나침반 추가'][i]||'실험 도구 추가');tool.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tool.click();}});});
 for(const canvas of root.querySelectorAll('canvas'))if(!canvas.getAttribute('aria-label'))canvas.setAttribute('aria-label',canvas.id==='observer-canvas'?'관측자가 보는 하늘':(document.querySelector('h1,h2')?.textContent.trim()||document.title)+' 시각화');
 if(root.dataset.labKind==='microscopy'){
  const brand=root.querySelector('.topbar .brand');
  if(brand&&!brand.querySelector('img')){const img=document.createElement('img');img.src=new URL('images/arcadia-club-logo.png',document.currentScript?.src||new URL('../../assets/arcadia-experiments.js',location.href)).href;img.alt='아르카디아 동아리 로고';brand.prepend(img);}
 }
})();
