import Matter from 'matter-js';
import type {Engine,Body as PhysicsBody} from 'matter-js';

type Point={x:number;y:number};
type Fragment={body:PhysicsBody;radius:number;sprite:HTMLCanvasElement};
const {Bodies,Body,Composite,Sleeping}=Matter;

// Ground-coffee clumps share the beans' world: contact transfers momentum in
// both directions. No height-map, painted polygon pile, or teleport on landing.
export function createCoffeeDust(stage:HTMLElement,engine:Engine,texture:HTMLImageElement){
  const canvas=document.createElement('canvas');canvas.className='coffee-dust';
  canvas.setAttribute('aria-hidden','true');stage.append(canvas);
  const ctx=canvas.getContext('2d')!;
  let fragments:Fragment[]=[],width=0,height=0,dpr=1;
  type Mote={x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;phase:number};
  let motes:Mote[]=[],clouds:Array<{x:number;y:number;age:number;vx:number}>=[];
  const haze=document.createElement('canvas');haze.width=haze.height=96;
  const hc=haze.getContext('2d')!,gradient=hc.createRadialGradient(48,48,0,48,48,48);
  gradient.addColorStop(0,'#99714b50');gradient.addColorStop(.4,'#75503930');gradient.addColorStop(1,'#75503900');
  hc.fillStyle=gradient;hc.fillRect(0,0,96,96);
  function update(dt:number){
    for(const mote of motes){
      mote.age+=dt;mote.vx*=Math.exp(-dt*3);mote.vy+=(55+mote.size*65)*dt;
      mote.vx+=Math.sin(mote.phase+mote.age*4)*18*dt;
      mote.x+=mote.vx*dt;mote.y+=mote.vy*dt;
    }
    motes=motes.filter(m=>m.age<m.life&&m.y<height);
    for(const cloud of clouds){cloud.age+=dt;cloud.x+=cloud.vx*dt;cloud.vx*=Math.exp(-dt*3);cloud.y-=10*dt;}
    clouds=clouds.filter(c=>c.age<1.4);
  }
  const sprites=Array.from({length:16},(_,index)=>{
    const tile=document.createElement('canvas');tile.width=tile.height=64;
    const c=tile.getContext('2d')!;
    // Sample the photographed roast surface, not the bean silhouette. Several
    // differently lit facets give each clump an irregular, granular surface.
    for(let n=0;n<18;n++){
      const angle=n*2.39996+index,distance=Math.sqrt(n/18)*21;
      const x=32+Math.cos(angle)*distance,y=32+Math.sin(angle)*distance;
      const radius=5+(n*7+index)%6;
      c.save();c.beginPath();
      for(let k=0;k<6;k++){
        const a=k*Math.PI/3,r=radius*(.72+((k+index+n)%3)*.14);
        const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
        if(k===0)c.moveTo(px,py);else c.lineTo(px,py);
      }
      c.closePath();c.shadowColor='#080503aa';c.shadowBlur=2;c.shadowOffsetY=1;
      c.fillStyle='#352217';c.fill();c.clip();
      c.filter="saturate(.8) brightness(.95)";
      c.drawImage(texture,texture.naturalWidth*(.05+(index%4)*.21),texture.naturalHeight*(.05+(n%4)*.21),70,70,x-radius,y-radius,radius*2,radius*2);
      c.filter='none';
      c.fillStyle=n%3===0?'#160b0655':'#8c613514';c.fill();c.restore();
    }
    return tile;
  });
  function paint(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    for(const fragment of fragments){
      const {body,radius,sprite}=fragment;
      ctx.save();ctx.translate(body.position.x,body.position.y);ctx.rotate(body.angle);
      ctx.drawImage(sprite,-radius*1.25,-radius*1.25,radius*2.5,radius*2.5);ctx.restore();
    }
    for(const cloud of clouds){
      const progress=cloud.age/1.4,size=38+progress*105;
      ctx.globalAlpha=Math.sin(progress*Math.PI)*.65;
      ctx.drawImage(haze,cloud.x-size/2,cloud.y-size*.35,size,size*.7);
    }
    for(const mote of motes){
      ctx.globalAlpha=Math.min(1,mote.age/.06)*Math.min(1,(mote.life-mote.age)/.5)*.65;
      ctx.fillStyle=mote.size<1?'#987454':'#67452f';ctx.beginPath();ctx.ellipse(mote.x,mote.y,mote.size,mote.size*.65,mote.phase,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;stage.dataset.dustAirborne=String(motes.length);
    stage.dataset.dustBodies=String(fragments.length);
    stage.dataset.dustParticles=String(fragments.filter(f=>!f.body.isSleeping).length);
  }
  function reset(w:number,h:number){
    for(const fragment of fragments)Composite.remove(engine.world,fragment.body);
    fragments=[];motes=[];clouds=[];width=w;height=h;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);paint();
  }
  function burst(position:Point,velocity:Point,area:number,strength:number,reduced:boolean){
    if(!reduced){
      clouds.push({x:position.x,y:position.y,age:0,vx:velocity.x*3});clouds=clouds.slice(-6);
      for(let i=0;i<32;i++)motes.push({x:position.x+(Math.random()-.5)*18,y:position.y+(Math.random()-.5)*14,
        vx:velocity.x*6+(Math.random()-.5)*(80+strength*3),vy:-35-Math.random()*85,
        age:0,life:1.1+Math.random()*1.3,size:.35+Math.random()*.85,phase:Math.random()*6});
      motes=motes.slice(-(width<761?96:160));
    }
    // Twelve clumps per bean, each displaying many finer photographed grains.
    // At most 528 bodies on desktop / 192 on a phone, all eligible for sleeping.
    const limit=width<761?192:528,count=Math.min(12,limit-fragments.length);
    const radius=Math.max(1.6,Math.min(4.4,Math.sqrt(area*.09/12/Math.PI)));
    const added:PhysicsBody[]=[];
    for(let i=0;i<count;i++){
      const size=radius*(.7+Math.random()*.6),angle=i*2.39996;
      const spread=Math.sqrt(i/12)*radius*5;
      const body=Bodies.polygon(Math.max(size,Math.min(width-size,position.x+Math.cos(angle)*spread)),Math.max(size,Math.min(height-size,position.y+Math.sin(angle)*spread)),5+i%3,size,{
        label:'Coffee grounds',density:.0012,friction:.85,frictionStatic:1,restitution:.025,
        frictionAir:.055,sleepThreshold:35,slop:.025,
      });
      Body.setAngle(body,angle);
      Body.setVelocity(body,{x:velocity.x*.18+(Math.random()-.5)*(reduced?1:Math.min(5,strength*.12)),y:Math.min(0,velocity.y*.12)-(reduced?.5:1+Math.random()*2)});
      Body.setAngularVelocity(body,(Math.random()-.5)*.12);
      fragments.push({body,radius:size,sprite:sprites[i%16]});added.push(body);
    }
    Composite.add(engine.world,added);paint();
  }
  function finish(){motes=[];clouds=[];fragments.forEach(f=>Sleeping.set(f.body,true));paint();}
  return {reset,burst,paint,update,finish,get active(){return motes.length>0||clouds.length>0||fragments.some(f=>!f.body.isSleeping);}};
}
