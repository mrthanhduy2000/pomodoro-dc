/** Interpretive, plot-sized models of documented Hoi An places; not measured replicas. */
import { heritageOf } from '../engine/catalog.js';

const FOOTPRINTS={
    'ha-quangtrieu-v1':[[0,-.7,2.1,.55,1.3],[-1.04,-.04,.42,.8,.9],[1.04,-.04,.42,.8,.9]],
    'ha-quancong-v1':[[0,-.77,2.14,.48,1.35],[0,.48,2.3,.45,1.1]],
    'ha-campho-v1':[[0,-.72,2.24,.58,1.3],[-1.05,-.02,.4,.84,1.04],[1.05,-.02,.4,.84,1.04]],
    'ha-tanky-v1':[[0,.48,2.22,.66,1.38],[0,-.73,2.22,.62,1.28],[-.97,-.14,.28,.6,1.18],[.97,-.14,.28,.6,1.18]],
    'ha-phunghung-v1':[[0,-.1,2.44,1.35,2.1]],
    'ha-phuckien-v1':[[0,-.64,2.42,.64,1.4],[-1.16,-.06,.3,.65,.8],[1.16,-.06,.3,.65,.8]],
    'ha-chuacau-v1':[[0,0,2.76,.86,1.02],[0,-.79,1.3,.51,1.1]],
    'ha-cho-v1':[[-.77,-.38,1.2,.91,1.13],[.77,-.38,1.2,.91,1.13]],
    'ha-thanhha-v1':[[-.66,-.3,1.31,1.12,1.04],[.85,-.57,.78,.73,.91]],
    'ha-kimbong-v1':[[0,-.5,2.5,.68,1.15]],
  };
export function heritageFootprints(key) {
  return Object.hasOwn(FOOTPRINTS,key)?FOOTPRINTS[key]:null;
}

/** Compress only new waterfront models around their immutable plot centre, keeping ground props on land. */
export function fitHeritageQuay(matrix, originZ) {
  if(originZ==null)return matrix;
  const e=matrix.elements;
  e[2]*=.65;e[6]*=.65;e[10]*=.65;e[14]=originZ+(e[14]-originZ)*.65;
  return matrix;
}

