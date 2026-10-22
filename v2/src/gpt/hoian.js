/** Hoi An-inspired architectural kit. Only draws; never changes a plot or session. */
import { hash01 } from '../engine/city.js';
import { plotCenter } from '../city/layout.js';

export const HOIAN_NAMES = { house: 'Nhà phố thương nhân', hall: 'Hội quán', market: 'Chợ phố Hội', tower: 'Lầu chuông', temple: 'Nhà văn hóa sân trong' };

export function drawHoiAnBuilding(scene, b) {
  const c = plotCenter(b.plot);
  const pick = { type: 'building', planId: b.planId };
  const progress = Math.min(1, b.bricks.length / b.size);
  const variant = Math.floor(hash01(`front:${b.planId}`) * 4);
  const wall = ['wall:#e0b253', 'wall:#dbc18a', 'wall:#d6a15c', 'wall:#e4cf9b'][variant];
  const tile = ['#66665b', '#777365', '#575d58', '#7a7061'][variant];
  const part = (kind, mat, x, y, z, w, h, d, rotation = [0, 0, 0]) => scene.part(kind, mat, [c.x+x, y, c.z+z], [w,h,d], rotation, pick);
  const beam = (mat, a, to, radius=.025) => scene.beam(mat, [c.x+a[0],a[1],c.z+a[2]], [c.x+to[0],to[1],c.z+to[2]], radius, pick);
  const box = (mat,x,y,z,w,h,d) => part('box',mat,x,y,z,w,h,d);
  const roof = (x,y,z,w,d,rise=.42) => {
    if(progress < .5) return;
    const reach=d/2;
    for(const side of [-1,1]) {
      const height = (u) => rise*(1-u)+.1*Math.pow(u,4);
      for(let row=0;row<7;row+=1) {
        const a=row/7, u=(row+.5)/7, next=(row+1)/7;
        const slope=Math.atan2(height(a)-height(next),reach/7);
        part('box','tile',x,y+height(u),z+side*reach*u,w,.045,Math.hypot(reach/7,height(a)-height(next))+.025,[side*slope,0,0]);
        const n=Math.max(5,Math.round(w/.13));
        for(let col=0;col<n;col+=1) part('pole',tile,x-w/2+(col+.5)*w/n,y+height(u)+.035,z+side*reach*u,.036,reach/6,.036,[Math.PI/2+side*slope,0,0]);
      }
      // Gable boards close the roof volume. Slim timber eaves keep the edges light.
      for(let j=0;j<7;j+=1) for(const end of [-1,1]) box('timber',x+end*(w/2-.09),y+rise*j/7,z,.04,rise/7+.01,d*(1-j/7));
      beam('timber',[x-w/2,y+.07,z+side*reach],[x+w/2,y+.07,z+side*reach],.025);
    }
    beam('tile',[x-w/2-.025,y+rise+.04,z],[x+w/2+.025,y+rise+.04,z],.055);
    if(b.shape !== 'house' && b.shape !== 'market') for(const end of [-1,1]) {
      beam('tile',[x+end*w*.36,y+rise+.04,z],[x+end*w*.48,y+rise+.14,z],.035);
    }
  };
  const window = (x,y,z,w=.36,h=.48, shutter=true) => {
    if(progress < .35) return;
    box('timber',x,y,z,w+.09,h+.09,.065);
    box('glow',x,y,z+.045,w,h,.025);
    box('timber',x,y,z+.065,.025,h,.025);
    box('timber',x,y,z+.065,w,.025,.025);
    if(shutter) for(const side of [-1,1]) {
      const sx=x+side*(w/2+.105);
      box('timber',sx,y,z+.035,.15,h+.05,.04);
      for(let i=0;i<4;i+=1) box(tile,sx,y-h*.35+i*h*.23,z+.062,.12,.018,.02);
    }
    box('stone',x,y-h/2-.055,z+.02,w+.16,.05,.13);
  };
  const body = (x,z,w,d,h) => {
    box(wall,x,.16+h/2,z,w,h,d);
    box('stone',x,.16,z,w+.08,.16,d+.08);
    for(const side of [-1,1]) box('timber',x+side*w/2,.16+h/2,z+d/2+.01,.045,h,.05);
    if(progress >= .35) {
      // Recesses, louvres and sills wrap around the actual volume, including its rear.
      for(const side of [-1,1]) for(let floor=0;floor<Math.max(1,Math.floor(h/.8));floor+=1) {
        const wy=.61+floor*.76;
        if(wy+.23 > h+.16) continue;
        for(const offset of [-.24,.24]) if(d>.7 || offset<0) {
          const wz=z+offset*d;
          box('timber',x+side*(w/2+.013),wy,wz,.045,.48,.29);
          box('glow',x+side*(w/2+.04),wy,wz,.018,.38,.21);
          for(let slat=0;slat<4;slat+=1) box('timber',x+side*(w/2+.055),wy-.15+slat*.1,wz,.02,.025,.23);
          box('stone',x+side*(w/2+.04),wy-.27,wz,.13,.055,.4);
        }
        box('timber',x,wy,z-d/2-.025,Math.min(w*.55,.6),.51,.05);
        box('glow',x,wy,z-d/2-.055,Math.min(w*.44,.48),.39,.015);
        for(let bar=0;bar<3;bar+=1) box('timber',x+(bar-1)*Math.min(w*.14,.15),wy,z-d/2-.07,.025,.4,.02);
      }
      // A damp plaster base and thin cornice keep the wall from reading as one slab.
      box('stone',x,.27,z,w+.018,.1,d+.018);
      box(wall,x,h+.11,z,w+.085,.075,d+.085);
    }
  };
  const lantern = (x,y,z) => {
    if(progress < .8) return;
    beam('timber',[x,y+.2,z],[x,y+.06,z],.008);
    part('orb','glow',x,y,z,.085,.12,.085);
    for(let rib=0;rib<6;rib+=1) {
      const angle=rib*Math.PI/3;
      beam('#a85932',[x+Math.sin(angle)*.078,y-.08,z+Math.cos(angle)*.078],[x+Math.sin(angle)*.078,y+.08,z+Math.cos(angle)*.078],.005);
    }
    for(const yy of [-.12,.12]) part('pole','timber',x,y+yy,z,.055,.02,.055);
    beam('#b78e42',[x,y-.12,z],[x,y-.23,z],.008);
  };
  const garden = (x,y,z,width=.6) => {
    if(progress < .65) return;
    box('timber',x,y-.05,z,width,.1,.16);
    for(let i=0;i<44;i+=1) {
      const u=hash01(`${b.planId}:garden:${i}`),v=hash01(`g:${i}`);
      part('leaf',`foliage:${i%2?'#63804a':'#7d934e'}`,x+(u-.5)*width,y+.04+v*.14,z+(v-.5)*.17,.07,.11,.07,[u*4,v*4,i]);
      if(i%2===0) part('orb',scene.snow?'#dce4dc':'#bd387c',x+(u-.5)*width,y+.15+v*.12,z+.03,.05,.035,.05);
    }
  };
  const posts = (xs,y,z,h) => xs.forEach(x=>beam('timber',[x,y,z],[x,y+h,z],.035));
  const rail = (x,y,z,w) => {
    box('timber',x,y,z,w,.045,.05);
    for(let i=0;i<12;i+=1) beam('timber',[x-w/2+i*w/11,y-.32,z],[x-w/2+i*w/11,y,z],.012);
  };
  const courtyard = () => { box('paving',0,.09,0,2.45,.12,1.85); };
  courtyard();
  if(progress === 0) { posts([-1,1],.16,-.65,.6); posts([-1,1],.16,.65,.6); return; }
  if(progress < .25) { body(0,-.18,1.65,1,.45); return; }

  switch(b.shape) {
    case 'house': {
      // Split merchant house: a narrow upper wing, lower tea shop and a side garden.
      const flip=variant%2 ? -1:1;
      const twoStoreys=variant!==1;
      const upper=twoStoreys ? 1.72 : 1.06;
      body(flip*-.28,-.14,1.25,1.3,upper);
      roof(flip*-.28,upper+.17,-.14,1.48,1.63,.43);
      body(flip*.68,.03,.65,1.15,.85);
      roof(flip*.68,1.02,.03,.83,1.42,.3);
      window(flip*-.28,.65,.55,.42,.59);
      if(twoStoreys) {
        window(flip*-.28,1.43,.55,.39,.44);
        box('timber',flip*-.28,1.08,.72,1.25,.06,.3);
        rail(flip*-.28,1.38,.87,1.28);
        garden(flip*-.28,1.35,.89,.85);
      }
      window(flip*.68,.6,.63,.28,.43,false);
      posts([flip*-.85,flip*.2],.16,.87,.85);
      roof(flip*-.32,1.01,.73,1.4,.48,.16);
      lantern(flip*.18,.84,.89);
      lantern(flip*-.62,.84,.89);
      // Open shop threshold, a carved sign and cafe seating belong to this house's plot.
      box('timber',flip*-.28,.2,.7,.49,.09,.35);
      box('timber',flip*.67,.88,.64,.45,.12,.06);
      for(let i=0;i<5;i+=1) box('#c5ab69',flip*.67+(i-2)*.065,.88,.675,.018,.06,.01);
      if(progress>=.8) {
        const tx=flip*.72,tz=1.05;
        part('pole','timber',tx,.43,tz,.23,.045,.23);
        beam('iron',[tx,.16,tz],[tx,.42,tz],.018);
        for(const side of [-1,1]) {
          box('timber',tx+side*.28,.29,tz,.17,.035,.17);
          posts([tx+side*.28-.06,tx+side*.28+.06],.16,tz,.12);
          box('timber',tx+side*.28,.43,tz+.07,.17,.22,.025);
        }
        part('pole','#e0d0a0',tx,.47,tz,.035,.04,.035);
        garden(flip*-.65,.92,.96,.75);
      }
      garden(flip*.98,.33,.64,.3);
      break;
    }
    case 'hall': {
      // Assembly hall: broad ceremonial hall, raised platform, triple entry and two roof tiers.
      body(0,-.22,2.15,1.1,1.12);
      roof(0,1.28,-.22,2.5,1.48,.56);
      roof(0,1.85,-.24,1.65,.94,.36);
      box('stone',0,.18,.58,1.7,.16,.43);
      for(const x of [-.58,0,.58]) {
        part('arch','timber',x,.66,.37,.4,.82,.07);
        part('arch','glow',x,.66,.42,.28,.65,.025);
        lantern(x,1.06,.57);
      }
      posts([-1,-.35,.35,1],.2,.61,1.05);
      roof(0,1.23,.58,2.46,.65,.23);
      box('timber',0,1.04,.68,.86,.19,.04);
      for(const x of [-.95,.95]) garden(x,.23,.83,.34);
      break;
    }
    case 'market': {
      // Open market shed, visibly hollow beneath its roof, with stalls and textile awnings.
      posts([-1.02,-.34,.34,1.02],.15,-.63,1.05);
      posts([-1.02,-.34,.34,1.02],.15,.63,1.05);
      roof(0,1.22,0,2.48,1.7,.46);
      box('timber',0,.34,-.25,2.1,.12,.46);
      for(let i=0;i<3;i+=1) {
        const x=(i-1)*.7;
        box('timber',x,.46,.5,.59,.5,.38);
        for(let j=0;j<8;j+=1) part('orb',['#b76b3b','#759243','#d9b568'][i],x+(j%4-.5)*.095-.1,.76,.47+Math.floor(j/4)*.1,.052,.047,.052);
        lantern(x,1.01,.6);
        for(let j=0;j<5;j+=1) part('box',j%2 ? '#e5d6b0': variant%2 ? '#8b4c3d':'#55785d',x+(j-2)*.125,.98,.79,.124,.035,.4,[.13,0,0]);
      }
      garden(-1.09,.22,.79,.25);
      break;
    }
    case 'tower': {
      // Bell pavilion with an open belfry, bronze bell and stacked roof silhouettes.
      body(0,0,.91,.95,1.35);
      window(0,.76,.49,.31,.67,false);
      roof(0,1.51,0,1.44,1.4,.34);
      posts([-.38,.38],1.68,-.36,.86);posts([-.38,.38],1.68,.36,.86);
      box('timber',0,1.72,0,.96,.09,.96);
      part('taper','#b38a48',0,2.15,0,.16,.29,.16);
      beam('iron',[0,2.3,0],[0,2.52,0],.015);
      rail(0,2.05,.4,.8);
      roof(0,2.56,0,1.38,1.38,.43);
      roof(0,3.0,0,.8,.8,.23);
      for(const x of [-.65,.65]) lantern(x,1.38,.48);
      break;
    }
    default: {
      // Courtyard culture house: rear shrine, two low side wings, gate and open centre.
      body(0,-.52,1.78,.58,.94);
      roof(0,1.1,-.52,2.14,.85,.51);
      for(const x of [-.91,.91]) {
        body(x,.02,.39,.8,.63);
        roof(x,.81,.02,.64,1.1,.22);
        lantern(x,.67,.46);
      }
      posts([-.56,.56],.16,.7,.69);
      roof(0,.98,.7,1.5,.45,.3);
      part('arch','timber',0,.56,-.2,.47,.72,.04);
      part('arch','glow',0,.56,-.17,.34,.59,.02);
      for(const x of [-.37,.37]) part('pole','stone',x,.24,.16,.11,.22,.11);
      garden(0,.2,.35,.4);
    }
  }
}
