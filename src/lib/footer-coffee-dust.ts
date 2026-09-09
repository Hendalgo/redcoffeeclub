type Point = {x:number;y:number};
type Collider = {x:number;y:number;rx:number;ry:number;angle:number;vx:number;vy:number};
type Particle = {element:HTMLSpanElement;x:number;y:number;vx:number;vy:number;mass:number;age:number;angle:number;spin:number;fine:number;phase:number};

// Ballistic specks and a persistent, textured pile. The bounded DOM pool shares
// the bean clock and goes idle after landing; no second renderer or rigid bodies.
export function createCoffeeDust(stage: HTMLElement) {
  const layer = document.createElement('div');layer.className='coffee-dust';layer.setAttribute('aria-hidden','true');
  let seed=37;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const texture=['#261810','#38251a','#503725','#715039'].map(color=>{
    let d='';
    for(let i=0;i<650;i++){
      const x=random()*96,y=random()*96,size=.3+random()*1.5;
      d+=`M${x.toFixed(1)} ${y.toFixed(1)}l${size.toFixed(1)} -.3 .2 ${size.toFixed(1)} -${size.toFixed(1)} .2z`;
    }
    return `<path fill="${color}" d="${d}"/>`;
  }).join('');
  layer.innerHTML=`<svg class="coffee-dust-bed" preserveAspectRatio="none"><defs><pattern id="coffee-grind-texture" width="96" height="96" patternUnits="userSpaceOnUse"><path fill="#38261b" d="M0 0h96v96H0z"/>${texture}</pattern></defs><path data-dust-pile fill="url(#coffee-grind-texture)"/></svg>`;
  stage.append(layer);
  const bed = layer.querySelector('svg')!, path=layer.querySelector<SVGPathElement>('[data-dust-pile]')!;
  let particles: Particle[] = [], free: HTMLSpanElement[] = [];
  let width=0,height=0,heights:number[]=[],dirty=false;
  const colors=['#382318','#65452e','#261b14','#493022','#79563a'];
  let disturbed=0;
  const clouds:Array<{element:HTMLSpanElement;x:number;y:number;vx:number;age:number}>=[];
  function haze(position:Point,velocity:Point) {
    let cloud=clouds.find(item=>item.age>=1.4);
    if(!cloud&&clouds.length<6){
      const element=document.createElement('span');element.className='coffee-haze';layer.append(element);
      cloud={element,x:0,y:0,vx:0,age:2};clouds.push(cloud);
    }
    if(!cloud)return;
    Object.assign(cloud,{x:position.x,y:position.y,vx:velocity.x*3,age:0});
    cloud.element.hidden=false;cloud.element.style.opacity='0';
  }
  function speck(x:number,y:number,vx:number,vy:number,mass:number) {
    const element=free.pop()??document.createElement('span');
    if(!element.parentNode){element.className='coffee-ground';layer.append(element);}
    element.hidden=false;
    const fine=Math.random(),size=.45+fine**3*2.5;
    element.style.width=`${size.toFixed(1)}px`;element.style.height=`${(size*(.6+Math.random()*.6)).toFixed(1)}px`;
    element.style.background=colors[Math.floor(Math.random()*colors.length)];
    element.style.opacity='1';
    particles.push({element,x,y,vx,vy,mass,age:0,angle:Math.random()*6,spin:(Math.random()-.5)*4,fine,phase:Math.random()*Math.PI*2});
  }
  function settle(particle: Particle) {
    const index=Math.max(0,Math.min(heights.length-1,Math.floor(particle.x/width*heights.length)));
    heights[index]+=particle.mass/(width/heights.length);dirty=true;
    particle.element.hidden=true;free.push(particle.element);
  }
  function paintBed() {
    if (!dirty) return;
    const cell=width/heights.length;
    // Let steep heaps spill into neighbouring columns instead of forming towers.
    for(let pass=0;pass<12;pass++)for(let i=0;i<heights.length-1;i++){
      const difference=heights[i]-heights[i+1],excess=Math.abs(difference)-cell*.6;
      if(excess>0){const transfer=excess*.45*Math.sign(difference);heights[i]-=transfer;heights[i+1]+=transfer;}
    }
    path.setAttribute('d',`M0 ${height}L0 ${height-heights[0]}${heights.map((value,i)=>`L${((i+.5)*cell).toFixed(1)} ${(height-Math.min(height*.55,value)).toFixed(1)}`).join('')}L${width} ${height-heights.at(-1)!}V${height}Z`);
    dirty=false;
  }
  function reset(nextWidth:number,nextHeight:number) {
    width=nextWidth;height=nextHeight;
    for(const particle of particles){particle.element.hidden=true;free.push(particle.element);}
    clouds.forEach(cloud=>{cloud.age=2;cloud.element.hidden=true;});
    particles=[];heights=Array(Math.max(1,Math.ceil(width/7))).fill(0);
    bed.setAttribute('viewBox',`0 0 ${width} ${height}`);path.setAttribute('d','');
    stage.dataset.dustParticles='0';disturbed=0;stage.dataset.dustDisturbed='0';dirty=false;
  }
  function burst(position:Point,velocity:Point,area:number,strength:number,reduced:boolean) {
    if(!reduced)haze(position,velocity);
    const limit=width<761?96:160,count=reduced?10:width<761?36:54;
    while(particles.length+count>limit)settle(particles.shift()!);
    for(let i=0;i<count;i++){
      const spread=(reduced?.35:1)*(55+strength*3);
      speck(position.x+(Math.random()-.5)*22,position.y+(Math.random()-.5)*18,
        velocity.x*12+(Math.random()-.5)*spread*2,Math.min(30,velocity.y*6)-45-Math.random()*spread,area*.23/count);
    }
    stage.dataset.dustParticles=String(particles.length);paintBed();
  }
  function update(seconds:number,beans:Collider[]=[]) {
    // Rake only existing mass out of the heap; fragments settle again elsewhere.
    const cell=width/heights.length,limit=width<761?96:160;
    for(const bean of beans){
      const speed=Math.hypot(bean.vx,bean.vy);
      if(speed<35)continue;
      const c=Math.cos(bean.angle),s=Math.sin(bean.angle);
      const extent=Math.hypot(bean.rx*s,bean.ry*c),horizontal=Math.hypot(bean.rx*c,bean.ry*s);
      for(let i=Math.max(0,Math.floor((bean.x-horizontal)/cell));i<Math.min(heights.length,Math.ceil((bean.x+horizontal)/cell));i++){
        if(particles.length>=limit)break;
        const top=height-heights[i];
        if(heights[i]<.2||bean.y+extent<top-2||bean.y-extent>height)continue;
        const amount=Math.min(heights[i],Math.min(speed,500)*seconds*.12);
        heights[i]-=amount;dirty=true;disturbed++;
        speck((i+.5)*cell,top-3,bean.vx*.65+(Math.random()-.5)*60,-25-Math.min(160,speed*.3),amount*cell);
      }
    }
    stage.dataset.dustDisturbed=String(disturbed);
    const remaining:Particle[]=[];
    for(const particle of particles){
      particle.age+=seconds;
      // Fine grounds follow air drag; heavier crumbs fall sooner. Continuous
      // low-amplitude eddies avoid the rigid, identical ballistic trajectories.
      const drag=1.8+(1-particle.fine)*3.8;
      particle.vy+=(100+particle.fine*400)*seconds;
      particle.vy*=Math.exp(-seconds*drag*.45);
      particle.vx+=Math.sin(particle.age*4+particle.phase)*(1-particle.fine)*38*seconds;
      particle.vx*=Math.exp(-seconds*drag);
      particle.spin*=Math.exp(-seconds*2);
      particle.x+=particle.vx*seconds;particle.y+=particle.vy*seconds;particle.angle+=particle.spin*seconds;
      if(particle.x<2||particle.x>width-2){particle.x=Math.max(2,Math.min(width-2,particle.x));particle.vx*=-.25;}
      for(const bean of beans){
        const c=Math.cos(bean.angle),s=Math.sin(bean.angle),dx=particle.x-bean.x,dy=particle.y-bean.y;
        const lx=c*dx+s*dy,ly=-s*dx+c*dy,distance=Math.hypot(lx/bean.rx,ly/bean.ry);
        if(distance>=1||distance<.001)continue;
        const px=lx/distance,py=ly/distance;
        let nx=px/(bean.rx*bean.rx),ny=py/(bean.ry*bean.ry);
        const length=Math.hypot(nx,ny);nx/=length;ny/=length;
        const wx=c*nx-s*ny,wy=s*nx+c*ny;
        particle.x=bean.x+c*px-s*py+wx;particle.y=bean.y+s*px+c*py+wy;
        const closing=(particle.vx-bean.vx)*wx+(particle.vy-bean.vy)*wy;
        if(closing<0){particle.vx-=closing*1.03*wx;particle.vy-=closing*1.03*wy;}
        particle.vx+=(bean.vx-particle.vx)*.12;
      }
      const index=Math.max(0,Math.min(heights.length-1,Math.floor(particle.x/width*heights.length)));
      if(particle.y>=height-heights[index]-2||particle.age>3.2)settle(particle);
      else{
        particle.element.style.opacity=String(Math.min(1,(3.2-particle.age)/.5)*(.45+particle.fine*.55));
        particle.element.style.transform=`translate3d(${particle.x.toFixed(1)}px,${particle.y.toFixed(1)}px,0) rotate(${particle.angle.toFixed(2)}rad)`;
        remaining.push(particle);
      }
    }
    if(remaining.length!==particles.length)stage.dataset.dustParticles=String(remaining.length);
    particles=remaining;
    for(const cloud of clouds){
      if(cloud.age>=1.4)continue;
      cloud.age+=seconds;cloud.x+=cloud.vx*seconds;cloud.y-=12*seconds;cloud.vx*=Math.exp(-seconds*3);
      const life=Math.min(1,cloud.age/1.4);
      cloud.element.style.transform=`translate3d(${cloud.x}px,${cloud.y}px,0) scale(${.35+life*1.3})`;
      cloud.element.style.opacity=String(Math.sin(life*Math.PI)*.2);
      if(life>=1)cloud.element.hidden=true;
    }
    paintBed();
  }
  function finish(){clouds.forEach(cloud=>{cloud.age=2;cloud.element.hidden=true;});particles.forEach(settle);particles=[];stage.dataset.dustParticles='0';paintBed();}
  return {reset,burst,update,finish,get active(){return particles.length>0||clouds.some(cloud=>cloud.age<1.4);}};
}
