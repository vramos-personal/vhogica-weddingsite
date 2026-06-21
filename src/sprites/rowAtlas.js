(function(){
  // Row-atlas helper for equal-cell sprite sheets
  function buildGridAtlas(img, columns, rows = null, frameNames = []) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error('Image not loaded or has zero size');

    if (!rows) {
      // infer rows assuming uniform grid cells
      rows = Math.round((h * columns) / w) || 1;
    }
    const cellW = Math.floor(w / columns);
    const cellH = Math.floor(h / rows);

    const total = columns * rows;
    const names = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        names.push(frameNames[idx] || `r${r}_c${c}`);
      }
    }

    const atlas = {};
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / columns);
      const c = i % columns;
      atlas[names[i]] = {
        sx: c * cellW,
        sy: r * cellH,
        sw: cellW,
        sh: cellH,
        name: names[i],
        index: i,
        row: r,
        col: c
      };
    }

    return {
      img,
      columns,
      rows,
      cellW,
      cellH,
      atlas,
      getFrame: (row, col) => {
        const name = names[row * columns + col];
        return atlas[name];
      },
      getFramesByRow: (row, startCol = 0, count = null) => {
        const available = columns - startCol;
        const n = count == null ? available : Math.min(count, available);
        const out = [];
        for (let i = 0; i < n; i++) {
          const name = names[row * columns + startCol + i];
          if (name) out.push(name);
        }
        return out;
      },
      getFramesRange: (startIndex = 0, count = 1) => {
        const out = [];
        for (let i = 0; i < count; i++) {
          const idx = startIndex + i;
          if (idx >= 0 && idx < names.length) out.push(names[idx]);
        }
        return out;
      },
      frameNames: names
    };
  }

  function drawFrameFromAtlas(ctx, atlasObj, frameName, dx, dy, dw, dh) {
    const m = atlasObj.atlas[frameName];
    if (!m) {
      ctx.drawImage(atlasObj.img, dx, dy, dw, dh);
      return;
    }
    ctx.drawImage(atlasObj.img, m.sx, m.sy, m.sw, m.sh, dx, dy, dw, dh);
  }

  function makeAnimationPlayer(atlasObj, frameNames, frameMs = 100, loop = true) {
    return {
      atlas: atlasObj,
      frames: frameNames.slice(),
      frameMs,
      loop,
      elapsed: 0,
      index: 0,
      playing: true,
      update: function(deltaMs) {
        if (!this.playing || this.frames.length <= 1) return;
        this.elapsed += deltaMs;
        while (this.elapsed >= this.frameMs) {
          this.elapsed -= this.frameMs;
          this.index++;
          if (this.index >= this.frames.length) {
            if (this.loop) this.index = 0;
            else { this.index = this.frames.length - 1; this.playing = false; }
          }
        }
      },
      draw: function(ctx, dx, dy, dw, dh) {
        const name = this.frames[this.index];
        drawFrameFromAtlas(ctx, this.atlas, name, dx, dy, dw, dh);
      },
      play: function() { this.playing = true; },
      stop: function() { this.playing = false; },
      goto: function(i) { this.index = Math.max(0, Math.min(i, this.frames.length - 1)); }
    };
  }

  // expose to global for simple inclusion via <script>
  window.buildGridAtlas = buildGridAtlas;
  window.drawFrameFromAtlas = drawFrameFromAtlas;
  window.makeAnimationPlayer = makeAnimationPlayer;
})();
