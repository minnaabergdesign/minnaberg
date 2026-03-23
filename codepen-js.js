(function () {

  /* ── Spring ── */
  function Sp(k, d) { this.k=k; this.d=d; this.x=0; this.v=0; this.t=0; }
  Sp.prototype.to   = function(t) { this.t = t; };
  Sp.prototype.tick = function()  {
    this.v = (this.v + (this.t - this.x) * this.k) * this.d;
    this.x += this.v;
    return this.x;
  };
  function clamp(v,a,b){ return Math.min(b, Math.max(a, v)); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  /* ── Refs ── */
  var cur   = document.getElementById('cur');
  var fimg  = document.getElementById('fimg');
  var track = document.getElementById('track');
  var cols  = document.querySelectorAll('.col');
  var imgs  = document.querySelectorAll('#fimg img');

  /* ── Cursor ── */
  var mx = innerWidth/2, my = innerHeight/2;
  var pmx = mx, pmy = my, vx = 0, vy = 0;
  document.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; });

  /* ── Cursor spring ── */
  var cx = new Sp(1,1), cy = new Sp(1,1);
  cx.x = mx; cy.x = my;

  /* ── Image springs ── */
  var ix = new Sp(.1,.76), iy = new Sp(.1,.76);
  var io = new Sp(.14,.80), is_ = new Sp(.12,.78);
  var irx= new Sp(.08,.82), iry= new Sp(.08,.82);
  ix.x = mx; iy.x = my;
  var IW = 480, IH = 336;

  /* ── Hover — use elementFromPoint, totally reliable ── */
  var active = -1;

  function show(i) {
    if (i === active) return;
    active = i;
    cols.forEach(function(c, j) { c.classList.toggle('on', j === i); });
    imgs.forEach(function(img, j) { img.classList.toggle('show', j === i); });
    fimg.style.transition = 'none'; /* let springs handle it */
  }

  function hide() {
    if (active === -1) return;
    active = -1;
    cols.forEach(function(c) { c.classList.remove('on'); });
    imgs.forEach(function(img) { img.classList.remove('show'); });
  }

  document.addEventListener('mousemove', function(e) {
    /* hit-test the actual element under the cursor */
    var el = document.elementFromPoint(e.clientX, e.clientY);
    /* walk up to find .col parent */
    var col = el;
    while (col && !col.classList.contains('col')) col = col.parentElement;
    if (col && col.dataset.i !== undefined) {
      show(parseInt(col.dataset.i, 10));
    } else {
      hide();
    }
  });

  /* ── Wheel scroll ── */
  track.addEventListener('wheel', function(e) {
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    track.scrollLeft += d;
  }, { passive: false });

  /* ── Drag scroll ── */
  var dn = false, dsx = 0, dsl = 0;
  track.addEventListener('mousedown', function(e) {
    dn = true; dsx = e.clientX; dsl = track.scrollLeft;
  });
  document.addEventListener('mousemove', function(e) {
    if (!dn) return;
    track.scrollLeft = dsl - (e.clientX - dsx) * 1.4;
  });
  document.addEventListener('mouseup', function() { dn = false; });

  /* ── Keyboard ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') track.scrollLeft += innerWidth * .38;
    if (e.key === 'ArrowLeft')  track.scrollLeft -= innerWidth * .38;
  });

  /* ── Page load stagger ── */
  var els = document.querySelectorAll('.col, .end');
  var hdr = document.querySelector('header');
  var ftr = document.querySelector('footer');
  els.forEach(function(el, i) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition =
      'opacity .6s ease '+(i*.06+.1)+'s,'+
      'transform .6s cubic-bezier(.23,1,.32,1) '+(i*.06+.1)+'s';
  });
  [hdr, ftr].forEach(function(el) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transition = 'opacity .5s ease .05s';
  });
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      els.forEach(function(el) { el.style.opacity='1'; el.style.transform='translateY(0)'; });
      [hdr, ftr].forEach(function(el) { if(el) el.style.opacity='1'; });
    });
  });

  /* ── RAF loop ── */
  function loop() {
    requestAnimationFrame(loop);

    vx = lerp(vx, mx - pmx, .3);
    vy = lerp(vy, my - pmy, .3);
    pmx = mx; pmy = my;

    /* cursor */
    cx.to(mx); cy.to(my);
    cur.style.transform = 'translate('+(cx.tick()-4.5)+'px,'+(cy.tick()-4.5)+'px)';

    /* image */
    var on = active >= 0;
    ix.to(on ? clamp(mx, IW/2+20, innerWidth -IW/2-20) : ix.x);
    iy.to(on ? clamp(my, IH/2+20, innerHeight-IH/2-20) : iy.x);
    io.to(on ? 1 : 0);
    is_.to(on ? 1 : .88);
    iry.to(clamp(vx*.4,-6,6));
    irx.to(clamp(-vy*.25,-4,4));

    var ox = ix.tick()-IW/2, oy = iy.tick()-IH/2;
    var oo = clamp(io.tick(),0,1);
    var os = is_.tick();
    fimg.style.opacity = oo.toFixed(3);
    fimg.style.transform =
      'translate('+ox.toFixed(1)+'px,'+oy.toFixed(1)+'px)'+
      ' scale('+os.toFixed(3)+')'+
      ' perspective(800px)'+
      ' rotateX('+irx.tick().toFixed(2)+'deg)'+
      ' rotateY('+iry.tick().toFixed(2)+'deg)';
  }
  requestAnimationFrame(loop);

}());