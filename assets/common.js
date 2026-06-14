/* 公共脚本：导航、数据索引、详情弹窗 */
(function(){
  // ---- 导航栏注入 ----
  var TABS=[
    ['index.html','首页'],
    ['objects.html','器物检索'],
    ['symbols.html','符号检索'],
    ['map.html','地理沙盘'],
    ['statement.html','学术声明']
  ];
  var here=(location.pathname.split('/').pop()||'index.html');

  // ---- 数据 ----
  var DATA=window.LZ_DATA||{qiwu:[],symbols:[]};
  var LZ={data:DATA};
  window.LZ=LZ;
  LZ.qById={}; DATA.qiwu.forEach(function(q){LZ.qById[q.id]=q;});
  LZ.symsByObj={};
  DATA.symbols.forEach(function(s){(LZ.symsByObj[s.qid]=LZ.symsByObj[s.qid]||[]).push(s);});
  LZ.symById={}; DATA.symbols.forEach(function(s){LZ.symById[s.id]=s;});

  var IMG=function(file){return file?('../img/'+file):'';};
  window.IMG=IMG;

  function buildNav(){
    var n=document.createElement('div');n.className='nav';
    var t=TABS.map(function(x){
      var a=x[0]===here?'tab active':'tab';
      return '<a class="'+a+'" href="'+x[0]+'">'+x[1]+'</a>';
    }).join('');
    n.innerHTML='<div class="nav-inner">'+
      '<a class="nav-brand" href="index.html"><span class="seal">良</span>'+
      '<span>良渚刻绘符号检索平台<small>LIANGZHU INSCIRBED SYMBOLS SEARCH PLATFORM</small></span></a>'+
      t+'</div>';
    document.body.insertBefore(n,document.body.firstChild);
  }
  function buildFooter(){
    var f=document.createElement('footer');
    f.innerHTML='良渚刻绘符号检索平台 · 共录入器物 '+DATA.qiwu.length+
      ' 件、符号 '+DATA.symbols.length+' 例　|　'+
      '数据仅供学术研究使用，详见<a href="statement.html">学术声明</a>';
    document.body.appendChild(f);
  }

  // 唯一值（带计数），排序：计数降序
  LZ.facet=function(items,key){
    var m={};items.forEach(function(it){var v=it[key];if(v){m[v]=(m[v]||0)+1;}});
    return Object.keys(m).sort(function(a,b){return m[b]-m[a]||a.localeCompare(b,'zh');})
      .map(function(k){return {v:k,n:m[k]};});
  };

  function thumb(file,ph){
    return file?('<img src="'+IMG(file)+'" loading="lazy" alt="" onerror="this.parentNode.innerHTML=&quot;<span class=ph>图片缺失</span>&quot;">')
      :('<span class="ph">'+(ph||'暂无图片')+'</span>');
  }
  LZ.thumb=thumb;

  // ---- 详情弹窗 ----
  function ensureModal(){
    var m=document.getElementById('lz-modal');
    if(m) return m;
    m=document.createElement('div');m.id='lz-modal';m.className='modal-bg';
    m.innerHTML='<div class="modal"><div class="modal-head"><h2></h2>'+
      '<button class="x" aria-label="关闭">&times;</button></div>'+
      '<div class="modal-body"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m)close();});
    m.querySelector('.x').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
    return m;
  }
  function close(){var m=document.getElementById('lz-modal');if(m)m.classList.remove('show');}
  LZ.closeModal=close;

  function gallery(imgs){
    imgs=imgs.filter(function(i){return i.file;});
    if(!imgs.length) return '<div class="gallery"><div class="main"><span class="ph">暂无图片</span></div></div>';
    var strip=imgs.map(function(im,i){
      return '<div style="text-align:center"><img class="gthumb'+(i===0?' on':'')+'" data-i="'+i+'" src="'+IMG(im.file)+'"><div class="lab">'+(im.label||'')+'</div></div>';
    }).join('');
    return '<div class="gallery"><div class="main"><img id="gmain" src="'+IMG(imgs[0].file)+'"></div>'+
      '<div class="cap" id="gcap">'+(imgs[0].sub||imgs[0].label||'')+'</div>'+
      '<div class="strip">'+strip+'</div></div>';
  }
  function bindGallery(root,imgs){
    imgs=imgs.filter(function(i){return i.file;});
    root.querySelectorAll('.gthumb').forEach(function(el){
      el.addEventListener('click',function(){
        var i=+el.dataset.i;
        root.querySelector('#gmain').src=IMG(imgs[i].file);
        root.querySelector('#gcap').textContent=imgs[i].sub||imgs[i].label||'';
        root.querySelectorAll('.gthumb').forEach(function(x){x.classList.remove('on');});
        el.classList.add('on');
      });
    });
  }
  function row(k,v){return v?('<tr><th>'+k+'</th><td>'+v+'</td></tr>'):'';}

  // 器物详情
  LZ.openObject=function(id){
    var q=LZ.qById[id]; if(!q) return;
    var m=ensureModal();
    m.querySelector('.modal-head h2').innerHTML=q.id+'　'+(q.type||'');
    var imgs=(q.pics||[]).map(function(p){return {file:p.file,label:p.name||'器物',sub:'器物照片 '+(p.name||'')};});
    var syms=LZ.symsByObj[id]||[];
    var symlinks=syms.length?('<div class="detail-sec"><h4>所含符号（'+syms.length+'）</h4><div class="linkline">'+
      syms.map(function(s){return '<span class="lk" data-sym="'+s.id+'">'+s.id+'</span>';}).join('')+'</div></div>'):'';
    var body='<div>'+gallery(imgs)+'</div>'+
      '<div><table class="detail-table">'+
        row('器物编号',q.id)+row('器型',q.type)+row('考古学编号',q.arch)+
        row('出土地',q.site)+row('现藏单位',q.inst)+row('尺寸',q.size)+
        row('材质',q.material)+row('备注',q.note)+
      '</table>'+symlinks+'</div>';
    m.querySelector('.modal-body').innerHTML=body;
    bindGallery(m,imgs);
    m.querySelectorAll('[data-sym]').forEach(function(el){
      el.addEventListener('click',function(){LZ.openSymbol(el.dataset.sym);});
    });
    m.classList.add('show');
  };

  // 符号详情
  LZ.openSymbol=function(id){
    var s=LZ.symById[id]; if(!s) return;
    var q=LZ.qById[s.qid]||{};
    var m=ensureModal();
    m.querySelector('.modal-head h2').innerHTML=s.id+'　刻绘符号';
    var imgs=[];
    if(s.sym_img) imgs.push({file:s.sym_img,label:'符号',sub:'符号图片'});
    (s.tracings||[]).forEach(function(t,i){imgs.push({file:t.file,label:'摹本'+(i+1),sub:'摹本 '+t.id});});
    (s.rubbings||[]).forEach(function(r,i){imgs.push({file:r.file,label:'拓本'+(i+1),sub:'拓本 '+r.id+(r.scale?'（比例'+r.scale+'）':'')});});
    var body='<div>'+gallery(imgs)+'</div>'+
      '<div><table class="detail-table">'+
        row('符号编号',s.id)+row('所属器物','<span class="lk" data-obj="'+s.qid+'" style="cursor:pointer;color:var(--jade)">'+s.qid+(q.type?'（'+q.type+'）':'')+'</span>')+
        row('出土地',s.site)+row('符号位置',s.pos)+row('烧刻时间',s.burn)+
        row('是否残缺',s.defect)+row('符号形象',s.imgform)+row('符号备注',s.note)+
      '</table>'+
      '<div class="detail-sec"><h4>关联图像</h4><div class="linkline">'+
        '<span class="tag'+(s.sym_img?'':' red')+'">符号图 '+(s.sym_img?'1':'0')+'</span>'+
        '<span class="tag gold">摹本 '+(s.tracings||[]).length+'</span>'+
        '<span class="tag">拓本 '+(s.rubbings||[]).length+'</span>'+
      '</div></div></div>';
    m.querySelector('.modal-body').innerHTML=body;
    bindGallery(m,imgs);
    var ob=m.querySelector('[data-obj]'); if(ob) ob.addEventListener('click',function(){LZ.openObject(s.qid);});
    m.classList.add('show');
  };

  // ---- 卡片渲染 ----
  LZ.objectCard=function(q){
    var f=(q.pics&&q.pics[0])?q.pics[0].file:'';
    return '<div class="card" data-obj="'+q.id+'">'+
      '<div class="thumb">'+thumb(f,'无器物照片')+'</div>'+
      '<div class="meta"><span class="id">'+q.id+'</span>'+
      '<div class="ttl">'+(q.type||'未定名')+'</div>'+
      '<div class="tags"><span class="tag">'+q.site+'</span>'+
      '<span class="tag gold">'+q.matcat+'</span></div></div></div>';
  };
  LZ.symbolCard=function(s){
    var f=s.sym_img||((s.tracings[0]||{}).file)||((s.rubbings[0]||{}).file)||'';
    var tags='<span class="tag">'+s.site+'</span>';
    if(s.burn_cat!=='不明') tags+='<span class="tag gold">'+s.burn_cat+'</span>';
    if(s.defect_cat==='是') tags+='<span class="tag red">残缺</span>';
    return '<div class="card" data-sym="'+s.id+'">'+
      '<div class="thumb" style="background:#fff">'+thumb(f,'无图')+'</div>'+
      '<div class="meta"><span class="id">'+s.id+'</span>'+
      '<div class="ttl">'+(s.qtype||'')+' · '+(s.pos_cat)+'</div>'+
      '<div class="tags">'+tags+'</div></div></div>';
  };
  LZ.bindCards=function(root){
    root.querySelectorAll('[data-obj]').forEach(function(el){
      el.addEventListener('click',function(){LZ.openObject(el.dataset.obj);});});
    root.querySelectorAll('[data-sym]').forEach(function(el){
      el.addEventListener('click',function(){LZ.openSymbol(el.dataset.sym);});});
  };

  // 初始化
  document.addEventListener('DOMContentLoaded',function(){buildNav();buildFooter();});
})();
