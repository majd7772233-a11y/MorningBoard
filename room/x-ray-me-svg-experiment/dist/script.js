/*
 * High-Precision Interactive Medical X-Ray Scanner
 * Developed for SapahBoard
 */

(function() {
  var svgElement = document.getElementById('svg-outer') || document.querySelector('svg');
  var maskedElement = document.querySelector('#mask-circle');
  var circleFeedback = document.querySelector('#circle-shadow');
  var circleReticleOuter = document.querySelector('#circle-reticle-outer');
  var chTop = document.querySelector('#ch-top');
  var chBottom = document.querySelector('#ch-bottom');
  var chLeft = document.querySelector('#ch-left');
  var chRight = document.querySelector('#ch-right');
  var chCenter = document.querySelector('#ch-center');
  var lensHudTag = document.querySelector('#lens-hud-tag');
  var hudTagText = document.querySelector('#hud-tag-text');
  var hudZone = document.getElementById('hud-zone');

  var btnZoomIn = document.getElementById('btn-zoom-in');
  var btnZoomOut = document.getElementById('btn-zoom-out');
  var btnResetPos = document.getElementById('btn-reset-pos');

  var currentRadius = 115;
  var minRadius = 75;
  var maxRadius = 180;

  var currentCoords = { x: 400, y: 420 };
  var svgPoint = svgElement ? svgElement.createSVGPoint() : null;

  function cursorPoint(e, svg) {
    if (!svgPoint || !svg) return { x: 400, y: 420 };
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    return svgPoint.matrixTransform(svg.getScreenCTM().inverse());
  }

  function getAnatomyZoneName(x, y) {
    // Check if in arm area
    if ((x < 315 || x > 485) && y >= 370 && y <= 660) {
      if (y < 490) return { ar: 'عظم العضد ومفصل الكتف', en: 'Humerus & Shoulder' };
      if (y < 575) return { ar: 'عظام الساعد (الكعبرة والزند)', en: 'Radius & Ulna' };
      return { ar: 'عظام الرسغ واليد والأصابع', en: 'Hand & Phalanges' };
    }
    // Vertical body zones
    if (y < 230) return { ar: 'الرأس وقبة الجمجمة', en: 'Cranium & Vault' };
    if (y < 330) return { ar: 'عظام الوجه والفك والأسنان', en: 'Facial Bones & Mandible' };
    if (y < 380) return { ar: 'الفقرات العنقية والترقوة', en: 'Cervical Spine & Clavicles' };
    if (y < 530) return { ar: 'القفص الصدري والقلب والأضلاع', en: 'Thorax & Ribcage' };
    if (y < 590) return { ar: 'الفقرات القطنية وتجويف البطن', en: 'Lumbar Spine & Abdomen' };
    if (y < 670) return { ar: 'عظام الحوض ومفصل الورك', en: 'Pelvis & Hip Joint' };
    if (y < 765) return { ar: 'عظم الفخذ ومفصل الركبة', en: 'Femur & Knee Joint' };
    if (y < 860) return { ar: 'عظام الساق (القصبة والشظية)', en: 'Tibia & Fibula' };
    return { ar: 'عظام الكاحل والقدم والأصابع', en: 'Ankle & Foot Phalanges' };
  }

  function update(svgCoords) {
    if (!svgCoords) return;
    currentCoords.x = svgCoords.x;
    currentCoords.y = svgCoords.y;

    var cx = svgCoords.x;
    var cy = svgCoords.y;
    var r = currentRadius;

    // 1. Update Lens Mask
    if (maskedElement) {
      maskedElement.setAttribute('cx', cx);
      maskedElement.setAttribute('cy', cy);
      maskedElement.setAttribute('r', r);
    }

    // 2. Update Bezel Shadow Rings
    if (circleFeedback) {
      circleFeedback.setAttribute('cx', cx);
      circleFeedback.setAttribute('cy', cy);
      circleFeedback.setAttribute('r', r);
    }
    if (circleReticleOuter) {
      circleReticleOuter.setAttribute('cx', cx);
      circleReticleOuter.setAttribute('cy', cy);
      circleReticleOuter.setAttribute('r', r + 6);
    }

    // 3. Update Crosshairs
    if (chTop) {
      chTop.setAttribute('x1', cx);
      chTop.setAttribute('y1', cy - r - 6);
      chTop.setAttribute('x2', cx);
      chTop.setAttribute('y2', cy - r + 4);
    }
    if (chBottom) {
      chBottom.setAttribute('x1', cx);
      chBottom.setAttribute('y1', cy + r - 4);
      chBottom.setAttribute('x2', cx);
      chBottom.setAttribute('y2', cy + r + 6);
    }
    if (chLeft) {
      chLeft.setAttribute('x1', cx - r - 6);
      chLeft.setAttribute('y1', cy);
      chLeft.setAttribute('x2', cx - r + 4);
      chLeft.setAttribute('y2', cy);
    }
    if (chRight) {
      chRight.setAttribute('x1', cx + r - 4);
      chRight.setAttribute('y1', cy);
      chRight.setAttribute('x2', cx + r + 6);
      chRight.setAttribute('y2', cy);
    }
    if (chCenter) {
      chCenter.setAttribute('cx', cx);
      chCenter.setAttribute('cy', cy);
    }

    // 4. Update HUD Tag & Anatomy Zone Label
    var zone = getAnatomyZoneName(cx, cy);
    if (lensHudTag) {
      var tagY = (cy - r - 16 < 45) ? (cy + r + 24) : (cy - r - 12);
      lensHudTag.setAttribute('transform', 'translate(' + cx + ',' + tagY + ')');
    }
    if (hudTagText) {
      hudTagText.textContent = zone.ar + ' | ' + zone.en;
      var bgEl = document.getElementById('hud-tag-bg');
      if (bgEl) {
        var w = Math.max(140, hudTagText.textContent.length * 7.5);
        bgEl.setAttribute('width', w);
        bgEl.setAttribute('x', -w / 2);
      }
    }
    if (hudZone) {
      hudZone.textContent = 'المنطقة: ' + zone.ar;
    }
  }

  function setRadius(newR) {
    currentRadius = Math.max(minRadius, Math.min(maxRadius, newR));
    update(currentCoords);
  }

  function sendCoordinatesToParent(pt) {
    if (window.parent && window.parent !== window && svgElement) {
      var rect = svgElement.getBoundingClientRect();
      if (rect.width && rect.height) {
        window.parent.postMessage({
          type: 'xrayMove',
          normX: pt.x / 800,
          normY: pt.y / 1000
        }, '*');
      }
    }
  }

  // Pointer & Touch Events
  window.addEventListener('mousemove', function(e) {
    if (!svgElement) return;
    var pt = cursorPoint(e, svgElement);
    update(pt);
    sendCoordinatesToParent(pt);
  }, { passive: true });

  window.addEventListener('touchmove', function(e) {
    var touch = e.targetTouches[0];
    if (touch && svgElement) {
      var pt = cursorPoint(touch, svgElement);
      update(pt);
      sendCoordinatesToParent(pt);
    }
  }, { passive: true });

  // Mouse wheel zoom for lens radius
  window.addEventListener('wheel', function(e) {
    if (e.deltaY < 0) {
      setRadius(currentRadius + 10);
    } else {
      setRadius(currentRadius - 10);
    }
  }, { passive: true });

  // Buttons interaction
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', function(e) {
      e.stopPropagation();
      setRadius(currentRadius + 15);
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', function(e) {
      e.stopPropagation();
      setRadius(currentRadius - 15);
    });
  }
  if (btnResetPos) {
    btnResetPos.addEventListener('click', function(e) {
      e.stopPropagation();
      update({ x: 400, y: 420 });
      sendCoordinatesToParent({ x: 400, y: 420 });
    });
  }

  // Cross-window sync (room mode / student control)
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (data && data.type === 'syncXray') {
      var targetX = (data.normX !== undefined) ? (data.normX * 800) : 400;
      var targetY = (data.normY !== undefined) ? (data.normY * 1000) : 420;
      update({ x: targetX, y: targetY });
    }
  });

  // Initial draw
  update(currentCoords);
})();
