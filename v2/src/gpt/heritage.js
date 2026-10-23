/** Interpretive, plot-sized models of documented Hoi An places; not measured replicas. */
import { heritageOf } from '../engine/catalog.js';

const FOOTPRINTS={
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
      // Open water extends past the bridge into its local inlet; old plots/river never move.
      box('#396e70',0,.165,0,.67,.015,2.7);
      for(const side of [-1,1]) {
        for(let stone=0;stone<11;stone++)box(stone%3?'stone':'#738471',side*.49,.2,-1.24+stone*.245,.22,.16,.23);
        for(let step=0;step<4;step++)box('stone',side*(1.35+step*.11),.43-step*.07,0,.115,.09,.8);
        // Clear stone paths connect both landward ends; never terminate against a wall.
        box('paving',side*1.72,.19,.64,.23,.05,.67);
      }
      for(let ripple=0;ripple<9;ripple++)box('#75988b',Math.sin(ripple*2.1)*.16,.177,-1.2+ripple*.29,.12,.002,.013);
      for(const x of [-1.08,-.36,.36,1.08])for(const z of [-.39,.39])box('stone',x,.3,z,.16,.28,.19);
      for(let board=0;board<24;board++)box(timber,-1.38+(board+.5)*2.76/24,.48,0,.109,.07,.86);
      columns([-1.24,-.74,-.25,.25,.74,1.24],-.44,1.02);
      columns([-1.24,-.74,-.25,.25,.74,1.24],.44,1.02);
      roof(0,1.49,0,2.85,1.12,.43);
      for(const x of [-1.32,1.32])roof(x,1.31,0,.52,1.4,.2);
      body(0,-.79,1.3,.51,1.1);roof(0,1.27,-.79,1.57,.8,.35);
      for(const z of [-.45,.45]) {
        box(timber,0,.7,z,2.55,.28,.055);
        if(finish)for(let bar=0;bar<24;bar++)box(timber,-1.24+bar*2.48/23,1.03,z,.025,.38,.03);
      }
      if(finish)for(const side of [-1,1]) {
        box('stone',side*1.53,.21,0,.26,.16,.85);
        // Paired timber guardians: dogs and monkeys, without invented inscriptions or legends.
        for(const z of [-.35,.35]) {
          part('orb',timber,side*1.45,.59,z,.06,.09,.055);
          part('orb',timber,side*1.45,.71,z,.043,.046,.044);
          if(side===1) {
            part('orb',timber,1.5,.695,z,.035,.018,.024);
            for(const dz of [-.03,.03])box(timber,1.48,.53,z+dz,.025,.11,.025);
          } else for(const dz of [-.04,.04]) {
            part('orb',timber,-1.42,.55,z+dz,.04,.04,.027);
            beam(timber,[-1.45,.66,z+dz],[-1.4,.57,z+dz],.012);
          }
        }
      }
      sign(0,1.36,.59,.77);
      break;
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
