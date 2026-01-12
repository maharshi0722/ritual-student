"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as turf from "@turf/turf";

/*
  GlobePage.jsx
  - Fixed tooltip not showing total members by keeping points and countryList in refs
*/

export default function Page() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const labelRendererRef = useRef(null);

  // stable refs for asynchronous / cross-scope objects
  const pointsRef = useRef(null);
  const countryListRef = useRef([]);

  const [tooltip, setTooltip] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const displayCommunities = [
    { label: "Indian community", count: 15968, geo: "India" },
    { label: "China", count: 16497, geo: "China" },
    { label: "日本語 (Japan)", count: 5149, geo: "Japan" },
    { label: "한국 커뮤니티 (Korea)", count: 7760, geo: "South Korea" },
    { label: "普通话交流区 (Chinese)", count: 15904, geo: "China" },
    { label: "Komunitas Indonesia", count: 11699, geo: "Indonesia" },
    { label: "ชุมชนไทย (Thailand)", count: 5053, geo: "Thailand" },
    { label: "Cộng đồng Việt Nam", count: 11158, geo: "Vietnam" },
    { label: "Naija", count: 13214, geo: "Nigeria" },
    { label: "Türkiye Topluluğu", count: 6155, geo: "Turkey" },
    { label: "Українська громада (Ukraine)", count: 5801, geo: "Ukraine" },
    { label: "Filipino", count: 2833, geo: "Philippines" },
    { label: "Português", count: 11514, geo: "Portugal" }
  ];

  const COUNTRY_CONTINENT = {
    India: "Asia",
    China: "Asia",
    Japan: "Asia",
    "South Korea": "Asia",
    Indonesia: "Asia",
    Thailand: "Asia",
    Vietnam: "Asia",
    Nigeria: "Africa",
    Turkey: "Eurasia",
    Ukraine: "Europe",
    Philippines: "Asia",
    Portugal: "Europe"
  };

  const COMMUNITY_COUNTS = {
    India: 15968,
    China: 16497,
    Japan: 5149,
    "South Korea": 7760,
    Indonesia: 11699,
    Thailand: 5053,
    Vietnam: 11158,
    Nigeria: 13214,
    Turkey: 6155,
    Ukraine: 5801,
    Philippines: 2833,
    Portugal: 11514
  };

  const COLORS = {
    India: 0x9db8ff,
    China: 0xb6a4ff,
    Japan: 0xaecbff,
    "South Korea": 0x9ad0ff,
    Indonesia: 0x6ad1ff,
    Thailand: 0x7fdcff,
    Vietnam: 0x84c7ff,
    Nigeria: 0x7cffb2,
    Turkey: 0xcaa8ff,
    Ukraine: 0xa3bfff,
    Philippines: 0x9fcfff,
    Portugal: 0xbfaaff
  };

  function focusCountry(countryGeoName) {
    window.dispatchEvent(new CustomEvent("focus-country", { detail: { country: countryGeoName } }));
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    function onChange() {
      const m = mq.matches;
      setIsMobile(m);
      setPanelOpen(!m);
    }
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // container
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.position = "relative";
    mountRef.current.appendChild(container);

    let width = window.innerWidth;
    let height = window.innerHeight;

    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030a);

    // helper latLon -> vector3
    const latLon = (lat, lon, r = 1.02) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.cos(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // camera - centered so globe visually stays in center
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    // renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    // CSS2D renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.style.zIndex = "2";
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 6;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.9;
    controls.target.set(0, 0, 0);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 2, 6);
    scene.add(sun);

    // starfield
    (function createStars() {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 500;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 45 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xcfe8ff,
        size: 0.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);
    })();

    // sprite texture for points
    function createSpriteTexture() {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.12, "rgba(230,220,255,0.98)");
      grad.addColorStop(0.32, "rgba(180,150,255,0.72)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    }
    const spriteTex = createSpriteTexture();

    // create a group so we can rotate the globe independently
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // globe mesh
    const loader = new THREE.TextureLoader();
    const earthDay = loader.load(
      "https://raw.githubusercontent.com/pmndrs/drei-assets/master/textures/earth/earth_daymap.jpg"
    );
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 40, 40),
      new THREE.MeshPhongMaterial({
        map: earthDay,
        color: new THREE.Color(0x070710),
        specular: new THREE.Color(0x0b0b0b),
        shininess: 2
      })
    );
    globeGroup.add(globe);

    // atmosphere (added to same group)
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.09, 28, 28),
      new THREE.MeshBasicMaterial({
        color: 0x4d6bff,
        transparent: true,
        opacity: 0.055,
        side: THREE.BackSide
      })
    );
    globeGroup.add(atmosphere);

    // mobile adjustments
    const mobile = window.matchMedia("(max-width:800px)").matches;
    const MAX_POINTS = mobile ? 900 : 1500;
    const MAX_LABELS = mobile ? 8 : 999;
    const MIN_PER_COUNTRY = mobile ? 2 : 3;

    // prepare counts scaling
    const countryKeys = Object.keys(COMMUNITY_COUNTS);
    const prelimCounts = {};
    let prelimTotal = 0;
    countryKeys.forEach((k) => {
      const v = Math.max(MIN_PER_COUNTRY, Math.floor(Math.sqrt(COMMUNITY_COUNTS[k]) * 3));
      prelimCounts[k] = v;
      prelimTotal += v;
    });
    const scale = prelimTotal > MAX_POINTS ? MAX_POINTS / prelimTotal : 1;

    // buffers + labels bookkeeping
    const positionsArr = [];
    const colorsArr = [];
    const countryIndexArr = [];
    const countryList = []; // we'll store a reference to this array
    countryListRef.current = countryList;
    const borderVerts = [];
    const labelGroup = new THREE.Group();
    scene.add(labelGroup);
    const cssLabelObjects = [];
    const centroidMap = {};

    // turf sampling helper
    function generateCountryPoints(feature, count) {
      const pts = [];
      const geom = feature.geometry;
      const polygons =
        geom.type === "MultiPolygon"
          ? geom.coordinates.map((c) => turf.polygon(c))
          : [turf.polygon(geom.coordinates)];
      const bboxes = polygons.map((p) => turf.bbox(p));
      let tries = 0;
      const maxTries = Math.max(500, count * 30);
      while (pts.length < count && tries < maxTries) {
        const i = Math.floor(Math.random() * polygons.length);
        const r = turf.randomPoint(1, { bbox: bboxes[i] }).features[0];
        if (turf.booleanPointInPolygon(r, polygons[i])) {
          pts.push(r.geometry.coordinates);
        }
        tries++;
      }
      return pts;
    }

    // load geojson and build geometry & labels
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => res.json())
      .then((world) => {
        let addedLabels = 0;
        world.features.forEach((feature) => {
          const name = feature.properties.name;
          const count = COMMUNITY_COUNTS[name];

          // borders
          const geom = feature.geometry;
          const polygonsForBorders = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
          polygonsForBorders.forEach((poly) => {
            poly.forEach((ring) => {
              ring.forEach(([lon, lat]) => {
                const v = latLon(lat, lon, 1.035);
                borderVerts.push(v.x, v.y, v.z);
              });
              if (ring.length > 0) {
                const [lon0, lat0] = ring[0];
                const v0 = latLon(lat0, lon0, 1.035);
                borderVerts.push(v0.x, v0.y, v0.z);
              }
            });
          });

          // centroid for focus & label
          try {
            const centroid = turf.centroid(feature).geometry.coordinates;
            const c3 = latLon(centroid[1], centroid[0], 1.06);
            centroidMap[name] = c3.clone();

            if (count && addedLabels < MAX_LABELS) {
              const el = document.createElement("div");
              el.textContent = name;
              el.style.color = "#cfe6ff";
              el.style.fontSize = "12px";
              el.style.fontFamily =
                "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
              el.style.textShadow = "0 4px 10px rgba(0,0,0,0.7)";
              el.style.pointerEvents = "none";
              el.style.whiteSpace = "nowrap";
              el.style.opacity = "0.95";
              const labelObj = new CSS2DObject(el);
              labelObj.position.copy(c3);
              labelGroup.add(labelObj);
              cssLabelObjects.push({ obj: labelObj, priority: count, worldPos: c3.clone(), name });
              addedLabels++;
            }
          } catch (e) {}

          if (!count) return;

          // points
          const base = prelimCounts[name] || MIN_PER_COUNTRY;
          const dotCount = Math.max(MIN_PER_COUNTRY, Math.round(base * scale));
          const countryIdx = countryList.length;
          countryList.push({
            name,
            count,
            color: COLORS[name] || 0x9db8ff,
            continent: COUNTRY_CONTINENT[name] || "Unknown"
          });

          const pts = generateCountryPoints(feature, dotCount);
          pts.forEach(([lon, lat]) => {
            const v = latLon(lat, lon, 1.02);
            positionsArr.push(v.x, v.y, v.z);
            const col = new THREE.Color(countryList[countryIdx].color);
            col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
            colorsArr.push(col.r, col.g, col.b);
            countryIndexArr.push(countryIdx);
          });
        });

        // Points (single draw)
        if (positionsArr.length) {
          const positions = new Float32Array(positionsArr);
          const colors = new Float32Array(colorsArr);
          const countryIdxs = new Float32Array(countryIndexArr);

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          geometry.setAttribute("countryIndex", new THREE.BufferAttribute(countryIdxs, 1));

          const material = new THREE.PointsMaterial({
            size: mobile ? 0.03 : 0.038,
            map: spriteTex,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
          });

          const pointsObject = new THREE.Points(geometry, material);
          pointsRef.current = pointsObject; // store into ref so handlers can access later
          scene.add(pointsObject);
        }

        // Borders (merged)
        if (borderVerts.length) {
          const borderGeo = new THREE.BufferGeometry();
          borderGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(borderVerts), 3));
          const borderMat = new THREE.LineBasicMaterial({
            color: 0x1f2126,
            transparent: true,
            opacity: 0.95
          });
          const borderLines = new THREE.LineSegments(borderGeo, borderMat);
          scene.add(borderLines);
        }
      });

    // raycaster/pointer interactions
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.04;
    const mouse = new THREE.Vector2();

    function updateMouseFromEvent(e) {
      if (e.touches && e.touches[0]) {
        mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        return [e.touches[0].clientX, e.touches[0].clientY];
      } else {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        return [e.clientX, e.clientY];
      }
    }

    function onPointerMove(e) {
      const [clientX, clientY] = updateMouseFromEvent(e);
      const pointsObject = pointsRef.current;
      const countryListLocal = countryListRef.current;
      if (!pointsObject) {
        setTooltip(null);
        return;
      }
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(pointsObject);
      if (hits.length) {
        const idx = hits[0].index;
        const countryIdxAttr = pointsObject.geometry.getAttribute("countryIndex");
        const cIdx = Math.round(countryIdxAttr.getX(idx));
        const meta = countryListLocal[cIdx];
        if (meta) {
          // use meta.count but fall back to COMMUNITY_COUNTS as a safety
          const total = meta.count ?? COMMUNITY_COUNTS[meta.name] ?? 0;
          setTooltip({
            x: clientX,
            y: clientY,
            text: `${meta.name} · ${total.toLocaleString()} · ${meta.continent}`
          });
        } else {
          setTooltip(null);
        }
      } else {
        setTooltip(null);
      }
    }

    function onPointerEnd() {
      const pointsObject = pointsRef.current;
      if (!pointsObject) return;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(pointsObject);
      if (hits.length) {
        const p = hits[0].point.clone().normalize().multiplyScalar(2.6);
        animateCameraTo(p, 700); // camera animates but globeGroup keeps rotating
      }
    }

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("click", onPointerEnd);
    window.addEventListener("touchend", onPointerEnd);

    // cursor UX
    renderer.domElement.style.cursor = "grab";
    function setGrabbing() {
      renderer.domElement.style.cursor = "grabbing";
    }
    function setGrab() {
      renderer.domElement.style.cursor = "grab";
    }
    renderer.domElement.addEventListener("pointerdown", setGrabbing);
    window.addEventListener("pointerup", setGrab);
    renderer.domElement.addEventListener("mouseenter", setGrab);
    renderer.domElement.addEventListener("mouseleave", () => (renderer.domElement.style.cursor = "default"));

    // camera animation helper (doesn't stop globe rotation)
    let cameraAnimHandle = null;
    function animateCameraTo(toPosition, duration = 800) {
      if (cameraAnimHandle) cancelAnimationFrame(cameraAnimHandle);
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const newTarget = toPosition.clone().normalize().multiplyScalar(1.02);
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
        camera.position.lerpVectors(startPos, toPosition, ease);
        controls.target.lerpVectors(startTarget, newTarget, ease);
        controls.update();
        if (t < 1) cameraAnimHandle = requestAnimationFrame(step);
        else cameraAnimHandle = null;
      }
      cameraAnimHandle = requestAnimationFrame(step);
    }

    // panel focus listener
    function handleFocusEvent(e) {
      const country = e?.detail?.country;
      if (!country) return;
      const centroid = centroidMap[country];
      if (centroid) {
        const to = centroid.clone().normalize().multiplyScalar(2.6);
        animateCameraTo(to, 900);
      }
    }
    window.addEventListener("focus-country", handleFocusEvent);

    // reset-view handler (returns camera to centered pos)
    function handleResetView() {
      const toPos = new THREE.Vector3(0, 0, 4);
      const target = new THREE.Vector3(0, 0, 0);
      if (cameraAnimHandle) cancelAnimationFrame(cameraAnimHandle);
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const duration = 800;
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
        camera.position.lerpVectors(startPos, toPos, ease);
        controls.target.lerpVectors(startTarget, target, ease);
        controls.update();
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    window.addEventListener("reset-view", handleResetView);

    // resize handler
    function onResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    // always-rotate speed
    const AUTO_ROTATE_SPEED = mobile ? 0.0006 : 0.0003;
    let t = 0;

    // animation loop: globeGroup rotates always and slowly; small X oscillation for depth
    function animate() {
      // continuous rotation
      globeGroup.rotation.y += AUTO_ROTATE_SPEED;
      t += AUTO_ROTATE_SPEED * 0.6; // time-like value for subtle nod
      globeGroup.rotation.x = Math.sin(t) * 0.02; // tiny nod to add life
      atmosphere.rotation.y += AUTO_ROTATE_SPEED * 0.6; // atmosphere spin slightly different

      // label declutter
      const camDir = camera.position.clone().normalize();
      const camDist = camera.position.length();
      const candidates = [];
      for (let i = 0; i < cssLabelObjects.length; i++) {
        const entry = cssLabelObjects[i];
        const dot = camDir.dot(entry.worldPos.clone().normalize());
        if (dot <= 0.08) {
          entry.obj.element.style.display = "none";
          continue;
        }
        const v = entry.worldPos.clone().project(camera);
        const sx = (v.x + 1) * 0.5 * window.innerWidth;
        const sy = (-v.y + 1) * 0.5 * window.innerHeight;
        if (camDist > 7.5 && entry.priority < 6000) {
          entry.obj.element.style.display = "none";
          continue;
        }
        entry.obj.element.style.display = "";
        const el = entry.obj.element;
        const w = el.offsetWidth || 80;
        const h = el.offsetHeight || 16;
        candidates.push({ entry, left: sx - (isMobile ? 6 : 8), top: sy - h / 2, right: sx - (isMobile ? 6 : 8) + w, bottom: sy + h / 2, priority: entry.priority });
      }

      candidates.sort((a, b) => b.priority - a.priority);
      const kept = [];
      for (const c of candidates) {
        let overlap = false;
        for (const k of kept) {
          if (!(c.right < k.left || c.left > k.right || c.bottom < k.top || c.top > k.bottom)) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          kept.push(c);
          c.entry.obj.element.style.display = "";
        } else {
          c.entry.obj.element.style.display = "none";
        }
      }

      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    }
    animate();

    // cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (cameraAnimHandle) cancelAnimationFrame(cameraAnimHandle);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("click", onPointerEnd);
      window.removeEventListener("touchend", onPointerEnd);
      window.removeEventListener("focus-country", handleFocusEvent);
      window.removeEventListener("reset-view", handleResetView);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", setGrabbing);
      window.removeEventListener("pointerup", setGrab);
      renderer.domElement.removeEventListener("mouseenter", setGrab);
      renderer.domElement.removeEventListener("mouseleave", () => (renderer.domElement.style.cursor = "default"));
      controls.dispose();
      renderer.dispose();
      spriteTex.dispose();
      if (pointsRef.current) {
        try {
          pointsRef.current.geometry.dispose();
          if (pointsRef.current.material) {
            if (Array.isArray(pointsRef.current.material)) {
              pointsRef.current.material.forEach((m) => m.dispose());
            } else {
              pointsRef.current.material.dispose();
            }
          }
        } catch (e) {}
      }
      if (mountRef.current) mountRef.current.innerHTML = "";
    };

    // helpers referenced in cleanup
    function setGrabbing() {
      renderer.domElement.style.cursor = "grabbing";
    }
    function setGrab() {
      renderer.domElement.style.cursor = "grab";
    }
  }, []); // run once

  // UI / panel code (unchanged)
  const logoSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#8ab6ff'/><stop offset='1' stop-color='#c9b7ff'/></linearGradient></defs>
      <rect rx='9' ry='9' width='40' height='40' fill='rgba(255,255,255,0.02)'/>
      <circle cx='20' cy='12' r='7' fill='url(#g)'/>
      <text x='20' y='27' font-size='13' fill='#e9f0ff' font-family='Inter, Arial' text-anchor='middle'>R</text>
    </svg>
  `)}`;

  const panelBaseStyle = {
    position: "absolute",
    left: isMobile ? 12 : 20,
    right: isMobile ? 12 : undefined,
    bottom: isMobile ? 12 : undefined,
    top: isMobile ? undefined : 20,
    width: isMobile ? "auto" : panelOpen ? 320 : 56,
    maxHeight: isMobile ? "40vh" : "86vh",
    padding: panelOpen ? (isMobile ? "10px 12px" : 16) : 8,
    borderRadius: 14,
    background: panelOpen ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" : "rgba(255,255,255,0.02)",
    backdropFilter: panelOpen && !isMobile ? "blur(8px) saturate(120%)" : undefined,
    boxShadow: panelOpen ? "0 14px 48px rgba(2,6,12,0.6)" : "0 8px 20px rgba(2,6,12,0.5)",
    color: "#eaf0ff",
    zIndex: 50,
    transition: "width 220ms ease, padding 220ms ease, transform 220ms ease"
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
        background:
          "radial-gradient(ellipse at 30% 25%, rgba(20,28,50,0.12) 0%, rgba(6,8,12,0.0) 30%), linear-gradient(180deg,#05060b 0%, #020207 100%)",
        color: "#eaf0ff",
        overflow: "hidden"
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(2,4,8,0.35) 75%, rgba(2,4,8,0.7) 100%)"
        }}
      />

      <div style={panelBaseStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/ritual-logo.png" alt="logo" style={{ width: 44, height: 44, borderRadius: 10 }} />
          {!isMobile && panelOpen && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Ritual Community Map</div>
              <div style={{ fontSize: 12, color: "#a9baff", marginTop: 2 }}>Global members — visual overview</div>
            </div>
          )}
          <button
            onClick={() => setPanelOpen((s) => !s)}
            aria-label="Toggle panel"
            style={{
              marginLeft: 4,
              background: "transparent",
              border: "none",
              color: "#bfcfff",
              cursor: "pointer",
              fontSize: 18,
              padding: 6
            }}
            title={panelOpen ? "Collapse" : "Expand"}
          >
            {panelOpen ? (isMobile ? "▾" : "—") : "≡"}
          </button>
        </div>

        {(panelOpen || isMobile) && (
          <>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#9fb0ff", fontWeight: 600 }}>Communities Users</div>
              {isMobile && <div style={{ fontSize: 12, color: "#9aa0b7" }}>Tap a row to focus</div>}
            </div>
<div
  style={{
    marginTop: 8,
    display: "grid",
    gap: 8,

    maxHeight: isMobile ? "28vh" : "calc(86vh - 160px)",

    /* ✅ scroll only on mobile */
    overflowY: isMobile ? "auto" : "visible",

    /* iOS smooth scrolling */
    WebkitOverflowScrolling: isMobile ? "touch" : "auto",

    /* Allow vertical pan on mobile only */
    touchAction: isMobile ? "pan-y" : "auto",

    paddingBottom: 12
  }}
  onTouchStart={isMobile ? (e) => e.stopPropagation() : undefined}
  onTouchMove={isMobile ? (e) => e.stopPropagation() : undefined}
>


              {displayCommunities.map((c) => (
                <div
                  key={c.label}
                  onClick={() => focusCountry(c.geo)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: isMobile ? "8px 10px" : "10px 12px",
                    borderRadius: 10,
                    background: "linear-gradient(180deg, rgba(10,12,20,0.12), rgba(8,8,12,0.02))",
                    cursor: "pointer",
                    transition: "transform 160ms ease",
                    userSelect: "none"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                >
                  <div style={{ fontSize: 13, color: "#eaf0ff", lineHeight: 1.1 }}>{c.label}</div>
                  <div style={{ color: "#c6cfe6", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                    {c.count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>


          </>
        )}
      </div>

      <div style={{ position: "absolute", right: 20, top: 20, display: "flex", gap: 10, zIndex: 50 }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("reset-view"))}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "#dfe8ff",
            cursor: "pointer",
            fontSize: 13,
            backdropFilter: "blur(6px)"
          }}
        >
          Reset view
        </button>
      </div>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "linear-gradient(180deg, rgba(8,10,20,0.98), rgba(6,6,10,0.94))",
            color: "#eaf0ff",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            pointerEvents: "none",
            boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
            zIndex: 9999,
            transform: "translateZ(0)"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}