export function drawHeritageBuilding(kit, building, progress) {
  if (!heritageOf(building.key)) return false;
  const {box,part,beam,roof,body,window,posts,rail,garden,lantern,counter}=kit;
  const finish=progress>=.82,open=progress>=.95;
  const timber='timber',red='wall:#bb746b';
  const columns=(xs,z,h)=>posts(xs,.18,z,h);
  const lattice=(x,y,z,w,h)=>{
    if(!finish)return;
    box(timber,x,y,z,w+.04,h+.04,.045);
    for(let i=0;i<7;i++)box('#bb9e6a',x-w/2+(i+.5)*w/7,y,z+.03,.017,h,.02);
  };
  const sign=(x,y,z,w)=>{if(finish){box('#513d2e',x,y,z,w,.18,.055);box('#bdab74',x,y,z+.031,w*.82,.012,.006);}};
  const pots=(x,z,n=6)=>{
    if(!finish)return;
    for(let i=0;i<n;i++)part('vase',i%2?'tile:#ad6c45':'tile:#bd8354',x+(i%3)*.18,.27+Math.floor(i/3)*.13,z+Math.floor(i/3)*.17,.065,.17,.065);
  };
  switch(building.key) {
    case 'ha-tanky-v1': {
      // Two roofed blocks and side galleries leave an actual open-air light well.
      body(0,.48,2.22,.66,1.38);roof(0,1.55,.48,2.5,.95,.39);
      body(0,-.73,2.22,.62,1.28);roof(0,1.45,-.73,2.5,.9,.34);
      for(const side of [-1,1]) {
        body(side*.97,-.14,.28,.6,1.18);roof(side*.97,1.35,-.14,.46,.85,.12);
        lattice(side*.67,.77,.85,.4,.65);
      }
      box('paving',0,.18,-.14,1.6,.06,.6);
      columns([-.95,-.32,.32,.95],.83,1.25);
      if(finish)for(const x of [-.14,.14])part('pole',timber,x,1.08,.875,.038,.02,.038,[Math.PI/2,0,0]);
      sign(0,1.23,.87,.85);window(0,.78,-1.055,.6,.58,false);
      if(finish){box(timber,-.48,.45,.54,.6,.045,.35);pots(-.55,-.64,3);}
      if(open)garden(.68,.24,-.14,.3);
      break;
    }
    case 'ha-phunghung-v1': {
      body(0,-.1,2.44,1.35,2.1);roof(0,2.27,-.1,2.83,1.7,.43);
      box(timber,0,1.15,.82,2.66,.09,.65);
      columns([-1.16,-.58,0,.58,1.16],1.06,1.02);
      roof(0,1.13,.96,2.84,.48,.14);
      if(finish)rail(0,1.52,1.09,2.62);
      for(const x of [-.78,0,.78]) {window(x,1.76,.61,.42,.57,false);lattice(x,.67,.6,.45,.73);}
      sign(0,1.02,.72,.9);lantern(-1.17,1.77,.78);lantern(1.17,1.77,.78);
      break;
    }
    case 'ha-phuckien-v1': {
      // Ordered forecourt, three gate openings and rear sanctuary, rather than a shop facade.
      body(0,-.64,2.42,.64,1.4);roof(0,1.57,-.64,2.82,.98,.52);
      for(const x of [-1.16,1.16]) {body(x,-.06,.3,.65,.8);roof(x,.97,-.06,.5,.9,.2);}
      box('paving',0,.18,.03,1.9,.06,.58);
      for(const x of [-1.23,-.48,.48,1.23]) {
        box(red,x,.8,.91,.16,1.25,.22);box('stone',x,.24,.91,.25,.17,.31);
      }
      if(finish)for(const x of [-1.23,-.48,.48,1.23]) {
        box('wall:#e8dfc5',x,.8,1.032,.19,1.27,.025);
        box(red,x,.8,1.051,.11,1.12,.025);
        for(const y of [.31,1.32])box('wall:#e8dfc5',x,y,.91,.27,.075,.29);
      }
      if(finish)for(let segment=0;segment<14;segment++) {
        const at=u=>[Math.cos(Math.PI*u)*.4,1.04+Math.sin(Math.PI*u)*.32,1.045];
        beam('wall:#e8dfc5',at(segment/14),at((segment+1)/14),.027);
      }
      for(const [x,w,y] of [[-.88,.8,1.38],[0,1.12,1.75],[.88,.8,1.38]]) {
        box(red,x,y-.13,.91,w,.23,.22);roof(x,y,.91,w+.17,.46,.25);
        if(finish) {
          for(const side of [-1,1])for(let curl=0;curl<7;curl++) {
            const point=u=>[x+side*(.06+u*w*.37),y+.25+.11*Math.sin(u*Math.PI)+.04*u,.91];
            beam('#71856b',point(curl/7),point((curl+1)/7),.019);
          }
          part('orb','#bda46c',x,y+.38,.91,.055,.06,.045);
          for(const side of [-1,1])part('orb','#8c977d',x+side*w*.32,y+.29,.91,.045,.065,.045);
        }
      }
      if(finish) {
        sign(0,1.55,1.05,.66);
        for(const x of [-.8,.8]){part('taper','stone',x,.32,.4,.13,.24,.13);garden(x,.35,.4,.22);}
        for(const x of [-.74,.74])for(let ring=0;ring<4;ring++)part('hoop','#b59457',x,1.23-ring*.055,-.35,.07+ring*.025,.07+ring*.025,.012,[Math.PI/2,0,0]);
      }
      break;
    }
    case 'ha-chuacau-v1': {
      // The GPT site spans the actual channel. Legacy kit callers retain their local inlet.
      if(!building.riverBridge) {
        box('#396e70',0,.165,0,.67,.015,2.7);
        for(const side of [-1,1])box('stone',side*.49,.2,0,.22,.16,2.7);
      }
      for(const x of [-1.35,-.675,0,.675,1.35])for(const z of [-.28,.28])box('stone',x,.08,z,.16,.42,.2);
      for(let bay=0;bay<4;bay++)for(const z of [-.34,.34])for(let stone=0;stone<8;stone++) {
        const at=u=>[-1.35+bay*.675+u*.675,.02+Math.sin(u*Math.PI)*.2,z];
        beam('stone',at(stone/8),at((stone+1)/8),.046);
      }
      for(let board=0;board<32;board++)box(timber,-1.53+(board+.5)*3.06/32,.32,0,.091,.075,.63);
      posts([-1.4,-.7,0,.7,1.4],.33,-.32,1.19);
      posts([-1.4,-.7,0,.7,1.4],.33,.32,1.19);
      roof(0,1.48,0,3.4,.87,.29);
      for(const z of [-.34,.34]) {
        box('wall:#c3bbb0',0,.58,z,2.87,.33,.07);
        box(timber,0,.78,z,2.92,.045,.07);
        if(finish)for(let bar=0;bar<29;bar++)box(timber,-1.38+bar*2.76/28,1.01,z,.019,.41,.026);
      }
      for(const x of [-.46,.46])box('stone',x,.08,-.78,.17,.42,.2);
      box('stone',0,.28,-.65,1.31,.08,.65);
      box('wall:#c3bbb0',0,.79,-.925,1.24,1.08,.07);
      for(const x of [-.6,.6])box('wall:#c3bbb0',x,.79,-.65,.07,1.08,.55);
      for(const x of [-.49,.49])box(timber,x,.86,-.35,.055,1.15,.055);
      box(timber,0,.49,-.73,.73,.11,.22);
      box('#9b5b42',0,.79,-.88,.42,.47,.035);
      box('#b7a06a',0,.79,-.852,.17,.25,.012);
      roof(0,1.25,-.65,1.56,.8,.28);
      for(const side of [-1,1]) {
        roof(side*1.5,1.39,0,.46,.99,.2);
        for(let step=0;step<6;step++)box('stone',side*(1.48+step*.078),.29-step*.049,0,.105,.09,.69);
        for(const z of [-.3,.3]) {
          box('wall:#c3bbb0',side*1.52,.81,z,.16,1.03,.13);
          box('wall:#b78d73',side*1.52,1.45,z,.21,.055,.19);
        }
        for(let stone=0;stone<9;stone++) {
          const at=u=>[side*1.53,.92+Math.sin(u*Math.PI)*.27,Math.cos(u*Math.PI)*.26];
          beam('wall:#c3bbb0',at(stone/9),at((stone+1)/9),.045);
        }
        if(finish)for(const z of [-.28,.28]) {
          part('orb',timber,side*1.45,.69,z,.047,.075,.045);
          part('orb',timber,side*1.45,.79,z,.036,.04,.037);
          if(side===1)part('orb',timber,1.49,.775,z,.03,.015,.021);
          else for(const dz of [-.03,.03])part('orb',timber,-1.42,.65,z+dz,.03,.03,.022);
        }
      }
      sign(0,1.4,.46,.73);
      if(finish)for(const x of [-.55,.55])box('#b5ad91',x,1.8,0,.11,.022,.055);
      break;
    }
    case 'ha-quangtrieu-v1': {
      body(0,-.7,2.1,.55,1.3);roof(0,1.47,-.7,2.5,.83,.42);
      for(const side of [-1,1]){body(side*1.04,-.04,.42,.8,.9);roof(side*1.04,1.07,-.04,.65,1.05,.22);}
      box('paving',0,.18,.05,1.56,.06,.96);
      for(const x of [-1.12,-.37,.37,1.12]){box('stone',x,.8,1,.12,1.21,.17);box('wall:#bc8468',x,1.29,1,.22,.08,.24);}
      for(const x of [-.75,0,.75])roof(x,1.36,1,.86,.43,.23);
      if(finish){part('pole','stone',0,.28,.11,.28,.15,.28);part('pole','#587c71',0,.36,.11,.23,.018,.23);sign(0,1.23,1.15,.65);}
      break;
    }
    case 'ha-quancong-v1': {
      body(0,-.77,2.14,.48,1.35);roof(0,1.52,-.77,2.54,.75,.38);
      body(0,.48,2.3,.45,1.1);roof(0,1.27,.48,2.67,.75,.31);
      for(const side of [-1,1])box('wall:#b5735e',side*1.14,.71,-.12,.09,1.05,.75);
      box('paving',0,.18,-.1,1.99,.055,.65);
      for(const x of [-.95,-.32,.32,.95])box('wall:#9f5547',x,.75,.77,.13,1.1,.12);
      sign(0,1.16,.84,.76);if(finish)for(const x of [-.65,.65]){part('pole','stone',x,.29,.99,.13,.17,.13);part('orb','stone',x,.43,.99,.08,.09,.07);}
      break;
    }
    case 'ha-campho-v1': {
      body(0,-.72,2.24,.58,1.3);roof(0,1.47,-.72,2.64,.85,.35);
      for(const side of [-1,1]){body(side*1.05,-.02,.4,.84,1.04);roof(side*1.05,1.21,-.02,.65,1.1,.2);}
      box('paving',0,.2,.57,1.68,.08,1.06);posts([-.63,.63],.23,.23,.94);posts([-.63,.63],.23,.96,.94);
      if(progress>=.65)part('hip','tile',0,1.34,.6,1.19,.45,.82);
      for(const x of [-.82,.82])for(const z of [.03,1.18])beam('tile',[x,1.12,z],[0,1.59,.6],.025);
      sign(0,1.05,1.01,.75);break;
    }
    case 'ha-cho-v1': {
      for(const x of [-.77,.77]) {
        body(x,-.38,1.2,.91,1.13);roof(x,1.3,-.38,1.49,1.2,.31);
        columns([x-.5,x,x+.5],.67,.86);roof(x,1.04,.55,1.52,.65,.17);
        counter(x,.49,.69,1.03,'pottery');
      }
      if(open)for(const x of [-.87,.77]) {
        box(timber,x,.33,1.03,.37,.05,.32);
        for(const z of [.93,1.13])box(timber,x,.16,z,.04,.3,.04);
        part('bowl','#c7b795',x,.39,1.03,.09,.055,.09);
        if(building.plot.y===-1){box(timber,x,.17,.42,.2,.045,.17);box(timber,x,.085,.42,.12,.14,.12);}
        for(let noodle=0;noodle<5;noodle++)part('box','#c2a069',x,.425,1.005+noodle*.013,.12,.006,.009,[0,(noodle-2)*.08,0]);
        for(let meat=0;meat<3;meat++)part('orb','#995c3e',x+.035,.435,1.005+meat*.025,.025,.006,.017);
        for(let herb=0;herb<6;herb++)part('orb','#65804b',x+(herb-2.5)*.022,.43,1.03,.015,.008,.02);
      }
      sign(0,1.38,-.06,.72);
      break;
    }
    case 'ha-thanhha-v1': {
      box('wall:#d0ad74',-.66,.7,-.81,1.31,1.04,.09);
      for(const x of [-1.27,-.05])box('wall:#d0ad74',x,.7,-.3,.075,1.04,1.08);
      columns([-1.27,-.66,-.05],.27,1.04);
      box(timber,-.66,.18,-.3,1.31,.06,1.12);
      roof(-.66,1.21,-.3,1.6,1.43,.34);
      // Earth-coloured kiln and drying yard are distinct from the roofed working shed.
      box('wall:#ad6947',.85,.27,-.57,.82,.24,.76);
      part('orb','wall:#ad6947',.85,.49,-.57,.42,.48,.39);
      part('pole','wall:#a96e4c',.85,1.03,-.66,.085,.4,.085);
      part('arch','timber',.85,.4,-.175,.3,.35,.025);
      if(finish)for(let course=0;course<4;course++)for(let brick=0;brick<12;brick++) {
        const angle=(brick+course*.5)*Math.PI/6,r=.423-course*.035;
        part('box','wall:#bb8058',.85+Math.sin(angle)*r,.31+course*.12,-.57+Math.cos(angle)*r,.16,.025,.025,[0,angle,0]);
      }
      if(finish) {
        for(let shelf=0;shelf<3;shelf++) {box(timber,.79,.27+shelf*.25,.38,.84,.035,.29);pots(.53,.35,3);}
        for(const z of [.94,1.16])for(let i=0;i<8;i++)part('vase','tile:#b4774a',-1.15+i*.22,.27,z,.055,.17,.055);
        part('pole','stone',-.72,.2,.15,.2,.1,.2);
      }
      sign(-.66,1.02,.3,.87);
      break;
    }
    case 'ha-kimbong-v1': {
      body(0,-.5,2.5,.68,1.15);roof(0,1.32,-.5,2.84,1.01,.38);
      columns([-1.19,0,1.19],.83,1.18);roof(0,1.35,.57,2.8,.83,.2);
      if(finish) {
        box(timber,-.66,.48,.62,.93,.07,.44);
        box(timber,-.66,.55,.62,.38,.06,.16);
        for(const x of [-1,-.35])box(timber,x,.26,.62,.065,.43,.35);
        for(let plank=0;plank<7;plank++)box(timber,-.69,.12+plank*.044,-.08,1.08,.036,.34);
        for(const z of [.19,.36,.53,.7,.87])beam(timber,[.38,.25,z],[1.26,.25,z],.019);
        for(const x of [.38,.82,1.26])beam(timber,[x,.25,.19],[x,.4,.53],.017);
        for(let chisel=0;chisel<4;chisel++)box('iron',-.96+chisel*.14,.53,.69,.025,.015,.16);
      }
      sign(0,1.12,.98,.91);
      break;
    }
    default:return false;
  }
  return true;
}
