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
export function heritageFootprints(key,site=null) {
  if(site&&key==='ha-tanky-v1')return [[0,.92,3.25,.66,1.38],[0,-.94,3.25,.62,1.28],[-1.48,-.01,.28,1.2,1.18],[1.48,-.01,.28,1.2,1.18]];
  if(site&&key==='ha-phunghung-v1')return [[0,.86,3.1,.72,2.1],[0,-.18,3.1,.9,1.65],[0,-1.1,3.1,.56,1.35]];
  if(site&&key==='ha-quangtrieu-v1')return [[0,-.96,3,.66,1.42],[-1.43,-.02,.55,1.35,1.02],[1.43,-.02,.55,1.35,1.02]];
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
  const {box,part,beam,roof,gableRoof,body,window,posts,rail,garden,lantern,counter}=kit;
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
      const frontage=building.site?3.25:2.22,sideX=building.site?1.48:.97,roofW=building.site?3.5:2.5;
      const frontZ=building.site?.92:.48,backZ=building.site?-.94:-.73,faceZ=building.site?1.27:.83;
      body(0,frontZ,frontage,.66,1.38);roof(0,1.55,frontZ,roofW,.95,.39);
      body(0,backZ,frontage,.62,1.28);roof(0,1.45,backZ,roofW,.9,.34);
      for(const side of [-1,1]) {
        body(side*sideX,building.site?-.01:-.14,.28,building.site?1.2:.6,1.18);roof(side*sideX,1.35,building.site?-.01:-.14,.46,building.site?1.5:.85,.12);
        lattice(side*.67,.77,building.site?1.29:.85,.4,.65);
      }
      box('paving',0,.18,building.site?-.01:-.14,building.site?2.6:1.6,.06,building.site?1.1:.6);
      columns(building.site?[-1.48,-.5,.5,1.48]:[-.95,-.32,.32,.95],faceZ,1.25);
      if(finish)for(const x of [-.14,.14])part('pole',timber,x,1.08,.875,.038,.02,.038,[Math.PI/2,0,0]);
      sign(0,1.23,building.site?1.31:.87,.85);
      if(building.site){
        // Deep merchant parcel: rear service doorway, not another street-facing shop window.
        box(timber,0,.63,-1.265,.56,.91,.045);
        for(const side of [-1,1])box(timber,side*.31,.64,-1.29,.035,.96,.04);
        box('stone',0,.22,-1.34,.72,.09,.22);
      }else window(0,.78,-1.055,.6,.58,false);
      if(finish){box(timber,-.48,.45,.54,.6,.045,.35);pots(-.55,-.64,3);}
      if(open)garden(.68,.24,-.14,.3);
      break;
    }
    case 'ha-phunghung-v1': {
      if(building.site) {
        // Documented merchant-house sequence: two-storey front, four-direction middle roof,
        // lower rear block. Parcel-only detail leaves released historical models untouched.
        for(const [x,z,w,d,h] of heritageFootprints(building.key,building.site))body(x,z,w,d,h);
        roof(0,2.27,.86,3.45,1.05,.43);
        roof(0,1.52,-1.1,3.43,.82,.29);
        const roofW=3.43,roofD=1.14,rise=.42,roofY=1.82,roofZ=-.18;
        if(progress>=.82) {
          // ConeGeometry's four-sided base spans sqrt(2), and its origin is the centre.
          part('hip','tile',0,roofY+rise/2,roofZ,roofW/Math.SQRT2,rise,roofD/Math.SQRT2);
          for(const side of [-1,1])for(let face=0;face<2;face++) {
            const run=(face?roofW:roofD)/2,across=face?roofD:roofW,slope=Math.atan2(rise,run);
            for(let row=0;row<7;row++) {
              const end=(row+1)/7,count=Math.max(1,Math.floor(across*end/.13));
              for(let col=0;col<count;col++) {
                const along=((col+.5)/count-.5)*across*end,start=Math.max(row/7,Math.abs(along)/(across/2)),u=(start+end)/2;
                part('roofTile','tile:#63695d',face?side*run*u:along,roofY+rise*(1-u)+.015,roofZ+(face?along:side*run*u),.024,Math.hypot(run,rise)*(end-start)+.015,.024,face?[0,0,Math.PI/2-side*slope]:[Math.PI/2+side*slope,0,0]);
              }
            }
          }
        }
        if(progress>=.5)for(const side of [-1,1])for(const end of [-1,1])
          beam(progress>=.82?'tile':timber,[side*roofW/2,roofY,roofZ+end*roofD/2],[0,roofY+rise,roofZ],.025);
        box(timber,0,1.21,1.08,3.35,.085,.56);
        for(const x of [-1.45,-.72,0,.72,1.45]) {
          box('stone',x,.25,1.27,.16,.18,.16);
          posts([x],.34,1.27,1.85);
          beam(timber,[x,1.91,1.27],[x,2.15,1.06],.025);
        }
        roof(0,1.16,1.17,3.45,.43,.13);
        if(finish) {
          rail(0,1.57,1.34,3.24);
          for(const side of [-1,1]) {
            box(timber,side*1.61,1.21,.67,.17,.075,.92);
            beam(timber,[side*1.61,1.57,.23],[side*1.61,1.57,1.34],.022);
            for(let i=0;i<7;i++)beam(timber,[side*1.61,1.24,.26+i*.17],[side*1.61,1.57,.26+i*.17],.012);
          }
          for(const x of [-1.02,0,1.02]) {
            lattice(x,1.78,1.25,.49,.58);
            for(const side of [-1,1])part('box','#443d30',x+side*.3,1.78,1.29,.14,.6,.035,[0,side*.32,0]);
          }
          counter(-.68,.48,1.05,.86,'cloth');
          sign(0,1.05,1.3,1.05);
          lantern(-1.38,1.81,1.23);lantern(1.38,1.81,1.23);
          for(const x of [-.8,.8])lattice(x,.68,-1.39,.46,.65);
        }
        break;
      }
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
      if(building.site) {
        const cream='wall:#d3c3a0',ceramic='#75988b',stone='stone',iron='#9f4b3d';
        const [[,hallZ,hallW,hallD,hallH],...galleries]=heritageFootprints(building.key,building.site);
        const hallFront=hallZ+hallD/2;
        // Open sanctuary and longitudinal galleries leave a real central courtyard.
        box('paving',0,.18,.03,3.25,.06,2.68);
        box(stone,0,.23,hallZ,hallW+.08,.18,hallD+.08);
        box(cream,0,.23+hallH/2,hallZ-hallD/2+.04,hallW,hallH,.09);
        for(const side of [-1,1])box(cream,side*(hallW/2-.04),.23+hallH/2,hallZ,.08,hallH,hallD);
        for(const x of [-1.36,-.45,.45,1.36]) {
          box(stone,x,.31,hallFront+.04,.16,.14,.2);
          part('pole','wall:#8b493f',x,.34+(hallH-.24)/2,hallFront+.04,.044,hallH-.24,.044);
          box(cream,x,.23+hallH-.17,hallFront+.04,.22,.11,.17);
        }
        box(timber,0,hallH+.14,hallFront+.03,hallW-.12,.14,.12);
        roof(0,.23+hallH,hallZ,hallW+.43,hallD+.32,.43);
        for(let step=0;step<3;step++)box(stone,0,.12+step*.065,hallFront+.2-step*.08,hallW-.35-step*.08,.075,.24);
        for(const [x,z,w,d,h] of galleries) {
          const side=Math.sign(x),inner=x-side*(w/2-.025);
          box(cream,x+side*(w/2-.055),.24+h/2,z,.08,h,d);
          box(timber,x,.23,z,w,.06,d);
          for(let i=0;i<4;i++) {
            const at=z-d/2+.095+i*(d-.14)/3;
            box(stone,inner,.27,at,.12,.12,.13);
            posts([inner],.33,at,h-.18);
          }
          gableRoof(x,.22+h,z,w+.27,d+.26,.24);
        }
        // Four round stone columns carry a taller central gate and lower side openings.
        for(const x of [-1.4,-.51,.51,1.4]) {
          const h=Math.abs(x)<1?1.52:1.22;
          part('pole',stone,x,.25,1.21,.095,.17,.095);
          part('pole',stone,x,.31+h/2,1.21,.061,h,.061);
          box(cream,x,.31+h,1.21,.23,.1,.21);
        }
        box(cream,0,1.64,1.21,1.22,.34,.16);
        roof(0,1.85,1.21,1.48,.44,.23);
        for(const side of [-1,1]) {
          box(cream,side*.96,1.35,1.21,.81,.21,.15);
          roof(side*.96,1.49,1.21,1.03,.4,.18);
        }
        if(finish) {
          sign(0,1.64,1.31,.86);
          for(const side of [-1,1]) {
            lantern(side*.49,1.54,1.31);
            for(const y of [1.51,1.77])box(ceramic,side*.32,y,1.304,.48,.025,.018);
            for(let i=0;i<7;i++) {
              const x=side*(.6+i*.16);
              box(iron,x,.65,1.21,.015,.77,.018);
              part('hat',iron,x,1.05,1.21,.027,.065,.027);
            }
            for(const y of [.31,.78])box(iron,side*1.05,y,1.21,.9,.025,.025);
            // Restrained glazed ridge curls and leafy shade use the existing instanced kit.
            for(let i=0;i<8;i++) {
              const a=i/8,b=(i+1)/8;
              const point=u=>[side*(.2+u*1.26),2.09+.11*Math.sin(u*Math.PI)+.08*u,-.96];
              beam(ceramic,point(a),point(b),.018);
            }
            for(let i=0;i<12;i++)part('leaf',`foliage:${i%2?'#536c43':'#6a8051'}`,side*(1.16+.06*Math.sin(i*2)),1.18+.08*Math.sin(i),-.55+i*.105,.16,.11,.13,[i*.6,side*.4,i*.3]);
          }
          // Ceramic dragon pool: a bounded static sculpture, not another animated water pass.
          part('pole',stone,0,.27,.13,.36,.14,.29);
          part('pole','#467d75',0,.347,.13,.31,.014,.245);
          const at=u=>{const angle=u*Math.PI*2.6;return [Math.sin(angle)*(.18+.07*u),.37+.51*u,.13+Math.cos(angle)*(.13+.05*u)];};
          for(let i=0;i<22;i++) {
            const a=at(i/22),b=at((i+1)/22);
            beam('#628d78',a,b,.042);
            for(const side of [-1,0,1])part('orb',i%3?'#88a58b':'#b6b998',a[0]+side*.025,a[1]+.028,a[2],.016,.01,.019);
            if(i%2===0)part('hat','#b69960',a[0],a[1]+.06,a[2],.018,.055,.018,[0,0,.3*Math.sin(i)]);
          }
          const head=at(1);
          part('orb','#648b72',head[0],head[1]+.055,head[2],.096,.09,.073);
          part('orb','#b96047',head[0],head[1]+.02,head[2]+.08,.065,.032,.053);
          box('#473d32',head[0],head[1]+.02,head[2]+.127,.09,.014,.009);
          for(let tooth=0;tooth<4;tooth++)box('#d9d2b4',head[0]+(tooth-1.5)*.022,head[1]+.026,head[2]+.134,.012,.02,.01);
          for(const side of [-1,1]) {
            part('orb','#e6ddc4',head[0]+side*.065,head[1]+.08,head[2]+.046,.026,.025,.02);
            part('orb','#334538',head[0]+side*.065,head[1]+.08,head[2]+.064,.011,.012,.009);
            beam('#d2c49b',[head[0]+side*.055,head[1]+.1,head[2]],[head[0]+side*.1,head[1]+.23,head[2]-.05],.014);
            beam('#d2c49b',[head[0]+side*.08,head[1]+.17,head[2]-.025],[head[0]+side*.145,head[1]+.19,head[2]-.06],.01);
            beam('#ddd1af',[head[0]+side*.04,head[1]+.12,head[2]+.04],[head[0]+side*.095,head[1]+.105,head[2]+.065],.016);
            for(let i=0;i<5;i++) {
              const whisker=u=>[head[0]+side*(.035+.18*u),head[1]+.045+.06*Math.sin(u*Math.PI),head[2]+.11+.06*u];
              beam('#d8c28b',whisker(i/5),whisker((i+1)/5),.008);
            }
          }
          box(timber,0,.43,-1.06,.88,.2,.24);
          box('wall:#8b493f',0,.94,-1.19,.92,.82,.035);
          sign(0,1.4,-1.16,.8);
          part('vase','#8c7851',0,.62,-.84,.12,.24,.1);
          for(const x of [-.08,0,.08])beam('#8c7851',[x,.35,-.82],[x*.7,.54,-.84],.015);
          for(const x of [-.92,.92])lantern(x,1.34,-.55);
        }
        break;
      }
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
