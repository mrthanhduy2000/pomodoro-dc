/** Hoi An-inspired architectural kit. Only draws; never changes a plot or session. */
import { hash01 } from '../engine/city.js';
import { plotCenter } from '../city/layout.js';

export const HOIAN_NAMES = { house: 'Nhà phố thương nhân', hall: 'Hội quán', market: 'Chợ phố Hội', tower: 'Lầu chuông', temple: 'Nhà văn hóa sân trong' };

export function drawHoiAnBuilding(scene, b) {
  const c = plotCenter(b.plot);
  const pick = { type: 'building', planId: b.planId };
  const progress = Math.min(1, b.bricks.length / b.size);
  const variant = Math.floor(hash01(`${b.planId}:front`) * 4);
  const frontage=Math.floor(hash01(`${b.planId}:architecture`)*6);
  const wall = ['wall:#e5b65c', 'wall:#ddbf7b', 'wall:#dba65b', 'wall:#e8ca89'][variant];
  const tiles = ['tile:#505b57','tile:#68716a','tile:#7c7765','tile:#595346'];
  const random = (label) => hash01(`${b.planId}:${label}`);
  const mirror=b.shape==='house' && random('mirror')>.5?-1:1;
  const shutterColor = ['#4f6555','#786247','#476466','#705043'][variant];
  const part = (kind, mat, x, y, z, w, h, d, rotation = [0, 0, 0]) => scene.part(kind, mat, [c.x+mirror*x, y, c.z+z], [w,h,d], [rotation[0],mirror*rotation[1],mirror*rotation[2]], pick);
  const beam = (mat, a, to, radius=.025) => scene.beam(mat, [c.x+mirror*a[0],a[1],c.z+a[2]], [c.x+mirror*to[0],to[1],c.z+to[2]], radius, pick);
  const box = (mat,x,y,z,w,h,d) => part('box',mat,x,y,z,w,h,d);
  const roof = (x,y,z,w,d,rise=.42) => {
    if(progress < .5) return;
    const reach=d/2;
    const ageAt=(col,row,side)=>{
      const px=col/5,py=row/3,ix=Math.floor(px),iy=Math.floor(py);
      const fx=px-ix,fy=py-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
      const sample=(dx,dy)=>random(`roof-age:${x}:${y}:${z}:${side}:${ix+dx}:${iy+dy}`);
      return (sample(0,0)*(1-u)+sample(1,0)*u)*(1-v)+(sample(0,1)*(1-u)+sample(1,1)*u)*v;
    };
    for(const side of [-1,1]) {
      const height = (u) => rise*(1-u)+.1*Math.pow(u,4);
      const sag = (dx) => -.025*(1-Math.pow(dx/(w/2),2));
      for(let row=0;row<10;row+=1) {
        const a=row/10, u=(row+.5)/10, next=(row+1)/10;
        const slope=Math.atan2(height(a)-height(next),reach/10);
        for(let strip=0;strip<4;strip+=1) {
          const dx=(strip-1.5)*w/4;
          part('box','tile',x+dx,y+height(u)+sag(dx),z+side*reach*u,w/4+.008,.025,Math.hypot(reach/10,height(a)-height(next))+.018,[side*slope,0,0]);
        }
        const n=Math.max(5,Math.round(w/.085));
        for(let col=0;col<n;col+=1) {
          const seed=`tile:${x}:${y}:${z}:${side}:${row}:${col}`;
          const wear=random(seed),dx=-w/2+(col+.5)*w/n;
          const age=ageAt(col,row,side)*.75+wear*.25;
          const tint=age<.5?variant:age<.72?(variant+1)%4:age<.9?(variant+3)%4:(variant+2)%4;
          part('roofTile',tiles[tint],x+dx+(random(`${seed}:x`)-.5)*.009,y+height(u)+.018+sag(dx)+(wear-.5)*.012,z+side*reach*u, .029*(.94+wear*.12),reach/9,.029,[Math.PI/2+side*slope,(wear-.5)*.035,(random(`${seed}:tilt`)-.5)*.025]);
        }
      }
      // Gable boards close the roof volume. Slim timber eaves keep the edges light.
      for(let j=0;j<7;j+=1) for(const end of [-1,1]) box('timber',x+end*(w/2-.09),y+rise*j/7,z,.04,rise/7+.01,d*(1-j/7));
      beam('timber',[x-w/2,y+.07,z+side*reach],[x+w/2,y+.07,z+side*reach],.025);
      for(let drip=0;drip<Math.floor(w/.42);drip+=1)box('timber',x-w/2+.2+drip*.42,y-.015-random(`drip:${drip}`)*.025,z+side*(reach-.025),.33,.045,.06);
      for(let bracket=0;bracket<Math.floor(w/.3);bracket+=1) {
        const bx=x-w/2+.16+bracket*.3;
        beam('timber',[bx,y-.1,z+side*(reach-.17)],[bx,y+.05,z+side*reach],.016);
      }
    }
    beam('tile',[x-w/2-.025,y+rise+.04,z],[x+w/2+.025,y+rise+.04,z],.055);
    if(b.shape !== 'house' && b.shape !== 'market') for(const end of [-1,1]) {
      beam('tile',[x+end*w*.36,y+rise+.04,z],[x+end*w*.48,y+rise+.14,z],.035);
    }
  };
  const gableRoof=(x,y,z,w,d,rise=.5)=>{
    if(progress<.5)return;
    for(const side of [-1,1])for(let row=0;row<10;row+=1) {
      const u=(row+.5)/10,height=rise*(1-u)+.07*u*u;
      const slope=Math.atan2(rise-.14*u,w/2);
      part('box','tile',x+side*w/2*u,y+height,z,w/20+.025,.028,d,[0,0,-side*slope]);
      const count=Math.round(d/.085);
      for(let col=0;col<count;col+=1) {
        const wear=random(`gable:${row}:${col}:${side}`);
        part('roofTile',tiles[(variant+(wear>.8?1:0))%4],x+side*w/2*u,y+height+.025,z-d/2+(col+.5)*d/count,.03,w/18,.03,[0,0,Math.PI/2-side*slope]);
      }
    }
    for(const end of [-1,1])for(let j=0;j<7;j+=1)box(wall,x,y+rise*j/7,z+end*(d/2-.04),w*(1-j/7),rise/7+.01,.055);
    beam('tile',[x,y+rise+.03,z-d/2-.025],[x,y+rise+.03,z+d/2+.025],.045);
  };
  const awning=(x,y,z,width,color)=>{
    if(progress<.65)return;
    for(let stripe=0;stripe<10;stripe+=1) {
      part('cloth',`cloth:${stripe%2?'#d9cdae':color}`,x+(stripe-4.5)*width/10,y,z,width/10,.14,.52,[.16,0,0]);
      part('orb',stripe%2?'#d9cdae':color,x+(stripe-4.5)*width/10,y-.055,z+.25,width/20,.06,.025);
    }
  };
  const counter=(x,y,z,width,wares)=>{
    if(progress<.65)return;
    box('timber',x,y,z,width,.07,.32);
    for(const side of [-1,1])box('timber',x+side*width*.4,y/2,z,.045,y,.16);
    for(let item=0;item<7;item+=1) {
      const px=x+(item-3)*width/8;
      if(wares==='cloth') {
        for(let fold=0;fold<3;fold+=1)box(['#557c80','#a75e4d','#c9b38c'][(item+fold)%3],px,y+.055+fold*.028,z,.11,.025,.21);
      } else part('taper',item%2?'#a97f5a':'#c8b98d',px,y+.12,z,.055,.16,.055);
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
      part('box',shutterColor,sx,y,z+.08,.16,h+.05,.035,[0,side*.4,0]);
      for(let i=0;i<6;i+=1) box('timber',sx,y-h*.38+i*h*.15,z+.105,.12,.014,.018);
    }
    if(progress>=.8 && random(`curtain:${x}:${y}:${z}`)>.45) {
      for(const side of [-1,1])part('cloth','cloth:#c6b994',x+side*w*.34,y,z+.072,w*.25,.07,h*.88,[Math.PI/2,0,side*.08]);
    }
    box('stone',x,y-h/2-.055,z+.02,w+.16,.05,.13);
  };
  const body = (x,z,w,d,h) => {
    if(b.shape==='house' && progress>=.35) {
      // The shop is genuinely hollow: deep verandas reveal shelves and rooms behind the facade.
      box(wall,x,.16+h/2,z-d/2+.055,w,h,.11);
      for(const side of [-1,1]) box(wall,x+side*(w/2-.055),.16+h/2,z,.11,h,d);
      box('timber',x,.18,z,w,.06,d);
      box('timber',x,h+.12,z,w,.07,d);
      if(h>1.6) box('timber',x,1.22,z,w,.07,d);
      if(h>1.8) box(wall,x,(1.25+h-.54)/2,z+d/2,w,h-.54-1.25,.09);
      const bays=Math.max(1,Math.round(w/.6));
      for(let i=0;i<=bays;i+=1) box('timber',x-w/2+i*w/bays,.16+h/2,z+d/2,.065,h,.09);
      for(const level of [1.1,h+.1]) box('timber',x,level,z+d/2,w,.12,.11);
      for(let shelf=0;shelf<3;shelf+=1) {
        box('timber',x,.45+shelf*.24,z-d*.3,w*.72,.035,.16);
        for(let jar=0;jar<5;jar+=1) part('taper',jar%2?'#b98855':'#c8b98d',x+(jar-2)*w*.12,.53+shelf*.24,z-d*.3,.045,.085,.045);
      }
    } else box(wall,x,.16+h/2,z,w,h,d);
    box('stone',x,.16,z,w+.08,.16,d+.08);
    if(progress>=.65) {
      // Irregular apron stones seat the facade in the street instead of a perfect plinth edge.
      const count=Math.max(3,Math.round(w/.3));
      for(let stone=0;stone<count;stone+=1) {
        const wear=random(`apron:${x}:${z}:${stone}`),dx=(stone+.5)/count*w-w/2;
        box(wear>.6?'stone':'paving',x+dx,.075+wear*.012,z+d/2+.085,w/count-.012,.075,.13+wear*.045);
      }
      if(b.shape==='house' && h>1.6) {
        part('box',shutterColor,x-w*.28,.59,z+d/2-.02,.25,.78,.035,[0,.72+random(`door:${x}`)*.35,0]);
        for(let slat=0;slat<5;slat+=1)box('timber',x-w*.28,.33+slat*.13,z+d/2+.01,.19,.014,.018);
        // Open shop ceiling glow and a pooled spill use the existing emissive/pool materials.
        box('glow',x,.99,z+d/2-.19,Math.min(w*.45,.7),.025,.07);
        scene.shopPools?.push({x:c.x+mirror*x,z:c.z+z+d/2+.4,w:Math.min(w*.8,1.7),d:1.05});
      }
      for(const side of [-1,1]) {
        const wear=random(`footing:${x}:${z}:${side}`);
        if(wear>.4)part('orb','foliage:#647053',x+side*(w/2+.04),.09,z-d*.25,.075,.018,.13);
      }
    }
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
      // Small worn patches sit on solid side walls, never across an open shop bay.
      if(progress>=.65) {
        const side=random(`wear-side:${x}:${z}`)>.5?1:-1;
        const centerZ=z+(random(`wear-z:${x}:${z}`)-.5)*d*.45;
        for(let row=0;row<4;row+=1) for(let brick=0;brick<5;brick+=1) {
          const wear=random(`brick:${x}:${z}:${row}:${brick}`);
          if(wear<.25 || (row===3 && wear<.6)) continue;
          const bz=centerZ+(brick-2)*.1+(row%2)*.035;
          if(Math.abs(bz-z)>d/2-.08) continue;
          box(wear>.65?'#a97f5a':'#b98e63',x+side*(w/2+.006),.33+row*.052,bz,.018,.045,.091);
        }
      }

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
  const courtyard = () => { box('paving',0,.09,0,3.45,.12,1.85); };
  courtyard();
  if(progress === 0) { posts([-1,1],.16,-.65,.6); posts([-1,1],.16,.65,.6); return; }
  if(progress < .25) { body(0,-.18,1.65,1,.45); return; }

  if(progress>=.65 && b.plot.y!==0 && ['house','hall','market'].includes(b.shape)) {
    // A shallow service wing belongs to this building; it is not a second earned house.
    box(wall,0,.57,-1.16,2.65,.8,.42);
    roof(0,1.03,-1.14,2.88,.59,.2);
    for(const dx of [-.86,0,.86]) {
      box('timber',dx,.61,-1.386,.36,.43,.035);
      box('glow',dx,.61,-1.41,.28,.35,.012);
      for(const offset of [-.07,.07])box('timber',dx+offset,.61,-1.424,.018,.35,.018);
    }
    for(const dx of [-1.3,1.3])garden(dx,.34,-1.08,.24);
  }
  switch(b.shape) {
    case 'house': {
      if(frontage===1) {
        // Low tea room with an open timber gallery and a small upper retreat.
        body(-.55,-.07,1.85,1.42,1.63);roof(-.55,1.8,-.04,2.1,1.7,.37);
        body(1.03,.02,.93,1.15,.92);roof(1.03,1.09,.03,1.15,1.43,.26);
        for(const dx of [-1.16,-.57,.02])window(dx,1.4,.66,.28,.38,false);
        posts([-1.35,-.55,.25],.16,1.06,.94);rail(-.55,1.35,1.08,1.85);
        roof(-.55,1.12,.94,2.05,.55,.15);
        counter(-.55,.48,.75,1.35,'pottery');garden(1.36,.27,.79,.3);
        for(const dx of [-1.15,.05,1.04])lantern(dx,.96,1.14);
        break;
      }
      if(frontage===2) {
        // A narrow, tall tailor's shop turns its ridge toward the street.
        body(-.65,-.05,1.4,1.48,2.55);gableRoof(-.65,2.72,-.02,1.7,1.7,.56);
        body(.91,.01,1.26,1.28,1.05);roof(.91,1.22,.02,1.5,1.55,.27);
        window(-.65,2.21,.72,.56,.5);window(-.65,1.51,.72,.56,.43,false);
        awning(-.65,1.09,.97,1.65,'#557c80');counter(.91,.53,.88,1.06,'cloth');
        if(progress>=.65) {
          for(let roll=0;roll<5;roll+=1)part('pole',['#557c80','#a75e4d','#c9b38c'][roll%3],.5+roll*.18,.74,.66,.045,.75,.045,[0,0,(roll-2)*.08]);
          box('timber',.31,1.72,.87,.32,.48,.06);
          for(let mark=0;mark<4;mark+=1)box('#c9b38c',.31,1.58+mark*.085,.91,.19,.018,.012);
        }
        lantern(-1.3,1.21,1.05);garden(1.46,.27,.62,.26);
        break;
      }
      if(frontage===3) {
        // Single-storey pottery workshop: broad shelves and unequal intersecting roofs.
        body(-.17,-.08,2.75,1.4,1.08);roof(-.17,1.25,-.04,3.05,1.65,.36);
        gableRoof(.87,1.32,.02,.93,1.58,.34);
        awning(-.48,1.03,1,2.1,'#a75e4d');counter(-.49,.46,.86,1.85,'pottery');
        if(progress>=.65)for(let shelf=0;shelf<3;shelf+=1) {
          box('timber',1.18,.39+shelf*.21,.75,.54,.035,.2);
          for(let jar=0;jar<4;jar+=1)part('taper',jar%2?'#b58d5e':'#d1ba91',.98+jar*.13,.48+shelf*.21,.77,.04,.12,.04);
        }
        lantern(-1.4,.96,.94);lantern(.42,.96,.94);garden(-1.55,.25,.58,.22);
        break;
      }
      if(frontage===4) {
        // L-shaped dwelling leaves a planted courtyard and an off-centre timber gate.
        body(-.87,-.02,1.13,1.52,2.02);gableRoof(-.87,2.19,-.02,1.4,1.74,.44);
        body(.57,-.44,1.63,.66,1.15);roof(.57,1.32,-.43,1.86,.91,.32);
        window(-.87,1.69,.76,.46,.43);window(.58,.77,-.08,.46,.43,false);
        if(progress>=.65) {
          box('stone',.62,.22,.53,.96,.09,.7);
          part('taper','#b78054',.66,.34,.53,.16,.28,.16);
          for(let leaf=0;leaf<50;leaf+=1) {
            const u=random(`court:${leaf}`);part('leaf','foliage:#587642',.66+Math.sin(leaf)*.19,.48+u*.35,.53+Math.cos(leaf)*.18,.08,.18,.08,[leaf,u*4,u]);
          }
          box(wall,.53,.42,1.06,1.65,.49,.08);
        }
        posts([.12,.91],.16,1.13,.85);roof(.52,1.03,1.1,1.04,.42,.22);
        lantern(.15,.84,1.19);garden(-1.48,.27,.62,.26);
        break;
      }
      if(frontage===5) {
        // Broad corner house uses an arched loggia instead of a long timber balcony.
        const upper=1.88+random('corner-height')*.3;
        body(0,-.05,2.91,1.38,upper);roof(0,upper+.17,-.02,3.22,1.65,.42);
        for(const dx of [-.94,0,.94]) {
          window(dx,upper-.35,.67,.43,.48,false);
          if(progress>=.65) {
            part('arch','timber',dx,.67,.77,.69,.92,.08);
            box('stone',dx,.17,.92,.73,.12,.38);
          }
          lantern(dx,1.22,.99);
        }
        roof(0,1.24,.93,3.2,.5,.14);garden(-1.37,.33,1.08,.27);garden(1.37,.33,1.08,.27);
        break;
      }
      // A full merchant frontage: two unequal wings, recessed shop bays and inhabited upper rooms.
      const flip=variant%2 ? -1:1;
      const mainX=flip*-.43, wingX=flip*1.05;
      const upper=variant===1?1.8:2.25+variant*.06;
      body(mainX,-.04,2.02,1.48,upper);
      roof(mainX,upper+.17,-.02,2.3,1.7,.51);
      if(variant===3 && progress>=.65) {
        box(wall,mainX,upper+.37,.43,.62,.43,.53);
        roof(mainX,upper+.57,.43,.78,.73,.23);
        window(mainX,upper+.39,.72,.24,.27,false);
      }
      body(wingX,.09,.9,1.35,variant===2?1.67:1.05);
      roof(wingX,variant===2?1.84:1.22,.1,1.13,1.57,.33);
      // Three bays and a continuous timber balcony read as a street house, not a pavilion.
      for(const dx of [-.57,0,.57]) {
        window(mainX+dx,upper-.28,.72,.3,.52);
        if(progress>=.65) {
          part('box',shutterColor,mainX+dx-.22,.62,.77,.15,.78,.035,[0,-.55,0]);
          box('timber',mainX+dx,.98,.77,.48,.08,.12);
        }
      }
      box('timber',mainX,1.24,.92,2.16,.085,.46);
      rail(mainX,1.62,1.13,2.18);
      for(const dx of [-.9,0,.9]) {
        beam('timber',[mainX+dx,.94,.72],[mainX+dx,1.23,1.13],.028);
        lantern(mainX+dx,1.05,1.04);
      }
      posts([mainX-.91,mainX,mainX+.91],.16,1.05,1.04);
      roof(mainX,1.21,.93,2.22,.49,.13);
      window(wingX,.69,.8,.36,.55,false);
      box('timber',wingX,1.05,.83,.67,.16,.065);
      for(let i=0;i<7;i+=1) box('#d1b477',wingX+(i-3)*.073,1.05,.87,.022,.07,.012);
      if(progress>=.8) {
        // Flowering vines drape over the balcony, with a cafe and display at street level.
        for(const dx of [-.7,.1,.7]) garden(mainX+dx,1.58,1.14,.6);
        for(let i=0;i<70;i+=1) {
          const u=hash01(`${b.planId}:climb:${i}`),v=hash01(`climb:${i}`);
          const vx=mainX-.78+u*1.55,vy=upper+.06-v*.62;
          part('leaf','foliage:#526d3c',vx,vy,.86,.08,.14,.08,[u*4,v*6,u]);
          if(i%2===0) part('orb','#c24780',vx,vy,.9,.04,.028,.04);
        }
        const tx=wingX,tz=1.15;
        part('pole','timber',tx,.43,tz,.23,.045,.23);
        beam('iron',[tx,.16,tz],[tx,.42,tz],.018);
        for(const side of [-1,1]) {
          box('timber',tx+side*.27,.29,tz,.16,.035,.17);
          posts([tx+side*.27-.05,tx+side*.27+.05],.16,tz,.12);
          box('timber',tx+side*.27,.43,tz+.07,.16,.22,.025);
        }
        part('pole','#e0d0a0',tx,.47,tz,.035,.04,.035);
        for(const dx of [-.3,.3]) part('taper','#b78054',mainX+dx,.34,.97,.09,.2,.09);
      }
      garden(flip*1.55,.32,.65,.25);
      break;
    }
    case 'hall': {
      // Broad ceremonial frontage with layered roofs, carved doors and a stone stair.
      body(0,-.12,2.85,1.24,1.55);
      roof(0,1.71,-.04,3.3,1.62,.63);
      roof(0,2.33,-.08,2.23,1.06,.38);
      box('stone',0,.18,.72,2.6,.16,.43);
      for(let step=0;step<3;step+=1) box('stone',0,.18-step*.04,.94+step*.1,1.9+step*.15,.08,.15);
      for(const x of [-.85,0,.85]) {
        part('arch','timber',x,.86,.54,.59,1.12,.12);
        part('arch','glow',x,.86,.6,.42,.92,.025);
        for(const dx of [-.1,.1]) box('timber',x+dx,.86,.64,.025,.9,.025);
        lantern(x,1.47,.91);
      }
      posts([-1.36,-.45,.45,1.36],.2,.96,1.35);
      roof(0,1.61,.78,3.23,.6,.18);
      box('timber',0,1.45,1.02,1.28,.23,.07);
      for(let i=0;i<9;i+=1) box('#c7a668',(i-4)*.12,1.45,1.06,.035,.105,.015);
      for(const x of [-1.39,1.39]) { garden(x,.3,1.07,.35); part('taper','stone',x,.26,.9,.14,.22,.14); }
      break;
    }
    case 'market': {
      // Four independently dressed stalls under one long roof form a continuous shopfront.
      posts([-1.45,-.72,0,.72,1.45],.15,-.62,1.32);
      posts([-1.45,-.72,0,.72,1.45],.15,.63,1.32);
      roof(0,1.49,0,3.4,1.73,.48);
      box('timber',0,.4,-.25,2.95,.12,.46);
      for(let i=0;i<4;i+=1) {
        const x=(i-1.5)*.73;
        box('timber',x,.48,.53,.66,.55,.43);
        for(let j=0;j<18;j+=1) part('orb',['#bb733f','#799448','#ceaa59','#a65349'][i],x+(j%6-2.5)*.087,.79,.46+Math.floor(j/6)*.082,.045,.04,.045);
        lantern(x,1.26,.72);
        for(let j=0;j<6;j+=1) part('box',j%2 ? '#e5d6b0': i%2 ? '#8b4c3d':'#55785d',x+(j-2.5)*.116,1.18,.9,.115,.035,.48,[.2,0,0]);
        for(const dx of [-.2,.2]) part('taper','#a47e55',x+dx,.27,1.04,.12,.22,.12);
      }
      garden(-1.54,.22,.85,.25);
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
      body(0,-.48,2.3,.66,1.14);
      roof(0,1.3,-.48,2.65,.91,.51);
      for(const x of [-1.3,1.3]) {
        body(x,.02,.43,1.05,.83);
        roof(x,1,.02,.7,1.35,.27);
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
