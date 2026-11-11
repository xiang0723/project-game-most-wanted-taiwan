/* 全臺通緝令 MOST WANTED · TAIWAN — © 2026 Jax Huang・CC BY-NC 4.0（姓名標示-非商業性）・https://github.com/xiang0723/project-game-most-wanted-taiwan */
// 地圖層：Leaflet + OpenStreetMap 資料（CARTO 深色底圖）
// 視野限定在中華民國管轄範圍（臺澎金馬及周邊離島）
(() => {
  const ROC_BOUNDS = L.latLngBounds([21.6, 117.9], [26.9, 122.6]);

  class GameMap {
    constructor(el) {
      this.map = L.map(el, { minZoom: 6, maxBounds: ROC_BOUNDS.pad(0.3), zoomControl: false, attributionControl: true })
        .fitBounds(ROC_BOUNDS);
      L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
      // OpenStreetMap 官方圖磚（免金鑰），以 CSS 濾鏡轉成深色戰情室風格
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, className: 'dark-tiles',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);
      this.trail = L.polyline([], { color: '#4cc3ff', weight: 3, opacity: 0.9, dashArray: '8 8', className: 'trail-line' }).addTo(this.map);
      this.raid = [];
      this.zoneLayer = L.layerGroup().addTo(this.map);
      // 地圖縮小時，小地點只留圓點、不顯示名稱，免得標籤疊在一起
      const zl = () => this.map.getContainer().classList.toggle('z-lo', this.map.getZoom() < 8);
      this.map.on('zoomend', zl); zl();
    }

    addMarker(loc, onClick) {
      const el = L.divIcon({ className: 'pin-wrap', html: `<div class="pin${loc.minor ? ' minor' : ''}"><i></i><b>🚧</b><span>${loc.name}</span></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
      const m = L.marker([loc.lat, loc.lng], { icon: el, riseOnHover: true }).addTo(this.map);
      m.on('click', onClick);
      return {
        setState: (state, blocked, hot) => {
          const node = m.getElement()?.querySelector('.pin');
          if (!node) return;
          node.className = `pin${loc.minor ? ' minor' : ''} ${state}${blocked ? ' blocked' : ''}${hot ? ' hot' : ''}`;
          m.setZIndexOffset(state === 'current' ? 1000 : state === 'selected' ? 900 : 0);
        },
      };
    }

    setTrail(points) { this.trail.setLatLngs(points.map((p) => [p.lat, p.lng])); }

    focus(lat, lng, zoom) { this.map.flyTo([lat, lng], zoom || Math.max(this.map.getZoom(), 7), { duration: 0.8 }); }

    // 把幾個地點同時框進畫面（手機版要避開上方標籤與下方快捷列）
    fitPoints(pts, mobile) {
      if (!pts.length) return;
      const b = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
      this.map.flyToBounds(b, { paddingTopLeft: mobile ? [30, 130] : [60, 70], paddingBottomRight: mobile ? [30, 110] : [60, 60], maxZoom: 9, duration: 0.9 });
    }

    fitAll() { this.map.fitBounds(ROC_BOUNDS); }

    // 移動動畫；分頁在背景時 rAF 會暫停，另以計時器確保一定會抵達
    animateTravel(from, to, ms) {
      return new Promise((resolve) => {
        const car = L.marker([from.lat, from.lng], {
          icon: L.divIcon({ className: 'car-icon', html: '🚓', iconSize: [26, 26], iconAnchor: [13, 13] }), zIndexOffset: 2000,
        }).addTo(this.map);
        let done = false;
        const finish = () => { if (done) return; done = true; car.remove(); resolve(); };
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          car.setLatLng([from.lat + (to.lat - from.lat) * e, from.lng + (to.lng - from.lng) * e]);
          if (k < 1 && !done) requestAnimationFrame(step); else finish();
        };
        setTimeout(finish, ms + 300);
        requestAnimationFrame(step);
      });
    }

    // 包圍網：線索畫出的可能範圍（圓形＝目擊、監視器、線民；扇形＝通聯方位）
    setZones(zones, from) {
      this.zoneLayer.clearLayers();
      zones.forEach((z) => {
        if (z.type === 'circle') {
          L.circle([z.lat, z.lng], { radius: z.r * 1000, color: '#ff4d4f', weight: 1, fillColor: '#ff4d4f', fillOpacity: 0.09, dashArray: '4 6', interactive: false })
            .addTo(this.zoneLayer);
        } else if (z.type === 'sector' && from) {
          const pts = [[from.lat, from.lng]];
          for (let a = z.brg - 30; a <= z.brg + 30; a += 3) {
            const r = (a * Math.PI) / 180;
            pts.push([from.lat + (z.r / 111) * Math.cos(r), from.lng + (z.r / (111 * Math.cos((from.lat * Math.PI) / 180))) * Math.sin(r)]);
          }
          L.polygon(pts, { color: '#ffb224', weight: 1, fillColor: '#ffb224', fillOpacity: 0.12, dashArray: '4 4', interactive: false }).addTo(this.zoneLayer);
        }
      });
    }

    clearZones() { this.zoneLayer.clearLayers(); }

    showRaid(spots, onPick) {
      this.clearRaid();
      spots.forEach((s) => {
        const m = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: 'raid-pin', html: `<span>${s.icon}</span><em>${s.name}</em>`, iconSize: [48, 48], iconAnchor: [24, 24] }),
          zIndexOffset: 3000,
        }).addTo(this.map);
        m.on('click', () => onPick(s));
        this.raid.push(m);
      });
    }

    clearRaid() { this.raid.forEach((m) => m.remove()); this.raid = []; }
  }

  window.GameMap = GameMap;
})();
